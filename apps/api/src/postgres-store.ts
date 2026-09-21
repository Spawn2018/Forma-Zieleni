import { sql, type Kysely, type Transaction } from 'kysely';
import type { Lead } from '@forma-zieleni/domain';
import { ApiFailure, PersistenceFailure } from './errors.ts';
import type { Database } from './db.ts';
import type { AuditEvent, LeadStore, LeadTx, ListQuery, OutboxMessage, StoredReply } from './store.ts';

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
    await this.trx.insertInto('lead').values(this.values(lead)).execute();
  }

  async saveLead(lead: Lead): Promise<void> {
    await this.trx.updateTable('lead').set(this.values(lead)).where('id', '=', lead.id).execute();
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

  async insertOutbox(message: OutboxMessage): Promise<void> {
    await this.trx.insertInto('domain_outbox').values({
      id: message.id,
      event_type: message.eventType,
      lead_id: message.leadId,
      payload: jsonb(message.payload),
      created_at: new Date(message.at),
      published_at: null,
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

  private values(lead: Lead): Database['lead'] {
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
