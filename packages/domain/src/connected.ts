const ID = /^[a-z][a-z0-9]{15,63}$/;

export const PROJECT_CLASSES = ['REAL_PROJECT', 'CONCEPT_PROJECT', 'ILLUSTRATIVE_PROJECT'] as const;
export type ProjectClass = (typeof PROJECT_CLASSES)[number];

export const VISIBILITIES = ['PUBLIC', 'INTERNAL', 'PRIVATE_CUSTOMER'] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const VALUE_CLASSES = [
  'AUTHORITATIVE',
  'DERIVED',
  'PROPOSED',
  'INFERRED',
  'USER_EDITED',
  'EXTERNAL_OBSERVED',
] as const;
export type ValueClass = (typeof VALUE_CLASSES)[number];

export const AGNIESZKA_CAPABILITIES = [
  'semantic:review',
  'design:review',
  'content:review',
  'marketing:review',
] as const;

const BLOCKED_FOR_AGNIESZKA = new Set([
  'owner-decision',
  'owner-only',
  'dangerous',
  'spend',
  'publish-live',
  'price-change',
  'legal-term',
  'security-gate',
  'privacy-gate',
]);

export const FIELD_OWNERS: Record<string, string> = {
  scientificName: 'plant-atlas',
  projectClass: 'project',
  title: 'project',
  body: 'cms',
  price: 'core-api',
  commercialTerms: 'core-api',
  checksum: 'media',
  marketingPlan: 'growth-os',
  searchMetric: 'search',
};

const SEMANTIC_FIELDS = new Set(['body', 'summary', 'narrative', 'prose', 'caption']);
const PRIVATE_FIELDS = new Set(['address', 'customerName', 'price', 'quote', 'phone', 'email']);

const INVERSE: Record<string, string> = {
  usesPlant: 'featuredInProject',
  referencesPlant: 'referencedByArticle',
  referencesProject: 'referencedByArticle',
  demonstratesStyle: 'demonstratedByProject',
  supportsService: 'demonstratedByProjectService',
  depictsProject: 'depictedByMedia',
  depictsPlant: 'depictedByMedia',
  representsProject: 'representedByPortfolio',
  usesArticle: 'usedByCampaign',
  targetsCep: 'targetedByCampaign',
  testsAsset: 'testedByExperiment',
  derivedFromExperiment: 'informedLearning',
};

export type Provenance = {
  origin: string;
  sourceId: string;
  sourceVersion: number;
  generatedBy: 'human' | 'system' | 'external';
  generatedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  humanLocked: boolean;
  confidence: 'low' | 'medium' | 'high' | null;
};

export type FieldValue = {
  value: string;
  valueClass: ValueClass;
  provenance: Provenance;
  humanLocked: boolean;
};

export type Entity = {
  id: string;
  type: string;
  ownerDomain: string;
  visibility: Visibility;
  customerId: string | null;
  version: number;
  projectClass: ProjectClass | null;
  synthetic: boolean;
  fields: Record<string, FieldValue>;
  rightsPublic: boolean;
};

export type Relation = {
  id: string;
  type: string;
  fromId: string;
  toId: string;
};

export type Change = {
  id: string;
  entityId: string;
  field: string;
  before: string;
  after: string;
  deterministic: boolean;
  sourceVersion: number;
};

export type ChangeStatus =
  | 'PROPOSED'
  | 'EDITED'
  | 'APPROVED'
  | 'PARTIAL'
  | 'REJECTED'
  | 'DEFERRED'
  | 'APPLIED'
  | 'STALE'
  | 'CONFLICT';

export type ChangeSet = {
  id: string;
  status: ChangeStatus;
  trigger: string;
  reason: string;
  evidence: string;
  confidence: 'low' | 'medium' | 'high';
  changes: Change[];
  selectedIds: string[];
  reviewer: string | null;
  synthetic: true;
};

export type OutboxEvent = {
  eventId: string;
  correlationId: string;
  causationId: string;
  entityId: string;
  entityVersion: number;
  eventType: string;
};

export type LearningSignal = {
  patternKey: string;
  source: 'ux';
  scope: string;
  summary: string;
  generalizability: 'ONE-OFF' | 'LOCAL' | 'RECURRING';
  canonWrite: false;
  removesHumanReview: false;
};

