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
