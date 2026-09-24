import { assertOpaqueContractId, type Contract } from './contract.ts';

export const PAYMENT_INSTALLMENT_STATUSES = [
  'scheduled',
  'due',
  'recorded',
  'waived',
  'cancelled',
] as const;

export type PaymentInstallmentStatus = (typeof PAYMENT_INSTALLMENT_STATUSES)[number];

/** Provider-neutral installment on a contract. Synthetic amounts only. */
export type PaymentInstallment = {
  id: string;
  sequence: number;
  amountMinor: number;
  dueAt: string | null;
  status: PaymentInstallmentStatus;
  updatedAt: string;
};

/** Provider-neutral payment schedule owned by Core API domain. No PSP fields. */
export type PaymentSchedule = {
  id: string;
  contractId: string;
  currency: string;
  installments: readonly PaymentInstallment[];
  createdAt: string;
  updatedAt: string;
};

export type PaymentInstallmentSpec = {
  id: string;
  sequence: number;
  amountMinor: number;
  dueAt?: string | null;
};

const OPAQUE_ID = /^[a-z][a-z0-9]{15,63}$/;
const FORBIDDEN_KEYS = new Set([
  'provider',
  'providerRef',
  'provider_ref',
  'webhook',
  'card',
  'pan',
  'chargeId',
  'charge_id',
  'secret',
]);

export function assertOpaquePaymentScheduleId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:pay|payment|sched|id)\d+$/i.test(id)) {
    throw new Error('PAYMENT_SCHEDULE_ID_GUESSABLE');
  }
  return id;
}

export function assertOpaquePaymentInstallmentId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:inst|installment|pay|id)\d+$/i.test(id)) {
    throw new Error('PAYMENT_INSTALLMENT_ID_GUESSABLE');
  }
  return id;
}

function assertNoProviderSurface(input: object): void {
  for (const key of Object.keys(input)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new Error('PAYMENT_PROVIDER_SURFACE_FORBIDDEN');
    }
  }
}

function assertInstallmentSpec(spec: PaymentInstallmentSpec): PaymentInstallmentSpec {
  assertNoProviderSurface(spec);
  if (!Number.isInteger(spec.sequence) || spec.sequence < 1) {
    throw new Error('PAYMENT_SEQUENCE_INVALID');
  }
  if (!Number.isInteger(spec.amountMinor) || spec.amountMinor < 1) {
    throw new Error('PAYMENT_AMOUNT_INVALID');
  }
  return spec;
}

export function createPaymentSchedule(
  id: string,
  contract: Contract,
  currency: string,
  installmentSpecs: readonly PaymentInstallmentSpec[],
  at: string,
): PaymentSchedule {
  assertNoProviderSurface({ currency, installmentSpecs });
  if (contract.status !== 'draft') {
    throw new Error('CONTRACT_NOT_READY');
  }
  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) {
    throw new Error('PAYMENT_CURRENCY_INVALID');
  }
  if (!Array.isArray(installmentSpecs) || installmentSpecs.length < 1) {
    throw new Error('PAYMENT_SCHEDULE_EMPTY');
  }
  const sequences = new Set<number>();
  const installments = installmentSpecs.map((raw) => {
    const spec = assertInstallmentSpec(raw);
    if (sequences.has(spec.sequence)) {
      throw new Error('PAYMENT_SEQUENCE_DUPLICATE');
    }
    sequences.add(spec.sequence);
    return {
      id: assertOpaquePaymentInstallmentId(spec.id),
      sequence: spec.sequence,
      amountMinor: spec.amountMinor,
      dueAt: spec.dueAt ?? null,
      status: 'scheduled' as const,
      updatedAt: at,
    };
  });
  installments.sort((a, b) => a.sequence - b.sequence);
  return {
    id: assertOpaquePaymentScheduleId(id),
    contractId: assertOpaqueContractId(contract.id),
    currency,
    installments,
    createdAt: at,
    updatedAt: at,
  };
}

function mapInstallment(
  schedule: PaymentSchedule,
  installmentId: string,
  at: string,
  nextStatus: PaymentInstallmentStatus,
  allowedFrom: readonly PaymentInstallmentStatus[],
): PaymentSchedule {
  const current = schedule.installments.find((item) => item.id === installmentId);
  if (!current) {
    throw new Error('PAYMENT_INSTALLMENT_UNKNOWN');
  }
  if (!allowedFrom.includes(current.status)) {
    throw new Error('PAYMENT_TRANSITION_FORBIDDEN');
  }
  return {
    ...schedule,
    updatedAt: at,
    installments: schedule.installments.map((item) => (
      item.id === installmentId
        ? { ...item, status: nextStatus, updatedAt: at }
        : item
    )),
  };
}

export function markInstallmentDue(
  schedule: PaymentSchedule,
  installmentId: string,
  at: string,
): PaymentSchedule {
  return mapInstallment(schedule, installmentId, at, 'due', ['scheduled']);
}

/** Record synthetic satisfaction without a provider charge. */
export function recordInstallmentSynthetic(
  schedule: PaymentSchedule,
  installmentId: string,
  at: string,
): PaymentSchedule {
  return mapInstallment(schedule, installmentId, at, 'recorded', ['due']);
}

export function waiveInstallment(
  schedule: PaymentSchedule,
  installmentId: string,
  at: string,
): PaymentSchedule {
  return mapInstallment(schedule, installmentId, at, 'waived', ['scheduled', 'due']);
}

export function cancelInstallment(
  schedule: PaymentSchedule,
  installmentId: string,
  at: string,
): PaymentSchedule {
  return mapInstallment(schedule, installmentId, at, 'cancelled', ['scheduled', 'due']);
}