export type Fabric = {
  entities: Map<string, Entity>;
  relations: Relation[];
  changeSets: ChangeSet[];
  outbox: OutboxEvent[];
  delivered: Set<string>;
  causationSeen: Set<string>;
  signals: LearningSignal[];
};

export type Reader = {
  customerId: string | null;
  staff: boolean;
};

const SURFACES = [
  'WWW', 'CMS', 'Portal', 'Admin', 'Mobile', 'Search', 'Plant Atlas', 'Portfolio',
  'Articles', 'Projects', 'Campaigns', 'Garden OS', 'Site Intelligence', 'SketchUp',
] as const;

export function createFabric(): Fabric {
  return {
    entities: new Map(),
    relations: [],
    changeSets: [],
    outbox: [],
    delivered: new Set(),
    causationSeen: new Set(),
    signals: [],
  };
}

export function assertId(value: string): string {
  if (!ID.test(value)) throw new Error('ID_INVALID');
  return value;
}

export function agnieszkaCapabilities(): readonly string[] {
  return AGNIESZKA_CAPABILITIES;
}

export function assertAgnieszkaCannotOverride(action: string): void {
  if (BLOCKED_FOR_AGNIESZKA.has(action)) throw new Error('AGNIESZKA_CANNOT_OVERRIDE');
}

export function fieldOwner(field: string): string {
  return FIELD_OWNERS[field] ?? 'unassigned';
}

export function assertProjectionCannotOwn(ownerDomain: string): void {
  if (ownerDomain === 'projection') throw new Error('PROJECTION_CANNOT_OWN');
}

export function putEntity(store: Fabric, input: {
  id: string;
  type: string;
  ownerDomain: string;
  visibility: Visibility;
  customerId?: string | null;
  projectClass?: ProjectClass | null;
  synthetic: boolean;
  rightsPublic?: boolean;
  fields?: Record<string, { value: string; valueClass: ValueClass; by: Provenance['generatedBy']; at: string }>;
}): Entity {
  assertId(input.id);
  if (input.ownerDomain === 'projection') throw new Error('PROJECTION_CANNOT_OWN');
  if (input.projectClass && !PROJECT_CLASSES.includes(input.projectClass)) throw new Error('PROJECT_CLASS_INVALID');
  if (input.visibility === 'PRIVATE_CUSTOMER' && !input.customerId) throw new Error('CUSTOMER_SCOPE_REQUIRED');
  const fields: Record<string, FieldValue> = {};
  for (const [name, field] of Object.entries(input.fields ?? {})) {
    if (PRIVATE_FIELDS.has(name) && input.visibility === 'PUBLIC') throw new Error('PRIVATE_FIELD_PUBLIC');
    fields[name] = {
      value: field.value,
      valueClass: field.valueClass,
      humanLocked: false,
      provenance: {
        origin: input.ownerDomain,
        sourceId: input.id,
        sourceVersion: 1,
        generatedBy: field.by,
        generatedAt: field.at,
        approvedBy: field.by === 'human' ? 'human' : null,
        approvedAt: field.by === 'human' ? field.at : null,
        humanLocked: false,
        confidence: null,
      },
    };
  }
  const entity: Entity = {
    id: input.id,
    type: input.type,
    ownerDomain: input.ownerDomain,
    visibility: input.visibility,
    customerId: input.customerId ?? null,
    version: 1,
    projectClass: input.projectClass ?? null,
    synthetic: input.synthetic,
    fields,
    rightsPublic: input.rightsPublic ?? input.visibility === 'PUBLIC',
  };
  store.entities.set(entity.id, entity);
  return entity;
}

export function lockField(store: Fabric, entityId: string, field: string): void {
  const entity = mustEntity(store, entityId);
  const current = entity.fields[field];
  if (!current) throw new Error('FIELD_ABSENT');
  current.humanLocked = true;
  current.provenance.humanLocked = true;
  if (current.valueClass === 'AUTHORITATIVE' || current.valueClass === 'USER_EDITED') {
    current.valueClass = 'USER_EDITED';
  }
}

