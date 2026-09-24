/**
 * Future-product boundary contracts. No runtime apps, twins, plugins, or
 * live third-party credentials are authorized here.
 */

export type OrderingStage = 'DATA' | 'RULES' | 'DOMAIN' | 'AI';

export function siteIntelligenceOrdering(): readonly OrderingStage[] {
  return ['DATA', 'RULES', 'DOMAIN', 'AI'] as const;
}

export function assertSiteIntelligenceOrdering(stages: readonly string[]): void {
  const expected = siteIntelligenceOrdering();
  if (stages.length !== expected.length) throw new Error('SITEINTEL_ORDER_INVALID');
  for (let i = 0; i < expected.length; i += 1) {
    if (stages[i] !== expected[i]) throw new Error('SITEINTEL_ORDER_INVALID');
  }
}

export function assertNoSiteIntelTwinDatabase(flags: { twinDatabase?: boolean; liveThirdPartyInCriticalUx?: boolean }): void {
  if (flags.twinDatabase) throw new Error('SITEINTEL_TWIN_FORBIDDEN');
  if (flags.liveThirdPartyInCriticalUx) throw new Error('SITEINTEL_LIVE_THIRD_PARTY_FORBIDDEN');
}

/** Normalized observation only. Raw live third-party payloads are not rules input. */
export type NormalizedSiteObservation = {
  observationId: string;
  kind: string;
  normalized: true;
  source: 'normalized';
  synthetic: true;
};

/** Deterministic RULES codes from normalized observation kinds. Not AI conclusions. */
const KIND_TO_FINDING: Readonly<Record<string, { constraint?: string; opportunity?: string }>> = {
  slope: { constraint: 'slope-constraint' },
  topography: { constraint: 'topography-constraint' },
  soil: { constraint: 'soil-constraint' },
  sun: { opportunity: 'sun-exposure' },
  aspect: { opportunity: 'aspect-opportunity' },
  surroundings: { opportunity: 'surroundings-context' },
  climate: { opportunity: 'climate-context' },
};

export type SiteIntelligenceCodedFinding = {
  code: string;
  observationIds: string[];
  /** Normalized observation kind that produced this code. */
  kind: string;
};

export type SiteIntelligenceRulesBoundary = {
  requirementId: 'FZ-REQ-SITEINTEL-002';
  stage: 'RULES';
  consumes: 'normalized-observations';
  aiInventForbidden: true;
  thirdPartyCredentials: false;
};

export type SiteIntelligenceRulesResult = {
  stage: 'RULES';
  observationIds: string[];
  /** observationId → normalized kind used when the RULES result was produced. */
  observationKinds: Readonly<Record<string, string>>;
  constraints: SiteIntelligenceCodedFinding[];
  opportunities: SiteIntelligenceCodedFinding[];
  inventedFacts: never[];
};

export function siteIntelligenceConstraintCodes(): ReadonlySet<string> {
  const codes = new Set<string>();
  for (const finding of Object.values(KIND_TO_FINDING)) {
    if (finding.constraint) codes.add(finding.constraint);
  }
  return codes;
}

export function siteIntelligenceOpportunityCodes(): ReadonlySet<string> {
  const codes = new Set<string>();
  for (const finding of Object.values(KIND_TO_FINDING)) {
    if (finding.opportunity) codes.add(finding.opportunity);
  }
  return codes;
}

export function siteIntelligenceFindingCodes(): ReadonlySet<string> {
  return new Set([...siteIntelligenceConstraintCodes(), ...siteIntelligenceOpportunityCodes()]);
}

/** Reverse map: finding code → the normalized observation kind that may emit it. */
export function siteIntelligenceKindForCode(code: string): string | null {
  for (const [kind, finding] of Object.entries(KIND_TO_FINDING)) {
    if (finding.constraint === code || finding.opportunity === code) return kind;
  }
  return null;
}

export function siteIntelligenceRulesBoundary(): SiteIntelligenceRulesBoundary {
  return {
    requirementId: 'FZ-REQ-SITEINTEL-002',
    stage: 'RULES',
    consumes: 'normalized-observations',
    aiInventForbidden: true,
    thirdPartyCredentials: false,
  };
}

