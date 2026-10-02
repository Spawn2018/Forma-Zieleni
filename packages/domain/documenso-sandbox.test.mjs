import assert from 'node:assert/strict';
import test from 'node:test';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { advanceContractLifecycle, createContract } from './src/contract.ts';
import { createLead, qualifyLead } from './src/lead.ts';
import { createOffer } from './src/offer.ts';
import { createOpportunity } from './src/opportunity.ts';
import {
  acceptSigningSandboxWebhook,
  openSigningSandboxEnvelope,
} from './src/documenso-sandbox.ts';

const at = '2026-10-02T12:00:00.000Z';
const secret = 'signing-sandbox-secret';

function sentContract() {
  const lead = qualifyLead(createLead('ld8k2n4p6q8r0s2t', 'www', {
    name: 'Anna Kowalska',
    phone: '+48 600 000 000',
    email: 'anna@example.invalid',
    locality: 'Kraków',
    siteAnalysisRequested: false,
  }, at), false, at);
  const opportunity = createOpportunity('p9k2n4p6q8r0s2t4', lead, at);
  const offer = createOffer('f9k2n4p6q8r0s2t4', opportunity, at);
  let contract = createContract('c9k2n4p6q8r0s2t4', offer, at);
  for (const status of ['internal_review', 'approved', 'sent']) {
    contract = advanceContractLifecycle(contract, status, at);
  }
  return contract;
}

function matches(raw, signature) {
  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  return left.length === right.length && timingSafeEqual(left, right);
}

test('documenso sandbox envelope stays local and a bad signature does not complete it', () => {
  const source = readFileSync(new URL('./src/documenso-sandbox.ts', import.meta.url), 'utf8');
  assert.equal(source.includes('fetch('), false);
  assert.equal(source.includes('documenso.com'), false);
  const contract = sentContract();
  const envelope = openSigningSandboxEnvelope(contract, 'ei8k2n4p6q8r0s2t', at);
  assert.equal(envelope.provider, 'documenso-sandbox');
  assert.equal(envelope.qesClaimed, false);
  assert.equal(Object.hasOwn(envelope, 'secret'), false);
  const raw = JSON.stringify({
    envelopeId: envelope.id,
    contractId: envelope.contractId,
    status: 'completed',
  });
  assert.throws(
    () => acceptSigningSandboxWebhook(envelope, raw, 'deadbeef', (body) => matches(body, 'deadbeef'), at),
    /SIGNING_SIGNATURE_INVALID/,
  );
  assert.equal(envelope.status, 'pending');
  const signature = createHmac('sha256', secret).update(raw).digest('hex');
  const completed = acceptSigningSandboxWebhook(envelope, raw, signature, (body) => matches(body, signature), at);
  assert.equal(completed.status, 'completed');
  assert.equal(completed.qesClaimed, false);
});

test('a token or live Documenso URL is refused', () => {
  const envelope = openSigningSandboxEnvelope(sentContract(), 'ei8k2n4p6q8r0s2t', at);
  const raw = JSON.stringify({
    envelopeId: envelope.id,
    contractId: envelope.contractId,
    status: 'completed',
    apiKey: 'live',
  });
  const signature = createHmac('sha256', secret).update(raw).digest('hex');
  assert.throws(
    () => acceptSigningSandboxWebhook(envelope, raw, signature, (body) => matches(body, signature), at),
    /SIGNING_VENDOR_SURFACE_FORBIDDEN/,
  );
  assert.equal(envelope.status, 'pending');
});
