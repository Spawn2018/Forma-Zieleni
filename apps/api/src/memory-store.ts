import type {
  CapacityWindow,
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
  SigningSandboxEnvelope,
  Project,
  ProjectDecisionLogEntry,
  ProjectFile,
  ProjectMilestone,
  ProjectStatus,
  SiteIntelligenceRecord,
} from '@forma-zieleni/domain';
import type {
  AuditEvent,
  ContractListQuery,
  DecisionLogListQuery,
  CapacityListQuery,
  GardenListQuery,
  LeadStore,
  LeadTx,
  ListQuery,
  MilestoneListQuery,
  OfferListQuery,
  OpportunityListQuery,
  OutboxMessage,
  PaymentScheduleListQuery,
  ProjectFileListQuery,
  ProjectListQuery,
  SiteIntelligenceListQuery,
  StoredReply,
} from './store.ts';

type MemoryState = {
  leads: Lead[];
  opportunities: Opportunity[];
  offers: Offer[];
  contracts: Contract[];
  projects: Project[];
  projectFiles: ProjectFile[];
  milestones: ProjectMilestone[];
  decisionLog: ProjectDecisionLogEntry[];
  paymentSchedules: PaymentSchedule[];
  sandboxIntents: SandboxPaymentIntent[];
  signingEnvelopes: SigningSandboxEnvelope[];
  capacityWindows: CapacityWindow[];
  gardens: Garden[];
  siteIntelligence: SiteIntelligenceRecord[];
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
    milestones: [],
    decisionLog: [],
    paymentSchedules: [],
    sandboxIntents: [],
    signingEnvelopes: [],
    capacityWindows: [],
    gardens: [],
    siteIntelligence: [],
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
      milestones: this.state.milestones,
      decisionLog: this.state.decisionLog,
      paymentSchedules: this.state.paymentSchedules,
      sandboxIntents: this.state.sandboxIntents,
      signingEnvelopes: this.state.signingEnvelopes,
      capacityWindows: this.state.capacityWindows,
      gardens: this.state.gardens,
      siteIntelligence: this.state.siteIntelligence,
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
      this.state.milestones = snapshot.milestones;
      this.state.decisionLog = snapshot.decisionLog;
      this.state.paymentSchedules = snapshot.paymentSchedules;
      this.state.sandboxIntents = snapshot.sandboxIntents;
      this.state.signingEnvelopes = snapshot.signingEnvelopes;
      this.state.capacityWindows = snapshot.capacityWindows;
      this.state.gardens = snapshot.gardens;
      this.state.siteIntelligence = snapshot.siteIntelligence;
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

  async saveContract(contract: Contract): Promise<void> {
    const index = this.state.contracts.findIndex(item => item.id === contract.id);
    if (index < 0) throw new Error('CONTRACT_MISSING');
    this.state.contracts[index] = clone(contract);
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

  async saveProject(project: Project): Promise<void> {
    const index = this.state.projects.findIndex(item => item.id === project.id);
    if (index < 0) throw new Error('PROJECT_MISSING');
    this.state.projects[index] = clone(project);
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
      file => (!query.projectId || file.projectId === query.projectId)
        && (!query.clientSubject || file.clientSubject === query.clientSubject),
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

  async insertMilestone(milestone: ProjectMilestone): Promise<void> {
    this.state.milestones.push(clone(milestone));
  }

  async saveMilestone(milestone: ProjectMilestone): Promise<void> {
    const index = this.state.milestones.findIndex(item => item.id === milestone.id);
    if (index < 0) throw new Error('MILESTONE_MISSING');
    this.state.milestones[index] = clone(milestone);
  }

  async findMilestone(id: string): Promise<ProjectMilestone | null> {
    return clone(this.state.milestones.find(item => item.id === id) ?? null);
  }

  async listMilestones(query: MilestoneListQuery): Promise<ProjectMilestone[]> {
    const descending = query.sort.startsWith('-');
    const owned = query.clientSubject
      ? new Set(this.state.projects.filter(project => project.clientSubject === query.clientSubject).map(project => project.id))
      : null;
    const rows = this.state.milestones.filter(milestone => {
      if (query.projectId && milestone.projectId !== query.projectId) return false;
      if (owned && !owned.has(milestone.projectId)) return false;
      return true;
    });
    rows.sort((left, right) => {
      const compared = stamp(left, query.sort).localeCompare(stamp(right, query.sort)) || left.id.localeCompare(right.id);
      return descending ? -compared : compared;
    });
    const start = query.cursor
      ? rows.findIndex(milestone => {
          const at = stamp(milestone, query.sort);
          if (descending) return at < query.cursor!.at || (at === query.cursor!.at && milestone.id < query.cursor!.id);
          return at > query.cursor!.at || (at === query.cursor!.at && milestone.id > query.cursor!.id);
        })
      : 0;
    if (query.cursor && start < 0) return [];
    return clone(rows.slice(start, start + query.limit));
  }

  async insertDecisionLogEntry(entry: ProjectDecisionLogEntry): Promise<void> {
    this.state.decisionLog.push(clone(entry));
  }

  async saveDecisionLogEntry(entry: ProjectDecisionLogEntry): Promise<void> {
    const index = this.state.decisionLog.findIndex(item => item.id === entry.id);
    if (index < 0) throw new Error('DECISION_LOG_MISSING');
    this.state.decisionLog[index] = clone(entry);
  }

  async findDecisionLogEntry(id: string): Promise<ProjectDecisionLogEntry | null> {
    return clone(this.state.decisionLog.find(item => item.id === id) ?? null);
  }

  async listDecisionLogEntries(query: DecisionLogListQuery): Promise<ProjectDecisionLogEntry[]> {
    const descending = query.sort.startsWith('-');
    const rows = this.state.decisionLog.filter(
      entry => !query.projectId || entry.projectId === query.projectId,
    );
    rows.sort((left, right) => {
      const compared = left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id);
      return descending ? -compared : compared;
    });
    const start = query.cursor
      ? rows.findIndex(entry => {
          const at = entry.createdAt;
          if (descending) return at < query.cursor!.at || (at === query.cursor!.at && entry.id < query.cursor!.id);
          return at > query.cursor!.at || (at === query.cursor!.at && entry.id > query.cursor!.id);
        })
      : 0;
    if (query.cursor && start < 0) return [];
    return clone(rows.slice(start, start + query.limit));
  }

  async insertPaymentSchedule(schedule: PaymentSchedule): Promise<void> {
    this.state.paymentSchedules.push(clone(schedule));
  }

  async savePaymentSchedule(schedule: PaymentSchedule): Promise<void> {
    const index = this.state.paymentSchedules.findIndex(item => item.id === schedule.id);
    if (index < 0) throw new Error('PAYMENT_SCHEDULE_MISSING');
    this.state.paymentSchedules[index] = clone(schedule);
  }

  async findPaymentSchedule(id: string): Promise<PaymentSchedule | null> {
    return clone(this.state.paymentSchedules.find(item => item.id === id) ?? null);
  }

  async findPaymentScheduleByContract(contractId: string): Promise<PaymentSchedule | null> {
    return clone(this.state.paymentSchedules.find(item => item.contractId === contractId) ?? null);
  }

  async listPaymentSchedules(query: PaymentScheduleListQuery): Promise<PaymentSchedule[]> {
    const descending = query.sort.startsWith('-');
    const rows = this.state.paymentSchedules.filter(
      schedule => !query.contractId || schedule.contractId === query.contractId,
    );
    rows.sort((left, right) => {
      const compared = stamp(left, query.sort).localeCompare(stamp(right, query.sort)) || left.id.localeCompare(right.id);
      return descending ? -compared : compared;
    });
    const start = query.cursor
      ? rows.findIndex(schedule => {
          const at = stamp(schedule, query.sort);
          if (descending) return at < query.cursor!.at || (at === query.cursor!.at && schedule.id < query.cursor!.id);
          return at > query.cursor!.at || (at === query.cursor!.at && schedule.id > query.cursor!.id);
        })
      : 0;
    if (query.cursor && start < 0) return [];
    return clone(rows.slice(start, start + query.limit));
  }

  async insertSandboxIntent(intent: SandboxPaymentIntent): Promise<void> {
    this.state.sandboxIntents.push(clone(intent));
  }

  async saveSandboxIntent(intent: SandboxPaymentIntent): Promise<void> {
    const index = this.state.sandboxIntents.findIndex(item => item.id === intent.id);
    if (index < 0) throw new Error('SANDBOX_INTENT_MISSING');
    this.state.sandboxIntents[index] = clone(intent);
  }

  async findSandboxIntent(id: string): Promise<SandboxPaymentIntent | null> {
    return clone(this.state.sandboxIntents.find(item => item.id === id) ?? null);
  }

  async findSandboxIntentByInstallment(installmentId: string): Promise<SandboxPaymentIntent | null> {
    return clone(this.state.sandboxIntents.find(item => item.installmentId === installmentId) ?? null);
  }

  async insertSigningEnvelope(envelope: SigningSandboxEnvelope): Promise<void> {
    this.state.signingEnvelopes.push(clone(envelope));
  }

  async saveSigningEnvelope(envelope: SigningSandboxEnvelope): Promise<void> {
    const index = this.state.signingEnvelopes.findIndex(item => item.id === envelope.id);
    if (index < 0) throw new Error('SIGNING_ENVELOPE_MISSING');
    this.state.signingEnvelopes[index] = clone(envelope);
  }

  async findSigningEnvelope(id: string): Promise<SigningSandboxEnvelope | null> {
    return clone(this.state.signingEnvelopes.find(item => item.id === id) ?? null);
  }

  async findSigningEnvelopeByContract(contractId: string): Promise<SigningSandboxEnvelope | null> {
    return clone(this.state.signingEnvelopes.find(item => item.contractId === contractId) ?? null);
  }

  async insertCapacityWindow(window: CapacityWindow): Promise<void> {
    this.state.capacityWindows.push(clone(window));
  }

  async findCapacityWindow(id: string): Promise<CapacityWindow | null> {
    return clone(this.state.capacityWindows.find(item => item.id === id) ?? null);
  }

  async listCapacityWindows(query: CapacityListQuery): Promise<CapacityWindow[]> {
    const descending = query.sort.startsWith('-');
    const rows = this.state.capacityWindows.filter(
      window => (!query.kind || window.kind === query.kind)
        && (!query.actorId || window.actorId === query.actorId),
    );
    rows.sort((left, right) => {
      const compared = stamp(left, query.sort).localeCompare(stamp(right, query.sort)) || left.id.localeCompare(right.id);
      return descending ? -compared : compared;
    });
    const start = query.cursor
      ? rows.findIndex(window => {
          const at = stamp(window, query.sort);
          if (descending) return at < query.cursor!.at || (at === query.cursor!.at && window.id < query.cursor!.id);
          return at > query.cursor!.at || (at === query.cursor!.at && window.id > query.cursor!.id);
        })
      : 0;
    if (query.cursor && start < 0) return [];
    return clone(rows.slice(start, start + query.limit));
  }

  async insertGarden(garden: Garden): Promise<void> {
    if (this.state.gardens.some(item => item.projectId === garden.projectId)) {
      throw new Error('GARDEN_EXISTS');
    }
    this.state.gardens.push(clone(garden));
  }

  async findGarden(id: string): Promise<Garden | null> {
    return clone(this.state.gardens.find(item => item.id === id) ?? null);
  }

  async findGardenByProject(projectId: string): Promise<Garden | null> {
    return clone(this.state.gardens.find(item => item.projectId === projectId) ?? null);
  }

  async listGardens(query: GardenListQuery): Promise<Garden[]> {
    const descending = query.sort.startsWith('-');
    const rows = this.state.gardens.filter(
      garden => (!query.projectId || garden.projectId === query.projectId)
        && (!query.clientSubject || garden.clientSubject === query.clientSubject),
    );
    rows.sort((left, right) => {
      const compared = stamp(left, query.sort).localeCompare(stamp(right, query.sort)) || left.id.localeCompare(right.id);
      return descending ? -compared : compared;
    });
    const start = query.cursor
      ? rows.findIndex(garden => {
          const at = stamp(garden, query.sort);
          if (descending) return at < query.cursor!.at || (at === query.cursor!.at && garden.id < query.cursor!.id);
          return at > query.cursor!.at || (at === query.cursor!.at && garden.id > query.cursor!.id);
        })
      : 0;
    if (query.cursor && start < 0) return [];
    return clone(rows.slice(start, start + query.limit));
  }

  async insertSiteIntelligence(record: SiteIntelligenceRecord): Promise<void> {
    if (this.state.siteIntelligence.some(item => item.projectId === record.projectId)) {
      throw new Error('SITEINTEL_EXISTS');
    }
    this.state.siteIntelligence.push(clone(record));
  }

  async findSiteIntelligence(id: string): Promise<SiteIntelligenceRecord | null> {
    return clone(this.state.siteIntelligence.find(item => item.id === id) ?? null);
  }

  async findSiteIntelligenceByProject(projectId: string): Promise<SiteIntelligenceRecord | null> {
    return clone(this.state.siteIntelligence.find(item => item.projectId === projectId) ?? null);
  }

  async listSiteIntelligence(query: SiteIntelligenceListQuery): Promise<SiteIntelligenceRecord[]> {
    const descending = query.sort.startsWith('-');
    const rows = this.state.siteIntelligence.filter(
      record => (!query.projectId || record.projectId === query.projectId)
        && (!query.clientSubject || record.clientSubject === query.clientSubject),
    );
    rows.sort((left, right) => {
      const compared = stamp(left, query.sort).localeCompare(stamp(right, query.sort)) || left.id.localeCompare(right.id);
      return descending ? -compared : compared;
    });
    const start = query.cursor
      ? rows.findIndex(record => {
          const at = stamp(record, query.sort);
          if (descending) return at < query.cursor!.at || (at === query.cursor!.at && record.id < query.cursor!.id);
          return at > query.cursor!.at || (at === query.cursor!.at && record.id > query.cursor!.id);
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
