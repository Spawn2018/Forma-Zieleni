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
  constraints: string[];
  opportunities: string[];
  inventedFacts: never[];
};

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
  for (const item of observations) {
    if (!item || item.normalized !== true || item.source !== 'normalized') {
      throw new Error('SITEINTEL_OBSERVATION_NOT_NORMALIZED');
    }
    if (typeof item.observationId !== 'string' || item.observationId.length < 8) {
      throw new Error('SITEINTEL_OBSERVATION_ID_INVALID');
    }
    if (typeof item.kind !== 'string' || item.kind.trim().length === 0) {
      throw new Error('SITEINTEL_OBSERVATION_KIND_INVALID');
    }
  }
  return {
    stage: 'RULES',
    observationIds: observations.map((item) => item.observationId),
    constraints: observations.map((item) => `constraint:${item.kind}`),
    opportunities: observations.map((item) => `opportunity:${item.kind}`),
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
