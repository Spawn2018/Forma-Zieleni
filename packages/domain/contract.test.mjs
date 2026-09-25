import test from 'node:test';
import assert from 'node:assert/strict';
import { createLead, qualifyLead } from './src/lead.ts';
import { createOpportunity } from './src/opportunity.ts';
import { createOffer } from './src/offer.ts';
import {
  advanceContractLifecycle,
  assertOpaqueContractId,
  createContract,
  nextContractLifecycleStatus,
} from './src/contract.ts';
import { createSignatureRequest, lockContractVersion } from './src/signing.ts';

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

test('contract version lock attaches without inventing a signing vendor', () => {
  const offer = draftOffer();
  const contract = createContract('c9k2n4p6q8r0s2t4', offer, '2026-09-22T12:20:00.000Z');
  const lock = lockContractVersion(contract, 'b'.repeat(64), '2026-09-22T12:25:00.000Z');
  const request = createSignatureRequest('sr8k2n4p6q8r0s2t', contract, lock, 'sa8k2n4p6q8r0s2t', '2026-09-22T12:30:00.000Z');
  assert.equal(request.qesClaimed, false);
  assert.equal(Object.hasOwn(request, 'provider'), false);
});

test('non-draft offers cannot open a contract', () => {
  const offer = { ...draftOffer(), status: 'sent' };
  assert.throws(
    () => createContract('c9k2n4p6q8r0s2t4', /** @type {import('./src/offer.ts').Offer} */ (offer), at),
    /OFFER_NOT_READY/,
  );
});

test('staff can advance draft → internal_review → approved → sent only', () => {
  const offer = draftOffer();
  let contract = createContract('c9k2n4p6q8r0s2t4', offer, '2026-09-22T12:20:00.000Z');
  assert.equal(nextContractLifecycleStatus(contract.status), 'internal_review');
  contract = advanceContractLifecycle(contract, 'internal_review', '2026-09-22T12:21:00.000Z');
  assert.equal(contract.status, 'internal_review');
  assert.equal(nextContractLifecycleStatus(contract.status), 'approved');
  contract = advanceContractLifecycle(contract, 'approved', '2026-09-22T12:22:00.000Z');
  assert.equal(contract.status, 'approved');
  assert.equal(nextContractLifecycleStatus(contract.status), 'sent');
  contract = advanceContractLifecycle(contract, 'sent', '2026-09-22T12:23:00.000Z');
  assert.equal(contract.status, 'sent');
  assert.equal(nextContractLifecycleStatus(contract.status), null);
});

test('illegal lifecycle transitions are rejected', () => {
  const offer = draftOffer();
  const draft = createContract('c9k2n4p6q8r0s2t4', offer, '2026-09-22T12:20:00.000Z');
  assert.throws(() => advanceContractLifecycle(draft, 'approved', at), /CONTRACT_TRANSITION_FORBIDDEN/);
  assert.throws(() => advanceContractLifecycle(draft, 'sent', at), /CONTRACT_TRANSITION_FORBIDDEN/);
  assert.throws(() => advanceContractLifecycle(draft, 'draft', at), /CONTRACT_TRANSITION_FORBIDDEN/);
  const reviewed = advanceContractLifecycle(draft, 'internal_review', '2026-09-22T12:21:00.000Z');
  assert.throws(() => advanceContractLifecycle(reviewed, 'sent', at), /CONTRACT_TRANSITION_FORBIDDEN/);
  assert.throws(() => advanceContractLifecycle(reviewed, 'draft', at), /CONTRACT_TRANSITION_FORBIDDEN/);
});

test('lifecycle advance forbids payment and signing vendor surface keys', () => {
  const offer = draftOffer();
  const draft = createContract('c9k2n4p6q8r0s2t4', offer, '2026-09-22T12:20:00.000Z');
  assert.throws(
    () => advanceContractLifecycle(draft, 'internal_review', at, { provider: 'x' }),
    /CONTRACT_SURFACE_FORBIDDEN/,
  );
  assert.throws(
    () => advanceContractLifecycle(draft, 'internal_review', at, { payment: true }),
    /CONTRACT_SURFACE_FORBIDDEN/,
  );
  assert.throws(
    () => advanceContractLifecycle(draft, 'internal_review', at, { qes: true }),
    /CONTRACT_SURFACE_FORBIDDEN/,
  );
});

test('signing helpers still require draft contracts', () => {
  const offer = draftOffer();
  const draft = createContract('c9k2n4p6q8r0s2t4', offer, '2026-09-22T12:20:00.000Z');
  const reviewed = advanceContractLifecycle(draft, 'internal_review', '2026-09-22T12:21:00.000Z');
  assert.throws(() => lockContractVersion(reviewed, 'b'.repeat(64), at), /CONTRACT_NOT_READY/);
});
