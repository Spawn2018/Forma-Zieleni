export const ARTICLE_CHARACTERS = [
  'naukowy',
  'poradnik',
  'case-study',
  'inspiracja',
  'pielegnacja',
  'projekt-koncepcyjny',
  'aktualnosc',
] as const;

export type ArticleCharacter = (typeof ARTICLE_CHARACTERS)[number];

export const WORK_STATUSES = [
  'PLANNED',
  'WAITING_DEPENDENCY',
  'WAITING_APPROVAL',
  'READY',
  'IN_PROGRESS',
  'BLOCKED',
  'COMPLETED',
  'MEASURED',
  'LEARNING_PENDING',
  'SUPERSEDED',
  'CANCELLED',
] as const;

export type WorkStatus = (typeof WORK_STATUSES)[number];

export type WorkItem = {
  workItemId: string;
  planId: string;
  planVersion: number;
  campaignId: string;
  workType: string;
  title: string;
  purpose: string;
  responsibleRole: string;
  blockingDependencies: string[];
  approvalRequirements: string[];
  approvalSatisfied: boolean;
  status: WorkStatus;
  capacityEstimate: 'UNKNOWN' | string;
  targetChannel: string | null;
  plannedStart: string;
  plannedFinish: string;
  measurementContract: string;
  synthetic: true;
};

export type MarketingPlan = {
  planId: string;
  version: number;
  createdAt: string;
  label: 'SYNTHETIC / TEST ONLY';
  synthetic: true;
  goal: string;
  budgetPln: number;
  horizonDays: number;
  authorizesSpend: false;
  authorizesPublication: false;
  capacity: 'UNKNOWN';
  assumptions: string[];
  strategy: { brandRole: string; activationRole: string; fixedSplit: false };
  allocations: Array<{ name: string; amountPln: number; pct: number; rationale: string; authorizesSpend: false; stop: string }>;
  campaigns: Array<{ campaignId: string; cepId: string; purpose: string }>;
  articleCount: number;
  articles: Array<{ topic: string; character: ArticleCharacter; date: string }>;
  prompts: string[];
  conceptBriefs: Array<Record<string, string>>;
  channels: Array<{ channel: string; decision: 'USE' | 'DO_NOT_USE'; reason: string }>;
  experiment: { hypothesis: string; metric: string; guardrail: string };
  measurement: string[];
  crmLink: string;
  simulator: { status: 'NOT_ENOUGH_DATA'; pointForecast: null };
};

const ALLOCATIONS: Array<{ name: string; pct: number; rationale: string; stop: string }> = [
  { name: 'content', pct: 35, rationale: 'Planning share for articles and research. Not a spend approval.', stop: 'Stop if capacity stays UNKNOWN past the first review.' },
  { name: 'creative', pct: 25, rationale: 'Planning share for photos, graphics and renders.', stop: 'Stop if no approved concept project exists.' },
  { name: 'measurement', pct: 10, rationale: 'Planning share for instrumentation design only.', stop: 'Do not buy a measurement vendor from this line.' },
  { name: 'experiments', pct: 10, rationale: 'Reserve so the plan is not 100 percent last-week exploitation.', stop: 'Stop an experiment that has no guardrail.' },
  { name: 'brand', pct: 10, rationale: 'Demand creation. Not a universal 60/40 rule.', stop: 'Revisit if the goal is only immediate capture.' },
  { name: 'activation', pct: 5, rationale: 'Short-horizon capture on owned channels.', stop: 'Do not open a paid channel from this line.' },
  { name: 'contingency', pct: 5, rationale: 'Unallocated ceiling. Not permission to spend.', stop: 'Owner must approve any later use.' },
];

const CHANNELS = [
  'www', 'portal', 'email', 'google-organic', 'bing-organic', 'google-business',
  'instagram', 'facebook', 'linkedin', 'tiktok', 'pinterest', 'youtube',
  'google-ads', 'meta-ads', 'pr', 'partnerships', 'offline',
];

