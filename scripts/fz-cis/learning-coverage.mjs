/**
 * One learning-coverage view over product scope and FZ-CIS.
 * Domain data stays in domain stores. Learning governance stays here.
 */

import { EFFECT_METHODS } from './effect.mjs';
import { toLearningInput } from './ingest.mjs';
import {
  HUMAN_ACTIONS,
  HUMAN_ROLES,
  LEARNING_SCOPES,
  TENANT_BOUND_SCOPES,
  syntheticProductionRejected,
} from './learning-governance.mjs';
import { loadProductScope } from '../requirements/product-scope.mjs';

export const LEARNING_CLASSIFICATIONS = Object.freeze([
  'LEARNING_LOOP_OPERATIONAL',
  'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
  'LEARNING_LOOP_PARTIAL',
  'NO_LEARNING_REQUIRED',
  'OWNER_GATED',
  'PRODUCTION_ONLY',
]);

export const LEARNING_READINESS = Object.freeze([
  'DESIGNED',
  'CONTRACTED',
  'IMPLEMENTED',
  'INTEGRATED',
  'TESTED',
  'OPERATIONAL',
  'EFFECT_VERIFIED',
  'WAITING_FOR_PRODUCT_RUNTIME',
  'WAITING_FOR_PRODUCTION_SIGNAL',
  'OWNER_GATED',
]);

export const DURABLE_CONTROL_TYPES = Object.freeze([
  'TEST',
  'VALIDATOR',
  'SCHEMA_CONSTRAINT',
  'AUTHZ_RULE',
  'LINT_RULE',
  'STATIC_ANALYSIS',
  'DESIGN_SYSTEM_COMPONENT',
  'API_CONTRACT',
  'DOMAIN_RULE',
  'CONTENT_RULE',
  'PROMPT_TEMPLATE',
  'WORKFLOW',
  'ALERT',
  'RUNBOOK',
  'UX_PATTERN',
  'MAPPING_RULE',
  'DATA_QUALITY_RULE',
  'MODEL_CONFIG',
  'EXPERIMENT_DECISION',
]);

export const CONTROL_PROMOTION_TARGET = Object.freeze({
  TEST: 'TEST',
  VALIDATOR: 'CONTRACT',
  SCHEMA_CONSTRAINT: 'SCHEMA',
  AUTHZ_RULE: 'SECURITY_CONTROL',
  LINT_RULE: 'LINT',
  STATIC_ANALYSIS: 'REPO_CHECK',
  DESIGN_SYSTEM_COMPONENT: 'DESIGN_SYSTEM',
  API_CONTRACT: 'CONTRACT',
  DOMAIN_RULE: 'PRODUCT_RULE',
  CONTENT_RULE: 'CONTENT_RULE',
  PROMPT_TEMPLATE: 'CONTENT_RULE',
  WORKFLOW: 'AUTOMATION',
  ALERT: 'OBSERVABILITY',
  RUNBOOK: 'RUNBOOK',
  UX_PATTERN: 'DESIGN_SYSTEM',
  MAPPING_RULE: 'CONTRACT',
  DATA_QUALITY_RULE: 'SCHEMA',
  MODEL_CONFIG: 'PRODUCT_RULE',
  EXPERIMENT_DECISION: 'PRODUCT_RULE',
});

export const REQUIRED_MATRIX_IDS = Object.freeze([
  'WWW', 'PORTAL', 'ADMIN', 'ANDROID', 'IOS', 'LEAD', 'OPPORTUNITY', 'OFFER', 'CONTRACT',
  'PAYMENT', 'PROJECT', 'FILES', 'MEDIA', 'ATLAS', 'SITEINTEL', 'GARDENOS', 'SKETCHUP',
  'CONNECTED', 'CMS', 'SEARCH', 'GROWTH', 'PXI', 'SECURITY', 'ACCESSIBILITY', 'PERFORMANCE',
  'RELIABILITY', 'ENGINEERING', 'CODERABBIT', 'GROK', 'FZ-CIS',
]);

const CIS_INGEST = 'node scripts/fz-cis/cli.mjs ingest';
const PLACEHOLDER = /learn later|enable learning later|effect\s*tbd|ai will improve|future ai improvement/i;

const SHARED = Object.freeze({
  normalization: 'normalizeLearningSignal maps one domain event into one FZ-CIS ingest outcome',
  deduplication: 'patternKey collapses open duplicates; distinct occurrence ids count once',
  hypothesisFormation: 'OBSERVED becomes HYPOTHESIS only through an explicit transition',
  validationMethod: 'local verification plus the named effect method; a second model is not validation',
  baselineRequirement: 'an effect plan names the success signal and the failure signal before PROVEN',
  controlComparison: 'effect observations compare the control with counter-evidence types',
  counterEvidence: 'DOWNSTREAM_ESCAPE, REPLAY_MISSED, FALSE_BLOCK, CONTROL_MISSED, and EXPERIMENT_REJECTED can revise a promotion',
  falsePositiveHandling: 'FALSE_BLOCK keeps effectState off SUPPORTED and opens demotion review',
  falseNegativeHandling: 'CONTROL_MISSED and REPLAY_MISSED are counter-evidence',
  recurrenceDetection: 'independent recurrence requires distinct occurrence ids, not a second copy of the same id',
  promotionRule: 'PROMOTED is only reachable from PROVEN when effectState is SUPPORTED and controlRef exists',
  demotionRule: 'PROMOTED moves to SUPERSEDED only with STALE, HARMFUL, REDUNDANT, or SUPERSEDED',
  cisIngestPath: CIS_INGEST,
  productChangePath: 'a durable control changes through the existing slice loop; the learning row does not rewrite Canon',
  auditHistory: 'docs/engineering/learning/records.json keeps status, evidence ids, and effect observations',
});

const GUARDS = Object.freeze({
  ATLAS: [{ flag: 'behaviorImpliesBotanicalTruth', reason: 'BOTANICAL_TRUTH_FROM_BEHAVIOR' }],
  SKETCHUP: [{ flag: 'pluginOwnsBusinessTruth', reason: 'SKETCHUP_NOT_BUSINESS_TRUTH' }],
  CONNECTED: [{ flag: 'overwriteHumanLock', reason: 'HUMAN_LOCK_PROTECTED' }],
  GROWTH: [{ flag: 'authorizeSpend', reason: 'SPEND_OWNER_GATED' }],
  PAYMENT: [{ flag: 'liveTransaction', reason: 'LIVE_TRANSACTION_FORBIDDEN' }],
  SIGNING: [{ flag: 'liveTransaction', reason: 'LIVE_TRANSACTION_FORBIDDEN' }],
  PXI: [
    { flag: 'universalScore', reason: 'UNIVERSAL_SCORE_FORBIDDEN' },
    { flag: 'replayEnabled', reason: 'REPLAY_OFF' },
  ],
  CMS: [{ flag: 'autoPublish', reason: 'AUTO_PUBLISH_FORBIDDEN' }],
  SEARCH: [{ flag: 'universalScore', reason: 'UNIVERSAL_SCORE_FORBIDDEN' }],
  SITEINTEL: [{ flag: 'aiOverwritesDomain', reason: 'AI_CANNOT_OVERWRITE_DOMAIN' }],
  GARDENOS: [{ flag: 'globalizeSingleGarden', reason: 'SCOPE_PROMOTION_REFUSED' }],
  OFFER: [{ flag: 'changePrice', reason: 'PRICE_HUMAN_GATED' }],
  CONTRACT: [{ flag: 'changeLegalTerms', reason: 'LEGAL_TERMS_HUMAN_GATED' }],
});

