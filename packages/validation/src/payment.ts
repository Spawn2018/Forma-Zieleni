import { assertOpaqueContractId } from '../../domain/src/contract.ts';
import {
  PAYMENT_INSTALLMENT_STATUSES,
  type PaymentInstallmentStatus,
} from '../../domain/src/payment.ts';

export type FieldError = { field: string; reason: string };

export type PaymentInstallmentInput = {
  sequence: number;
  amountMinor: number;
  dueAt?: string | null;
};

export type PaymentScheduleCreateRequest = {
  contractId: string;
  currency: string;
  installments: PaymentInstallmentInput[];
};

export type PaymentScheduleReplaceRequest = {
  installments: PaymentInstallmentInput[];
};

export type PaymentInstallmentTransitionRequest = {
  status: Exclude<PaymentInstallmentStatus, 'scheduled'>;
};

const FORBIDDEN = new Set([
  'provider',
  'providerRef',
  'provider_ref',
  'webhook',
  'card',
  'pan',
  'blik',
  'chargeId',
  'charge_id',
  'secret',
  'payment',
  'signing',
  'id',
]);

const TRANSITION_STATUSES = ['due', 'recorded', 'waived', 'cancelled'] as const;

function parseInstallments(
  raw: unknown,
  field: string,
): { ok: true; value: PaymentInstallmentInput[] } | { ok: false; errors: FieldError[] } {
  if (!Array.isArray(raw) || raw.length < 1) {
    return { ok: false, errors: [{ field, reason: 'PAYMENT_SCHEDULE_EMPTY' }] };
  }
  const installments: PaymentInstallmentInput[] = [];
  for (let index = 0; index < raw.length; index += 1) {
    const item = raw[index];
    const prefix = `${field}[${index}]`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { ok: false, errors: [{ field: prefix, reason: 'OBJECT_REQUIRED' }] };
    }
    const body = item as Record<string, unknown>;
    for (const key of Object.keys(body)) {
      if (FORBIDDEN.has(key) || key === 'status' || key === 'id') {
        return { ok: false, errors: [{ field: `${prefix}.${key}`, reason: 'FORBIDDEN_FIELD' }] };
      }
    }
    const allowed = new Set(['sequence', 'amountMinor', 'dueAt']);
    const extra = Object.keys(body).filter((key) => !allowed.has(key));
    if (extra.length) {
      return { ok: false, errors: extra.map((key) => ({ field: `${prefix}.${key}`, reason: 'UNKNOWN_FIELD' })) };
    }
    if (!Number.isInteger(body.sequence) || (body.sequence as number) < 1) {
      return { ok: false, errors: [{ field: `${prefix}.sequence`, reason: 'PAYMENT_SEQUENCE_INVALID' }] };
    }
    if (!Number.isInteger(body.amountMinor) || (body.amountMinor as number) < 1) {
      return { ok: false, errors: [{ field: `${prefix}.amountMinor`, reason: 'PAYMENT_AMOUNT_INVALID' }] };
    }
    let dueAt: string | null | undefined;
    if (Object.hasOwn(body, 'dueAt')) {
      if (body.dueAt === null) dueAt = null;
      else if (typeof body.dueAt !== 'string') {
        return { ok: false, errors: [{ field: `${prefix}.dueAt`, reason: 'STRING_OR_NULL_REQUIRED' }] };
      } else dueAt = body.dueAt;
    }
    installments.push({
      sequence: body.sequence as number,
      amountMinor: body.amountMinor as number,
      ...(dueAt !== undefined ? { dueAt } : {}),
    });
  }
  return { ok: true, value: installments };
}

export function validatePaymentScheduleCreateRequest(
  value: unknown,
): { ok: true; value: PaymentScheduleCreateRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  for (const key of Object.keys(body)) {
    if (FORBIDDEN.has(key)) {
      return { ok: false, errors: [{ field: key, reason: 'FORBIDDEN_FIELD' }] };
    }
  }
  const allowed = new Set(['contractId', 'currency', 'installments']);
  const extra = Object.keys(body).filter((key) => !allowed.has(key));
  if (extra.length) return { ok: false, errors: extra.map((field) => ({ field, reason: 'UNKNOWN_FIELD' })) };
  if (typeof body.contractId !== 'string') {
    return { ok: false, errors: [{ field: 'contractId', reason: 'STRING_REQUIRED' }] };
  }
  if (typeof body.currency !== 'string' || !/^[A-Z]{3}$/.test(body.currency)) {
    return { ok: false, errors: [{ field: 'currency', reason: 'PAYMENT_CURRENCY_INVALID' }] };
  }
  const installments = parseInstallments(body.installments, 'installments');
  if (!installments.ok) return installments;
  try {
    return {
      ok: true,
      value: {
        contractId: assertOpaqueContractId(body.contractId),
        currency: body.currency,
        installments: installments.value,
      },
    };
  } catch {
    return { ok: false, errors: [{ field: 'contractId', reason: 'CONTRACT_ID_INVALID' }] };
  }
}

export function validatePaymentScheduleReplaceRequest(
  value: unknown,
): { ok: true; value: PaymentScheduleReplaceRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  for (const key of Object.keys(body)) {
    if (FORBIDDEN.has(key) || key === 'contractId' || key === 'currency') {
      return { ok: false, errors: [{ field: key, reason: 'FORBIDDEN_FIELD' }] };
    }
  }
  const extra = Object.keys(body).filter((key) => key !== 'installments');
  if (extra.length) return { ok: false, errors: extra.map((field) => ({ field, reason: 'UNKNOWN_FIELD' })) };
  const installments = parseInstallments(body.installments, 'installments');
  if (!installments.ok) return installments;
  return { ok: true, value: { installments: installments.value } };
}

export function validatePaymentInstallmentTransitionRequest(
  value: unknown,
): { ok: true; value: PaymentInstallmentTransitionRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  for (const key of Object.keys(body)) {
    if (FORBIDDEN.has(key) || key === 'amountMinor' || key === 'provider') {
      return { ok: false, errors: [{ field: key, reason: 'FORBIDDEN_FIELD' }] };
    }
  }
  const extra = Object.keys(body).filter((key) => key !== 'status');
  if (extra.length) return { ok: false, errors: extra.map((field) => ({ field, reason: 'UNKNOWN_FIELD' })) };
  if (typeof body.status !== 'string') {
    return { ok: false, errors: [{ field: 'status', reason: 'STRING_REQUIRED' }] };
  }
  if (!(TRANSITION_STATUSES as readonly string[]).includes(body.status)) {
    return { ok: false, errors: [{ field: 'status', reason: 'PAYMENT_STATUS_INVALID' }] };
  }
  if (!(PAYMENT_INSTALLMENT_STATUSES as readonly string[]).includes(body.status)) {
    return { ok: false, errors: [{ field: 'status', reason: 'PAYMENT_STATUS_INVALID' }] };
  }
  return {
    ok: true,
    value: { status: body.status as PaymentInstallmentTransitionRequest['status'] },
  };
}
