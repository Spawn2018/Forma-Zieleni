import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContractCreateRequest } from './src/contract.ts';

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
