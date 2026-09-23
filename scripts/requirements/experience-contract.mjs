/**
 * Product-experience contracts on the existing scope and FZ-CIS path.
 * Not a second architecture, learning store, or process engine.
 */

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEARNING_SUBJECTS } from '../fz-cis/learning-coverage.mjs';
import { loadProductScope } from './product-scope.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const ACCEPTANCE_STATES = Object.freeze([
  'DESIGNED',
  'SEMANTIC_CONTRACT_READY',
  'IMPLEMENTED',
  'INTEGRATED',
  'VISUAL_REVIEW_READY',
  'VISUAL_ACCEPTED',
  'UX_ACCEPTED',
  'TESTED',
  'OPERATIONAL',
  'MEASURED',
]);

export const REQUIRED_STATES = Object.freeze([
  'loading', 'empty', 'error', 'unauthorized', 'success', 'conflict', 'stale',
]);

const WWW = 'legacy/chatgpt-lean-full/screenshots/www/craft-v2-home.png';
const PORTAL_REF = 'legacy/chatgpt-lean-full/screenshots/www/craft-v2-portal.png';
const PROJECT_REF = 'legacy/chatgpt-lean-full/screenshots/www/art-portal-projekt.png';
const ADMIN_REF = 'legacy/chatgpt-lean-full/mobile-screens/02-admin.png';
const PANEL_REF = 'legacy/chatgpt-lean-full/screenshots/www/craft-v2-panel.png';
const CONTACT_REF = 'legacy/chatgpt-lean-full/screenshots/www/album3-kontakt.png';
const GARDEN_REF = 'legacy/chatgpt-lean-full/mobile-screens/04-garden-os.png';
const PHONE_REF = 'legacy/chatgpt-lean-full/mobile-screens/03-garden-os-phone.png';
const ARTICLES_REF = 'legacy/chatgpt-lean-full/screenshots/www/craft-v2-articles.png';

const A11Y = Object.freeze([
  'keyboard', 'focus', 'semantics', 'contrast', 'labels', 'touch-targets', 'screen-reader',
]);

function down(capability, relation) {
  return { capability, relation };
}

function action(id, domainEffect, feedback, extra = {}) {
  return { id, domainEffect, feedback, implemented: false, ...extra };
}

function ux(spec) {
  return {
    userFacing: true,
    backendOnly: false,
    surfaceRequired: true,
    acceptanceState: 'SEMANTIC_CONTRACT_READY',
    visualAcceptance: 'NOT_ACCEPTED',
    semanticReview: 'REQUIRED',
    responsiveReview: 'REQUIRED',
    browserEvidence: 'WAITING_FOR_RUNTIME',
    screenshotArtifact: null,
    reviewRecord: null,
    materialDeviation: false,
    deviation: null,
    visualSource: 'PRESENT',
    newDirectionReview: null,
    measurement: 'NOT_MEASURABLE',
    blocksDomainSlice: false,
    decorative: false,
    sourceOfTruth: 'core-api',
    canonicalOwner: 'core-api',
    privacyClass: 'INTERNAL',
    responsive: ['desktop', 'tablet', 'mobile'],
    accessibility: A11Y,
    states: REQUIRED_STATES,
    pxi: { replay: 'OFF', pii: false, minimization: true, classes: ['technical'] },
    automation: {
      trigger: 'none',
      failure: 'no customer state changes',
      audit: 'no silent write',
      idempotent: true,
      humanOverride: 'staff can correct the canonical record',
    },
    integration: null,
    ...spec,
  };
}

