import test from 'node:test';
import assert from 'node:assert/strict';
import { createLead, qualifyLead } from './src/lead.ts';
import { createOpportunity } from './src/opportunity.ts';
import { createOffer } from './src/offer.ts';
import { assertOpaqueContractId, createContract } from './src/contract.ts';

const at = '2026-09-22T12:00:00.000Z';
const capture = {
  name: 'Anna Kowalska',
  phone: '+48 600 000 000',
  email: 'anna@example.invalid',
  locality: 'Kraków',
  siteAnalysisRequested: true,
};

function draftOffer() {
  const lead = qualifyLead(createLead('ld8k2n4p6q8r0s2t', 'www', capture, at), false, '2026-09-22T12:05:00.000Z');
  const opportunity = createOpportunity('p9k2n4p6q8r0s2t4', lead, '2026-09-22T12:10:00.000Z');
  return createOffer('f9k2n4p6q8r0s2t4', opportunity, '2026-09-22T12:15:00.000Z');
}

test('opaque contract identifiers reject sequential or prefixed guessable values', () => {
  assert.equal(assertOpaqueContractId('c9k2n4p6q8r0s2t4'), 'c9k2n4p6q8r0s2t4');
  for (const id of ['1', 'contract1', 'CONTRACT99', 'short']) {
    assert.throws(() => assertOpaqueContractId(id), /CONTRACT_ID_GUESSABLE/);
  }
});

test('contract is created only from a draft offer and owns its status', () => {
  const offer = draftOffer();
  const contract = createContract('c9k2n4p6q8r0s2t4', offer, '2026-09-22T12:20:00.000Z');
  assert.equal(contract.offerId, offer.id);
  assert.equal(contract.status, 'draft');
  assert.equal(Object.hasOwn(contract, 'signedAt'), false);
  assert.equal(Object.hasOwn(contract, 'provider'), false);
});

test('non-draft offers cannot open a contract', () => {
  const offer = { ...draftOffer(), status: 'sent' };
  assert.throws(
    () => createContract('c9k2n4p6q8r0s2t4', /** @type {import('./src/offer.ts').Offer} */ (offer), at),
    /OFFER_NOT_READY/,
  );
});
