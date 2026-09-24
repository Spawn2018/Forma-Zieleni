import { sql, type Kysely, type Transaction } from 'kysely';
import type { Contract, Lead, Offer, Opportunity, Project, ProjectFile } from '@forma-zieleni/domain';
import { ApiFailure, PersistenceFailure } from './errors.ts';
import type { Database } from './db.ts';
import type {
  AuditEvent,
  ContractListQuery,
  LeadStore,
  LeadTx,
  ListQuery,
  OfferListQuery,
  OpportunityListQuery,
  OutboxMessage,
  ProjectFileListQuery,
  ProjectListQuery,
  StoredReply,
} from './store.ts';

type Executor = Kysely<Database> | Transaction<Database>;

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function jsonb(value: unknown) {
  return sql`${JSON.stringify(value)}::jsonb`;
}

function toLead(row: Database['lead']): Lead {
  const reasons = Array.isArray(row.qualification_reasons) ? row.qualification_reasons : [];
  return {
    id: row.id,
    source: row.source as Lead['source'],
    status: row.status as Lead['status'],
    contact: {
      name: row.contact_name,
      phone: row.contact_phone,
      ...(row.contact_email ? { email: row.contact_email } : {}),
    },
    property: row.locality ? { locality: row.locality } : {},
    siteAnalysisRequested: row.site_analysis_requested,
    qualification: {
      result: row.qualification_result as Lead['qualification']['result'],
      reasons: reasons as Lead['qualification']['reasons'],
    },
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function toOpportunity(row: Database['opportunity']): Opportunity {
  return {
    id: row.id,
    leadId: row.lead_id,
    status: row.status as Opportunity['status'],
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function toOffer(row: Database['offer']): Offer {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    status: row.status as Offer['status'],
    clientSubject: row.client_subject ?? null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function toContract(row: Database['contract']): Contract {
  return {
    id: row.id,
    offerId: row.offer_id,
    status: row.status as Contract['status'],
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function toProject(row: Database['project']): Project {
  return {
    id: row.id,
    contractId: row.contract_id,
    status: row.status as Project['status'],
    clientSubject: row.client_subject ?? null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function toProjectFile(row: Database['project_file']): ProjectFile {
  return {
    id: row.id,
    projectId: row.project_id,
    clientSubject: row.client_subject ?? null,
    name: row.name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function isPg(error: unknown): error is { code?: string; constraint?: string } {
  return Boolean(error && typeof error === 'object' && 'code' in error);
}

export class PostgresLeadStore implements LeadStore {
  private readonly db: Kysely<Database>;

  constructor(db: Kysely<Database>) {
    this.db = db;
  }

  async transaction<T>(run: (tx: LeadTx) => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await this.db.transaction().execute(async trx => run(new PostgresTx(trx)));
      } catch (error) {
        if (attempt === 0 && isPg(error) && error.code === '23505' && error.constraint === 'idempotency_record_pkey') continue;
        if (error instanceof ApiFailure) throw error;
        if (isPg(error) && error.code === '23505' && error.constraint === 'opportunity_lead_unique') {
          throw new ApiFailure(409, 'OPPORTUNITY_EXISTS', 'An opportunity already exists for this lead.');
        }
        if (isPg(error) && error.code === '23505' && error.constraint === 'offer_opportunity_unique') {
          throw new ApiFailure(409, 'OFFER_EXISTS', 'An offer already exists for this opportunity.');
        }
        if (isPg(error) && error.code === '23505' && error.constraint === 'contract_offer_unique') {
          throw new ApiFailure(409, 'CONTRACT_EXISTS', 'A contract already exists for this offer.');
        }
        if (isPg(error)) throw new PersistenceFailure();
        throw error;
      }
    }
    throw new PersistenceFailure();
  }
}

class PostgresTx implements LeadTx {
  private readonly trx: Executor;

  constructor(trx: Executor) {
    this.trx = trx;
  }

  async findIdempotency(scope: string, key: string): Promise<StoredReply | null> {
    const row = await this.trx.selectFrom('idempotency_record').selectAll().where('scope', '=', scope).where('idempotency_key', '=', key).executeTakeFirst();
    if (!row) return null;
    return { requestHash: row.request_hash, responseStatus: row.response_status, responseBody: row.response_body };
  }

  async saveIdempotency(scope: string, key: string, reply: StoredReply, at: string): Promise<void> {
    await this.trx.insertInto('idempotency_record').values({
      scope,
      idempotency_key: key,
      request_hash: reply.requestHash,
      response_status: reply.responseStatus,
      response_body: jsonb(reply.responseBody),
      created_at: new Date(at),
    }).execute();
  }

  async insertLead(lead: Lead): Promise<void> {
    await this.trx.insertInto('lead').values(this.leadValues(lead)).execute();
  }

  async saveLead(lead: Lead): Promise<void> {
    await this.trx.updateTable('lead').set(this.leadValues(lead)).where('id', '=', lead.id).execute();
  }

  async findLead(id: string): Promise<Lead | null> {
    const row = await this.trx.selectFrom('lead').selectAll().where('id', '=', id).executeTakeFirst();
    return row ? toLead(row) : null;
  }

  async listLeads(query: ListQuery): Promise<Lead[]> {
    const column = query.sort.includes('updatedAt') ? 'updated_at' : 'created_at';
    const direction = query.sort.startsWith('-') ? 'desc' : 'asc';
    let request = this.trx.selectFrom('lead').selectAll();
    if (query.status) request = request.where('status', '=', query.status);
    if (query.cursor) {
      const at = new Date(query.cursor.at);
      const id = query.cursor.id;
      request = request.where(eb => direction === 'desc'
        ? eb.or([eb(column, '<', at), eb.and([eb(column, '=', at), eb('id', '<', id)])])
        : eb.or([eb(column, '>', at), eb.and([eb(column, '=', at), eb('id', '>', id)])]));
    }
    const rows = await request.orderBy(column, direction).orderBy('id', direction).limit(query.limit).execute();
    return rows.map(toLead);
  }

  async insertOpportunity(opportunity: Opportunity): Promise<void> {
    await this.trx.insertInto('opportunity').values({
      id: opportunity.id,
      lead_id: opportunity.leadId,
      status: opportunity.status,
      created_at: new Date(opportunity.createdAt),
      updated_at: new Date(opportunity.updatedAt),
    }).execute();
  }

  async findOpportunity(id: string): Promise<Opportunity | null> {
    const row = await this.trx.selectFrom('opportunity').selectAll().where('id', '=', id).executeTakeFirst();
    return row ? toOpportunity(row) : null;
  }

  async findOpportunityByLead(leadId: string): Promise<Opportunity | null> {
    const row = await this.trx.selectFrom('opportunity').selectAll().where('lead_id', '=', leadId).executeTakeFirst();
    return row ? toOpportunity(row) : null;
  }

  async listOpportunities(query: OpportunityListQuery): Promise<Opportunity[]> {
    const column = query.sort.includes('updatedAt') ? 'updated_at' : 'created_at';
    const direction = query.sort.startsWith('-') ? 'desc' : 'asc';
    let request = this.trx.selectFrom('opportunity').selectAll();
    if (query.status) request = request.where('status', '=', query.status);
    if (query.cursor) {
      const at = new Date(query.cursor.at);
      const id = query.cursor.id;
      request = request.where(eb => direction === 'desc'
        ? eb.or([eb(column, '<', at), eb.and([eb(column, '=', at), eb('id', '<', id)])])
        : eb.or([eb(column, '>', at), eb.and([eb(column, '=', at), eb('id', '>', id)])]));
    }
    const rows = await request.orderBy(column, direction).orderBy('id', direction).limit(query.limit).execute();
    return rows.map(toOpportunity);
  }

  async insertOffer(offer: Offer): Promise<void> {
    await this.trx.insertInto('offer').values({
      id: offer.id,
      opportunity_id: offer.opportunityId,
      status: offer.status,
      client_subject: offer.clientSubject,
      created_at: new Date(offer.createdAt),
      updated_at: new Date(offer.updatedAt),
    }).execute();
  }

  async findOffer(id: string): Promise<Offer | null> {
    const row = await this.trx.selectFrom('offer').selectAll().where('id', '=', id).executeTakeFirst();
    return row ? toOffer(row) : null;
  }

  async findOfferByOpportunity(opportunityId: string): Promise<Offer | null> {
    const row = await this.trx.selectFrom('offer').selectAll().where('opportunity_id', '=', opportunityId).executeTakeFirst();
    return row ? toOffer(row) : null;
  }

  async listOffers(query: OfferListQuery): Promise<Offer[]> {
    const column = query.sort.includes('updatedAt') ? 'updated_at' : 'created_at';
    const direction = query.sort.startsWith('-') ? 'desc' : 'asc';
    let request = this.trx.selectFrom('offer').selectAll();
    if (query.status) request = request.where('status', '=', query.status);
    if (query.cursor) {
      const at = new Date(query.cursor.at);
      const id = query.cursor.id;
      request = request.where(eb => direction === 'desc'
        ? eb.or([eb(column, '<', at), eb.and([eb(column, '=', at), eb('id', '<', id)])])
        : eb.or([eb(column, '>', at), eb.and([eb(column, '=', at), eb('id', '>', id)])]));
    }
    const rows = await request.orderBy(column, direction).orderBy('id', direction).limit(query.limit).execute();
    return rows.map(toOffer);
  }

  async insertContract(contract: Contract): Promise<void> {
    await this.trx.insertInto('contract').values({
      id: contract.id,
      offer_id: contract.offerId,
      status: contract.status,
      created_at: new Date(contract.createdAt),
      updated_at: new Date(contract.updatedAt),
    }).execute();
  }

  async findContract(id: string): Promise<Contract | null> {
    const row = await this.trx.selectFrom('contract').selectAll().where('id', '=', id).executeTakeFirst();
    return row ? toContract(row) : null;
  }

  async findContractByOffer(offerId: string): Promise<Contract | null> {
    const row = await this.trx.selectFrom('contract').selectAll().where('offer_id', '=', offerId).executeTakeFirst();
    return row ? toContract(row) : null;
  }

  async listContracts(query: ContractListQuery): Promise<Contract[]> {
    const column = query.sort.includes('updatedAt') ? 'updated_at' : 'created_at';
    const direction = query.sort.startsWith('-') ? 'desc' : 'asc';
    let request = this.trx.selectFrom('contract').selectAll();
    if (query.status) request = request.where('status', '=', query.status);
    if (query.cursor) {
      const at = new Date(query.cursor.at);
      const id = query.cursor.id;
      request = request.where(eb => direction === 'desc'
        ? eb.or([eb(column, '<', at), eb.and([eb(column, '=', at), eb('id', '<', id)])])
        : eb.or([eb(column, '>', at), eb.and([eb(column, '=', at), eb('id', '>', id)])]));
    }
    const rows = await request.orderBy(column, direction).orderBy('id', direction).limit(query.limit).execute();
    return rows.map(toContract);
  }

  async insertProject(project: Project): Promise<void> {
    await this.trx.insertInto('project').values({
      id: project.id,
      contract_id: project.contractId,
      status: project.status,
      client_subject: project.clientSubject,
      created_at: new Date(project.createdAt),
      updated_at: new Date(project.updatedAt),
    }).execute();
  }

  async findProject(id: string): Promise<Project | null> {
    const row = await this.trx.selectFrom('project').selectAll().where('id', '=', id).executeTakeFirst();
    return row ? toProject(row) : null;
  }

  async findProjectByContract(contractId: string): Promise<Project | null> {
    const row = await this.trx.selectFrom('project').selectAll().where('contract_id', '=', contractId).executeTakeFirst();
    return row ? toProject(row) : null;
  }

  async listProjects(query: ProjectListQuery): Promise<Project[]> {
    const column = query.sort.includes('updatedAt') ? 'updated_at' : 'created_at';
    const direction = query.sort.startsWith('-') ? 'desc' : 'asc';
    let request = this.trx.selectFrom('project').selectAll();
    if (query.status) request = request.where('status', '=', query.status);
    if (query.cursor) {
      const at = new Date(query.cursor.at);
      const id = query.cursor.id;
      request = request.where(eb => direction === 'desc'
        ? eb.or([eb(column, '<', at), eb.and([eb(column, '=', at), eb('id', '<', id)])])
        : eb.or([eb(column, '>', at), eb.and([eb(column, '=', at), eb('id', '>', id)])]));
    }
    const rows = await request.orderBy(column, direction).orderBy('id', direction).limit(query.limit).execute();
    return rows.map(toProject);
  }

  async insertProjectFile(file: ProjectFile): Promise<void> {
    await this.trx.insertInto('project_file').values({
      id: file.id,
      project_id: file.projectId,
      client_subject: file.clientSubject,
      name: file.name,
      mime_type: file.mimeType,
      size_bytes: file.sizeBytes,
      created_at: new Date(file.createdAt),
      updated_at: new Date(file.updatedAt),
    }).execute();
  }

  async findProjectFile(id: string): Promise<ProjectFile | null> {
    const row = await this.trx.selectFrom('project_file').selectAll().where('id', '=', id).executeTakeFirst();
    return row ? toProjectFile(row) : null;
  }

  async listProjectFiles(query: ProjectFileListQuery): Promise<ProjectFile[]> {
    const column = query.sort.includes('updatedAt') ? 'updated_at' : 'created_at';
    const direction = query.sort.startsWith('-') ? 'desc' : 'asc';
    let request = this.trx.selectFrom('project_file').selectAll();
    if (query.projectId) request = request.where('project_id', '=', query.projectId);
    if (query.clientSubject) request = request.where('client_subject', '=', query.clientSubject);
    if (query.cursor) {
      const at = new Date(query.cursor.at);
      const id = query.cursor.id;
      request = request.where(eb => direction === 'desc'
        ? eb.or([eb(column, '<', at), eb.and([eb(column, '=', at), eb('id', '<', id)])])
        : eb.or([eb(column, '>', at), eb.and([eb(column, '=', at), eb('id', '>', id)])]));
    }
    const rows = await request.orderBy(column, direction).orderBy('id', direction).limit(query.limit).execute();
    return rows.map(toProjectFile);
  }

  async insertOutbox(message: OutboxMessage): Promise<void> {
    await this.trx.insertInto('domain_outbox').values({
      id: message.id,
      event_type: message.eventType,
      lead_id: message.leadId,
      payload: jsonb(message.payload),
      created_at: new Date(message.at),
      published_at: null,
      attempts: 0,
      next_attempt_at: null,
      claimed_at: null,
      claim_token: null,
      last_error: null,
      delivery_status: 'pending',
    }).execute();
  }

  async insertAudit(event: AuditEvent): Promise<void> {
    await this.trx.insertInto('audit_event').values({
      id: event.id,
      action: event.action,
      actor_id: event.actorId,
      lead_id: event.leadId,
      metadata: jsonb(event.metadata),
      created_at: new Date(event.at),
    }).execute();
  }

  private leadValues(lead: Lead): Database['lead'] {
    return {
      id: lead.id,
      source: lead.source,
      status: lead.status,
      contact_name: lead.contact.name,
      contact_phone: lead.contact.phone,
      contact_email: lead.contact.email ?? null,
      locality: lead.property.locality ?? null,
      site_analysis_requested: lead.siteAnalysisRequested,
      qualification_result: lead.qualification.result,
      qualification_reasons: jsonb(lead.qualification.reasons),
      created_at: new Date(lead.createdAt),
      updated_at: new Date(lead.updatedAt),
    };
  }
}
