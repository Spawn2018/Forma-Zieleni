import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProjectCreateRequest } from './src/project.ts';

test('project create accepts only an opaque contract id', () => {
  const ok = validateProjectCreateRequest({ contractId: 'c9k2n4p6q8r0s2t4' });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.value.contractId, 'c9k2n4p6q8r0s2t4');
});

test('project create rejects client lifecycle fields and unknown fields', () => {
  const withStatus = validateProjectCreateRequest({ contractId: 'c9k2n4p6q8r0s2t4', status: 'planned' });
  assert.equal(withStatus.ok, false);
  if (!withStatus.ok) assert.equal(withStatus.errors[0].reason, 'CLIENT_LIFECYCLE_FORBIDDEN');
  const withPayment = validateProjectCreateRequest({ contractId: 'c9k2n4p6q8r0s2t4', payment: true });
  assert.equal(withPayment.ok, false);
  if (!withPayment.ok) assert.equal(withPayment.errors[0].reason, 'CLIENT_LIFECYCLE_FORBIDDEN');
  const badId = validateProjectCreateRequest({ contractId: 'prj1' });
  assert.equal(badId.ok, false);
});
