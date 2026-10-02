import {
  assertOpaquePaymentInstallmentId,
  assertOpaquePaymentScheduleId,
  transitionPaymentInstallment,
  type PaymentSchedule,
} from './payment.ts';

export const SANDBOX_PROVIDER = 'przelewy24-sandbox';

export type SandboxIntentStatus = 'pending' | 'confirmed';

export type SandboxPaymentIntent = {
  id: string;
  provider: typeof SANDBOX_PROVIDER;
  scheduleId: string;
  installmentId: string;
  amountMinor: number;
  currency: string;
  status: SandboxIntentStatus;
  createdAt: string;
  updatedAt: string;
};

const OPAQUE_ID = /^[a-z][a-z0-9]{15,63}$/;
const FORBIDDEN_KEY = /card|blik|cvv|pan|merchant|secret|production/i;

export function assertOpaqueSandboxIntentId(value: string): string {
  if (!OPAQUE_ID.test(value)) throw new Error('SANDBOX_INTENT_ID_GUESSABLE');
  return value;
}

export function openSandboxIntent(
  schedule: PaymentSchedule,
  installmentId: string,
  intentId: string,
  at: string,
): SandboxPaymentIntent {
  const id = assertOpaqueSandboxIntentId(intentId);
  const scheduleId = assertOpaquePaymentScheduleId(schedule.id);
  const lineId = assertOpaquePaymentInstallmentId(installmentId);
  const line = schedule.installments.find((item) => item.id === lineId);
  if (!line) throw new Error('PAYMENT_INSTALLMENT_UNKNOWN');
  if (line.status !== 'due') throw new Error('PAYMENT_TRANSITION_FORBIDDEN');
  return {
    id,
    provider: SANDBOX_PROVIDER,
    scheduleId,
    installmentId: lineId,
    amountMinor: line.amountMinor,
    currency: schedule.currency,
    status: 'pending',
    createdAt: at,
    updatedAt: at,
  };
}

function assertSandboxBody(value: unknown): {
  intentId: string;
  scheduleId: string;
  installmentId: string;
  status: 'confirmed';
} {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('SANDBOX_WEBHOOK_INVALID');
  const body = value as Record<string, unknown>;
  for (const key of Object.keys(body)) {
    if (FORBIDDEN_KEY.test(key)) throw new Error('PAYMENT_PROVIDER_SURFACE_FORBIDDEN');
  }
  const allowed = ['intentId', 'scheduleId', 'installmentId', 'status'];
  if (Object.keys(body).some((key) => !allowed.includes(key))) throw new Error('SANDBOX_WEBHOOK_INVALID');
  if (body.status !== 'confirmed') throw new Error('SANDBOX_WEBHOOK_INVALID');
  for (const key of ['intentId', 'scheduleId', 'installmentId'] as const) {
    if (typeof body[key] !== 'string') throw new Error('SANDBOX_WEBHOOK_INVALID');
  }
  const text = JSON.stringify(body);
  if (/przelewy24\.pl|https?:\/\//i.test(text)) throw new Error('PAYMENT_PROVIDER_SURFACE_FORBIDDEN');
  return {
    intentId: assertOpaqueSandboxIntentId(body.intentId as string),
    scheduleId: assertOpaquePaymentScheduleId(body.scheduleId as string),
    installmentId: assertOpaquePaymentInstallmentId(body.installmentId as string),
    status: 'confirmed',
  };
}

/**
 * Confirm a sandbox webhook. Does not call a network and does not read a
 * production merchant key. A bad signature leaves the schedule untouched.
 */
export function acceptSandboxWebhook(
  intent: SandboxPaymentIntent,
  schedule: PaymentSchedule,
  rawBody: string,
  signature: string,
  signatureMatches: (rawBody: string) => boolean,
  at: string,
): { intent: SandboxPaymentIntent; schedule: PaymentSchedule } {
  if (intent.provider !== SANDBOX_PROVIDER) throw new Error('SANDBOX_PROVIDER_FORBIDDEN');
  if (!signatureMatches(rawBody) || signature.trim() === '') throw new Error('SANDBOX_SIGNATURE_INVALID');
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new Error('SANDBOX_WEBHOOK_INVALID');
  }
  const body = assertSandboxBody(parsed);
  if (
    body.intentId !== intent.id
    || body.scheduleId !== intent.scheduleId
    || body.installmentId !== intent.installmentId
    || intent.scheduleId !== schedule.id
  ) {
    throw new Error('SANDBOX_INTENT_MISMATCH');
  }
  if (intent.status === 'confirmed') return { intent, schedule };
  const nextSchedule = transitionPaymentInstallment(schedule, intent.installmentId, 'recorded', at);
  return {
    intent: { ...intent, status: 'confirmed', updatedAt: at },
    schedule: nextSchedule,
  };
}