function sig(id, kind, availability) {
  return { id, kind, availability };
}

function subject(spec) {
  return {
    ...SHARED,
    secondStore: false,
    counterEvidencePath: true,
    demotionPath: true,
    productionSignalsFaked: false,
    autoApply: 'NEVER',
    humanGate: 'LOCAL_VERIFICATION',
    defaultScope: 'CAPABILITY',
    ingestSource: 'agent',
    kind: 'product',
    parentCapability: null,
    dataClassification: 'INTERNAL',
    privacyClassification: 'INTERNAL',
    ...spec,
  };
}

export const LEARNING_SUBJECTS = Object.freeze([
  subject({
    id: 'WWW',
    label: 'WWW',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCTION_SIGNAL',
    effectMethod: 'BEFORE_AFTER',
    durableControlType: 'UX_PATTERN',
    signalOwner: 'public-site',
    provenance: 'contract-until-approved-measurement',
    observationType: 'journey-and-vitals',
    materialityRule: 'a broken public journey or a measured regression against a recorded baseline',
    humanApprovalRule: 'no invasive tracking; measurement stays privacy-gated',
    automationLimit: 'does not publish copy or enable production telemetry',
    signals: [
      sig('route-error', 'technical', 'CONTRACT_ONLY'),
      sig('web-vitals', 'technical', 'PRODUCTION_LATER'),
      sig('form-failure', 'behavioral', 'PRODUCTION_LATER'),
      sig('conversion', 'business', 'PRODUCTION_LATER'),
    ],
    productionDependency: 'privacy-approved public measurement',
    activationCondition: 'WWW-PORTFOLIO-PROJECTION is in the product graph; production signals stay off until a privacy-approved measurement contract exists',
    nextActivation: 'WAITING_FOR_PRODUCTION_SIGNAL after the public projection exists and measurement is approved',
  }),
  subject({
    id: 'PORTAL',
    label: 'PORTAL',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCTION_SIGNAL',
    effectMethod: 'BEFORE_AFTER',
    durableControlType: 'AUTHZ_RULE',
    signalOwner: 'client-portal',
    provenance: 'contract-until-client-runtime-evidence',
    observationType: 'auth-and-task',
    materialityRule: 'an authorization failure or a repeated abandoned client workflow with a named entity',
    humanApprovalRule: 'client feedback is evidence and is not inferred intent',
    automationLimit: 'does not change client entitlements',
    signals: [
      sig('auth-failure', 'technical', 'CONTRACT_ONLY'),
      sig('bola-denial', 'technical', 'CONTRACT_ONLY'),
      sig('abandoned-workflow', 'behavioral', 'PRODUCTION_LATER'),
    ],
    productionDependency: 'approved portal telemetry',
    activationCondition: 'Portal shell exists; task and file evidence waits for PORTAL-FILE-PROJECTION and approved telemetry',
    nextActivation: 'WAITING_FOR_PRODUCTION_SIGNAL',
  }),
  subject({
    id: 'ADMIN',
    label: 'ADMIN/CRM',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCT_RUNTIME',
    effectMethod: 'MANUAL_VERIFICATION',
    effectMethods: ['MANUAL_VERIFICATION', 'DETERMINISTIC_REPLAY'],
    durableControlType: 'WORKFLOW',
    signalOwner: 'staff-admin',
    provenance: 'staff-action-with-role',
    observationType: 'workflow-correction',
    materialityRule: 'a repeated staff correction or rejected action on the same workflow class',
    humanApprovalRule: 'Agnieszka actions create observations and do not train a model or rewrite Canon',
    automationLimit: 'does not optimize away audit or human control',
    signals: [
      sig('validation-failure', 'technical', 'CONTRACT_ONLY'),
      sig('staff-correction', 'human', 'CONTRACT_ONLY'),
      sig('workflow-timing', 'business', 'PRODUCTION_LATER'),
    ],
    productionDependency: 'staff workflow runtime',
    activationCondition: 'ADMIN-CRM-LEAD plus recorded staff corrections entering FZ-CIS',
    nextActivation: 'WAITING_FOR_PRODUCT_RUNTIME until ADMIN-CRM-LEAD, then WAITING_FOR_PRODUCTION_SIGNAL for timing',
  }),
  subject({
    id: 'LEAD',
    label: 'LEAD',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCTION_SIGNAL',
    effectMethod: 'DETERMINISTIC_REPLAY',
    durableControlType: 'VALIDATOR',
    signalOwner: 'lead-domain',
    provenance: 'domain-contract',
    observationType: 'qualification-correction',
    materialityRule: 'a qualification or validation failure that can recur on another lead',
    humanApprovalRule: 'qualification rules stay human-controlled; learning does not mark Lead security-accepted',
    automationLimit: 'does not auto-qualify a lead',
    signals: [sig('qualification-failure', 'technical', 'CONTRACT_ONLY'), sig('staff-correction', 'human', 'CONTRACT_ONLY')],
    productionDependency: 'live lead traffic',
    activationCondition: 'Lead domain tests exist; production qualification evidence waits for real staff use without claiming security acceptance',
    nextActivation: 'WAITING_FOR_PRODUCTION_SIGNAL',
  }),
  subject({
    id: 'OPPORTUNITY',
    label: 'OPPORTUNITY',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCTION_SIGNAL',
    effectMethod: 'BEFORE_AFTER',
    durableControlType: 'WORKFLOW',
    signalOwner: 'crm-opportunity',
    provenance: 'domain-contract',
    observationType: 'workflow-friction',
    materialityRule: 'a repeated opportunity workflow failure against the qualified-lead rule',
    humanApprovalRule: 'commercial treatment recommendations stay human-approved',
    automationLimit: 'does not change customer treatment',
    signals: [sig('workflow-failure', 'technical', 'CONTRACT_ONLY')],
    productionDependency: 'staff opportunity use',
    activationCondition: 'Opportunity contract is implemented; outcome evidence waits for staff use',
    nextActivation: 'WAITING_FOR_PRODUCTION_SIGNAL',
  }),
  subject({
    id: 'OFFER',
    label: 'OFFER',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCTION_SIGNAL',
    effectMethod: 'MANUAL_VERIFICATION',
    durableControlType: 'DOMAIN_RULE',
    signalOwner: 'crm-offer',
    provenance: 'domain-contract',
    observationType: 'offer-correction',
    materialityRule: 'a repeated offer correction that does not itself change price',
    humanApprovalRule: 'price and commercial terms stay human-approved',
    automationLimit: 'learning cannot change a price',
    signals: [sig('offer-correction', 'human', 'CONTRACT_ONLY'), sig('acceptance', 'business', 'PRODUCTION_LATER')],
    productionDependency: 'real offer decisions',
    activationCondition: 'Offer domain exists; acceptance evidence waits for real offers',
    nextActivation: 'WAITING_FOR_PRODUCTION_SIGNAL',
  }),
  subject({
    id: 'CONTRACT',
    label: 'CONTRACT',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCTION_SIGNAL',
    effectMethod: 'MANUAL_VERIFICATION',
    durableControlType: 'DOMAIN_RULE',
    signalOwner: 'crm-contract',
    provenance: 'domain-contract',
    observationType: 'contract-exception',
    materialityRule: 'a repeated contract exception that stays scoped to its record',
    humanApprovalRule: 'legal terms stay human-approved',
    automationLimit: 'learning cannot change legal terms',
    signals: [sig('contract-exception', 'human', 'CONTRACT_ONLY')],
    productionDependency: 'real contracts',
    activationCondition: 'Contract domain exists without a signing provider; exceptions wait for real contracts',
    nextActivation: 'WAITING_FOR_PRODUCTION_SIGNAL',
  }),
  subject({
    id: 'SIGNING',
    label: 'SIGNING',
    classification: 'OWNER_GATED',
    readiness: 'OWNER_GATED',
    effectMethod: 'DETERMINISTIC_REPLAY',
    durableControlType: 'API_CONTRACT',
    signalOwner: 'signing-boundary',
    provenance: 'provider-neutral-contract',
    observationType: 'signature-state',
    materialityRule: 'a signature state divergence or idempotent callback failure in a provider-neutral fixture',
    humanApprovalRule: 'provider selection stays OWNER-DECISION',
    automationLimit: 'no live signing and no provider choice',
    humanGate: 'OWNER-DECISION',
    signals: [sig('state-fixture', 'technical', 'CONTRACT_ONLY'), sig('callback-divergence', 'technical', 'OWNER_GATED')],
    productionDependency: 'Owner-selected signing provider',
    activationCondition: 'FZ-SIGN-1 provider remains UNDECIDED; provider-neutral state fixtures may enter FZ-CIS only as ENGINEERING claims',
    nextActivation: 'OWNER_GATED until a provider is selected, then WAITING_FOR_PRODUCTION_SIGNAL',
  }),
  subject({
    id: 'PAYMENT',
    label: 'PAYMENT',
    classification: 'OWNER_GATED',
    readiness: 'OWNER_GATED',
    effectMethod: 'DETERMINISTIC_REPLAY',
    durableControlType: 'API_CONTRACT',
    signalOwner: 'payment-boundary',
    provenance: 'provider-neutral-contract',
    observationType: 'payment-state',
    materialityRule: 'a webhook, reconciliation, or idempotency failure in a provider-neutral fixture',
    humanApprovalRule: 'provider selection and live charges stay OWNER-DECISION',
    automationLimit: 'no live transaction and no provider call',
    humanGate: 'OWNER-DECISION',
    signals: [sig('idempotency-failure', 'technical', 'CONTRACT_ONLY'), sig('live-charge', 'business', 'OWNER_GATED')],
    productionDependency: 'Owner-selected payment provider',
    activationCondition: 'PAY-DOMAIN-NEUTRAL fixtures may be ingested; live charges stay gated',
    nextActivation: 'OWNER_GATED for a provider, then WAITING_FOR_PRODUCTION_SIGNAL for live failures',
  }),
  subject({
    id: 'PROJECT',
    label: 'PROJECT',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCTION_SIGNAL',
    effectMethod: 'DETERMINISTIC_REPLAY',
    durableControlType: 'DOMAIN_RULE',
    signalOwner: 'project-domain',
    provenance: 'domain-contract',
    observationType: 'visibility-and-class',
    materialityRule: 'a project class or visibility mistake that could recur',
    humanApprovalRule: 'publication of a real project stays human-approved',
    automationLimit: 'does not publish a project',
    signals: [sig('class-mismatch', 'technical', 'CONTRACT_ONLY')],
    productionDependency: 'real project operations',
    activationCondition: 'Project classes are implemented; operational corrections wait for staff and client use',
    nextActivation: 'WAITING_FOR_PRODUCTION_SIGNAL',
  }),
  subject({
    id: 'MOBILE',
    label: 'MOBILE',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCT_RUNTIME',
    effectMethod: 'DETERMINISTIC_REPLAY',
    durableControlType: 'API_CONTRACT',
    signalOwner: 'mobile-client',
    provenance: 'boundary-contract',
    observationType: 'client-health',
    materialityRule: 'a mobile failure that belongs to the client contract rather than a second business store',
    humanApprovalRule: 'no production mobile telemetry without approval',
    automationLimit: 'does not ship a store binary',
    signals: [sig('contract-violation', 'technical', 'CONTRACT_ONLY')],
    productionDependency: 'Android or iOS runtime',
    activationCondition: 'MOBILE-CLIENT-BOUNDARY is in place; runtime learning starts at MOBILE-ANDROID-FOUNDATION or MOBILE-IOS-FOUNDATION',
    nextActivation: 'WAITING_FOR_PRODUCT_RUNTIME',
  }),
  subject({
    id: 'ANDROID',
    label: 'ANDROID',
    kind: 'depth',
    parentCapability: 'MOBILE',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCT_RUNTIME',
    effectMethod: 'DETERMINISTIC_REPLAY',
    durableControlType: 'TEST',
    signalOwner: 'android-client',
    provenance: 'future-instrumentation-contract',
    observationType: 'android-health',
    materialityRule: 'a crash, ANR, sync, or upload failure with an occurrence id once a test runtime exists',
    humanApprovalRule: 'store signing and Play credentials stay out',
    automationLimit: 'does not upload a build',
    signals: [
      sig('crash', 'technical', 'CONTRACT_ONLY'),
      sig('anr', 'technical', 'CONTRACT_ONLY'),
      sig('sync-failure', 'technical', 'CONTRACT_ONLY'),
    ],
    productionDependency: 'Android test runtime, then approved telemetry',
    activationCondition: 'MOBILE-ANDROID-FOUNDATION plus the instrumentation contract plus a test runtime',
    nextActivation: 'WAITING_FOR_PRODUCT_RUNTIME, then WAITING_FOR_PRODUCTION_SIGNAL until approved telemetry exists',
  }),
  subject({
    id: 'IOS',
    label: 'IOS',
    kind: 'depth',
    parentCapability: 'MOBILE',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCT_RUNTIME',
    effectMethod: 'DETERMINISTIC_REPLAY',
    durableControlType: 'TEST',
    signalOwner: 'ios-client',
    provenance: 'future-instrumentation-contract',
    observationType: 'ios-health',
    materialityRule: 'a crash, MetricKit, or sync failure with an occurrence id once a test runtime exists',
    humanApprovalRule: 'App Store credentials stay out',
    automationLimit: 'does not upload a build',
    signals: [sig('crash', 'technical', 'CONTRACT_ONLY'), sig('metrickit', 'technical', 'PRODUCTION_LATER')],
    productionDependency: 'iOS test runtime, then approved telemetry',
    activationCondition: 'MOBILE-IOS-FOUNDATION plus the instrumentation contract plus a test runtime',
    nextActivation: 'WAITING_FOR_PRODUCT_RUNTIME, then WAITING_FOR_PRODUCTION_SIGNAL; MetricKit stays unmeasured until then',
  }),
  subject({
    id: 'GARDENOS',
    label: 'GARDEN OS',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCT_RUNTIME',
    effectMethod: 'NATURAL_RECURRENCE',
    effectMethods: ['NATURAL_RECURRENCE', 'MANUAL_VERIFICATION'],
    durableControlType: 'DOMAIN_RULE',
    signalOwner: 'garden-domain',
    provenance: 'human-correction-or-rule-test',
    observationType: 'semantic-correction',
    materialityRule: 'a garden correction can become a rule only after independent recurrence beyond one garden',
    humanApprovalRule: 'human-approved garden truth stays authoritative; one garden does not become global',
    automationLimit: 'does not generalize one customer garden',
    defaultScope: 'GARDEN',
    signals: [sig('human-correction', 'human', 'CONTRACT_ONLY'), sig('rule-miss', 'technical', 'CONTRACT_ONLY')],
    productionDependency: 'garden domain runtime',
    activationCondition: 'GARDENOS-DOMAIN plus scoped corrections; global promotion still requires independent gardens',
    nextActivation: 'WAITING_FOR_PRODUCT_RUNTIME',
  }),
  subject({
    id: 'SITEINTEL',
    label: 'SITE INTELLIGENCE',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCT_RUNTIME',
    effectMethod: 'DETERMINISTIC_REPLAY',
    durableControlType: 'DATA_QUALITY_RULE',
    signalOwner: 'site-intelligence',
    provenance: 'data-rules-domain-then-ai',
    observationType: 'rule-or-source-correction',
    materialityRule: 'a rule miss or source disagreement that survives the DATA, RULES, DOMAIN, AI order',
    humanApprovalRule: 'an AI conclusion cannot overwrite deterministic or domain truth',
    automationLimit: 'AI may propose a rule and cannot apply it unverified',
    signals: [sig('rule-miss', 'technical', 'CONTRACT_ONLY'), sig('source-disagreement', 'human', 'CONTRACT_ONLY')],
    productionDependency: 'site rules runtime',
    activationCondition: 'SITEINTEL-RULES; AI remains after DATA, RULES, and DOMAIN',
    nextActivation: 'WAITING_FOR_PRODUCT_RUNTIME',
  }),
  subject({
    id: 'ATLAS',
    label: 'PLANT ATLAS',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCT_RUNTIME',
    effectMethod: 'MANUAL_VERIFICATION',
    durableControlType: 'DATA_QUALITY_RULE',
    signalOwner: 'plant-atlas',
    provenance: 'cited-source-or-editor',
    observationType: 'taxonomy-or-content-correction',
    materialityRule: 'a taxonomic or cultivation correction with provenance; behavior is not botanical proof',
    humanApprovalRule: 'editor approval is required for semantic factual changes',
    automationLimit: 'search behavior may change ranking only, not botanical truth',
    defaultScope: 'PLANT',
    signals: [sig('editor-correction', 'human', 'CONTRACT_ONLY'), sig('search-ranking', 'behavioral', 'PRODUCTION_LATER')],
    productionDependency: 'plant identity runtime',
    activationCondition: 'ATLAS-PLANT-IDENTITY; taxonomic authority stays distinct from cultivation evidence',
    nextActivation: 'WAITING_FOR_PRODUCT_RUNTIME',
  }),
  subject({
    id: 'SKETCHUP',
    label: 'SKETCHUP',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCT_RUNTIME',
    effectMethod: 'DETERMINISTIC_REPLAY',
    durableControlType: 'MAPPING_RULE',
    signalOwner: 'sketchup-adapter',
    provenance: 'adapter-fixture',
    observationType: 'mapping-failure',
    materialityRule: 'a repeated mapping, idempotency, or version failure that can become a fixture',
    humanApprovalRule: 'SketchUp does not become business truth',
    automationLimit: 'does not grant the plugin a local business ACL',
    signals: [sig('mapping-failure', 'technical', 'CONTRACT_ONLY'), sig('user-correction', 'human', 'CONTRACT_ONLY')],
    productionDependency: 'adapter mapping runtime',
    activationCondition: 'SKETCHUP-PROJECT-MAP fixtures; the plugin stays a projection',
    nextActivation: 'WAITING_FOR_PRODUCT_RUNTIME',
  }),
  subject({
    id: 'PXI',
    label: 'PXI',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCT_RUNTIME',
    effectMethod: 'BEFORE_AFTER',
    durableControlType: 'UX_PATTERN',
    signalOwner: 'product-experience',
    provenance: 'experience-contract',
    observationType: 'cross-surface-experience',
    materialityRule: 'a repeated experience failure with a baseline; no universal experience score',
    humanApprovalRule: 'replay stays off unless explicitly approved',
    automationLimit: 'does not enable replay or a universal score',
    signals: [
      sig('signal-contract', 'technical', 'CONTRACT_ONLY'),
      sig('behavior', 'behavioral', 'PRODUCTION_LATER'),
      sig('human-feedback', 'human', 'CONTRACT_ONLY'),
    ],
    productionDependency: 'approved experience telemetry',
    activationCondition: 'PXI-SIGNAL-MODEL, rejecting email, phone, message bodies, replay, and a universal score',
    nextActivation: 'WAITING_FOR_PRODUCT_RUNTIME, then WAITING_FOR_PRODUCTION_SIGNAL',
  }),
  subject({
    id: 'GROWTH',
    label: 'GROWTH OS',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCTION_SIGNAL',
    effectMethod: 'EXPERIMENT',
    effectMethods: ['EXPERIMENT', 'BEFORE_AFTER'],
    durableControlType: 'EXPERIMENT_DECISION',
    signalOwner: 'growth-plan',
    provenance: 'plan-then-approved-execution',
    observationType: 'plan-outcome',
    materialityRule: 'a plan outcome with a baseline; vanity reach is not a business result',
    humanApprovalRule: 'live spend stays OWNER-DECISION',
    automationLimit: 'internal plan learning does not authorize spend or a campaign',
    humanGate: 'OWNER-DECISION',
    signals: [sig('plan-retrospective', 'business', 'CONTRACT_ONLY'), sig('live-outcome', 'business', 'OWNER_GATED')],
    productionDependency: 'approved live execution',
    activationCondition: 'versioned plans exist; live outcomes wait for an approved execution and enough evidence for the named method',
    nextActivation: 'WAITING_FOR_PRODUCTION_SIGNAL for live outcomes; Bayesian or geo methods stay unused until the evidence justifies them',
  }),
  subject({
    id: 'CONNECTED',
    label: 'CONNECTED KNOWLEDGE',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCTION_SIGNAL',
    effectMethod: 'DETERMINISTIC_REPLAY',
    effectMethods: ['DETERMINISTIC_REPLAY', 'MANUAL_VERIFICATION'],
    durableControlType: 'DOMAIN_RULE',
    signalOwner: 'connected-facts',
    provenance: 'field-provenance-class',
    observationType: 'relationship-correction',
    materialityRule: 'a relationship, projection, or lock violation with its value class attached',
    humanApprovalRule: 'AUTHORITATIVE and human-locked values are not replaced by inference',
    automationLimit: 'inference cannot silently overwrite a human lock',
    signals: [sig('conflict', 'technical', 'CONTRACT_ONLY'), sig('human-correction', 'human', 'CONTRACT_ONLY')],
    productionDependency: 'live relationship corrections',
    activationCondition: 'connected domain tests exist; a correction enters FZ-CIS with its scope and value class',
    nextActivation: 'WAITING_FOR_PRODUCTION_SIGNAL',
  }),
  subject({
    id: 'CMS',
    label: 'CMS',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCTION_SIGNAL',
    effectMethod: 'BEFORE_AFTER',
    durableControlType: 'CONTENT_RULE',
    signalOwner: 'content-editor',
    provenance: 'editor-action',
    observationType: 'editor-correction',
    materialityRule: 'a repeated editor correction may change a template or rule after recurrence, not on one draft',
    humanApprovalRule: 'AI drafts stay human-approved; private drafts are not a training set',
    automationLimit: 'does not auto-publish',
    signals: [sig('editor-correction', 'human', 'CONTRACT_ONLY'), sig('content-performance', 'business', 'PRODUCTION_LATER')],
    productionDependency: 'published content measurement',
    activationCondition: 'CMS domain exists; performance evidence waits for publication measurement. CMS-ACCEPT stays open',
    nextActivation: 'WAITING_FOR_PRODUCTION_SIGNAL',
  }),
  subject({
    id: 'SEARCH',
    label: 'SEARCH',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCTION_SIGNAL',
    effectMethod: 'BEFORE_AFTER',
    durableControlType: 'VALIDATOR',
    signalOwner: 'search-architecture',
    provenance: 'measured-observation-with-baseline',
    observationType: 'search-change',
    materialityRule: 'a technical or content change with a baseline; correlation without a method is not a cause',
    humanApprovalRule: 'no universal SEO or AI-visibility score; unmeasured citations are not promoted',
    automationLimit: 'does not invent a rank or change crawler policy',
    signals: [
      sig('technical-audit', 'technical', 'CONTRACT_ONLY'),
      sig('indexing', 'technical', 'PRODUCTION_LATER'),
      sig('traffic', 'business', 'PRODUCTION_LATER'),
    ],
    productionDependency: 'search measurement baseline',
    activationCondition: 'FZ-SEARCH-1 contracts exist; measured change evidence waits for a baseline. FZ-SEARCH-CRAWL-1 stays open',
    nextActivation: 'WAITING_FOR_PRODUCTION_SIGNAL',
  }),
  subject({
    id: 'MEDIA',
    label: 'MEDIA',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCTION_SIGNAL',
    effectMethod: 'DETERMINISTIC_REPLAY',
    durableControlType: 'VALIDATOR',
    signalOwner: 'media-pipeline',
    provenance: 'checksummed-master-contract',
    observationType: 'media-failure',
    materialityRule: 'a derivative, checksum, or payload regression that a fixture can replay',
    humanApprovalRule: 'private masters stay private',
    automationLimit: 'does not publish a gallery item',
    signals: [sig('derivative-failure', 'technical', 'CONTRACT_ONLY'), sig('payload', 'technical', 'PRODUCTION_LATER')],
    productionDependency: 'public media traffic',
    activationCondition: 'media derivative contract tests exist; field payload evidence waits for publication',
    nextActivation: 'WAITING_FOR_PRODUCTION_SIGNAL',
  }),
  subject({
    id: 'FILES',
    label: 'FILES',
    kind: 'cross-cutting',
    parentCapability: 'MEDIA',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCT_RUNTIME',
    effectMethod: 'DETERMINISTIC_REPLAY',
    durableControlType: 'AUTHZ_RULE',
    signalOwner: 'project-files',
    provenance: 'authorization-fixture',
    observationType: 'file-access',
    materialityRule: 'a cross-client file read or a failed authorized read',
    humanApprovalRule: 'file visibility follows the project owner',
    automationLimit: 'does not widen file access',
    signals: [sig('bola-denial', 'technical', 'CONTRACT_ONLY')],
    productionDependency: 'portal file projection',
    activationCondition: 'PORTAL-FILE-PROJECTION authorization tests, then approved production errors if they occur',
    nextActivation: 'WAITING_FOR_PRODUCT_RUNTIME',
  }),
  subject({
    id: 'HOSTING',
    label: 'HOSTING',
    classification: 'OWNER_GATED',
    readiness: 'OWNER_GATED',
    effectMethod: 'BEFORE_AFTER',
    durableControlType: 'RUNBOOK',
    signalOwner: 'hosting-boundary',
    provenance: 'owner-decision',
    observationType: 'hosting-change',
    materialityRule: 'a hosting or deployment failure after a provider exists',
    humanApprovalRule: 'provider, DNS, and Cloudflare stay OWNER-DECISION or DANGEROUS',
    automationLimit: 'no DNS, Cloudflare, or production configuration change',
    humanGate: 'OWNER-DECISION',
    signals: [sig('deployment-failure', 'technical', 'OWNER_GATED')],
    productionDependency: 'Owner hosting decision',
    activationCondition: 'HOSTING remains OWNER_DECISION; no learning row selects a provider',
    nextActivation: 'OWNER_GATED',
  }),
  subject({
    id: 'SECURITY',
    label: 'SECURITY',
    kind: 'cross-cutting',
    classification: 'LEARNING_LOOP_OPERATIONAL',
    readiness: 'OPERATIONAL',
    effectMethod: 'DETERMINISTIC_REPLAY',
    durableControlType: 'AUTHZ_RULE',
    signalOwner: 'security-review',
    ingestSource: 'security',
    provenance: 'repository-security-signal',
    observationType: 'security-finding',
    materialityRule: 'a failed authz test, secret finding, or verified security review finding',
    humanApprovalRule: 'urgent critical security learning may interrupt; ordinary debt does not',
    automationLimit: 'does not grant a security exception',
    autoApply: 'EXISTING_AUTO_ENGINEERING_ONLY',
    signals: [
      sig('security-test', 'technical', 'REPOSITORY_NOW'),
      sig('secret-scan', 'technical', 'REPOSITORY_NOW'),
      sig('zap', 'technical', 'PRODUCTION_LATER'),
    ],
    productionDependency: 'ZAP stays ARMED_WAITING_FOR_TARGET; incidents wait for a real event',
    activationCondition: 'Repository security findings already use FZ-CIS ingest kind security_finding',
    nextActivation: 'ZAP and incident learning stay WAITING_FOR_PRODUCTION_SIGNAL on this same loop',
  }),
  subject({
    id: 'ACCESSIBILITY',
    label: 'ACCESSIBILITY',
    kind: 'cross-cutting',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCTION_SIGNAL',
    effectMethod: 'DETERMINISTIC_REPLAY',
    durableControlType: 'DESIGN_SYSTEM_COMPONENT',
    signalOwner: 'interface-quality',
    provenance: 'finding-or-component-test',
    observationType: 'accessibility-defect',
    materialityRule: 'a repeated component-level defect becomes a shared control instead of a one-page fix',
    humanApprovalRule: 'manual assistive-technology findings stay human evidence',
    automationLimit: 'does not restyle a surface from one automated warning',
    signals: [sig('component-defect', 'technical', 'CONTRACT_ONLY'), sig('assistive-tech', 'human', 'PRODUCTION_LATER')],
    productionDependency: 'component regression or a manual finding',
    activationCondition: 'a repeated accessibility defect may enter FZ-CIS and promote a component test; field audits are not claimed',
    nextActivation: 'WAITING_FOR_PRODUCTION_SIGNAL for manual audits; repository defects can use this contract now',
  }),
  subject({
    id: 'PERFORMANCE',
    label: 'PERFORMANCE',
    kind: 'cross-cutting',
    classification: 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL',
    readiness: 'WAITING_FOR_PRODUCTION_SIGNAL',
    effectMethod: 'BEFORE_AFTER',
    effectMethods: ['BEFORE_AFTER', 'DETERMINISTIC_REPLAY'],
    durableControlType: 'TEST',
    signalOwner: 'performance',
    ingestSource: 'performance',
    provenance: 'baseline-comparison',
    observationType: 'performance-regression',
    materialityRule: 'a regression against an established requirement or baseline, not an invented threshold',
    humanApprovalRule: 'no numeric SLO is invented here',
    automationLimit: 'does not add a threshold that no requirement states',
    signals: [sig('budget-regression', 'technical', 'CONTRACT_ONLY'), sig('web-vitals', 'technical', 'PRODUCTION_LATER')],
    productionDependency: 'Core Web Vitals and mobile startup wait for production',
    activationCondition: 'a repository regression with a recorded baseline may enter FZ-CIS; field vitals stay unmeasured',
    nextActivation: 'WAITING_FOR_PRODUCTION_SIGNAL for field vitals',
  }),
  subject({
    id: 'RELIABILITY',
    label: 'RELIABILITY',
    kind: 'cross-cutting',
    classification: 'PRODUCTION_ONLY',
    readiness: 'WAITING_FOR_PRODUCTION_SIGNAL',
    effectMethod: 'BEFORE_AFTER',
    durableControlType: 'RUNBOOK',
    signalOwner: 'delivery',
    provenance: 'deployment-event',
    observationType: 'dora-event',
    materialityRule: 'a real deployment, failure, or recovery event; absent events stay NOT MEASURABLE',
    humanApprovalRule: 'no production DORA number is invented',
    automationLimit: 'does not create a DORA score',
    signals: [sig('deployment', 'technical', 'PRODUCTION_LATER'), sig('rollback', 'technical', 'PRODUCTION_LATER')],
    productionDependency: 'deployment events',
    activationCondition: 'the five DORA metrics stay NOT MEASURABLE until deployment events exist; CI failures stay on ENGINEERING',
    nextActivation: 'WAITING_FOR_PRODUCTION_SIGNAL',
    effectObservability: 'IMPLEMENTED_NOT_YET_OBSERVABLE',
  }),
  subject({
    id: 'ENGINEERING',
    label: 'ENGINEERING QUALITY',
    kind: 'cross-cutting',
    classification: 'LEARNING_LOOP_OPERATIONAL',
    readiness: 'OPERATIONAL',
    effectMethod: 'DETERMINISTIC_REPLAY',
    durableControlType: 'TEST',
    signalOwner: 'repository',
    ingestSource: 'test',
    provenance: 'ci-or-test',
    observationType: 'regression',
    materialityRule: 'a failed test, build, lint, or CI run; a routine PASS is not a learning row',
    humanApprovalRule: 'ordinary engineering debt does not block product selection',
    automationLimit: 'AUTO applies only where the existing slice gate already allows a safe engineering change',
    autoApply: 'EXISTING_AUTO_ENGINEERING_ONLY',
    signals: [
      sig('test-failure', 'technical', 'REPOSITORY_NOW'),
      sig('ci-failure', 'technical', 'REPOSITORY_NOW'),
      sig('build-failure', 'technical', 'REPOSITORY_NOW'),
    ],
    productionDependency: 'none for repository failures',
    activationCondition: 'test_failed, build_failed, and ci_failed already enter FZ-CIS',
    nextActivation: 'Active for repository signals',
  }),
  subject({
    id: 'CODERABBIT',
    label: 'CODERABBIT',
    kind: 'cross-cutting',
    classification: 'LEARNING_LOOP_OPERATIONAL',
    readiness: 'OPERATIONAL',
    effectMethod: 'DETERMINISTIC_REPLAY',
    durableControlType: 'STATIC_ANALYSIS',
    signalOwner: 'checkpoint-review',
    ingestSource: 'coderabbit',
    provenance: 'coderabbit-occurrence-id',
    observationType: 'review-finding',
    materialityRule: 'a verified CodeRabbit finding with a distinct cr-occurrence id',
    humanApprovalRule: 'the finding is non-authoritative until local verification',
    automationLimit: 'a finding does not promote itself and does not approve the learning change that contains it',
    signals: [sig('review-finding', 'technical', 'REPOSITORY_NOW')],
    productionDependency: 'none',
    activationCondition: 'coderabbit_finding ingest and occurrence dedupe are already in FZ-CIS',
    nextActivation: 'Active',
  }),
  subject({
    id: 'GROK',
    label: 'GROK',
    kind: 'cross-cutting',
    classification: 'LEARNING_LOOP_OPERATIONAL',
    readiness: 'OPERATIONAL',
    effectMethod: 'DETERMINISTIC_REPLAY',
    durableControlType: 'TEST',
    signalOwner: 'adversarial-review',
    ingestSource: 'grok',
    provenance: 'sanitized-challenge',
    observationType: 'review-finding',
    materialityRule: 'a Grok finding becomes a row only after local verification; agreement with another model is not effect evidence',
    humanApprovalRule: 'Grok output stays non-authoritative',
    automationLimit: 'Grok cannot mutate the repository or confirm its own finding',
    signals: [sig('review-finding', 'technical', 'REPOSITORY_NOW')],
    productionDependency: 'none; a challenge runs only when policy triggers it',
    activationCondition: 'grok_finding ingest exists; AI_OPINION evidence cannot support effect',
    nextActivation: 'Active when a challenge is triggered; idle when policy says GROK_NOT_NEEDED',
  }),
  subject({
    id: 'FZ-CIS',
    label: 'FZ-CIS',
    kind: 'cross-cutting',
    classification: 'LEARNING_LOOP_OPERATIONAL',
    readiness: 'OPERATIONAL',
    effectMethod: 'DETERMINISTIC_REPLAY',
    durableControlType: 'TEST',
    signalOwner: 'learning-system',
    ingestSource: 'test',
    provenance: 'learning-check',
    observationType: 'learning-system-defect',
    materialityRule: 'a failed learning-policy test or a poisoned record rejected by validation',
    humanApprovalRule: 'meta-learning cannot rewrite promotion or safety rules without a separate verified control',
    automationLimit: 'no recursive self-rewrite of safety rules',
    signals: [sig('policy-failure', 'technical', 'REPOSITORY_NOW')],
    productionDependency: 'none',
    activationCondition: 'FZ-CIS check, effect, and coverage tests already run in the repository',
    nextActivation: 'Active',
  }),
]);

