import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOfferCreateRequest } from './src/offer.ts';

test('offer create accepts only an opaque opportunity id', () => {
  const ok = validateOfferCreateRequest({ opportunityId: 'p9k2n4p6q8r0s2t4' });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.value.opportunityId, 'p9k2n4p6q8r0s2t4');
});

test('offer create rejects client commercial fields and unknown fields', () => {
  const withStatus = validateOfferCreateRequest({ opportunityId: 'p9k2n4p6q8r0s2t4', status: 'draft' });
  assert.equal(withStatus.ok, false);
  const withPrice = validateOfferCreateRequest({ opportunityId: 'p9k2n4p6q8r0s2t4', price: 1000 });
  assert.equal(withPrice.ok, false);
  const badId = validateOfferCreateRequest({ opportunityId: 'opp1' });
  assert.equal(badId.ok, false);
});