export const EXPERIENCE_CONTRACTS = Object.freeze([
  ux({
    id: 'WWW',
    screenId: 'WWW-HOME',
    surface: 'WWW',
    primaryUser: 'anonymous visitor',
    secondaryUsers: ['owner'],
    businessPurpose: 'Acquire a qualified enquiry without inventing proof or urgency',
    userJob: 'Understand the studio and start a relevant enquiry',
    workflowId: 'public-enquiry',
    entryConditions: 'public route, no client session',
    upstream: 'none',
    authz: 'anonymous read of published content only',
    privacyClass: 'PUBLIC',
    businessOutcome: 'a qualified lead reaches Core API or the visitor stops without a false promise',
    uxOutcome: 'the next step is visible and the enquiry does not ask for unused data',
    visualReference: WWW,
    learningCapability: 'WWW',
    pxi: { replay: 'OFF', pii: false, minimization: true, classes: ['business', 'behavioral'] },
    actions: [action('start-enquiry', 'lead.capture', 'validation or the next honest step')],
    events: ['lead.received'],
    downstream: [down('LEAD', 'capture'), down('ADMIN', 'staff queue')],
    states: [...REQUIRED_STATES, 'offline'],
  }),
  ux({
    id: 'PORTAL',
    screenId: 'PORTAL-HOME',
    surface: 'PORTAL',
    primaryUser: 'client',
    secondaryUsers: ['staff'],
    businessPurpose: 'Show the client the state of their own project and the next real action',
    userJob: 'See what is happening and complete the action that is actually available',
    workflowId: 'client-visibility',
    entryConditions: 'authenticated client session',
    upstream: 'OFFER, PROJECT',
    authz: 'client reads only their subject; staff use Admin',
    businessOutcome: 'client decisions are recorded once on Core API',
    uxOutcome: 'status, next action, and refusal of other clients files are visible',
    visualReference: PORTAL_REF,
    learningCapability: 'PORTAL',
    pxi: { replay: 'OFF', pii: false, minimization: true, classes: ['human', 'technical'] },
    actions: [action('open-own-project', 'project.read', 'project state or an unauthorized empty state')],
    events: ['portal.projection.read'],
    downstream: [down('PROJECT', 'read'), down('FILES', 'authorized read')],
  }),
  ux({
    id: 'ADMIN',
    screenId: 'ADMIN-QUEUE',
    surface: 'ADMIN',
    primaryUser: 'staff',
    secondaryUsers: ['owner', 'designer'],
    businessPurpose: 'Give staff the next correct action without a second business store',
    userJob: 'Qualify, prepare, and correct records the role is allowed to change',
    workflowId: 'staff-operations',
    entryConditions: 'staff session',
    upstream: 'LEAD',
    authz: 'staff commands only; client tokens cannot qualify or price',
    businessOutcome: 'one canonical update is visible to the projections that may see it',
    uxOutcome: 'the required action is denser and clearer than the public site',
    visualReference: ADMIN_REF,
    learningCapability: 'ADMIN',
    pxi: { replay: 'OFF', pii: false, minimization: true, classes: ['human', 'technical'] },
    actions: [action('qualify-lead', 'lead.qualify', 'qualification result or a recoverable validation error')],
    events: ['lead.qualified'],
    downstream: [down('OPPORTUNITY', 'create-from-qualified-lead'), down('LEAD', 'status')],
  }),
  ux({
    id: 'LEAD',
    screenId: 'LEAD-CAPTURE',
    surface: 'WWW',
    primaryUser: 'visitor',
    secondaryUsers: ['staff'],
    businessPurpose: 'Capture a lead that staff can qualify',
    userJob: 'Send the enquiry with the fields this stage actually needs',
    workflowId: 'public-enquiry',
    entryConditions: 'contact or enquiry section',
    upstream: 'WWW',
    authz: 'public create; staff qualify',
    privacyClass: 'INTERNAL',
    businessOutcome: 'Core API holds the lead; the public site does not keep a second copy',
    uxOutcome: 'errors are recoverable and success does not invent a consultation',
    visualReference: CONTACT_REF,
    learningCapability: 'LEAD',
    actions: [action('submit-lead', 'lead.capture', 'received or field-level recovery')],
    events: ['lead.received'],
    downstream: [down('ADMIN', 'staff queue')],
  }),
  ux({
    id: 'OPPORTUNITY',
    screenId: 'OPPORTUNITY-STAFF',
    surface: 'ADMIN',
    primaryUser: 'staff',
    secondaryUsers: ['owner'],
    businessPurpose: 'Continue a qualified lead into an opportunity without duplicate entry',
    userJob: 'See the qualified lead and open the opportunity that Core API allows',
    workflowId: 'commercial-path',
    entryConditions: 'lead is qualified',
    upstream: 'LEAD',
    authz: 'staff only',
    businessOutcome: 'an opportunity exists only from a qualified lead',
    uxOutcome: 'staff see the blocker when the lead is not qualified',
    visualReference: PANEL_REF,
    learningCapability: 'OPPORTUNITY',
    actions: [action('open-opportunity', 'opportunity.create', 'the opportunity or the qualification blocker')],
    events: ['opportunity.created'],
    downstream: [down('OFFER', 'prepare')],
  }),
  ux({
    id: 'OFFER',
    screenId: 'OFFER-CLIENT',
    surface: 'PORTAL',
    primaryUser: 'client',
    secondaryUsers: ['staff'],
    businessPurpose: 'Let the client accept a real offer without changing price or terms by learning',
    userJob: 'Read scope and accept or reject the offer that belongs to them',
    workflowId: 'commercial-path',
    entryConditions: 'offer exists for the client subject',
    upstream: 'OPPORTUNITY',
    authz: 'client accepts only their offer; staff prepare it',
    businessOutcome: 'acceptance is an audited Core API change, not a portal-only flag',
    uxOutcome: 'acceptance is clearly irreversible and confirmation is the new state',
    visualReference: PROJECT_REF,
    learningCapability: 'OFFER',
    pxi: { replay: 'OFF', pii: false, minimization: true, classes: ['business', 'human'] },
    actions: [action('accept-offer', 'offer.accept', 'accepted state or a conflict if the offer changed', { irreversible: true })],
    events: ['offer.accepted'],
    downstream: [down('CONTRACT', 'available'), down('ADMIN', 'staff sees acceptance'), down('PORTAL', 'confirmation')],
    automation: {
      trigger: 'offer.accepted',
      failure: 'offer stays unaccepted and the failure is visible',
      audit: 'the status change and outbox event are recorded',
      idempotent: true,
      humanOverride: 'price and commercial terms stay staff-controlled',
    },
  }),
  ux({
    id: 'CONTRACT',
    screenId: 'CONTRACT-STAFF',
    surface: 'ADMIN',
    primaryUser: 'staff',
    secondaryUsers: ['client'],
    businessPurpose: 'Open a contract from an accepted offer without a signing vendor',
    userJob: 'See that a contract can start and what is still undecided',
    workflowId: 'commercial-path',
    entryConditions: 'offer accepted',
    upstream: 'OFFER',
    authz: 'staff create; client reads their projection later',
    businessOutcome: 'the contract is a Core API record, not a signature-provider object',
    uxOutcome: 'missing provider is an explicit gated state, not a completed signature',
    visualReference: PANEL_REF,
    learningCapability: 'CONTRACT',
    actions: [action('prepare-contract', 'contract.create', 'draft contract or the missing-acceptance blocker')],
    events: ['contract.drafted'],
    downstream: [down('SIGNING', 'gated'), down('PAYMENT', 'preparation'), down('PROJECT', 'after preparation')],
  }),
  ux({
    id: 'SIGNING',
    screenId: 'SIGNING-STATE',
    surface: 'ADMIN',
    primaryUser: 'staff',
    secondaryUsers: ['client'],
    businessPurpose: 'Show signature state without pretending a provider was chosen',
    userJob: 'See whether signature is required and that no remote system has confirmed it',
    workflowId: 'commercial-path',
    entryConditions: 'contract exists and provider is undecided',
    upstream: 'CONTRACT',
    authz: 'no live signing call',
    businessOutcome: 'Core API remains the business record',
    uxOutcome: 'sent is not shown as signed',
    visualReference: PANEL_REF,
    learningCapability: 'SIGNING',
    actions: [action('record-signature-state', 'contract.signature-state', 'pending, failed, or acknowledged')],
    events: ['signature.state'],
    downstream: [down('CONTRACT', 'state')],
    integration: { facing: true, successRequiresAck: true, vendorOverwritesCanon: false },
  }),
  ux({
    id: 'PAYMENT',
    screenId: 'PAYMENT-PREP',
    surface: 'ADMIN',
    primaryUser: 'staff',
    secondaryUsers: ['client', 'owner'],
    businessPurpose: 'Prepare payment state without a live charge or a chosen provider',
    userJob: 'See preparation status and whether a provider has acknowledged anything',
    workflowId: 'commercial-path',
    entryConditions: 'contract drafted',
    upstream: 'CONTRACT',
    authz: 'owner gate for a provider and for any charge',
    businessOutcome: 'no money moves in this contract',
    uxOutcome: 'a sent request is pending until acknowledgement',
    visualReference: PANEL_REF,
    learningCapability: 'PAYMENT',
    actions: [action('prepare-payment', 'payment.prepare', 'pending preparation, not a receipt')],
    events: ['payment.preparation'],
    downstream: [down('PROJECT', 'handoff when preparation exists')],
    integration: { facing: true, successRequiresAck: true, vendorOverwritesCanon: false },
  }),
  ux({
    id: 'PROJECT',
    screenId: 'PROJECT-RECORD',
    surface: 'ADMIN',
    primaryUser: 'staff',
    secondaryUsers: ['client'],
    businessPurpose: 'Keep one project record that projections may show when allowed',
    userJob: 'Create and read the project class without publishing it by accident',
    workflowId: 'delivery',
    entryConditions: 'commercial path has a project handoff',
    upstream: 'PAYMENT',
    authz: 'publication is a separate staff decision; clients see only their projection',
    businessOutcome: 'REAL, CONCEPT, and ILLUSTRATIVE stay distinct',
    uxOutcome: 'public projection is absent until publication is allowed',
    visualReference: PROJECT_REF,
    learningCapability: 'PROJECT',
    actions: [action('read-project', 'project.read', 'class, status, and visibility')],
    events: ['project.created'],
    downstream: [down('PORTAL', 'client projection'), down('GARDENOS', 'after delivery'), down('WWW', 'only when published')],
  }),
  ux({
    id: 'FILES',
    screenId: 'FILES-CLIENT',
    surface: 'PORTAL',
    primaryUser: 'client',
    secondaryUsers: ['staff'],
    businessPurpose: 'Show a client only their project files',
    userJob: 'Open an authorized file or see a denial',
    workflowId: 'client-visibility',
    entryConditions: 'project projection exists',
    upstream: 'PROJECT',
    authz: 'BOLA denied for another client',
    businessOutcome: 'file bytes are not a second project record',
    uxOutcome: 'denial is a designed unauthorized state',
    visualReference: PROJECT_REF,
    learningCapability: 'FILES',
    actions: [action('open-file', 'file.read', 'the file or an unauthorized state')],
    events: ['file.read'],
    downstream: [down('MEDIA', 'derivative when public')],
  }),
  ux({
    id: 'MEDIA',
    screenId: 'MEDIA-DERIVATIVE',
    surface: 'WWW',
    primaryUser: 'visitor',
    secondaryUsers: ['staff'],
    businessPurpose: 'Publish derivatives without exposing private masters',
    userJob: 'See approved imagery, not a private original',
    workflowId: 'publication',
    entryConditions: 'a derivative is approved for the public surface',
    upstream: 'PROJECT',
    authz: 'private masters stay off the public response',
    privacyClass: 'PUBLIC',
    businessOutcome: 'public media does not leak the master',
    uxOutcome: 'missing media is an empty state, not a broken private URL',
    visualReference: WWW,
    learningCapability: 'MEDIA',
    actions: [action('show-derivative', 'media.read-public', 'the derivative or an empty state')],
    events: ['media.public-read'],
    downstream: [down('WWW', 'published page')],
  }),
  ux({
    id: 'MOBILE',
    screenId: 'MOBILE-TASK',
    surface: 'MOBILE',
    primaryUser: 'field staff',
    secondaryUsers: ['client'],
    businessPurpose: 'Complete a field task against Core API, not a second domain',
    userJob: 'Capture or update the allowed task on a small screen',
    workflowId: 'field-task',
    entryConditions: 'mobile runtime exists',
    upstream: 'PROJECT',
    authz: 'same Core API authorization, no second authz store',
    businessOutcome: 'field updates are canonical or visibly pending',
    uxOutcome: 'touch, camera, and poor network have designed states',
    visualReference: PHONE_REF,
    learningCapability: 'MOBILE',
    states: [...REQUIRED_STATES, 'offline'],
    actions: [action('complete-field-task', 'project.field-update', 'saved or pending offline')],
    events: ['mobile.task'],
    downstream: [down('PROJECT', 'canonical update'), down('ADMIN', 'staff visibility')],
  }),
  ux({
    id: 'ANDROID',
    screenId: 'ANDROID-TASK',
    surface: 'ANDROID',
    primaryUser: 'field staff',
    secondaryUsers: [],
    businessPurpose: 'Android field tasks use the same business semantics as Core API',
    userJob: 'Finish the field task with platform controls, not a desktop clone',
    workflowId: 'field-task',
    entryConditions: 'MOBILE-ANDROID-FOUNDATION runtime',
    upstream: 'MOBILE',
    authz: 'Core API only',
    businessOutcome: 'no commercial state is owned on the device',
    uxOutcome: 'identity matches Forma Zieleni and interaction matches Android',
    visualReference: PHONE_REF,
    learningCapability: 'ANDROID',
    states: [...REQUIRED_STATES, 'offline'],
    actions: [action('sync-task', 'project.field-update', 'synced or pending')],
    events: ['android.sync'],
    downstream: [down('PROJECT', 'canonical update')],
  }),
  ux({
    id: 'IOS',
    screenId: 'IOS-TASK',
    surface: 'IOS',
    primaryUser: 'field staff',
    secondaryUsers: [],
    businessPurpose: 'iOS field tasks use the same business semantics as Core API',
    userJob: 'Finish the field task with platform controls, not a desktop clone',
    workflowId: 'field-task',
    entryConditions: 'MOBILE-IOS-FOUNDATION runtime',
    upstream: 'MOBILE',
    authz: 'Core API only',
    businessOutcome: 'no commercial state is owned on the device',
    uxOutcome: 'identity matches Forma Zieleni and interaction matches iOS',
    visualReference: PHONE_REF,
    learningCapability: 'IOS',
    states: [...REQUIRED_STATES, 'offline'],
    actions: [action('sync-task', 'project.field-update', 'synced or pending')],
    events: ['ios.sync'],
    downstream: [down('PROJECT', 'canonical update')],
  }),
  ux({
    id: 'GARDENOS',
    screenId: 'GARDEN-RECORD',
    surface: 'PORTAL',
    primaryUser: 'client',
    secondaryUsers: ['staff'],
    businessPurpose: 'Continue a delivered project as a garden without a twin database',
    userJob: 'See the garden that belongs to the delivered project',
    workflowId: 'delivery',
    entryConditions: 'project delivered and garden record exists',
    upstream: 'PROJECT',
    authz: 'client isolation matches the project owner',
    businessOutcome: 'one garden relation, not a second business truth',
    uxOutcome: 'a missing garden is empty, not an invented live garden',
    visualReference: GARDEN_REF,
    learningCapability: 'GARDENOS',
    actions: [action('open-garden', 'garden.read', 'the linked garden or an empty state')],
    events: ['garden.linked'],
    downstream: [down('PORTAL', 'client garden'), down('ATLAS', 'plant relation when allowed')],
  }),
  ux({
    id: 'SITEINTEL',
    screenId: 'SITE-REVIEW',
    surface: 'ADMIN',
    primaryUser: 'staff',
    secondaryUsers: ['designer'],
    businessPurpose: 'Turn site observations into rules and domain results a human can review',
    userJob: 'Review a conclusion and its source before it affects a project',
    workflowId: 'site-review',
    entryConditions: 'normalized observations exist',
    upstream: 'none',
    authz: 'AI cannot overwrite domain truth',
    businessOutcome: 'order stays data, rules, domain, then AI',
    uxOutcome: 'an inferred note does not look like an authoritative fact',
    visualSource: 'VISUAL_SOURCE_MISSING',
    visualReference: null,
    newDirectionReview: 'REVIEW',
    learningCapability: 'SITEINTEL',
    actions: [action('review-site-result', 'site.review', 'accepted, rejected, or deferred')],
    events: ['site.reviewed'],
    downstream: [down('PROJECT', 'context when approved'), down('GARDENOS', 'context when approved')],
  }),
  ux({
    id: 'ATLAS',
    screenId: 'ATLAS-IDENTITY',
    surface: 'WWW',
    primaryUser: 'visitor',
    secondaryUsers: ['editor'],
    businessPurpose: 'Show plant identity and taxonomic citation, not cultivation as fact',
    userJob: 'Find an approved plant and its source',
    workflowId: 'plant-knowledge',
    entryConditions: 'identity is approved for the surface',
    upstream: 'none',
    authz: 'unpublished identities stay off the public response',
    privacyClass: 'PUBLIC',
    businessOutcome: 'taxonomy authority stays distinct from cultivation evidence',
    uxOutcome: 'search improves discovery and does not rewrite the plant',
    visualSource: 'VISUAL_SOURCE_MISSING',
    visualReference: null,
    newDirectionReview: 'REVIEW',
    learningCapability: 'ATLAS',
    actions: [action('open-plant', 'plant.read', 'identity and citation or an empty result')],
    events: ['plant.read'],
    downstream: [down('PROJECT', 'relation when used'), down('GARDENOS', 'relation when used')],
  }),
  ux({
    id: 'SKETCHUP',
    screenId: 'SKETCHUP-MAP',
    surface: 'ADMIN',
    primaryUser: 'staff',
    secondaryUsers: [],
    businessPurpose: 'Map a model reference to a project without letting the plugin own business truth',
    userJob: 'See mapping, conflict, and sync state',
    workflowId: 'model-sync',
    entryConditions: 'a model reference exists',
    upstream: 'PROJECT',
    authz: 'no local business ACL',
    businessOutcome: 'Core API keeps project, price, and customer identity',
    uxOutcome: 'sync failure stays pending or failed, not completed',
    visualSource: 'VISUAL_SOURCE_MISSING',
    visualReference: null,
    newDirectionReview: 'REVIEW',
    learningCapability: 'SKETCHUP',
    actions: [action('map-model', 'sketchup.map', 'mapped, conflict, or failed')],
    events: ['sketchup.mapped'],
    downstream: [down('PROJECT', 'reference only')],
    integration: { facing: true, successRequiresAck: true, vendorOverwritesCanon: false },
  }),
  ux({
    id: 'CMS',
    screenId: 'CMS-EDITOR',
    surface: 'ADMIN',
    primaryUser: 'editor',
    secondaryUsers: ['staff'],
    businessPurpose: 'Edit content truth without publishing business records or private drafts',
    userJob: 'Review a draft and approve only what may be public',
    workflowId: 'publication',
    entryConditions: 'editor session',
    upstream: 'PROJECT',
    sourceOfTruth: 'cms-content',
    canonicalOwner: 'cms-content',
    authz: 'human approval before publish; CMS does not own CRM facts',
    businessOutcome: 'published content is content, not a second project',
    uxOutcome: 'proposed changes can be compared, approved, rejected, or deferred',
    visualReference: ARTICLES_REF,
    learningCapability: 'CMS',
    actions: [action('approve-draft', 'content.approve', 'published or still draft')],
    events: ['content.approved'],
    downstream: [down('WWW', 'public projection'), down('SEARCH', 'index when published')],
  }),
  ux({
    id: 'SEARCH',
    screenId: 'SEARCH-STATUS',
    surface: 'ADMIN',
    primaryUser: 'staff',
    secondaryUsers: [],
    businessPurpose: 'Show measured search evidence without a universal score',
    userJob: 'See what is known and what is not measurable yet',
    workflowId: 'publication',
    entryConditions: 'published content exists or the absence is explicit',
    upstream: 'CMS',
    authz: 'crawler policy stays an owner decision',
    businessOutcome: 'no invented rank or citation',
    uxOutcome: 'missing baseline is labeled not measurable',
    visualReference: ARTICLES_REF,
    learningCapability: 'SEARCH',
    measurement: 'WAITING_FOR_SIGNAL',
    actions: [action('review-search-evidence', 'search.observe', 'evidence or not measurable')],
    events: ['search.observed'],
    downstream: [down('CMS', 'editorial correction when justified')],
  }),
  ux({
    id: 'GROWTH',
    screenId: 'GROWTH-PLAN',
    surface: 'ADMIN',
    primaryUser: 'owner',
    secondaryUsers: ['staff'],
    businessPurpose: 'Review a versioned plan that does not spend or publish',
    userJob: 'See the plan, its ceiling, and that live spend is still gated',
    workflowId: 'growth-plan',
    entryConditions: 'a plan version exists',
    upstream: 'none',
    authz: 'spend and publication stay owner-gated',
    businessOutcome: 'the plan is not a campaign and not a forecast',
    uxOutcome: 'not-enough-data stays visible',
    visualSource: 'VISUAL_SOURCE_MISSING',
    visualReference: null,
    newDirectionReview: 'REVIEW',
    learningCapability: 'GROWTH',
    measurement: 'WAITING_FOR_SIGNAL',
    pxi: { replay: 'OFF', pii: false, minimization: true, classes: ['business'] },
    actions: [action('review-plan', 'growth.review', 'the plan or not-enough-data')],
    events: ['growth.reviewed'],
    downstream: [down('CMS', 'candidates only'), down('WWW', 'nothing until approved publication')],
  }),
  ux({
    id: 'PXI',
    userFacing: false,
    surfaceRequired: false,
    screenId: null,
    surface: null,
    primaryUser: 'product',
    businessPurpose: 'Classify experience signals without a universal score or replay',
    userJob: 'none; PXI is not a screen',
    workflowId: 'experience-signals',
    entryConditions: 'a workflow names its signal classes',
    upstream: 'user-facing contracts',
    authz: 'no PII and replay stays off',
    businessOutcome: 'signals stay classified until a real measurement exists',
    uxOutcome: 'no experience dashboard is required for this contract',
    visualSource: null,
    visualReference: null,
    learningCapability: 'PXI',
    pxi: { replay: 'OFF', pii: false, minimization: true, classes: ['technical', 'behavioral', 'human', 'business'] },
    actions: [],
    events: ['pxi.classified'],
    downstream: [down('FZ-CIS', 'learning path when a signal is material')],
  }),
  ux({
    id: 'CONNECTED',
    userFacing: false,
    surfaceRequired: false,
    screenId: null,
    surface: null,
    primaryUser: 'system',
    businessPurpose: 'Carry canonical ownership, provenance, and human lock across projections',
    userJob: 'none; relationships are consumed by other surfaces',
    workflowId: 'connected-facts',
    entryConditions: 'a field has an owner and a value class',
    upstream: 'domain records',
    authz: 'inference cannot replace a human lock',
    businessOutcome: 'one owner per fact',
    uxOutcome: 'when a surface shows inference, it is distinguishable',
    visualSource: null,
    visualReference: null,
    learningCapability: 'CONNECTED',
    actions: [],
    events: ['fact.projected'],
    downstream: [down('PORTAL', 'allowed projection'), down('ADMIN', 'allowed projection'), down('WWW', 'published projection only')],
  }),
  ux({
    id: 'HOSTING',
    userFacing: false,
    backendOnly: true,
    surfaceRequired: false,
    screenId: null,
    surface: null,
    primaryUser: 'owner',
    businessPurpose: 'Hosting stays an owner decision and is not a product screen',
    userJob: 'none until a provider exists',
    workflowId: 'hosting-decision',
    entryConditions: 'owner decision',
    upstream: 'none',
    authz: 'DNS and Cloudflare stay gated',
    businessOutcome: 'no provider is selected here',
    uxOutcome: 'no hosting dashboard',
    visualSource: null,
    visualReference: null,
    learningCapability: 'HOSTING',
    actions: [],
    events: [],
    downstream: [],
  }),
]);

