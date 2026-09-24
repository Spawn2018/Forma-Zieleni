import test from 'node:test';
import assert from 'node:assert/strict';
import { createLead, qualifyLead } from './src/lead.ts';
import { createOpportunity } from './src/opportunity.ts';
import { createOffer } from './src/offer.ts';
import { createContract } from './src/contract.ts';
import {
  assertOpaquePaymentInstallmentId,
  assertOpaquePaymentScheduleId,
  cancelInstallment,
  createPaymentSchedule,
  markInstallmentDue,
  recordInstallmentSynthetic,
  waiveInstallment,
} from './src/payment.ts';

const at = '2026-09-24T12:00:00.000Z';
const capture = {
  name: 'Anna Kowalska',
  phone: '+48 600 000 000',
  email: 'anna@example.invalid',
  locality: 'Kraków',
  siteAnalysisRequested: true,
};

function draftContract() {
  const lead = qualifyLead(createLead('ld8k2n4p6q8r0s2t', 'www', capture, at), false, '2026-09-24T12:05:00.000Z');
  const opportunity = createOpportunity('p9k2n4p6q8r0s2t4', lead, '2026-09-24T12:10:00.000Z');
  const offer = createOffer('f9k2n4p6q8r0s2t4', opportunity, '2026-09-24T12:15:00.000Z');
  return createContract('c9k2n4p6q8r0s2t4', offer, '2026-09-24T12:20:00.000Z');
}

test('opaque payment identifiers reject sequential or prefixed guessable values', () => {
  assert.equal(assertOpaquePaymentScheduleId('ps8k2n4p6q8r0s2t'), 'ps8k2n4p6q8r0s2t');
  assert.equal(assertOpaquePaymentInstallmentId('pi8k2n4p6q8r0s2t'), 'pi8k2n4p6q8r0s2t');
  for (const id of ['1', 'pay1', 'payment99', 'sched1', 'short']) {
    assert.throws(() => assertOpaquePaymentScheduleId(id), /PAYMENT_SCHEDULE_ID_GUESSABLE/);
  }
  for (const id of ['1', 'inst1', 'installment9', 'pay1', 'short']) {
    assert.throws(() => assertOpaquePaymentInstallmentId(id), /PAYMENT_INSTALLMENT_ID_GUESSABLE/);
  }
});

test('payment schedule attaches to a draft contract with synthetic amounts only', () => {
  const contract = draftContract();
  const schedule = createPaymentSchedule(
    'ps8k2n4p6q8r0s2t',
    contract,
    'PLN',
    [
      { id: 'pi8k2n4p6q8r0s2a', sequence: 1, amountMinor: 500_00, dueAt: '2026-10-01' },
      { id: 'pi8k2n4p6q8r0s2b', sequence: 2, amountMinor: 1500_00 },
    ],
    '2026-09-24T12:25:00.000Z',
  );
  assert.equal(schedule.contractId, contract.id);
  assert.equal(schedule.currency, 'PLN');
  assert.equal(schedule.installments.length, 2);
  assert.equal(schedule.installments[0].status, 'scheduled');
  assert.equal(schedule.installments[0].amountMinor, 500_00);
  assert.equal(Object.hasOwn(schedule, 'provider'), false);
  assert.equal(Object.hasOwn(schedule, 'webhook'), false);
  assert.equal(Object.hasOwn(schedule.installments[0], 'chargeId'), false);
  assert.equal(Object.hasOwn(schedule.installments[0], 'card'), false);
});

test('provider-shaped fields and invalid amounts are refused', () => {
  const contract = draftContract();
  assert.throws(
    () => createPaymentSchedule(
      'ps8k2n4p6q8r0s2t',
      contract,
      'PLN',
      [{ id: 'pi8k2n4p6q8r0s2a', sequence: 1, amountMinor: 100, provider: 'stripe' }],
      at,
    ),
    /PAYMENT_PROVIDER_SURFACE_FORBIDDEN/,
  );
  assert.throws(
    () => createPaymentSchedule(
      'ps8k2n4p6q8r0s2t',
      contract,
      'PLN',
      [{ id: 'pi8k2n4p6q8r0s2a', sequence: 1, amountMinor: 0 }],
      at,
    ),
    /PAYMENT_AMOUNT_INVALID/,
  );
});

test('installment transitions stay provider-neutral without moving money', () => {
  const contract = draftContract();
  let schedule = createPaymentSchedule(
    'ps8k2n4p6q8r0s2t',
    contract,
    'PLN',
    [{ id: 'pi8k2n4p6q8r0s2a', sequence: 1, amountMinor: 250_00 }],
    at,
  );
  schedule = markInstallmentDue(schedule, 'pi8k2n4p6q8r0s2a', '2026-09-24T13:00:00.000Z');
  assert.equal(schedule.installments[0].status, 'due');
  schedule = recordInstallmentSynthetic(schedule, 'pi8k2n4p6q8r0s2a', '2026-09-24T14:00:00.000Z');
  assert.equal(schedule.installments[0].status, 'recorded');
  assert.throws(
    () => recordInstallmentSynthetic(schedule, 'pi8k2n4p6q8r0s2a', '2026-09-24T15:00:00.000Z'),
    /PAYMENT_TRANSITION_FORBIDDEN/,
  );

  let waived = createPaymentSchedule(
    'ps8k2n4p6q8r0s2u',
    contract,
    'PLN',
    [{ id: 'pi8k2n4p6q8r0s2c', sequence: 1, amountMinor: 100_00 }],
    at,
  );
  waived = waiveInstallment(waived, 'pi8k2n4p6q8r0s2c', '2026-09-24T13:00:00.000Z');
  assert.equal(waived.installments[0].status, 'waived');

  let cancelled = createPaymentSchedule(
    'ps8k2n4p6q8r0s2v',
    contract,
    'PLN',
    [{ id: 'pi8k2n4p6q8r0s2d', sequence: 1, amountMinor: 100_00 }],
    at,
  );
  cancelled = cancelInstallment(cancelled, 'pi8k2n4p6q8r0s2d', '2026-09-24T13:00:00.000Z');
  assert.equal(cancelled.installments[0].status, 'cancelled');
});
