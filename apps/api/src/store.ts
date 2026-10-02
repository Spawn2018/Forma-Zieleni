import type {
  Contract,
  ContractStatus,
  Garden,
  Lead,
  LeadStatus,
  Offer,
  OfferStatus,
  Opportunity,
  OpportunityStatus,
  PaymentSchedule,
  SandboxPaymentIntent,
  Project,
  ProjectDecisionLogEntry,
  ProjectFile,
  ProjectMilestone,
  ProjectStatus,
  SiteIntelligenceRecord,
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

export type MilestoneListQuery = {
  limit: number;
  sort: SortField;
  projectId?: string;
  cursor?: { at: string; id: string };
};

export type DecisionLogListQuery = {
  limit: number;
  sort: SortField;
  projectId?: string;
  cursor?: { at: string; id: string };
};

export type PaymentScheduleListQuery = {
  limit: number;
  sort: SortField;
  contractId?: string;
  cursor?: { at: string; id: string };
};

export type GardenListQuery = {
  limit: number;
  sort: SortField;
  projectId?: string;
  clientSubject?: string;
  cursor?: { at: string; id: string };
};

export type SiteIntelligenceListQuery = {
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
  eventType: 'lead.captured' | 'lead.qualified' | 'opportunity.created' | 'offer.created' | 'contract.created' | 'contract.lifecycle_advanced' | 'project.created' | 'project.delivered';
  leadId: string;
  payload: {
    leadId: string;
    status: string;
    source?: string;
    opportunityId?: string;
    offerId?: string;
    contractId?: string;
    projectId?: string;
    fromStatus?: string;
  };
  at: string;
};

export type AuditEvent = {
  id: string;
  action: 'lead.captured' | 'lead.qualified' | 'opportunity.created' | 'offer.created' | 'contract.created' | 'contract.lifecycle_advanced' | 'project.created' | 'project.delivered' | 'payment.schedule_created' | 'payment.schedule_replaced' | 'payment.installment_transitioned' | 'payment.sandbox_intent_created' | 'payment.sandbox_webhook_confirmed';
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
    fromStatus?: string;
    scheduleId?: string;
    installmentId?: string;
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
  saveContract(contract: Contract): Promise<void>;
  findContract(id: string): Promise<Contract | null>;
  findContractByOffer(offerId: string): Promise<Contract | null>;
  listContracts(query: ContractListQuery): Promise<Contract[]>;
  insertProject(project: Project): Promise<void>;
  saveProject(project: Project): Promise<void>;
  findProject(id: string): Promise<Project | null>;
  findProjectByContract(contractId: string): Promise<Project | null>;
  listProjects(query: ProjectListQuery): Promise<Project[]>;
  insertProjectFile(file: ProjectFile): Promise<void>;
  findProjectFile(id: string): Promise<ProjectFile | null>;
  listProjectFiles(query: ProjectFileListQuery): Promise<ProjectFile[]>;
  insertMilestone(milestone: ProjectMilestone): Promise<void>;
  findMilestone(id: string): Promise<ProjectMilestone | null>;
  listMilestones(query: MilestoneListQuery): Promise<ProjectMilestone[]>;
  insertDecisionLogEntry(entry: ProjectDecisionLogEntry): Promise<void>;
  findDecisionLogEntry(id: string): Promise<ProjectDecisionLogEntry | null>;
  listDecisionLogEntries(query: DecisionLogListQuery): Promise<ProjectDecisionLogEntry[]>;
  insertPaymentSchedule(schedule: PaymentSchedule): Promise<void>;
  savePaymentSchedule(schedule: PaymentSchedule): Promise<void>;
  findPaymentSchedule(id: string): Promise<PaymentSchedule | null>;
  findPaymentScheduleByContract(contractId: string): Promise<PaymentSchedule | null>;
  listPaymentSchedules(query: PaymentScheduleListQuery): Promise<PaymentSchedule[]>;
  insertSandboxIntent(intent: SandboxPaymentIntent): Promise<void>;
  saveSandboxIntent(intent: SandboxPaymentIntent): Promise<void>;
  findSandboxIntent(id: string): Promise<SandboxPaymentIntent | null>;
  findSandboxIntentByInstallment(installmentId: string): Promise<SandboxPaymentIntent | null>;
  insertGarden(garden: Garden): Promise<void>;
  findGarden(id: string): Promise<Garden | null>;
  findGardenByProject(projectId: string): Promise<Garden | null>;
  listGardens(query: GardenListQuery): Promise<Garden[]>;
  insertSiteIntelligence(record: SiteIntelligenceRecord): Promise<void>;
  findSiteIntelligence(id: string): Promise<SiteIntelligenceRecord | null>;
  findSiteIntelligenceByProject(projectId: string): Promise<SiteIntelligenceRecord | null>;
  listSiteIntelligence(query: SiteIntelligenceListQuery): Promise<SiteIntelligenceRecord[]>;
  insertOutbox(message: OutboxMessage): Promise<void>;
  insertAudit(event: AuditEvent): Promise<void>;
}

export interface LeadStore {
  transaction<T>(run: (tx: LeadTx) => Promise<T>): Promise<T>;
}