export const WORKFLOWS = Object.freeze([
  { id: 'public-enquiry', surfaceRequired: true },
  { id: 'client-visibility', surfaceRequired: true },
  { id: 'staff-operations', surfaceRequired: true },
  { id: 'commercial-path', surfaceRequired: true },
  { id: 'delivery', surfaceRequired: true },
  { id: 'field-task', surfaceRequired: true },
  { id: 'site-review', surfaceRequired: true },
  { id: 'plant-knowledge', surfaceRequired: true },
  { id: 'model-sync', surfaceRequired: true },
  { id: 'publication', surfaceRequired: true },
  { id: 'growth-plan', surfaceRequired: true },
  { id: 'experience-signals', surfaceRequired: false },
  { id: 'connected-facts', surfaceRequired: false },
  { id: 'hosting-decision', surfaceRequired: false },
]);

export const JOURNEYS = Object.freeze([
  {
    id: 'lead-to-project',
    steps: ['LEAD', 'ADMIN', 'OPPORTUNITY', 'OFFER', 'PORTAL', 'CONTRACT', 'PAYMENT', 'PROJECT'],
    edges: [
      ['LEAD', 'ADMIN'],
      ['ADMIN', 'OPPORTUNITY'],
      ['OPPORTUNITY', 'OFFER'],
      ['OFFER', 'PORTAL'],
      ['OFFER', 'CONTRACT'],
      ['CONTRACT', 'PAYMENT'],
      ['PAYMENT', 'PROJECT'],
    ],
  },
  {
    id: 'project-projections',
    steps: ['PROJECT', 'ADMIN', 'PORTAL', 'GARDENOS', 'WWW'],
    edges: [
      ['PROJECT', 'PORTAL'],
      ['PROJECT', 'GARDENOS'],
      ['PROJECT', 'WWW'],
    ],
  },
]);

