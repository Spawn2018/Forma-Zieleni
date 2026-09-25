import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateContractCreateRequest,
  validateContractLifecycleAdvanceRequest,
} from './src/contract.ts';

test('contract create accepts only an opaque offer id', () => {
  const ok = validateContractCreateRequest({ offerId: 'f9k2n4p6q8r0s2t4' });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.value.offerId, 'f9k2n4p6q8r0s2t4');
});

test('contract create rejects client lifecycle fields', () => {
  const withStatus = validateContractCreateRequest({ offerId: 'f9k2n4p6q8r0s2t4', status: 'draft' });
  assert.equal(withStatus.ok, false);
  if (!withStatus.ok) assert.equal(withStatus.errors[0].reason, 'CLIENT_LIFECYCLE_FORBIDDEN');
  const withProvider = validateContractCreateRequest({ offerId: 'f9k2n4p6q8r0s2t4', provider: 'docuSign' });
  assert.equal(withProvider.ok, false);
  const badId = validateContractCreateRequest({ offerId: 'ctr1' });
  assert.equal(badId.ok, false);
});

test('lifecycle advance accepts only a known next status', () => {
  const ok = validateContractLifecycleAdvanceRequest({ status: 'internal_review' });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.value.status, 'internal_review');
});

test('lifecycle advance rejects unknown status, extras and vendor surface', () => {
  const badStatus = validateContractLifecycleAdvanceRequest({ status: 'SIGNED' });
  assert.equal(badStatus.ok, false);
  if (!badStatus.ok) assert.equal(badStatus.errors[0].reason, 'STATUS_INVALID');
  const withProvider = validateContractLifecycleAdvanceRequest({ status: 'approved', provider: 'x' });
  assert.equal(withProvider.ok, false);
  if (!withProvider.ok) assert.equal(withProvider.errors[0].reason, 'CONTRACT_SURFACE_FORBIDDEN');
  const withPayment = validateContractLifecycleAdvanceRequest({ status: 'approved', payment: true });
  assert.equal(withPayment.ok, false);
  const unknown = validateContractLifecycleAdvanceRequest({ status: 'approved', note: 'x' });
  assert.equal(unknown.ok, false);
});