const CONTRACT_FIELDS = [
  'signalOwner', 'dataClassification', 'privacyClassification', 'provenance', 'normalization',
  'deduplication', 'materialityRule', 'observationType', 'hypothesisFormation', 'validationMethod',
  'effectMethod', 'baselineRequirement', 'controlComparison', 'counterEvidence',
  'falsePositiveHandling', 'falseNegativeHandling', 'recurrenceDetection', 'durableControlType',
  'promotionRule', 'demotionRule', 'humanApprovalRule', 'automationLimit', 'cisIngestPath',
  'productChangePath', 'auditHistory', 'activationCondition',
];

function walkStrings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const item of value) walkStrings(item, out);
  else if (value && typeof value === 'object') for (const item of Object.values(value)) walkStrings(item, out);
  return out;
}

function subjectErrors(item) {
  const errors = [];
  if (!item?.id) errors.push('MISSING_ID');
  if (!LEARNING_CLASSIFICATIONS.includes(item.classification)) errors.push('UNKNOWN_CLASSIFICATION');
  if (!LEARNING_READINESS.includes(item.readiness)) errors.push('BAD_READINESS');
  if (item.secondStore !== false) errors.push('SECOND_STORE');
  if (item.cisIngestPath !== CIS_INGEST) errors.push('CIS_PATH');
  if (item.counterEvidencePath !== true) errors.push('MISSING_COUNTER_EVIDENCE');
  if (item.demotionPath !== true) errors.push('MISSING_DEMOTION');
  if (item.productionSignalsFaked === true) errors.push('FAKED_PRODUCTION');
  if (!Array.isArray(item.signals) || item.signals.length === 0) errors.push('MISSING_SIGNALS');
  const learning = item.classification !== 'NO_LEARNING_REQUIRED';
  if (learning) {
    if (!EFFECT_METHODS.includes(item.effectMethod)) errors.push('MISSING_EFFECT_METHOD');
    for (const method of item.effectMethods || [item.effectMethod]) {
      if (!EFFECT_METHODS.includes(method)) errors.push('UNKNOWN_EFFECT_METHOD');
    }
    if (!DURABLE_CONTROL_TYPES.includes(item.durableControlType)) errors.push('BAD_CONTROL');
    if (!CONTROL_PROMOTION_TARGET[item.durableControlType]) errors.push('UNMAPPED_CONTROL');
    for (const field of CONTRACT_FIELDS) {
      if (field === 'effectMethod' || field === 'durableControlType') continue;
      if (typeof item[field] !== 'string' || item[field].trim().length < 8) errors.push(`MISSING_${field}`);
    }
  } else if (typeof item.justification !== 'string' || item.justification.trim().length < 40) {
    errors.push('MISSING_NO_LEARNING_JUSTIFICATION');
  }
  if (item.classification === 'LEARNING_LOOP_OPERATIONAL') {
    if (!item.signals.some((signal) => signal.availability === 'REPOSITORY_NOW')) errors.push('FALSE_OPERATIONAL');
    if (item.readiness !== 'OPERATIONAL' && item.readiness !== 'EFFECT_VERIFIED') errors.push('FALSE_OPERATIONAL');
  }
  if (item.classification === 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL' && item.readiness === 'OPERATIONAL') {
    errors.push('FALSE_OPERATIONAL');
  }
  if (item.classification === 'OWNER_GATED' && !['OWNER-DECISION', 'OWNER-ONLY', 'DANGEROUS'].includes(item.humanGate)) {
    errors.push('OWNER_GATE_MISSING');
  }
  if (item.classification === 'PRODUCTION_ONLY' && item.effectObservability !== 'IMPLEMENTED_NOT_YET_OBSERVABLE') {
    errors.push('PRODUCTION_OBSERVABILITY');
  }
  if (walkStrings(item).some((text) => PLACEHOLDER.test(text))) errors.push('PLACEHOLDER');
  return errors;
}

