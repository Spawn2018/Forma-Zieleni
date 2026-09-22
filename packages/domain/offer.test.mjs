import test from 'node:test';
import assert from 'node:assert/strict';
import { createLead, qualifyLead } from './src/lead.ts';
import { createOpportunity } from './src/opportunity.ts';
import { assertOpaqueOfferId, createOffer } from './src/offer.ts';

const at = '2026-09-22T12:00:00.000Z';
const capture = {
  name: 'Anna Kowalska',
  phone: '+48 600 000 000',
  email: 'anna@example.invalid',
  locality: 'Kraków',
  siteAnalysisRequested: true,
};

function openOpportunity() {
  const lead = qualifyLead(createLead('ld8k2n4p6q8r0s2t', 'www', capture, at), false, '2026-09-22T12:05:00.000Z');
  return createOpportunity('p9k2n4p6q8r0s2t4', lead, '2026-09-22T12:10:00.000Z');
}

test('opaque offer identifiers reject sequential or prefixed guessable values', () => {
  assert.equal(assertOpaqueOfferId('f9k2n4p6q8r0s2t4'), 'f9k2n4p6q8r0s2t4');
  for (const id of ['1', 'offer1', 'OFFER99', 'short']) {
    assert.throws(() => assertOpaqueOfferId(id), /OFFER_ID_GUESSABLE/);
  }
});

test('offer is created only from an open opportunity and owns its status', () => {
  const opportunity = openOpportunity();
  const offer = createOffer('f9k2n4p6q8r0s2t4', opportunity, '2026-09-22T12:15:00.000Z');
  assert.equal(offer.opportunityId, opportunity.id);
  assert.equal(offer.status, 'draft');
  assert.equal(Object.hasOwn(offer, 'price'), false);
  assert.equal(Object.hasOwn(offer, 'amountPln'), false);
  assert.equal(Object.hasOwn(offer, 'terms'), false);
});

test('non-open opportunities cannot open an offer', () => {
  const opportunity = { ...openOpportunity(), status: 'closed' };
  assert.throws(
    () => createOffer('f9k2n4p6q8r0s2t4', /** @type {import('./src/opportunity.ts').Opportunity} */ (opportunity), at),
    /OPPORTUNITY_NOT_OPEN/,
  );
});