const LENGTH: Record<ArticleCharacter, { sentences: [number, number]; words: [number, number]; sections: [number, number]; minutes: [number, number] }> = {
  naukowy: { sentences: [40, 70], words: [900, 1400], sections: [6, 9], minutes: [6, 9] },
  poradnik: { sentences: [24, 40], words: [550, 900], sections: [5, 7], minutes: [4, 6] },
  'case-study': { sentences: [30, 50], words: [700, 1100], sections: [5, 8], minutes: [5, 7] },
  inspiracja: { sentences: [18, 32], words: [400, 700], sections: [4, 6], minutes: [3, 5] },
  pielegnacja: { sentences: [22, 36], words: [500, 850], sections: [5, 7], minutes: [4, 6] },
  'projekt-koncepcyjny': { sentences: [28, 46], words: [650, 1000], sections: [5, 8], minutes: [5, 7] },
  aktualnosc: { sentences: [12, 22], words: [250, 500], sections: [3, 5], minutes: [2, 4] },
};

const OFFER_OUTCOMES = [
  'OFFER_PREPARED', 'OFFER_SENT', 'OFFER_VIEWED', 'OFFER_ACCEPTED', 'OFFER_REJECTED',
  'OFFER_EXPIRED', 'NEGOTIATION_STARTED', 'CUSTOMER_DECLINED', 'FZ_DECLINED', 'PROJECT_CREATED', 'UNKNOWN',
] as const;

export type OfferOutcome = (typeof OFFER_OUTCOMES)[number];

export const DORA_METRICS = [
  'change lead time',
  'deployment frequency',
  'failed deployment recovery time',
  'change fail rate',
  'deployment rework rate',
] as const;

export const OPS_DOMAINS = [
  'MarketingOps', 'ContentOps', 'CreativeOps', 'DesignOps', 'ExperienceOps', 'SearchOps',
  'MediaOps', 'CMSOps', 'CRM/RevenueOps', 'IntegrationOps', 'KnowledgeOps', 'DataQualityOps',
  'AtlasOps', 'ProjectOps', 'MobileOps', 'ReliabilityOps', 'SecurityOps',
] as const;

export const GROWTH_CAPABILITIES = ['growth:plan', 'semantic:review'] as const;

export function isGrowthCapability(value: string): value is (typeof GROWTH_CAPABILITIES)[number] {
  return (GROWTH_CAPABILITIES as readonly string[]).includes(value);
}

export const INTEGRATIONS = [
  { provider: 'google-search-console', capability: 'search-analytics-read', status: 'PLANNED', live: false },
  { provider: 'google-ads', capability: 'campaign-read', status: 'DISCOVERED', live: false },
  { provider: 'google-business-profile', capability: 'posts-read', status: 'DISCOVERED', live: false },
  { provider: 'bing-webmaster', capability: 'search-performance-read', status: 'DISCOVERED', live: false },
  { provider: 'meta', capability: 'page-read', status: 'DISCOVERED', live: false },
  { provider: 'linkedin', capability: 'organization-read', status: 'DISCOVERED', live: false },
  { provider: 'fakturownia', capability: 'invoice-read', status: 'DISCOVERED', live: false },
  { provider: 'payment-provider', capability: 'undecided', status: 'DISCOVERED', live: false },
  { provider: 'signing-provider', capability: 'undecided', status: 'DISCOVERED', live: false },
  { provider: 'meridian', capability: 'mmm-later', status: 'DISCOVERED', live: false },
] as const;

const BOTANICAL_SOURCES = [
  { id: 'kew-powo', role: 'taxonomic-authority', url: 'https://powo.science.kew.org/', note: 'WCVP names backbone. Not horticultural practice evidence.' },
  { id: 'world-flora-online', role: 'taxonomic-authority', url: 'https://www.worldfloraonline.org/', note: 'Consensus plant list. Not a care guide.' },
];