const LEARNING_IDS = new Set(LEARNING_SUBJECTS.map((item) => item.id));
const PLACEHOLDER = /lorem|decorative dashboard|ai-slop|fake urgency|fake scarcity/i;

function fail(errors, code) {
  errors.push(code);
}

function stringsOf(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const item of value) stringsOf(item, out);
  else if (value && typeof value === 'object') for (const item of Object.values(value)) stringsOf(item, out);
  return out;
}

function edgeExists(catalog, fromId, toId) {
  const from = catalog.find((item) => item.id === fromId);
  if (!from) return false;
  return (from.downstream || []).some((item) => item.capability === toId);
}

export function contractErrors(item, options = {}) {
  const errors = [];
  const exists = options.existsSync || existsSync;
  if (!item?.id) fail(errors, 'MISSING_ID');
  if (!ACCEPTANCE_STATES.includes(item.acceptanceState)) fail(errors, 'BAD_ACCEPTANCE');
  if (item.acceptanceState === 'DONE') fail(errors, 'COLLAPSED_DONE');
  const acceptedAt = ACCEPTANCE_STATES.indexOf('VISUAL_ACCEPTED');
  if (ACCEPTANCE_STATES.indexOf(item.acceptanceState) >= acceptedAt && !item.reviewRecord) {
    fail(errors, 'MISSING_VISUAL_REVIEW');
  }
  if (item.decorative === true || !item.businessPurpose || item.businessPurpose.trim().length < 12) {
    fail(errors, 'MISSING_BUSINESS_PURPOSE');
  }
  if (stringsOf(item).some((text) => PLACEHOLDER.test(text))) fail(errors, 'DECORATIVE_OR_SLOP');
  if (item.learningCapability && !LEARNING_IDS.has(item.learningCapability)) fail(errors, 'MISSING_LEARNING_PATH');
  if (item.pxi?.replay !== 'OFF' || item.pxi?.pii === true) fail(errors, 'PXI_PRIVACY');
  if (typeof item.measurementValue === 'number') fail(errors, 'INVENTED_METRIC');
  if (item.backendOnly === true) {
    if (item.surfaceRequired === true || item.screenId) fail(errors, 'BACKEND_VISUAL_BLOCKER');
    return errors;
  }
  if (item.userFacing === false && item.surfaceRequired === false) {
    if (!item.workflowId) fail(errors, 'ORPHAN_WORKFLOW');
    return errors;
  }
  for (const field of ['screenId', 'surface', 'primaryUser', 'userJob', 'workflowId', 'entryConditions', 'upstream', 'authz', 'businessOutcome', 'uxOutcome']) {
    if (typeof item[field] !== 'string' || item[field].trim().length < 3) fail(errors, `MISSING_${field}`);
  }
  if (!Array.isArray(item.actions) || item.actions.length === 0) fail(errors, 'MISSING_ACTIONS');
  for (const entry of item.actions || []) {
    if (!entry.domainEffect) fail(errors, 'ACTION_WITHOUT_DOMAIN_EFFECT');
    if (!entry.feedback) fail(errors, 'EFFECT_WITHOUT_FEEDBACK');
  }
  if (!Array.isArray(item.events)) fail(errors, 'MISSING_EVENTS');
  if (!Array.isArray(item.downstream) || item.downstream.length === 0) fail(errors, 'MISSING_DOWNSTREAM');
  if (!item.automation?.failure || !item.automation?.audit || item.automation?.idempotent !== true) {
    fail(errors, 'AUTOMATION_WITHOUT_FAILURE_AUDIT');
  }
  if (item.integration?.facing === true && item.integration.successRequiresAck !== true) {
    fail(errors, 'SUCCESS_BEFORE_ACK');
  }
  if (item.integration?.vendorOverwritesCanon === true) fail(errors, 'VENDOR_OVERWRITES_CANON');
  for (const state of REQUIRED_STATES) {
    if (!(item.states || []).includes(state)) fail(errors, `MISSING_STATE_${state}`);
  }
  if (!(item.responsive || []).includes('desktop') || !(item.responsive || []).includes('mobile')) {
    fail(errors, 'MOBILE_WORKFLOW_MISSING');
  }
  if (!['REQUIRED', 'ACCEPTED'].includes(item.responsiveReview)) fail(errors, 'RESPONSIVE_REVIEW_MISSING');
  for (const need of ['keyboard', 'focus', 'contrast', 'labels', 'screen-reader']) {
    if (!(item.accessibility || []).includes(need)) fail(errors, 'ACCESSIBILITY_MISSING');
  }
  if (['MOBILE', 'ANDROID', 'IOS'].includes(item.surface) && !(item.states || []).includes('offline')) {
    fail(errors, 'MOBILE_OFFLINE_MISSING');
  }
  if (item.visualSource === 'VISUAL_SOURCE_MISSING') {
    if (item.visualAcceptance === 'ACCEPTED') fail(errors, 'MISSING_REFERENCE_ACCEPTED');
    if (item.newDirectionReview !== 'REVIEW') fail(errors, 'MISSING_DIRECTION_REVIEW');
  } else if (typeof item.visualReference !== 'string' || !exists(path.join(root, item.visualReference))) {
    fail(errors, 'VISUAL_REFERENCE_MISSING');
  }
  if (item.materialDeviation === true) {
    const deviation = item.deviation;
    if (!deviation?.what || !deviation?.why || !deviation?.requirement || !deviation?.benefit || !deviation?.visualImpact) {
      fail(errors, 'UNJUSTIFIED_DEVIATION');
    }
  }
  if (item.visualAcceptance === 'ACCEPTED' && !item.reviewRecord) fail(errors, 'MISSING_VISUAL_REVIEW');
  if (item.semanticReview === 'ACCEPTED' && !item.reviewRecord) fail(errors, 'MISSING_SEMANTIC_REVIEW');
  if (item.browserEvidence === 'OPERATIONAL' && !item.screenshotArtifact) fail(errors, 'FALSE_BROWSER_EVIDENCE');
  if (item.sourceOfTruth === 'client') fail(errors, 'CLIENT_BUSINESS_TRUTH');
  if (!LEARNING_IDS.has(item.learningCapability)) fail(errors, 'MISSING_LEARNING_PATH');
  return errors;
}