export function checkLearningCoverage(options = {}) {
  const catalog = options.catalog || LEARNING_SUBJECTS;
  const scope = options.productScope || loadProductScope();
  const errors = [];
  const ids = new Set();
  for (const item of catalog) {
    if (ids.has(item.id)) errors.push(`DUPLICATE:${item.id}`);
    ids.add(item.id);
    for (const code of subjectErrors(item)) errors.push(`${item.id}:${code}`);
  }
  for (const capability of scope) {
    if (capability.normative === false) continue;
    if (!ids.has(capability.id)) errors.push(`MISSING_CLASSIFICATION:${capability.id}`);
  }
  for (const id of (options.requiredIds || REQUIRED_MATRIX_IDS)) {
    if (!ids.has(id)) errors.push(`MISSING_MATRIX:${id}`);
  }
  const summary = summarize(catalog, scope, errors);
  return { ok: errors.length === 0, errors, summary };
}

function summarize(catalog, scope, errors) {
  const binding = scope.filter((item) => item.normative !== false);
  const count = (classification) => catalog.filter((item) => item.classification === classification);
  const ids = (classification) => count(classification).map((item) => item.id);
  return {
    bindingCapabilities: binding.length,
    classifiedBinding: binding.filter((item) => catalog.some((subjectRow) => subjectRow.id === item.id)).length,
    unclassifiedBinding: binding.filter((item) => !catalog.some((subjectRow) => subjectRow.id === item.id)).length,
    learningSubjects: catalog.length,
    unknown: catalog.filter((item) => !LEARNING_CLASSIFICATIONS.includes(item.classification)).length,
    operational: ids('LEARNING_LOOP_OPERATIONAL'),
    implementedNotOperational: ids('LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL'),
    partial: ids('LEARNING_LOOP_PARTIAL'),
    noLearningRequired: count('NO_LEARNING_REQUIRED').map((item) => ({
      id: item.id,
      justification: item.justification,
    })),
    ownerGated: ids('OWNER_GATED'),
    productionOnly: ids('PRODUCTION_ONLY'),
    waitingForRuntime: catalog.filter((item) => item.readiness === 'WAITING_FOR_PRODUCT_RUNTIME').map((item) => item.id),
    waitingForProductionSignal: catalog.filter((item) => item.readiness === 'WAITING_FOR_PRODUCTION_SIGNAL').map((item) => item.id),
    safeGaps: errors.filter((error) => !error.startsWith('DUPLICATE')).length,
    secondStore: catalog.some((item) => item.secondStore !== false),
    missingEffectMethod: catalog.filter((item) => item.classification !== 'NO_LEARNING_REQUIRED' && !EFFECT_METHODS.includes(item.effectMethod)).length,
    missingCounterEvidence: catalog.filter((item) => item.counterEvidencePath !== true).length,
  };
}