export function writeField(store: Fabric, input: {
  entityId: string;
  field: string;
  value: string;
  by: 'human' | 'ai' | 'system';
  valueClass: ValueClass;
  at: string;
}): void {
  const entity = mustEntity(store, input.entityId);
  const current = entity.fields[input.field];
  if (current?.humanLocked && input.by === 'ai') throw new Error('HUMAN_LOCK');
  if (PRIVATE_FIELDS.has(input.field) && entity.visibility === 'PUBLIC') throw new Error('PRIVATE_FIELD_PUBLIC');
  const next: FieldValue = {
    value: input.value,
    valueClass: input.by === 'human' ? 'USER_EDITED' : input.valueClass,
    humanLocked: current?.humanLocked ?? input.by === 'human',
    provenance: {
      origin: fieldOwner(input.field),
      sourceId: entity.id,
      sourceVersion: entity.version + 1,
      generatedBy: input.by === 'ai' ? 'system' : input.by,
      generatedAt: input.at,
      approvedBy: input.by === 'human' ? 'human' : null,
      approvedAt: input.by === 'human' ? input.at : null,
      humanLocked: current?.humanLocked ?? input.by === 'human',
      confidence: null,
    },
  };
  entity.fields[input.field] = next;
  entity.version += 1;
}

export function relate(store: Fabric, input: { id: string; type: string; fromId: string; toId: string }): Relation {
  assertId(input.id);
  if (!INVERSE[input.type]) throw new Error('RELATION_UNKNOWN');
  mustEntity(store, input.fromId);
  mustEntity(store, input.toId);
  if (store.relations.some(item => item.type === input.type && item.fromId === input.fromId && item.toId === input.toId)) {
    throw new Error('RELATION_DUPLICATE');
  }
  const relation = { id: input.id, type: input.type, fromId: input.fromId, toId: input.toId };
  store.relations.push(relation);
  return relation;
}

export function inverseType(type: string): string {
  const direct = INVERSE[type];
  if (direct) return direct;
  const back = Object.entries(INVERSE).find(([, value]) => value === type);
  if (!back) throw new Error('RELATION_UNKNOWN');
  return back[0];
}

export function related(store: Fabric, entityId: string, asType: string): Entity[] {
  const rows: Entity[] = [];
  for (const relation of store.relations) {
    if (relation.type === asType && relation.fromId === entityId) rows.push(mustEntity(store, relation.toId));
    if (inverseType(relation.type) === asType && relation.toId === entityId) rows.push(mustEntity(store, relation.fromId));
  }
  return rows;
}

export function canSee(reader: Reader, entity: Entity): boolean {
  if (entity.visibility === 'PUBLIC') return true;
  if (reader.staff && entity.visibility !== 'PRIVATE_CUSTOMER') return true;
  if (reader.staff && reader.customerId === null && entity.visibility === 'PRIVATE_CUSTOMER') return false;
  return reader.customerId !== null && reader.customerId === entity.customerId;
}

export function visibleNeighbors(store: Fabric, reader: Reader, entityId: string): string[] {
  if (!canSee(reader, mustEntity(store, entityId))) return [];
  const ids: string[] = [];
  for (const relation of store.relations) {
    const otherId = relation.fromId === entityId ? relation.toId : relation.toId === entityId ? relation.fromId : null;
    if (!otherId) continue;
    const other = mustEntity(store, otherId);
    if (canSee(reader, other)) ids.push(otherId);
  }
  return ids;
}

export function publicEntityView(entity: Entity): Record<string, string | boolean | null> | null {
  if (entity.visibility !== 'PUBLIC' || !entity.rightsPublic) return null;
  const fields: Record<string, string | boolean | null> = {
    id: entity.id,
    type: entity.type,
    realization: entity.projectClass === 'REAL_PROJECT',
    projectClass: entity.projectClass,
  };
  for (const [name, field] of Object.entries(entity.fields)) {
    if (PRIVATE_FIELDS.has(name)) continue;
    if (field.valueClass === 'INFERRED' || field.valueClass === 'PROPOSED') continue;
    fields[name] = field.value;
  }
  if (entity.projectClass && entity.projectClass !== 'REAL_PROJECT') fields.realization = false;
  return fields;
}