export function checkExperienceContracts(options = {}) {
  const catalog = options.catalog || EXPERIENCE_CONTRACTS;
  const scope = options.productScope || loadProductScope();
  const journeys = options.journeys || JOURNEYS;
  const errors = [];
  const ids = new Set();
  for (const item of catalog) {
    if (ids.has(item.id)) fail(errors, `DUPLICATE:${item.id}`);
    ids.add(item.id);
    for (const code of contractErrors(item, options)) fail(errors, `${item.id}:${code}`);
  }
  for (const capability of scope) {
    if (capability.normative === false) continue;
    if (!ids.has(capability.id)) fail(errors, `MISSING_CONTRACT:${capability.id}`);
  }
  for (const journey of journeys) {
    for (const [fromId, toId] of journey.edges || []) {
      if (!edgeExists(catalog, fromId, toId)) fail(errors, `MISSING_EDGE:${fromId}:${toId}`);
    }
  }
  const screens = catalog.filter((item) => item.screenId);
  const workflows = new Set((options.workflows || WORKFLOWS).map((item) => item.id));
  for (const screen of screens) {
    if (!workflows.has(screen.workflowId)) fail(errors, `ORPHAN_SCREEN:${screen.screenId}`);
  }
  for (const workflow of (options.workflows || WORKFLOWS)) {
    if (workflow.surfaceRequired !== true) continue;
    const covered = catalog.some((item) => item.workflowId === workflow.id && item.screenId);
    if (!covered) fail(errors, `ORPHAN_WORKFLOW:${workflow.id}`);
  }
  return {
    ok: errors.length === 0,
    errors,
    summary: summarize(catalog, errors),
  };
}