export function learningCoverageReport(options = {}) {
  const checked = checkLearningCoverage(options);
  const catalog = options.catalog || LEARNING_SUBJECTS;
  return {
    ok: checked.ok,
    summary: checked.summary,
    matrix: catalog.map((item) => ({
      capability: item.label,
      id: item.id,
      learningState: item.classification,
      readiness: item.readiness,
      signals: item.signals.map((signal) => `${signal.id}:${signal.kind}:${signal.availability}`),
      effectMethod: item.effectMethod,
      durableControlType: item.durableControlType,
      promotionTarget: CONTROL_PROMOTION_TARGET[item.durableControlType] || null,
      cisPath: item.cisIngestPath,
      humanGate: item.humanGate,
      productionDependency: item.productionDependency,
      nextActivation: item.nextActivation,
      safeGapRemaining: subjectErrors(item).length > 0,
    })),
    errors: checked.errors,
  };
}

export function forbiddenLearningStores(paths = []) {
  const banned = /search-learning|growth-learning|pxi-learning|coderabbit-learning|mobile-learning/i;
  return paths.filter((file) => banned.test(String(file).replaceAll('\\', '/')));
}

function refuse(reason, extra = {}) {
  return { ok: false, reason, outcome: null, ...extra };
}

export function normalizeLearningSignal(event = {}) {
  const catalog = event.catalog || LEARNING_SUBJECTS;
  const subjectRow = catalog.find((item) => item.id === event.capability);
  if (!subjectRow) return refuse('UNKNOWN_CAPABILITY');
  if (event.passed === true || event.kind === 'pass' || event.kind === 'success') return refuse('noise_skip');
  if (event.canonRewrite === true || event.trainModel === true || event.silentMutation === true) {
    return refuse('AUTONOMOUS_MUTATION_FORBIDDEN');
  }
  if (event.rewriteSafetyRules === true) return refuse('SELF_REWRITE_FORBIDDEN');
  for (const guard of GUARDS[subjectRow.id] || []) {
    if (event[guard.flag] === true) return refuse(guard.reason);
  }
  if (event.learningScope === 'GLOBAL' && event.evidenceScope && event.evidenceScope !== 'GLOBAL' && event.evidenceScope !== 'CAPABILITY') {
    return refuse('SCOPE_PROMOTION_REFUSED');
  }
  if (event.tenantId && event.targetTenantId && event.tenantId !== event.targetTenantId) {
    return refuse('CROSS_TENANT_LEAK');
  }
  const learningScope = event.learningScope || subjectRow.defaultScope;
  if (TENANT_BOUND_SCOPES.includes(learningScope) && !event.tenantId) return refuse('MISSING_TENANT');
  if (syntheticProductionRejected(event)) return refuse('SYNTHETIC_PRODUCTION_REJECTED');
  if (event.productionTelemetry === true) return refuse('PRODUCTION_TELEMETRY_GATED');
  if (event.evidenceClass === 'AI_OPINION' || event.evidenceClass === 'AI_AGREEMENT' || event.supportedOnlyByAi === true) {
    return refuse('AI_CIRCULAR_EVIDENCE');
  }
  let signal = subjectRow.signals[0];
  if (event.signalId) {
    signal = subjectRow.signals.find((item) => item.id === event.signalId);
    if (!signal) return refuse('UNKNOWN_SIGNAL');
  }
  if (!signal) return refuse('MISSING_SIGNALS');
  if (signal.availability === 'PRODUCTION_LATER' || signal.availability === 'OWNER_GATED') {
    return refuse('NOT_YET_OBSERVABLE', { availability: signal.availability, classification: subjectRow.classification });
  }
  if (event.claimOperational === true && subjectRow.classification !== 'LEARNING_LOOP_OPERATIONAL') {
    return refuse('NOT_OPERATIONAL', { classification: subjectRow.classification });
  }
  const outcome = {
    kind: 'domain_signal',
    source: event.source || subjectRow.ingestSource,
    patternKey: event.patternKey,
    scope: String(event.scope || subjectRow.id).slice(0, 120),
    observation: event.observation,
    evidence: event.evidence,
    generalizability: event.generalizability || 'LOCAL',
    severity: event.severity || 'medium',
    signalType: event.signalType || (signal.kind === 'human' ? 'review-finding' : 'failure'),
    provenanceEnvironment: event.provenanceEnvironment || 'FIXTURE',
    learningScope: event.learningScope || subjectRow.defaultScope,
    learningClaim: 'ENGINEERING',
    privacyClassification: 'INTERNAL',
    horizon: 'FOUNDATION_NOW',
  };
  if (event.tenantId) outcome.tenantId = event.tenantId;
  const prepared = toLearningInput(outcome);
  if (!prepared.ok) return refuse(prepared.reason);
  return {
    ok: true,
    reason: 'ready',
    classification: subjectRow.classification,
    outcome: prepared.record,
    wroteCanon: false,
    secondStore: false,
  };
}