export function compileMarketingPlan(input: {
  goal: string;
  budgetPln: number;
  horizonDays: number;
  now: string;
  priorityService?: string;
  excludedChannels?: string[];
}): MarketingPlan {
  if (input.goal.trim().length < 8) throw new Error('GOAL_TOO_THIN');
  if (!Number.isInteger(input.budgetPln) || input.budgetPln <= 0) throw new Error('BUDGET_INVALID');
  if (!Number.isInteger(input.horizonDays) || input.horizonDays < 14 || input.horizonDays > 366) throw new Error('HORIZON_INVALID');
  const articleCount = Math.max(1, Math.round(input.horizonDays / 45));
  const service = input.priorityService ?? 'ogrod-prywatny';
  const articles = Array.from({ length: articleCount }, (_, index) => ({
    topic: index % 2 === 0
      ? `Jak planowac ${service} bez obiecywania cudzego efektu`
      : `Koncepcja ogrodu: co jest projektem, a co realizacja`,
    character: (index % 2 === 0 ? 'poradnik' : 'projekt-koncepcyjny') as ArticleCharacter,
    date: addDays(input.now, 14 + index * 21),
  }));
  const excluded = new Set(input.excludedChannels ?? []);
  const channels = CHANNELS.map(channel => evaluateChannel(channel, { excluded, budgetPln: input.budgetPln }));
  let spent = 0;
  const allocations = ALLOCATIONS.map((item, index) => {
    const amount = index === ALLOCATIONS.length - 1
      ? input.budgetPln - spent
      : Math.floor(input.budgetPln * item.pct / 100);
    spent += amount;
    return { ...item, amountPln: amount, authorizesSpend: false as const };
  });
  return {
    planId: 'plan-synthetic-0001',
    version: 1,
    createdAt: input.now,
    label: 'SYNTHETIC / TEST ONLY',
    synthetic: true,
    goal: input.goal.trim(),
    budgetPln: input.budgetPln,
    horizonDays: input.horizonDays,
    authorizesSpend: false,
    authorizesPublication: false,
    capacity: 'UNKNOWN',
    assumptions: [
      'Staff capacity is UNKNOWN. Article count is a planning assumption of one substantial piece per 45 days.',
      'No observed conversion rate is on record.',
      'Brand and activation are both present. There is no fixed 60/40 split.',
    ],
    strategy: {
      brandRole: 'Explain the studio point of view on private gardens.',
      activationRole: 'Invite a qualified consultation from people already comparing garden help.',
      fixedSplit: false,
    },
    allocations,
    campaigns: [{
      campaignId: 'camp-synthetic-0001',
      cepId: 'cep-nowy-ogrod-prywatny',
      purpose: `Help a household decide whether ${service} is the right kind of help.`,
    }],
    articleCount,
    articles,
    prompts: articles.map(article => perplexityPrompt({
      character: article.character,
      topic: article.topic,
      campaignId: 'camp-synthetic-0001',
      cepId: 'cep-nowy-ogrod-prywatny',
    })),
    conceptBriefs: [{
      briefId: 'brief-synthetic-001',
      purpose: 'Show a concept garden for the campaign. It is not a client realization.',
      projectClass: 'CONCEPT_PROJECT',
      campaignId: 'camp-synthetic-0001',
      cepId: 'cep-nowy-ogrod-prywatny',
      audience: 'Household planning a private garden.',
      season: 'late-spring',
      style: 'quiet-perennial',
      deadline: addDays(input.now, 21),
    }],
    channels,
    experiment: {
      hypothesis: 'A concept-project story produces more qualified consultations than a generic service page. This is a hypothesis.',
      metric: 'qualified-consultation',
      guardrail: 'Do not increase raw form submissions by hiding the concept label.',
    },
    measurement: ['qualified-lead', 'opportunity', 'offer-outcome', 'content-assisted-path'],
    crmLink: 'Campaign outcome is judged on qualified opportunity, not raw lead count.',
    simulator: { status: 'NOT_ENOUGH_DATA', pointForecast: null },
  };
}

