import test from 'node:test';
import assert from 'node:assert/strict';
import { createLead, qualifyLead } from './src/lead.ts';
import { createOpportunity } from './src/opportunity.ts';
import { createOffer } from './src/offer.ts';
import { createContract } from './src/contract.ts';
import {
  assertOpaqueSignatureRequestId,
  assertOpaqueSignerActorId,
  cancelSignatureRequest,
  createSignatureRequest,
  lockContractVersion,
} from './src/signing.ts';

const at = '2026-09-24T15:00:00.000Z';
const capture = {
  name: 'Anna Kowalska',
  phone: '+48 600 000 000',
  email: 'anna@example.invalid',
  locality: 'Kraków',
  siteAnalysisRequested: true,
};
const version = 'a'.repeat(64);

function draftContract() {
  const lead = qualifyLead(createLead('ld8k2n4p6q8r0s2t', 'www', capture, at), false, '2026-09-24T15:05:00.000Z');
  const opportunity = createOpportunity('p9k2n4p6q8r0s2t4', lead, '2026-09-24T15:10:00.000Z');
  const offer = createOffer('f9k2n4p6q8r0s2t4', opportunity, '2026-09-24T15:15:00.000Z');
  return createContract('c9k2n4p6q8r0s2t4', offer, '2026-09-24T15:20:00.000Z');
}

test('opaque signing identifiers reject guessable values', () => {
  assert.equal(assertOpaqueSignatureRequestId('sr8k2n4p6q8r0s2t'), 'sr8k2n4p6q8r0s2t');
  assert.equal(assertOpaqueSignerActorId('sa8k2n4p6q8r0s2t'), 'sa8k2n4p6q8r0s2t');
  for (const id of ['1', 'sign1', 'sig99', 'request1', 'short']) {
    assert.throws(() => assertOpaqueSignatureRequestId(id), /SIGNATURE_REQUEST_ID_GUESSABLE/);
  }
  for (const id of ['1', 'signer1', 'user9', 'actor1', 'short']) {
    assert.throws(() => assertOpaqueSignerActorId(id), /SIGNER_ACTOR_ID_GUESSABLE/);
  }
});

test('contract version lock and signature request stay provider-neutral without QES', () => {
  const contract = draftContract();
  const lock = lockContractVersion(contract, version, '2026-09-24T15:25:00.000Z');
  assert.equal(lock.contractId, contract.id);
  assert.equal(lock.version, version);
  assert.equal(Object.hasOwn(lock, 'provider'), false);

  const request = createSignatureRequest(
    'sr8k2n4p6q8r0s2t',
    contract,
    lock,
    'sa8k2n4p6q8r0s2t',
    '2026-09-24T15:30:00.000Z',
  );
  assert.equal(request.status, 'requested');
  assert.equal(request.qesClaimed, false);
  assert.equal(request.contractVersion, version);
  assert.equal(request.signerActorId, 'sa8k2n4p6q8r0s2t');
  assert.equal(Object.hasOwn(request, 'provider'), false);
  assert.equal(Object.hasOwn(request, 'document'), false);
  assert.equal(Object.hasOwn(request, 'webhook'), false);

  const cancelled = cancelSignatureRequest(request, '2026-09-24T15:35:00.000Z');
  assert.equal(cancelled.status, 'cancelled');
  assert.equal(cancelled.qesClaimed, false);
});

test('invalid versions and mismatched locks are refused', () => {
  const contract = draftContract();
  assert.throws(() => lockContractVersion(contract, 'short', at), /CONTRACT_VERSION_INVALID/);
  const lock = lockContractVersion(contract, version, at);
  assert.throws(
    () => createSignatureRequest(
      'sr8k2n4p6q8r0s2t',
      contract,
      { ...lock, contractId: 'c0thercontract0001' },
      'sa8k2n4p6q8r0s2t',
      at,
    ),
    /CONTRACT_VERSION_MISMATCH/,
  );
  assert.throws(
    () => cancelSignatureRequest(
      { ...createSignatureRequest('sr8k2n4p6q8r0s2t', contract, lock, 'sa8k2n4p6q8r0s2t', at), status: 'cancelled' },
      at,
    ),
    /SIGNATURE_TRANSITION_FORBIDDEN/,
  );
});