export function humanCorrectionToSignal(input = {}) {
  if (!HUMAN_ROLES.includes(input.role)) return refuse('BAD_HUMAN_ROLE');
  if (!HUMAN_ACTIONS.includes(input.action)) return refuse('BAD_HUMAN_ACTION');
  if (!input.entity || !input.capability) return refuse('MISSING_CONTEXT');
  if (input.trainModel === true || input.canonRewrite === true) return refuse('AUTONOMOUS_MUTATION_FORBIDDEN');
  const learningScope = input.learningScope || input.scope || 'PROJECT';
  if (!LEARNING_SCOPES.includes(learningScope)) return refuse('BAD_LEARNING_SCOPE');
  if (learningScope === 'GLOBAL' && input.scope && input.scope !== 'GLOBAL') return refuse('SCOPE_PROMOTION_REFUSED');
  return normalizeLearningSignal({
    capability: input.capability,
    signalId: input.signalId || 'human-correction',
    patternKey: input.patternKey,
    observation: input.observation || `${input.role} ${input.action} on ${input.entity}`,
    evidence: input.evidence || [`role:${input.role}`, `action:${input.action}`, `entity:${input.entity}`],
    learningScope,
    evidenceScope: input.scope || learningScope,
    source: input.role === 'OWNER' ? 'owner' : input.role === 'CLIENT' ? 'customer' : 'review',
    signalType: 'review-finding',
    generalizability: 'LOCAL',
    provenanceEnvironment: 'INTERNAL',
    tenantId: input.tenantId,
  });
}
