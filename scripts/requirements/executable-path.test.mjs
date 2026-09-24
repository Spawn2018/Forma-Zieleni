import assert from 'node:assert/strict';
import test from 'node:test';
import {
  currentBindingDepthExhausted,
  masterProductScopeExhausted,
  missingExecutablePathDeclarations,
  missingRequiredDepths,
  parentProductReport,
  portalCapabilityIsProductComplete,
  proseOnlyFutureDepths,
  registryMaterializationGap,
  scopeCoverageGaps,
} from './executable-path.mjs';
import { loadParentModels, loadProductScope } from './product-scope.mjs';
import { requirements } from './registry.mjs';

test('registry materialization gap is driven by requirement metadata', () => {
  const gap = registryMaterializationGap(
    [{
      id: 'FZ-REQ-X-001',
      status: 'BLOCKED_BY_DEPENDENCY',
      gate: 'NONE',
      blockerClass: 'INTERNAL',
      executableSlice: 'X-SLICE',
      executableWhenComplete: ['PREV'],
      safePreblockerWork: true,
    }],
    [{ id: 'PREV', status: 'COMPLETE' }],
  );
  assert.equal(gap.id, 'X-SLICE');
  assert.equal(gap.requirementId, 'FZ-REQ-X-001');
});

test('portal capability stays incomplete with foundation-only completion', () => {
  assert.equal(portalCapabilityIsProductComplete([
    { id: 'FZ-REQ-PORTAL-001', status: 'DONE_AT_MAX_DEPTH', foundationOnly: true, productCapability: 'PORTAL' },
    { id: 'FZ-REQ-PORTAL-003', status: 'BLOCKED_BY_DEPENDENCY', productCapability: 'PORTAL' },
  ]), false);
});

test('undeclared executable paths are validation failures', () => {
  assert.deepEqual(missingExecutablePathDeclarations([{
    id: 'FZ-REQ-Y-001',
    status: 'BLOCKED_BY_DEPENDENCY',
    gate: 'NONE',
    blockerClass: 'INTERNAL',
    safePreblockerWork: true,
  }]), ['FZ-REQ-Y-001']);
});

test('approved scope without a requirement is not master exhaustion', () => {
  const scope = [{ id: 'PXI-SYNTH', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: [] }];
  assert.deepEqual(scopeCoverageGaps(scope, []), ['PXI-SYNTH']);
  assert.equal(masterProductScopeExhausted([], [], scope, []), false);
});

test('boundary without a required runtime depth is not parent completion', () => {
  const requirements = [{
    id: 'FZ-REQ-MOBILE-001', status: 'DONE_AT_MAX_DEPTH', productCapability: 'MOBILE', depth: 'BOUNDARY', gap: 'runtime later',
  }];
  const models = [{ capability: 'MOBILE', requiredDepths: ['BOUNDARY', 'ANDROID_RUNTIME', 'IOS_RUNTIME'] }];
  assert.deepEqual(missingRequiredDepths(requirements, models), ['MOBILE:ANDROID_RUNTIME', 'MOBILE:IOS_RUNTIME']);
  assert.equal(parentProductReport(requirements, models[0]).complete, false);
  assert.deepEqual(proseOnlyFutureDepths(requirements, models), ['MOBILE:ANDROID_RUNTIME', 'MOBILE:IOS_RUNTIME']);
  assert.equal(currentBindingDepthExhausted(requirements, []), true);
  assert.equal(masterProductScopeExhausted(requirements, [], [], models), false);
});

test('owner-gated payment still requires the provider-neutral domain depth', () => {
  const requirements = [{
    id: 'FZ-REQ-PAY-001', status: 'OWNER_GATED', gate: 'OWNER-DECISION', blockerClass: 'OWNER_GATED', productCapability: 'PAYMENT', depth: 'OWNER_DECISION', safePreblockerWork: false,
  }];
  const models = [{ capability: 'PAYMENT', requiredDepths: ['OWNER_DECISION', 'DOMAIN'] }];
  assert.equal(parentProductReport(requirements, models[0]).complete, false);
  assert.equal(masterProductScopeExhausted(requirements, [], [], models), false);
});

test('live scope has no coverage gap and master exhaustion stays false while product slices are open', () => {
  const rows = requirements();
  const scope = loadProductScope();
  const models = loadParentModels();
  assert.deepEqual(scopeCoverageGaps(scope, rows), []);
  assert.deepEqual(missingRequiredDepths(rows, models), []);
  assert.equal(masterProductScopeExhausted(rows, [], scope, models), false);
  assert.equal(rows.some((row) => row.id === 'FZ-REQ-PXI-001'), true);
  assert.equal(parentProductReport(rows, { capability: 'MOBILE', requiredDepths: ['BOUNDARY', 'ANDROID_RUNTIME', 'IOS_RUNTIME'] }).complete, true);
  assert.equal(parentProductReport(rows, { capability: 'PAYMENT', requiredDepths: ['OWNER_DECISION', 'DOMAIN'] }).complete, true);
  assert.equal(parentProductReport(rows, { capability: 'SIGNING', requiredDepths: ['OWNER_DECISION', 'DOMAIN'] }).complete, true);
  assert.equal(parentProductReport(rows, { capability: 'PXI', requiredDepths: ['CONTRACT'] }).complete, false);
});
