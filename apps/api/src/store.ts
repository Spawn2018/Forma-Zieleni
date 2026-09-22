import type { Lead, LeadStatus, Offer, OfferStatus, Opportunity, OpportunityStatus } from '@forma-zieleni/domain';

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

export type OfferListQuery = {
  limit: number;
  sort: SortField;
  status?: OfferStatus;
  cursor?: { at: string; id: string };
};

export type StoredReply = {
  requestHash: string;
  responseStatus: number;
  responseBody: unknown;
};

export type OutboxMessage = {
  id: string;
  eventType: 'lead.captured' | 'lead.qualified' | 'opportunity.created' | 'offer.created';
  leadId: string;
  payload: {
    leadId: string;
    status: string;
    source?: string;
    opportunityId?: string;
    offerId?: string;
  };
  at: string;
};

export type AuditEvent = {
  id: string;
  action: 'lead.captured' | 'lead.qualified' | 'opportunity.created' | 'offer.created';
  actorId: string | null;
  leadId: string;
  at: string;
  metadata: {
    status: string;
    source?: string;
    result?: string;
    capacityHold?: boolean;
    opportunityId?: string;
    offerId?: string;
  };
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
  insertOffer(offer: Offer): Promise<void>;
  findOffer(id: string): Promise<Offer | null>;
  findOfferByOpportunity(opportunityId: string): Promise<Offer | null>;
  listOffers(query: OfferListQuery): Promise<Offer[]>;
  insertOutbox(message: OutboxMessage): Promise<void>;
  insertAudit(event: AuditEvent): Promise<void>;
}

export interface LeadStore {
  transaction<T>(run: (tx: LeadTx) => Promise<T>): Promise<T>;
}