export function propose(store: Fabric, input: {
  id: string;
  trigger: string;
  reason: string;
  evidence: string;
  confidence: 'low' | 'medium' | 'high';
  changes: Array<Omit<Change, 'deterministic'>>;
}): ChangeSet {
  assertId(input.id);
  const changes: Change[] = input.changes.map(change => {
    const entity = mustEntity(store, change.entityId);
    const current = entity.fields[change.field];
    return {
      ...change,
      before: current?.value ?? change.before,
      deterministic: !SEMANTIC_FIELDS.has(change.field),
      sourceVersion: entity.version,
    };
  });
  let status: ChangeStatus = 'PROPOSED';
  for (const change of changes) {
    const open = store.changeSets.find(set =>
      set.status === 'PROPOSED' && set.changes.some(item => item.entityId === change.entityId && item.field === change.field),
    );
    if (open) status = 'CONFLICT';
  }
  const changeSet: ChangeSet = {
    id: input.id,
    status,
    trigger: input.trigger,
    reason: input.reason,
    evidence: input.evidence,
    confidence: input.confidence,
    changes,
    selectedIds: [],
    reviewer: null,
    synthetic: true,
  };
  store.changeSets.push(changeSet);
  return changeSet;
}

export function review(store: Fabric, input: {
  changeSetId: string;
  action: 'EDIT' | 'APPROVE_ALL' | 'APPROVE_SELECTED' | 'PARTIAL_APPROVE' | 'REJECT' | 'DEFER';
  reviewer: string;
  selectedIds?: string[];
  edits?: Array<{ changeId: string; after: string }>;
}): ChangeSet {
  const changeSet = mustSet(store, input.changeSetId);
  if (changeSet.status === 'APPLIED' || changeSet.status === 'REJECTED') throw new Error('REVIEW_CLOSED');
  changeSet.reviewer = input.reviewer;
  if (input.action === 'EDIT') {
    for (const edit of input.edits ?? []) {
      const change = changeSet.changes.find(item => item.id === edit.changeId);
      if (!change) throw new Error('CHANGE_ABSENT');
      change.after = edit.after;
    }
    changeSet.status = 'EDITED';
    return changeSet;
  }
  if (input.action === 'REJECT') {
    changeSet.status = 'REJECTED';
    return changeSet;
  }
  if (input.action === 'DEFER') {
    changeSet.status = 'DEFERRED';
    return changeSet;
  }
  const selected = input.action === 'APPROVE_ALL'
    ? changeSet.changes.map(change => change.id)
    : input.selectedIds ?? [];
  if (selected.length === 0) throw new Error('SELECTION_EMPTY');
  changeSet.selectedIds = selected;
  changeSet.status = input.action === 'APPROVE_ALL' ? 'APPROVED' : 'PARTIAL';
  return changeSet;
}

export function impactOf(store: Fabric, changeSetId: string): { entities: string[]; surfaces: string[] } {
  const changeSet = mustSet(store, changeSetId);
  const entities = new Set<string>();
  for (const change of changeSet.changes) {
    entities.add(change.entityId);
    for (const relation of store.relations) {
      if (relation.fromId === change.entityId) entities.add(relation.toId);
      if (relation.toId === change.entityId) entities.add(relation.fromId);
    }
  }
  const surfaces = new Set<string>();
  for (const id of entities) {
    const entity = store.entities.get(id);
    if (!entity) continue;
    if (entity.visibility === 'PUBLIC') surfaces.add('WWW');
    if (entity.type === 'Article' || entity.type === 'Page') surfaces.add('CMS').add('Articles');
    if (entity.type === 'Plant' || entity.type === 'PlantAtlasEntry') surfaces.add('Plant Atlas');
    if (entity.type === 'PortfolioItem') surfaces.add('Portfolio');
    if (entity.projectClass) surfaces.add('Projects');
    if (entity.type === 'Campaign') surfaces.add('Campaigns');
  }
  return { entities: [...entities], surfaces: [...surfaces] };
}