export function evaluateChannel(channel: string, context: { excluded: Set<string>; budgetPln: number }): { channel: string; decision: 'USE' | 'DO_NOT_USE'; reason: string } {
  if (context.excluded.has(channel)) return { channel, decision: 'DO_NOT_USE', reason: 'EXCLUDED' };
  if (channel.endsWith('-ads') || channel === 'meta-ads') return { channel, decision: 'DO_NOT_USE', reason: 'PAID_MEDIA_NOT_AUTHORIZED' };
  if (channel === 'tiktok' && context.budgetPln < 20000) return { channel, decision: 'DO_NOT_USE', reason: 'PRODUCTION_BURDEN_WITHOUT_EVIDENCE' };
  if (channel === 'www' || channel === 'google-organic' || channel === 'google-business' || channel === 'instagram') {
    return { channel, decision: 'USE', reason: 'OWNED_OR_LOCAL_FIT_FOR_THIS_PLAN' };
  }
  return { channel, decision: 'DO_NOT_USE', reason: 'NO_EVIDENCE_FOR_THIS_HORIZON' };
}

export function assertPlanSpecific(plan: MarketingPlan): void {
  if (plan.authorizesSpend || plan.authorizesPublication) throw new Error('PLAN_AUTHORITY');
  if (plan.articleCount < 1 || plan.articles.length !== plan.articleCount) throw new Error('ARTICLE_COUNT');
  if (!plan.measurement.length || !plan.crmLink) throw new Error('MEASUREMENT_MISSING');
  if (plan.capacity !== 'UNKNOWN' && !plan.assumptions.length) throw new Error('CAPACITY_UNSTATED');
  const text = JSON.stringify(plan);
  if (text.includes('publish on social media')) throw new Error('GENERIC_PLAN');
  const sum = plan.allocations.reduce((total, item) => total + item.amountPln, 0);
  if (sum !== plan.budgetPln) throw new Error('BUDGET_SUM');
  if (plan.allocations.some(item => item.authorizesSpend)) throw new Error('SPEND_AUTHORIZED');
  if (!plan.channels.some(item => item.decision === 'DO_NOT_USE')) throw new Error('CHANNEL_SELECTIVITY');
}

export function compileExecutionGraph(plan: MarketingPlan): WorkItem[] {
  assertPlanSpecific(plan);
  const campaignId = plan.campaigns[0].campaignId;
  const start = plan.createdAt;
  const items: Array<Omit<WorkItem, 'planId' | 'planVersion' | 'campaignId' | 'synthetic' | 'capacityEstimate'>> = [
    item('work-research-00001', 'RESEARCH', 'Gather verified studio facts for the plan', [], [], start, 3),
    item('work-strategy-00001', 'STRATEGY', 'Confirm CEP and owned-channel choice', ['work-research-00001'], [], start, 5),
    item('work-concept-000001', 'CONCEPT_PROJECT', 'Agnieszka concept brief', ['work-strategy-00001'], ['agnieszka'], start, 7),
    item('work-palette-000001', 'PLANT_PALETTE', 'Palette for the concept, not a client planting plan', ['work-concept-000001'], [], start, 12),
    item('work-atlas-00000001', 'PLANT_ATLAS_ENTRY', 'Atlas dependency for plants named in the palette', ['work-palette-000001'], [], start, 16),
    item('work-visual-0000001', 'VISUALIZATION', 'Concept render. Labeled concept.', ['work-palette-000001'], [], start, 18),
    item('work-article-000001', 'ARTICLE', plan.articles[0].topic, ['work-visual-0000001'], ['agnieszka'], start, 24),
    item('work-prompt-0000001', 'PERPLEXITY_PROMPT', 'Copy-ready research prompt', ['work-article-000001'], [], start, 25),
    item('work-review-0000001', 'CONTENT_REVIEW', 'Human review before any publication', ['work-prompt-0000001'], ['agnieszka'], start, 28),
    item('work-portfolio-0001', 'PORTFOLIO_ITEM', 'Portfolio candidate only after approval', ['work-visual-0000001', 'work-review-0000001'], [], start, 30),
    item('work-graphic-000001', 'GRAPHIC', 'Campaign graphic from approved facts', ['work-visual-0000001'], [], start, 26),
    item('work-social-0000001', 'SOCIAL_POST', 'One Instagram draft about the concept', ['work-review-0000001', 'work-graphic-000001'], ['agnieszka'], start, 32),
    item('work-landing-000001', 'LANDING_PAGE', 'Service page module for the CEP', ['work-review-0000001'], [], start, 33),
    item('work-experiment-001', 'EXPERIMENT', plan.experiment.hypothesis, ['work-landing-000001'], [], start, 40),
    item('work-measure-000001', 'MEASUREMENT', 'Define qualified-outcome measures', ['work-experiment-001'], [], start, 41),
    item('work-retro-00000001', 'RETROSPECTIVE', 'Learning review. No score.', ['work-measure-000001'], [], start, plan.horizonDays),
  ];
  if (plan.channels.some(channel => channel.channel === 'google-business' && channel.decision === 'USE')) {
    items.push(item('work-gbp-0000000001', 'GBP_POST', 'GBP draft after portfolio approval', ['work-portfolio-0001'], ['agnieszka'], start, 34));
  }
  return items.map(entry => ({
    ...entry,
    planId: plan.planId,
    planVersion: plan.version,
    campaignId,
    capacityEstimate: 'UNKNOWN',
    synthetic: true,
  }));
}

