import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createContract } from './src/contract.ts';
import { createLead, qualifyLead } from './src/lead.ts';
import { createOffer } from './src/offer.ts';
import { createOpportunity } from './src/opportunity.ts';
import { createPaymentSchedule, transitionPaymentInstallment } from './src/payment.ts';
import {
  acceptSandboxWebhook,
  openSandboxIntent,
} from './src/przelewy24-sandbox.ts';

const at = '2026-10-02T12:00:00.000Z';
const secret = 'sandbox-webhook-secret';

function matches(raw, signature) {
  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  return left.length === right.length && timingSafeEqual(left, right);
}

function dueSchedule() {
  const lead = qualifyLead(createLead('ld8k2n4p6q8r0s2t', 'www', {
    name: 'Anna Kowalska',
    phone: '+48 600 000 000',
    email: 'anna@example.invalid',
    locality: 'Kraków',
    siteAnalysisRequested: false,
  }, at), false, at);
  const opportunity = createOpportunity('p9k2n4p6q8r0s2t4', lead, at);
  const offer = createOffer('f9k2n4p6q8r0s2t4', opportunity, at);
  const contract = createContract('c9k2n4p6q8r0s2t4', offer, at);
  const schedule = createPaymentSchedule('ps8k2n4p6q8r0s2t', contract, 'PLN', [{
    id: 'pi8k2n4p6q8r0s2t',
    sequence: 1,
    amountMinor: 15000,
  }], at);
  return transitionPaymentInstallment(schedule, 'pi8k2n4p6q8r0s2t', 'due', at);
}

test('sandbox intent does not call the network and a bad signature does not record the installment', () => {
  const source = readFileSync(new URL('./src/przelewy24-sandbox.ts', import.meta.url), 'utf8');
  assert.equal(source.includes('fetch('), false);
  assert.equal(source.includes('przelewy24.pl'), false);
  const schedule = dueSchedule();
  const intent = openSandboxIntent(schedule, 'pi8k2n4p6q8r0s2t', 'bi8k2n4p6q8r0s2t', at);
  assert.equal(intent.provider, 'przelewy24-sandbox');
  assert.equal(intent.status, 'pending');
  assert.equal(Object.hasOwn(intent, 'secret'), false);
  const raw = JSON.stringify({
    intentId: intent.id,
    scheduleId: intent.scheduleId,
    installmentId: intent.installmentId,
    status: 'confirmed',
  });
  assert.throws(
    () => acceptSandboxWebhook(intent, schedule, raw, 'deadbeef', (body) => matches(body, 'deadbeef'), at),
    /SANDBOX_SIGNATURE_INVALID/,
  );
  assert.equal(schedule.installments[0].status, 'due');
  const signature = createHmac('sha256', secret).update(raw).digest('hex');
  const signed = acceptSandboxWebhook(intent, schedule, raw, signature, (body) => matches(body, signature), at);
  assert.equal(signed.schedule.installments[0].status, 'recorded');
  assert.equal(signed.intent.status, 'confirmed');
  const again = acceptSandboxWebhook(signed.intent, signed.schedule, raw, signature, (body) => matches(body, signature), at);
  assert.equal(again.schedule.installments[0].status, 'recorded');
});

test('card, merchant and live-url fields are refused', () => {
  const schedule = dueSchedule();
  const intent = openSandboxIntent(schedule, 'pi8k2n4p6q8r0s2t', 'bi8k2n4p6q8r0s2t', at);
  const raw = JSON.stringify({
    intentId: intent.id,
    scheduleId: intent.scheduleId,
    installmentId: intent.installmentId,
    status: 'confirmed',
    cardNumber: '4111',
  });
  assert.throws(
    () => acceptSandboxWebhook(intent, schedule, raw, createHmac('sha256', secret).update(raw).digest('hex'), (body) => matches(body, createHmac('sha256', secret).update(raw).digest('hex')), at),
    /PAYMENT_PROVIDER_SURFACE_FORBIDDEN/,
  );
  assert.equal(schedule.installments[0].status, 'due');
});