export function applyApproved(store: Fabric, input: {
  changeSetId: string;
  at: string;
  causationId: string;
  eventId: string;
}): { applied: string[]; proposals: string[] } {
  const changeSet = mustSet(store, input.changeSetId);
  if (store.causationSeen.has(input.causationId)) return { applied: [], proposals: [] };
  if (changeSet.status !== 'APPROVED' && changeSet.status !== 'PARTIAL') throw new Error('NOT_APPROVED');
  const chosen = changeSet.changes.filter(change => changeSet.selectedIds.includes(change.id));
  for (const change of chosen) {
    const entity = mustEntity(store, change.entityId);
    if (entity.version !== change.sourceVersion) {
      changeSet.status = 'STALE';
      throw new Error('STALE');
    }
  }
  const applied: string[] = [];
  const proposals: string[] = [];
  let eventIndex = 0;
  for (const change of chosen) {
    const entity = mustEntity(store, change.entityId);
    if (!change.deterministic) {
      proposals.push(change.field);
      continue;
    }
    writeField(store, {
      entityId: change.entityId,
      field: change.field,
      value: change.after,
      by: 'human',
      valueClass: 'AUTHORITATIVE',
      at: input.at,
    });
    applied.push(change.field);
    eventIndex += 1;
    enqueue(store, {
      eventId: `${input.eventId}${eventIndex}`.slice(0, 48),
      correlationId: changeSet.id,
      causationId: input.causationId,
      entityId: entity.id,
      entityVersion: entity.version,
      eventType: 'fabric.field-updated',
    });
  }
  for (const change of chosen) {
    if (change.deterministic) continue;
    const entity = mustEntity(store, change.entityId);
    const followId = `follow${change.id}`.slice(0, 40);
    propose(store, {
      id: followId,
      trigger: 'semantic-propagation',
      reason: 'Semantic prose stays a proposal after a deterministic approval.',
      evidence: input.changeSetId,
      confidence: 'low',
      changes: [{
        id: `sem${change.id}`.slice(0, 40),
        entityId: change.entityId,
        field: change.field,
        before: entity.fields[change.field]?.value ?? '',
        after: change.after,
        sourceVersion: entity.version,
      }],
    });
  }
  store.causationSeen.add(input.causationId);
  changeSet.status = 'APPLIED';
  return { applied, proposals };
}

export function deliverOnce(store: Fabric, event: OutboxEvent, chain: readonly string[]): void {
  if (store.delivered.has(event.eventId)) return;
  if (chain.includes(event.entityId)) throw new Error('LOOP_GUARD');
  if (chain.length > 4) throw new Error('LOOP_GUARD');
  store.delivered.add(event.eventId);
}

export function writeCanonicalFromProjection(): void {
  throw new Error('PROJECTION_CANNOT_OWN');
}

export function ingestExternal(text: string): { valueClass: 'EXTERNAL_OBSERVED'; canonWrite: false; commands: []; data: string } {
  return { valueClass: 'EXTERNAL_OBSERVED', canonWrite: false, commands: [], data: text };
}

export function correctionSignal(input: { kind: string; repeated: boolean }): LearningSignal {
  const signal: LearningSignal = {
    patternKey: `agnieszka-${input.kind}-correction`.replace(/[^a-z0-9-]/g, '').slice(0, 40),
    source: 'ux',
    scope: 'semantic-review',
    summary: `Reviewer corrected ${input.kind}. Human review stays required.`,
    generalizability: input.repeated ? 'RECURRING' : 'ONE-OFF',
    canonWrite: false,
    removesHumanReview: false,
  };
  if (signal.patternKey.split('-').length < 2) throw new Error('PATTERN_INVALID');
  return signal;
}

export function recordSignal(store: Fabric, signal: LearningSignal): void {
  if (signal.canonWrite || signal.removesHumanReview) throw new Error('LEARNING_AUTHORITY');
  store.signals.push(signal);
}