export function effectiveStatus(item: WorkItem, items: readonly WorkItem[]): WorkStatus {
  if (item.status === 'COMPLETED' || item.status === 'CANCELLED' || item.status === 'MEASURED') return item.status;
  const blockers = item.blockingDependencies.map(id => {
    const found = items.find(candidate => candidate.workItemId === id);
    if (!found) throw new Error('DEPENDENCY_ABSENT');
    return found;
  });
  if (blockers.some(blocker => blocker.status !== 'COMPLETED')) return 'WAITING_DEPENDENCY';
  if (item.approvalRequirements.length > 0 && !item.approvalSatisfied) return 'WAITING_APPROVAL';
  return item.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'READY';
}

export function completeWork(items: WorkItem[], workItemId: string): void {
  const item = items.find(candidate => candidate.workItemId === workItemId);
  if (!item) throw new Error('WORK_ABSENT');
  const status = effectiveStatus(item, items);
  if (status === 'WAITING_DEPENDENCY') throw new Error('DEPENDENCY_INCOMPLETE');
  if (status === 'WAITING_APPROVAL') throw new Error('APPROVAL_REQUIRED');
  if (status !== 'READY' && status !== 'IN_PROGRESS') throw new Error('NOT_READY');
  item.status = 'COMPLETED';
}

export function satisfyApproval(items: WorkItem[], workItemId: string): void {
  const item = items.find(candidate => candidate.workItemId === workItemId);
  if (!item) throw new Error('WORK_ABSENT');
  if (effectiveStatus(item, items) === 'WAITING_DEPENDENCY') throw new Error('DEPENDENCY_INCOMPLETE');
  item.approvalSatisfied = true;
}

export function lengthFor(character: ArticleCharacter): { sentences: [number, number]; words: [number, number]; sections: [number, number]; minutes: [number, number]; rationale: string } {
  const band = LENGTH[character];
  return {
    ...band,
    rationale: 'Range follows the article character, how much evidence it must carry, and reader task. It is not a search-engine word-count target.',
  };
}

export function briefFromCharacter(input: { character: ArticleCharacter; topic?: string; campaignId: string; cepId: string }): Record<string, string | number | boolean> {
  const length = lengthFor(input.character);
  return {
    character: input.character,
    topic: input.topic ?? `Temat: ${input.character}`,
    campaignId: input.campaignId,
    cepId: input.cepId,
    sentenceMin: length.sentences[0],
    sentenceMax: length.sentences[1],
    wordMin: length.words[0],
    wordMax: length.words[1],
    sectionsMin: length.sections[0],
    sectionsMax: length.sections[1],
    rationale: length.rationale,
    prompt: perplexityPrompt(input),
  };
}

