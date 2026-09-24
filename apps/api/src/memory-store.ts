import type {
  Contract,
  ContractStatus,
  Lead,
  LeadStatus,
  Offer,
  OfferStatus,
  Opportunity,
  OpportunityStatus,
  Project,
  ProjectFile,
  ProjectStatus,
} from '@forma-zieleni/domain';
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

type MemoryState = {
  leads: Lead[];
  opportunities: Opportunity[];
  offers: Offer[];
  contracts: Contract[];
  projects: Project[];
  projectFiles: ProjectFile[];
  idempotency: Map<string, StoredReply>;
  outbox: OutboxMessage[];
  audits: AuditEvent[];
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function stamp(row: { createdAt: string; updatedAt: string; id: string }, sort: ListQuery['sort']): string {
  return sort === 'updatedAt' || sort === '-updatedAt' ? row.updatedAt : row.createdAt;
}

export class MemoryLeadStore implements LeadStore {
  readonly state: MemoryState = {
    leads: [],
    opportunities: [],
    offers: [],
    contracts: [],
    projects: [],
    projectFiles: [],
    idempotency: new Map(),
    outbox: [],
    audits: [],
  };

  async transaction<T>(run: (tx: LeadTx) => Promise<T>): Promise<T> {
    const snapshot = clone({
      leads: this.state.leads,
      opportunities: this.state.opportunities,
      offers: this.state.offers,
      contracts: this.state.contracts,
      projects: this.state.projects,
      projectFiles: this.state.projectFiles,
      outbox: this.state.outbox,
      audits: this.state.audits,
      idempotency: [...this.state.idempotency.entries()],
    });
    try {
      return await run(new MemoryTx(this.state));
    } catch (error) {
      this.state.leads = snapshot.leads;
      this.state.opportunities = snapshot.opportunities;
      this.state.offers = snapshot.offers;
      this.state.contracts = snapshot.contracts;
      this.state.projects = snapshot.projects;
      this.state.projectFiles = snapshot.projectFiles;
      this.state.outbox = snapshot.outbox;
      this.state.audits = snapshot.audits;
      this.state.idempotency = new Map(snapshot.idempotency);
      throw error;
    }
  }
}

class MemoryTx implements LeadTx {
  private readonly state: MemoryState;

  constructor(state: MemoryState) {
    this.state = state;
  }

  async findIdempotency(scope: string, key: string): Promise<StoredReply | null> {
    return this.state.idempotency.get(`${scope}\0${key}`) ?? null;
  }

  async saveIdempotency(scope: string, key: string, reply: StoredReply, _at: string): Promise<void> {
    this.state.idempotency.set(`${scope}\0${key}`, reply);
  }

  async insertLead(lead: Lead): Promise<void> {
    this.state.leads.push(clone(lead));
  }

  async saveLead(lead: Lead): Promise<void> {
    const index = this.state.leads.findIndex(item => item.id === lead.id);
    if (index < 0) throw new Error('LEAD_MISSING');
    this.state.leads[index] = clone(lead);
  }

  async findLead(id: string): Promise<Lead | null> {
    return clone(this.state.leads.find(item => item.id === id) ?? null);
  }

  async listLeads(query: ListQuery): Promise<Lead[]> {
    const descending = query.sort.startsWith('-');
    const rows = this.state.leads.filter(lead => !query.status || lead.status === (query.status as LeadStatus));
    rows.sort((left, right) => {
      const compared = stamp(left, query.sort).localeCompare(stamp(right, query.sort)) || left.id.localeCompare(right.id);
      return descending ? -compared : compared;
    });
    const start = query.cursor
      ? rows.findIndex(lead => {
          const at = stamp(lead, query.sort);
          if (descending) return at < query.cursor!.at || (at === query.cursor!.at && lead.id < query.cursor!.id);
          return at > query.cursor!.at || (at === query.cursor!.at && lead.id > query.cursor!.id);
        })
      : 0;
    if (query.cursor && start < 0) return [];
    return clone(rows.slice(start, start + query.limit));
  }

  async insertOpportunity(opportunity: Opportunity): Promise<void> {
    if (this.state.opportunities.some(item => item.leadId === opportunity.leadId)) {
      throw new Error('OPPORTUNITY_EXISTS');
    }
    this.state.opportunities.push(clone(opportunity));
  }

  async findOpportunity(id: string): Promise<Opportunity | null> {
    return clone(this.state.opportunities.find(item => item.id === id) ?? null);
  }

  async findOpportunityByLead(leadId: string): Promise<Opportunity | null> {
    return clone(this.state.opportunities.find(item => item.leadId === leadId) ?? null);
  }

  async listOpportunities(query: OpportunityListQuery): Promise<Opportunity[]> {
    const descending = query.sort.startsWith('-');
    const rows = this.state.opportunities.filter(
      opportunity => !query.status || opportunity.status === (query.status as OpportunityStatus),
    );
    rows.sort((left, right) => {
      const compared = stamp(left, query.sort).localeCompare(stamp(right, query.sort)) || left.id.localeCompare(right.id);
      return descending ? -compared : compared;
    });
    const start = query.cursor
      ? rows.findIndex(opportunity => {
          const at = stamp(opportunity, query.sort);
          if (descending) return at < query.cursor!.at || (at === query.cursor!.at && opportunity.id < query.cursor!.id);
          return at > query.cursor!.at || (at === query.cursor!.at && opportunity.id > query.cursor!.id);
        })
      : 0;
    if (query.cursor && start < 0) return [];
    return clone(rows.slice(start, start + query.limit));
  }

  async insertOffer(offer: Offer): Promise<void> {
    if (this.state.offers.some(item => item.opportunityId === offer.opportunityId)) {
      throw new Error('OFFER_EXISTS');
    }
    this.state.offers.push(clone(offer));
  }

  async findOffer(id: string): Promise<Offer | null> {
    return clone(this.state.offers.find(item => item.id === id) ?? null);
  }

  async findOfferByOpportunity(opportunityId: string): Promise<Offer | null> {
    return clone(this.state.offers.find(item => item.opportunityId === opportunityId) ?? null);
  }

  async listOffers(query: OfferListQuery): Promise<Offer[]> {
    const descending = query.sort.startsWith('-');
    const rows = this.state.offers.filter(
      offer => !query.status || offer.status === (query.status as OfferStatus),
    );
    rows.sort((left, right) => {
      const compared = stamp(left, query.sort).localeCompare(stamp(right, query.sort)) || left.id.localeCompare(right.id);
      return descending ? -compared : compared;
    });
    const start = query.cursor
      ? rows.findIndex(offer => {
          const at = stamp(offer, query.sort);
          if (descending) return at < query.cursor!.at || (at === query.cursor!.at && offer.id < query.cursor!.id);
          return at > query.cursor!.at || (at === query.cursor!.at && offer.id > query.cursor!.id);
        })
      : 0;
    if (query.cursor && start < 0) return [];
    return clone(rows.slice(start, start + query.limit));
  }

  async insertContract(contract: Contract): Promise<void> {
    if (this.state.contracts.some(item => item.offerId === contract.offerId)) {
      throw new Error('CONTRACT_EXISTS');
    }
    this.state.contracts.push(clone(contract));
  }

  async findContract(id: string): Promise<Contract | null> {
    return clone(this.state.contracts.find(item => item.id === id) ?? null);
  }

  async findContractByOffer(offerId: string): Promise<Contract | null> {
    return clone(this.state.contracts.find(item => item.offerId === offerId) ?? null);
  }

  async listContracts(query: ContractListQuery): Promise<Contract[]> {
    const descending = query.sort.startsWith('-');
    const rows = this.state.contracts.filter(
      contract => !query.status || contract.status === (query.status as ContractStatus),
    );
    rows.sort((left, right) => {
      const compared = stamp(left, query.sort).localeCompare(stamp(right, query.sort)) || left.id.localeCompare(right.id);
      return descending ? -compared : compared;
    });
    const start = query.cursor
      ? rows.findIndex(contract => {
          const at = stamp(contract, query.sort);
          if (descending) return at < query.cursor!.at || (at === query.cursor!.at && contract.id < query.cursor!.id);
          return at > query.cursor!.at || (at === query.cursor!.at && contract.id > query.cursor!.id);
        })
      : 0;
    if (query.cursor && start < 0) return [];
    return clone(rows.slice(start, start + query.limit));
  }

  async insertProject(project: Project): Promise<void> {
    if (this.state.projects.some(item => item.contractId === project.contractId)) {
      throw new Error('PROJECT_EXISTS');
    }
    this.state.projects.push(clone(project));
  }

  async findProject(id: string): Promise<Project | null> {
    return clone(this.state.projects.find(item => item.id === id) ?? null);
  }

  async findProjectByContract(contractId: string): Promise<Project | null> {
    return clone(this.state.projects.find(item => item.contractId === contractId) ?? null);
  }

  async listProjects(query: ProjectListQuery): Promise<Project[]> {
    const descending = query.sort.startsWith('-');
    const rows = this.state.projects.filter(
      project => !query.status || project.status === (query.status as ProjectStatus),
    );
    rows.sort((left, right) => {
      const compared = stamp(left, query.sort).localeCompare(stamp(right, query.sort)) || left.id.localeCompare(right.id);
      return descending ? -compared : compared;
    });
    const start = query.cursor
      ? rows.findIndex(project => {
          const at = stamp(project, query.sort);
          if (descending) return at < query.cursor!.at || (at === query.cursor!.at && project.id < query.cursor!.id);
          return at > query.cursor!.at || (at === query.cursor!.at && project.id > query.cursor!.id);
        })
      : 0;
    if (query.cursor && start < 0) return [];
    return clone(rows.slice(start, start + query.limit));
  }

  async insertProjectFile(file: ProjectFile): Promise<void> {
    this.state.projectFiles.push(clone(file));
  }

  async findProjectFile(id: string): Promise<ProjectFile | null> {
    return clone(this.state.projectFiles.find(item => item.id === id) ?? null);
  }

  async listProjectFiles(query: ProjectFileListQuery): Promise<ProjectFile[]> {
    const descending = query.sort.startsWith('-');
    const rows = this.state.projectFiles.filter(
      file => !query.projectId || file.projectId === query.projectId,
    );
    rows.sort((left, right) => {
      const compared = stamp(left, query.sort).localeCompare(stamp(right, query.sort)) || left.id.localeCompare(right.id);
      return descending ? -compared : compared;
    });
    const start = query.cursor
      ? rows.findIndex(file => {
          const at = stamp(file, query.sort);
          if (descending) return at < query.cursor!.at || (at === query.cursor!.at && file.id < query.cursor!.id);
          return at > query.cursor!.at || (at === query.cursor!.at && file.id > query.cursor!.id);
        })
      : 0;
    if (query.cursor && start < 0) return [];
    return clone(rows.slice(start, start + query.limit));
  }

  async insertOutbox(message: OutboxMessage): Promise<void> {
    this.state.outbox.push(clone(message));
  }

  async insertAudit(event: AuditEvent): Promise<void> {
    this.state.audits.push(clone(event));
  }
}
