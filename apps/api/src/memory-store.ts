import type { Lead, LeadStatus, Opportunity, OpportunityStatus } from '@forma-zieleni/domain';
import type {
  AuditEvent,
  LeadStore,
  LeadTx,
  ListQuery,
  OpportunityListQuery,
  OutboxMessage,
  StoredReply,
} from './store.ts';

type MemoryState = {
  leads: Lead[];
  opportunities: Opportunity[];
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
    idempotency: new Map(),
    outbox: [],
    audits: [],
  };

  async transaction<T>(run: (tx: LeadTx) => Promise<T>): Promise<T> {
    const snapshot = clone({
      leads: this.state.leads,
      opportunities: this.state.opportunities,
      outbox: this.state.outbox,
      audits: this.state.audits,
      idempotency: [...this.state.idempotency.entries()],
    });
    try {
      return await run(new MemoryTx(this.state));
    } catch (error) {
      this.state.leads = snapshot.leads;
      this.state.opportunities = snapshot.opportunities;
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

  async insertOutbox(message: OutboxMessage): Promise<void> {
    this.state.outbox.push(clone(message));
  }

  async insertAudit(event: AuditEvent): Promise<void> {
    this.state.audits.push(clone(event));
  }
}
