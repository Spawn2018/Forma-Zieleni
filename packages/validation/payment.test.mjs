import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePaymentInstallmentTransitionRequest,
  validatePaymentScheduleCreateRequest,
  validatePaymentScheduleReplaceRequest,
} from './src/payment.ts';

test('payment schedule create accepts synthetic installment lines only', () => {
  const ok = validatePaymentScheduleCreateRequest({
    contractId: 'c9k2n4p6q8r0s2t4',
    currency: 'PLN',
    installments: [
      { sequence: 1, amountMinor: 500_00 },
      { sequence: 2, amountMinor: 500_00, dueAt: '2026-10-01T00:00:00.000Z' },
    ],
  });
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.value.currency, 'PLN');
    assert.equal(ok.value.installments.length, 2);
  }
});

test('payment schedule create rejects provider surface and invalid amounts', () => {
  const withProvider = validatePaymentScheduleCreateRequest({
    contractId: 'c9k2n4p6q8r0s2t4',
    currency: 'PLN',
    installments: [{ sequence: 1, amountMinor: 100 }],
    provider: 'stripe',
  });
  assert.equal(withProvider.ok, false);
  const badAmount = validatePaymentScheduleCreateRequest({
    contractId: 'c9k2n4p6q8r0s2t4',
    currency: 'PLN',
    installments: [{ sequence: 1, amountMinor: 0 }],
  });
  assert.equal(badAmount.ok, false);
});

test('replace and transition stay provider-neutral', () => {
  const replace = validatePaymentScheduleReplaceRequest({
    installments: [{ sequence: 1, amountMinor: 200_00 }],
  });
  assert.equal(replace.ok, true);
  const transition = validatePaymentInstallmentTransitionRequest({ status: 'due' });
  assert.equal(transition.ok, true);
  const charge = validatePaymentInstallmentTransitionRequest({ status: 'due', chargeId: 'x' });
  assert.equal(charge.ok, false);
  const scheduled = validatePaymentInstallmentTransitionRequest({ status: 'scheduled' });
  assert.equal(scheduled.ok, false);
});
