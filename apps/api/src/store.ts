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

export type ContractListQuery = {
  limit: number;
  sort: SortField;
  status?: ContractStatus;
  cursor?: { at: string; id: string };
};

export type ProjectListQuery = {
  limit: number;
  sort: SortField;
  status?: ProjectStatus;
  cursor?: { at: string; id: string };
};

export type ProjectFileListQuery = {
  limit: number;
  sort: SortField;
  projectId?: string;
  clientSubject?: string;
  cursor?: { at: string; id: string };
};

export type StoredReply = {
  requestHash: string;
  responseStatus: number;
  responseBody: unknown;
};

export type OutboxMessage = {
  id: string;
  eventType: 'lead.captured' | 'lead.qualified' | 'opportunity.created' | 'offer.created' | 'contract.created' | 'project.created';
  leadId: string;
  payload: {
    leadId: string;
    status: string;
    source?: string;
    opportunityId?: string;
    offerId?: string;
    contractId?: string;
    projectId?: string;
  };
  at: string;
};

export type AuditEvent = {
  id: string;
  action: 'lead.captured' | 'lead.qualified' | 'opportunity.created' | 'offer.created' | 'contract.created' | 'project.created';
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
    contractId?: string;
    projectId?: string;
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
  insertContract(contract: Contract): Promise<void>;
  findContract(id: string): Promise<Contract | null>;
  findContractByOffer(offerId: string): Promise<Contract | null>;
  listContracts(query: ContractListQuery): Promise<Contract[]>;
  insertProject(project: Project): Promise<void>;
  findProject(id: string): Promise<Project | null>;
  findProjectByContract(contractId: string): Promise<Project | null>;
  listProjects(query: ProjectListQuery): Promise<Project[]>;
  insertProjectFile(file: ProjectFile): Promise<void>;
  findProjectFile(id: string): Promise<ProjectFile | null>;
  listProjectFiles(query: ProjectFileListQuery): Promise<ProjectFile[]>;
  insertOutbox(message: OutboxMessage): Promise<void>;
  insertAudit(event: AuditEvent): Promise<void>;
}

export interface LeadStore {
  transaction<T>(run: (tx: LeadTx) => Promise<T>): Promise<T>;
}
