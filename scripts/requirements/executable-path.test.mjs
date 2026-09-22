import assert from 'node:assert/strict';
import test from 'node:test';
import {
  missingExecutablePathDeclarations,
  portalCapabilityIsProductComplete,
  registryMaterializationGap,
} from './executable-path.mjs';

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
