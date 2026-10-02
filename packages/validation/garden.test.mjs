import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGardenCreateRequest, validateProjectDeliverRequest } from './src/garden.ts';

test('validateGardenCreateRequest accepts projectId only', () => {
  const ok = validateGardenCreateRequest({ projectId: 'j9k2n4p6q8r0s2t4' });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.value.projectId, 'j9k2n4p6q8r0s2t4');
});

test('validateGardenCreateRequest rejects twin and live invent fields', () => {
  for (const field of ['twinDatabase', 'liveGarden', 'sensorFeed', 'plants', 'xr']) {
    const bad = validateGardenCreateRequest({ projectId: 'j9k2n4p6q8r0s2t4', [field]: true });
    assert.equal(bad.ok, false);
    if (!bad.ok) assert.equal(bad.errors[0].reason, 'GARDEN_SURFACE_FORBIDDEN');
  }
});

test('validateGardenCreateRequest rejects bad project ids and extras', () => {
  assert.equal(validateGardenCreateRequest({ projectId: 'prj1' }).ok, false);
  assert.equal(validateGardenCreateRequest({ projectId: 'j9k2n4p6q8r0s2t4', note: 'x' }).ok, false);
});

test('validateProjectDeliverRequest accepts empty body only', () => {
  assert.equal(validateProjectDeliverRequest({}).ok, true);
  assert.equal(validateProjectDeliverRequest(null).ok, true);
  assert.equal(validateProjectDeliverRequest({ status: 'delivered' }).ok, false);
  assert.equal(validateProjectDeliverRequest({ payment: true }).ok, false);
});