export function perplexityPrompt(input: { character: ArticleCharacter; topic?: string; campaignId: string; cepId: string }): string {
  const length = lengthFor(input.character);
  return [
    'SYNTHETIC / TEST ONLY',
    `Purpose: prepare a Polish editorial draft of character ${input.character}.`,
    `Topic: ${input.topic ?? input.character}.`,
    `Campaign: ${input.campaignId}. CEP: ${input.cepId}.`,
    'Reader: a household comparing garden help. Do not invent a client.',
    `Length: ${length.words[0]}-${length.words[1]} words, ${length.sections[0]}-${length.sections[1]} sections.`,
    length.rationale,
    'Brand tone: concrete, calm, specific. No slogans.',
    'Verified FZ facts: use only facts supplied in this prompt. If none are supplied, write no studio claim.',
    'Source hierarchy: primary studies, reviews, universities, botanical authorities, then high-quality secondary sources.',
    'Bibliography: author, title, publication, year, DOI when one exists, stable URL, access date.',
    'NEVER INVENT A SOURCE.',
    'Unsupported claim: state uncertainty and mark it for review.',
    'SEO and AI Search: clear entities, internal relations, truthful structured data. No rank score.',
    'CTA: invitation to a consultation, without a fabricated result.',
    'QA: concept work is labeled concept. No testimonial. No price.',
  ].join('\n');
}

export function mapClaim(claim: string, source: { title: string; year: number; url: string } | null): { claim: string; status: 'MAPPED' | 'UNCERTAIN' } {
  if (!claim.trim()) throw new Error('CLAIM_EMPTY');
  if (!source) return { claim, status: 'UNCERTAIN' };
  if (!source.title || !source.url || !Number.isInteger(source.year)) throw new Error('SOURCE_INCOMPLETE');
  return { claim, status: 'MAPPED' };
}

export function chooseContentAction(overlap: 'none' | 'partial' | 'same'): 'CREATE' | 'UPDATE' | 'EXPAND' {
  if (overlap === 'same') return 'UPDATE';
  if (overlap === 'partial') return 'EXPAND';
  return 'CREATE';
}

export function assertRealFreshness(input: { bodyChanged: boolean; dateOnly: boolean }): void {
  if (input.dateOnly && !input.bodyChanged) throw new Error('FAKE_FRESHNESS');
}

export function recordBehavior(event: Record<string, unknown>): { name: string; conclusion: false } {
  if (event.sessionReplay === true) throw new Error('SESSION_REPLAY_OFF');
  const forbidden = ['name', 'email', 'phone', 'address', 'message', 'fieldValue'];
  for (const key of forbidden) {
    if (key in event && event[key] != null && event[key] !== '') throw new Error('FORM_VALUE_REJECTED');
  }
  if (typeof event.event !== 'string') throw new Error('EVENT_NAME_REQUIRED');
  const allowed = new Set(['form_view', 'form_start', 'field_error', 'validation_retry', 'abandon', 'submit_success']);
  if (!allowed.has(event.event)) throw new Error('EVENT_NAME_REJECTED');
  return { name: event.event, conclusion: false };
}

export function sessionReplayStatus(): 'OFF' {
  return 'OFF';
}

export function enableSessionReplay(): void {
  throw new Error('SESSION_REPLAY_OFF');
}

export type Offer = {
  offerId: string;
  pricePln: number;
  terms: string;
  campaignId: string;
  cepId: string;
  synthetic: true;
};

export function recordOfferOutcome(offer: Offer, outcome: OfferOutcome): {
  offer: Offer;
  outcome: OfferOutcome;
  priceUnchanged: true;
  priceChange: null;
  hypotheses: string[];
} {
  if (!OFFER_OUTCOMES.includes(outcome)) throw new Error('OUTCOME_UNKNOWN');
  const hypotheses = outcome === 'OFFER_REJECTED'
    ? ['lead quality', 'expectation mismatch', 'scope mismatch', 'timing', 'capacity', 'competition', 'terms', 'price']
    : [];
  return { offer: { ...offer }, outcome, priceUnchanged: true, priceChange: null, hypotheses };
}