export function assertAiCannotInventSiteFacts(claim: {
  inventedSiteFacts?: boolean;
  aheadOfRules?: boolean;
}): void {
  if (claim.inventedSiteFacts || claim.aheadOfRules) {
    throw new Error('SITEINTEL_AI_INVENT_FORBIDDEN');
  }
}

export function applySiteIntelligenceRules(
  observations: readonly NormalizedSiteObservation[],
  proposal: {
    inventedSiteFacts?: boolean;
    rawThirdPartyPayload?: boolean;
    thirdPartyCredentials?: boolean;
  } = {},
): SiteIntelligenceRulesResult {
  if (proposal.thirdPartyCredentials) throw new Error('SITEINTEL_CREDENTIALS_FORBIDDEN');
  if (proposal.rawThirdPartyPayload) throw new Error('SITEINTEL_RAW_THIRD_PARTY_FORBIDDEN');
  assertAiCannotInventSiteFacts(proposal);
  if (!Array.isArray(observations) || observations.length === 0) {
    throw new Error('SITEINTEL_OBSERVATIONS_REQUIRED');
  }
  const constraintsByCode = new Map<string, { observationIds: string[]; kind: string }>();
  const opportunitiesByCode = new Map<string, { observationIds: string[]; kind: string }>();
  const observationIds: string[] = [];
  const observationKinds: Record<string, string> = {};
  const seenIds = new Set<string>();
  for (const item of observations) {
    if (!item || item.normalized !== true || item.source !== 'normalized') {
      throw new Error('SITEINTEL_OBSERVATION_NOT_NORMALIZED');
    }
    if (typeof item.observationId !== 'string' || item.observationId.length < 8) {
      throw new Error('SITEINTEL_OBSERVATION_ID_INVALID');
    }
    if (seenIds.has(item.observationId)) {
      throw new Error('SITEINTEL_OBSERVATION_ID_DUPLICATE');
    }
    if (typeof item.kind !== 'string' || item.kind.trim().length === 0) {
      throw new Error('SITEINTEL_OBSERVATION_KIND_INVALID');
    }
    const kind = item.kind.trim().toLowerCase();
    if (!Object.hasOwn(KIND_TO_FINDING, kind)) {
      throw new Error('SITEINTEL_OBSERVATION_KIND_UNKNOWN');
    }
    const finding = KIND_TO_FINDING[kind];
    seenIds.add(item.observationId);
    observationIds.push(item.observationId);
    observationKinds[item.observationId] = kind;
    if (finding?.constraint) {
      const entry = constraintsByCode.get(finding.constraint) ?? { observationIds: [] as string[], kind };
      if (entry.kind !== kind) throw new Error('SITEINTEL_FINDING_KIND_CONFLICT');
      entry.observationIds.push(item.observationId);
      constraintsByCode.set(finding.constraint, entry);
    }
    if (finding?.opportunity) {
      const entry = opportunitiesByCode.get(finding.opportunity) ?? { observationIds: [] as string[], kind };
      if (entry.kind !== kind) throw new Error('SITEINTEL_FINDING_KIND_CONFLICT');
      entry.observationIds.push(item.observationId);
      opportunitiesByCode.set(finding.opportunity, entry);
    }
  }
  return {
    stage: 'RULES',
    observationIds,
    observationKinds,
    constraints: [...constraintsByCode.entries()].map(([code, entry]) => ({
      code,
      observationIds: entry.observationIds,
      kind: entry.kind,
    })),
    opportunities: [...opportunitiesByCode.entries()].map(([code, entry]) => ({
      code,
      observationIds: entry.observationIds,
      kind: entry.kind,
    })),
    inventedFacts: [],
  };
}

export function gardenOsRelationBoundary(): {
  requirementId: 'FZ-REQ-GARDENOS-001';
  relationOnly: true;
  twinRuntime: false;
  twinDatabase: false;
} {
  return {
    requirementId: 'FZ-REQ-GARDENOS-001',
    relationOnly: true,
    twinRuntime: false,
    twinDatabase: false,
  };
}

export function assertGardenOsNotTwin(claim: { twinDatabase?: boolean; liveTwinUi?: boolean }): void {
  if (claim.twinDatabase || claim.liveTwinUi) throw new Error('GARDENOS_TWIN_FORBIDDEN');
}

