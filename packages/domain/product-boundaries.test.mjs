import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertGardenOsNotTwin,
  assertMobileUsesCoreApiOnly,
  assertSiteIntelligenceOrdering,
  assertNoSiteIntelTwinDatabase,
  assertSketchUpNotBusinessTruth,
  gardenOsRelationBoundary,
  mobileClientBoundary,
  siteIntelligenceOrdering,
  sketchUpAdapterBoundary,
} from './src/product-boundaries.ts';

test('Site Intelligence ordering is DATA then RULES then DOMAIN then AI', () => {
  assert.deepEqual(siteIntelligenceOrdering(), ['DATA', 'RULES', 'DOMAIN', 'AI']);
  assert.doesNotThrow(() => assertSiteIntelligenceOrdering(['DATA', 'RULES', 'DOMAIN', 'AI']));
  assert.throws(() => assertSiteIntelligenceOrdering(['AI', 'DATA', 'RULES', 'DOMAIN']), /SITEINTEL_ORDER_INVALID/);
  assert.throws(() => assertNoSiteIntelTwinDatabase({ twinDatabase: true }), /SITEINTEL_TWIN_FORBIDDEN/);
  assert.throws(() => assertNoSiteIntelTwinDatabase({ liveThirdPartyInCriticalUx: true }), /SITEINTEL_LIVE_THIRD_PARTY_FORBIDDEN/);
});

test('Garden OS is a client relation boundary without twin runtime', () => {
  const boundary = gardenOsRelationBoundary();
  assert.equal(boundary.requirementId, 'FZ-REQ-GARDENOS-001');
  assert.equal(boundary.relationOnly, true);
  assert.equal(boundary.twinRuntime, false);
  assert.equal(boundary.twinDatabase, false);
  assert.throws(() => assertGardenOsNotTwin({ liveTwinUi: true }), /GARDENOS_TWIN_FORBIDDEN/);
});

test('Mobile clients keep Core API as business truth and do not ship apps here', () => {
  const boundary = mobileClientBoundary();
  assert.equal(boundary.businessTruth, 'core-api');
  assert.equal(boundary.separateMobileDomain, false);
  assert.equal(boundary.shipsApps, false);
  assert.throws(() => assertMobileUsesCoreApiOnly({ separateDomain: true }), /MOBILE_SEPARATE_DOMAIN_FORBIDDEN/);
  assert.throws(() => assertMobileUsesCoreApiOnly({ secondAuthz: true }), /MOBILE_SECOND_AUTHZ_FORBIDDEN/);
});

test('SketchUp adapter is not business truth and forbids local ACL', () => {
  const boundary = sketchUpAdapterBoundary();
  assert.equal(boundary.businessTruth, 'core-api');
  assert.equal(boundary.pluginRuntime, false);
  assert.equal(boundary.localBusinessAcl, false);
  assert.throws(() => assertSketchUpNotBusinessTruth({ pluginOwnsIds: true }), /SKETCHUP_BUSINESS_TRUTH_FORBIDDEN/);
  assert.throws(() => assertSketchUpNotBusinessTruth({ localAcl: true }), /SKETCHUP_LOCAL_ACL_FORBIDDEN/);
});