export function marketingPriceEdit(): void {
  throw new Error('COMMERCIAL_TRUTH_LOCKED');
}

export function qualityOverVolume(input: { rawLeads: number; qualified: number; offers: number; customers: number }): { prefer: 'qualified-path'; rawIsEnough: false } {
  if (input.qualified < 0 || input.rawLeads < input.qualified) throw new Error('FUNNEL_INVALID');
  return { prefer: 'qualified-path', rawIsEnough: false };
}

export function proposeFromRealProject(project: {
  projectClass: 'REAL_PROJECT' | 'CONCEPT_PROJECT' | 'ILLUSTRATIVE_PROJECT';
  verified: boolean;
  rightsPublic: boolean;
  facts: Record<string, string>;
}): { publicCandidates: string[]; privateHeld: string[]; published: false } {
  if (!project.verified) throw new Error('UNVERIFIED_PROJECT_FACT');
  if (project.projectClass !== 'REAL_PROJECT') throw new Error('NOT_A_REAL_PROJECT');
  const forbidden = ['address', 'customerName', 'price', 'quote', 'award'];
  for (const key of forbidden) {
    if (project.facts[key]) throw new Error('INVENTED_OR_PRIVATE_FACT');
  }
  if (!project.rightsPublic) return { publicCandidates: [], privateHeld: ['portfolio', 'case-study', 'social'], published: false };
  return {
    publicCandidates: ['portfolio-candidate', 'case-study-candidate', 'atlas-link-candidate'],
    privateHeld: [],
    published: false,
  };
}

export function botanicalSourcePolicy(): readonly typeof BOTANICAL_SOURCES[number][] {
  return BOTANICAL_SOURCES;
}

export function assertNoLiveIntegration(provider: string): void {
  const found = INTEGRATIONS.find(item => item.provider === provider);
  if (!found) throw new Error('PROVIDER_UNKNOWN');
  if (found.live) throw new Error('LIVE_MUTATION_FORBIDDEN');
  throw new Error('LIVE_MUTATION_FORBIDDEN');
}

export function opsAreNotDora(): boolean {
  const dora = new Set<string>(DORA_METRICS);
  return OPS_DOMAINS.every(domain => !dora.has(domain));
}

export function platformSpec(platform: string): { platform: string; status: 'UNVERIFIED'; productionUse: false } {
  return { platform, status: 'UNVERIFIED', productionUse: false };
}

export function creativeFatigue(samples: readonly number[]): { status: 'NOT_ENOUGH_DATA' | 'WATCH'; universalThreshold: null } {
  if (samples.length < 4) return { status: 'NOT_ENOUGH_DATA', universalThreshold: null };
  return { status: 'WATCH', universalThreshold: null };
}

function item(
  workItemId: string,
  workType: string,
  title: string,
  blockingDependencies: string[],
  approvalRequirements: string[],
  start: string,
  finishInDays: number,
): Omit<WorkItem, 'planId' | 'planVersion' | 'campaignId' | 'synthetic' | 'capacityEstimate'> {
  return {
    workItemId,
    workType,
    title,
    purpose: title,
    responsibleRole: approvalRequirements.includes('agnieszka') ? 'agnieszka' : 'studio',
    blockingDependencies,
    approvalRequirements,
    approvalSatisfied: false,
    status: 'PLANNED',
    targetChannel: workType === 'SOCIAL_POST' ? 'instagram' : workType === 'GBP_POST' ? 'google-business' : null,
    plannedStart: start,
    plannedFinish: addDays(start, finishInDays),
    measurementContract: 'qualified-outcome',
  };
}

function addDays(iso: string, days: number): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error('DATE_INVALID');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}