export function mobileClientBoundary(): {
  requirementId: 'FZ-REQ-MOBILE-001';
  businessTruth: 'core-api';
  separateMobileDomain: false;
  shipsApps: false;
} {
  return {
    requirementId: 'FZ-REQ-MOBILE-001',
    businessTruth: 'core-api',
    separateMobileDomain: false,
    shipsApps: false,
  };
}

export function assertMobileUsesCoreApiOnly(path: { separateDomain?: boolean; secondAuthz?: boolean }): void {
  if (path.separateDomain) throw new Error('MOBILE_SEPARATE_DOMAIN_FORBIDDEN');
  if (path.secondAuthz) throw new Error('MOBILE_SECOND_AUTHZ_FORBIDDEN');
}

export function sketchUpAdapterBoundary(): {
  requirementId: 'FZ-REQ-SKETCHUP-001';
  businessTruth: 'core-api';
  pluginRuntime: false;
  localBusinessAcl: false;
} {
  return {
    requirementId: 'FZ-REQ-SKETCHUP-001',
    businessTruth: 'core-api',
    pluginRuntime: false,
    localBusinessAcl: false,
  };
}

export function assertSketchUpNotBusinessTruth(claim: { pluginOwnsIds?: boolean; localAcl?: boolean }): void {
  if (claim.pluginOwnsIds) throw new Error('SKETCHUP_BUSINESS_TRUTH_FORBIDDEN');
  if (claim.localAcl) throw new Error('SKETCHUP_LOCAL_ACL_FORBIDDEN');
}

const SKETCHUP_OPAQUE = /^[a-z][a-z0-9-]{7,63}$/;
const SKETCHUP_COMMERCIAL_KEYS = new Set([
  'price',
  'pricePln',
  'contractId',
  'customerId',
  'customerName',
  'offerId',
  'payment',
  'ownsPrice',
  'ownsContract',
  'ownsCustomer',
]);

export type SketchUpProjectMap = {
  requirementId: 'FZ-REQ-SKETCHUP-002';
  modelRef: string;
  projectId: string;
  ownsPrice: false;
  ownsContract: false;
  ownsCustomer: false;
  localBusinessAcl: false;
  synthetic: true;
};

export function sketchUpProjectMapBoundary(): {
  requirementId: 'FZ-REQ-SKETCHUP-002';
  businessTruth: 'core-api';
  mappingOwnsCommercialTruth: false;
  localBusinessAcl: false;
} {
  return {
    requirementId: 'FZ-REQ-SKETCHUP-002',
    businessTruth: 'core-api',
    mappingOwnsCommercialTruth: false,
    localBusinessAcl: false,
  };
}

export function mapSketchUpModelToProject(
  modelRef: string,
  projectId: string,
  extras: Record<string, unknown> = {},
): SketchUpProjectMap {
  if (typeof modelRef !== 'string' || !SKETCHUP_OPAQUE.test(modelRef) || /^(?:model|skp|id)\d+$/i.test(modelRef)) {
    throw new Error('SKETCHUP_MODEL_REF_INVALID');
  }
  if (typeof projectId !== 'string' || !SKETCHUP_OPAQUE.test(projectId) || /^(?:project|proj|id)\d+$/i.test(projectId)) {
    throw new Error('SKETCHUP_PROJECT_ID_INVALID');
  }
  for (const key of Object.keys(extras)) {
    if (SKETCHUP_COMMERCIAL_KEYS.has(key)) throw new Error('SKETCHUP_COMMERCIAL_TRUTH_FORBIDDEN');
    if (key === 'localAcl' || key === 'localBusinessAcl') throw new Error('SKETCHUP_LOCAL_ACL_FORBIDDEN');
  }
  assertSketchUpNotBusinessTruth({
    pluginOwnsIds: extras.pluginOwnsIds === true,
    localAcl: extras.localAcl === true || extras.localBusinessAcl === true,
  });
  return {
    requirementId: 'FZ-REQ-SKETCHUP-002',
    modelRef,
    projectId,
    ownsPrice: false,
    ownsContract: false,
    ownsCustomer: false,
    localBusinessAcl: false,
    synthetic: true,
  };
}