function summarize(catalog, errors) {
  const facing = catalog.filter((item) => item.userFacing !== false && item.backendOnly !== true);
  return {
    contracts: catalog.length,
    userFacing: facing.length,
    orphanScreens: errors.filter((error) => error.startsWith('ORPHAN_SCREEN')).length,
    orphanWorkflows: errors.filter((error) => error.includes('ORPHAN_WORKFLOW') || error.includes('MISSING_DOWNSTREAM')).length,
    actionsWithoutEffect: errors.filter((error) => error.includes('ACTION_WITHOUT_DOMAIN_EFFECT')).length,
    missingEdges: errors.filter((error) => error.startsWith('MISSING_EDGE')).length,
    unjustifiedDeviations: errors.filter((error) => error.includes('UNJUSTIFIED_DEVIATION')).length,
    decorative: errors.filter((error) => error.includes('DECORATIVE_OR_SLOP') || error.includes('MISSING_BUSINESS_PURPOSE')).length,
    visualSourceMissing: catalog.filter((item) => item.visualSource === 'VISUAL_SOURCE_MISSING').map((item) => item.id),
    browserEvidence: 'WAITING_FOR_RUNTIME',
    visualAcceptanceEnforced: catalog.every((item) => item.visualAcceptance !== 'ACCEPTED' || item.reviewRecord),
    semanticReviewEnforced: catalog.every((item) => item.semanticReview !== 'ACCEPTED' || item.reviewRecord),
    safeGaps: errors.length,
  };
}

export function integrationDisplayedEarly(state = {}) {
  if (state.acknowledged === true) return { ok: true };
  if (state.displayed === 'completed' || state.displayed === 'success') {
    return { ok: false, reason: 'SUCCESS_BEFORE_ACK' };
  }
  return { ok: true, reason: 'pending' };
}

export function propagateIntegrationFailure() {
  return {
    canonicalUnchanged: true,
    uiStatus: 'pending-error',
    retry: true,
    audit: true,
    downstreamClaimsSuccess: false,
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const report = checkExperienceContracts();
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}