export const CONNECTIVITY: Array<{ surface: string; state: string; reason: string }> = [
  ['WWW', 'PROJECTION', 'Published content is a projection of approved CMS and project facts.'],
  ['CMS', 'CONNECTED', 'Editorial owner for prose. Business truth stays in Core API.'],
  ['Core API', 'CONNECTED', 'Canonical business owner.'],
  ['Database', 'CONNECTED', 'PostgreSQL is the persistence truth. This module is the domain contract.'],
  ['Portal', 'PROJECTION', 'apps/portal is a React Router shell with session classification. Client offer projections remain later.'],
  ['Admin', 'FUTURE_DEPENDENCY', 'apps/admin is README only until ADMIN-APP ships a React Router application.'],
  ['Android', 'FUTURE_DEPENDENCY', 'No mobile app. Future clients use the Core API contract.'],
  ['iOS', 'FUTURE_DEPENDENCY', 'No mobile app. Future clients use the Core API contract.'],
  ['CRM', 'CONNECTED', 'Lead vertical exists. Offer linkage is a domain contract, not a second CRM.'],
  ['Offers', 'CONNECTED', 'Commercial fields are owned by core-api and locked against marketing writes.'],
  ['Contracts', 'LOCAL_BY_DESIGN', 'FZ-SIGN-1 owns lifecycle. Provider remains an Owner gate.'],
  ['Payments', 'LOCAL_BY_DESIGN', 'Provider is undecided. No payment truth is invented here.'],
  ['Articles', 'CONNECTED', 'Articles reference plants and projects. Prose is not a second fact owner.'],
  ['Pages', 'CONNECTED', 'Pages are CMS documents. Public pages read the published projection.'],
  ['Sections', 'PROJECTION', 'Sections render approved page fields.'],
  ['Services', 'CONNECTED', 'Services are business entities a project can support.'],
  ['Projects', 'CONNECTED', 'Project class and visibility are machine-checked.'],
  ['Real projects', 'CONNECTED', 'REAL_PROJECT is a distinct class and stays private until rights allow.'],
  ['Concept projects', 'CONNECTED', 'CONCEPT_PROJECT cannot be projected as a realization.'],
  ['Illustrative projects', 'CONNECTED', 'ILLUSTRATIVE_PROJECT cannot be projected as a realization.'],
  ['Visualizations', 'CONNECTED', 'A visualization relates to a project and cannot upgrade its class.'],
  ['Styles', 'CONNECTED', 'DesignStyle is an entity a project can demonstrate.'],
  ['Plants', 'CONNECTED', 'Plant facts are owned by the plant domain, not by articles.'],
  ['Plant Atlas', 'CONNECTED', 'Atlas entries relate to plants. Taxonomy is not horticultural advice.'],
  ['Plant palettes', 'CONNECTED', 'A palette relates to a concept brief and to plants.'],
  ['Materials', 'CONNECTED', 'Materials relate to a project when a fact is present. Absence is not a fact.'],
  ['Portfolio', 'DERIVED', 'Portfolio reads approved project relations. It does not store a second title owner.'],
  ['Media', 'CONNECTED', 'Media metadata stays in the media pipeline. Relations point at assets.'],
  ['Files', 'PRIVATE_OR_ISOLATED', 'Private business files stay off the public graph.'],
  ['Search', 'CONNECTED', 'Search measures. It does not write CRM or Canon.'],
  ['Marketing', 'CONNECTED', 'Growth OS plans are proposals. They do not authorize spend.'],
  ['Campaigns', 'CONNECTED', 'Campaigns target a CEP and reference articles without copying them.'],
  ['Content', 'CONNECTED', 'Content proposals stay unpublished until the CMS path approves them.'],
  ['Creative', 'CONNECTED', 'Creative briefs hang off a campaign work item.'],
  ['Product Experience', 'CONNECTED', 'Signals are privacy-filtered and are not conclusions.'],
  ['Site Intelligence', 'LOCAL_BY_DESIGN', 'DATA to RULES to DOMAIN to AI. No site-intelligence product runtime yet.'],
  ['Garden OS', 'FUTURE_DEPENDENCY', 'Relationship contract only. No digital-twin runtime.'],
  ['SketchUp', 'FUTURE_DEPENDENCY', 'SketchUp is not business truth. No plugin runtime.'],
  ['Integrations', 'CONNECTED', 'Registry records capability and forbids live mutation.'],
].map(([surface, state, reason]) => ({ surface, state, reason }));

export function unexplainedOrphans(): number {
  return CONNECTIVITY.filter(item => !item.state || !item.reason).length;
}

function mustEntity(store: Fabric, id: string): Entity {
  const entity = store.entities.get(id);
  if (!entity) throw new Error('ENTITY_ABSENT');
  return entity;
}

function mustSet(store: Fabric, id: string): ChangeSet {
  const changeSet = store.changeSets.find(item => item.id === id);
  if (!changeSet) throw new Error('CHANGESET_ABSENT');
  return changeSet;
}

function enqueue(store: Fabric, event: OutboxEvent): void {
  if (store.outbox.some(item => item.eventId === event.eventId)) return;
  store.outbox.push(event);
}

export function surfaceCatalog(): readonly string[] {
  return SURFACES;
}
