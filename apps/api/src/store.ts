import type { Lead, LeadStatus } from '@forma-zieleni/domain';

export type SortField = 'createdAt' | '-createdAt' | 'updatedAt' | '-updatedAt';

export type ListQuery = {
  limit: number;
  sort: SortField;
  status?: LeadStatus;
  cursor?: { at: string; id: string };
};

export type StoredReply = {
  requestHash: string;
  responseStatus: number;
  responseBody: unknown;
};

export type OutboxMessage = {
  id: string;
  eventType: 'lead.captured' | 'lead.qualified';
  leadId: string;
  payload: { leadId: string; status: string; source: string };
  at: string;
};

export type AuditEvent = {
  id: string;
  action: 'lead.captured' | 'lead.qualified';
  actorId: string | null;
  leadId: string;
  at: string;
  metadata: { status: string; source?: string; result?: string; capacityHold?: boolean };
};

export interface LeadTx {
  findIdempotency(scope: string, key: string): Promise<StoredReply | null>;
  saveIdempotency(scope: string, key: string, reply: StoredReply, at: string): Promise<void>;
  insertLead(lead: Lead): Promise<void>;
  saveLead(lead: Lead): Promise<void>;
  findLead(id: string): Promise<Lead | null>;
  listLeads(query: ListQuery): Promise<Lead[]>;
  insertOutbox(message: OutboxMessage): Promise<void>;
  insertAudit(event: AuditEvent): Promise<void>;
}

export interface LeadStore {
  transaction<T>(run: (tx: LeadTx) => Promise<T>): Promise<T>;
}
