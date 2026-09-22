import type { Lead, LeadStatus, Opportunity, OpportunityStatus } from '@forma-zieleni/domain';

export type SortField = 'createdAt' | '-createdAt' | 'updatedAt' | '-updatedAt';

export type ListQuery = {
  limit: number;
  sort: SortField;
  status?: LeadStatus;
  cursor?: { at: string; id: string };
};

export type OpportunityListQuery = {
  limit: number;
  sort: SortField;
  status?: OpportunityStatus;
  cursor?: { at: string; id: string };
};

export type StoredReply = {
  requestHash: string;
  responseStatus: number;
  responseBody: unknown;
};

export type OutboxMessage = {
  id: string;
  eventType: 'lead.captured' | 'lead.qualified' | 'opportunity.created';
  leadId: string;
  payload: { leadId: string; status: string; source?: string; opportunityId?: string };
  at: string;
};

export type AuditEvent = {
  id: string;
  action: 'lead.captured' | 'lead.qualified' | 'opportunity.created';
  actorId: string | null;
  leadId: string;
  at: string;
  metadata: { status: string; source?: string; result?: string; capacityHold?: boolean; opportunityId?: string };
};

export interface LeadTx {
  findIdempotency(scope: string, key: string): Promise<StoredReply | null>;
  saveIdempotency(scope: string, key: string, reply: StoredReply, at: string): Promise<void>;
  insertLead(lead: Lead): Promise<void>;
  saveLead(lead: Lead): Promise<void>;
  findLead(id: string): Promise<Lead | null>;
  listLeads(query: ListQuery): Promise<Lead[]>;
  insertOpportunity(opportunity: Opportunity): Promise<void>;
  findOpportunity(id: string): Promise<Opportunity | null>;
  findOpportunityByLead(leadId: string): Promise<Opportunity | null>;
  listOpportunities(query: OpportunityListQuery): Promise<Opportunity[]>;
  insertOutbox(message: OutboxMessage): Promise<void>;
  insertAudit(event: AuditEvent): Promise<void>;
}

export interface LeadStore {
  transaction<T>(run: (tx: LeadTx) => Promise<T>): Promise<T>;
}
