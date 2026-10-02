import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  assertOpaqueContractId,
  assertOpaquePaymentInstallmentId,
  assertOpaquePaymentScheduleId,
  createPaymentSchedule,
  replacePaymentScheduleInstallments,
  transitionPaymentInstallment,
  acceptSandboxWebhook,
  assertOpaqueSandboxIntentId,
  openSandboxIntent,
  type PaymentInstallmentStatus,
  type PaymentSchedule,
  type SandboxPaymentIntent,
} from '@forma-zieleni/domain';
import type { Actor } from './auth.ts';
import { ApiFailure, badRequest } from './errors.ts';
import { newOpaqueId, newPaymentInstallmentId, newPaymentScheduleId } from './ids.ts';
import { decodeCursor, encodeCursor, requestHash } from './leads.ts';
import type { LeadStore, PaymentScheduleListQuery, SortField, StoredReply } from './store.ts';

const SORTS = new Set<SortField>(['createdAt', '-createdAt', 'updatedAt', '-updatedAt']);

export function parsePaymentScheduleListQuery(input: {
  limit?: string;
  cursor?: string;
  sort?: string;
  contractId?: string;
}): PaymentScheduleListQuery {
  const sort = input.sort ?? '-createdAt';
  if (!SORTS.has(sort as SortField)) throw badRequest('SORT_INVALID', 'Sort is not valid.');
  const limitText = input.limit ?? '20';
  if (!/^(?:[1-9]|[1-9][0-9]|100)$/.test(limitText)) throw badRequest('LIMIT_INVALID', 'Limit is not valid.');
  let contractId: string | undefined;
  if (input.contractId !== undefined && input.contractId !== '') {
    try {
      contractId = assertOpaqueContractId(input.contractId);
    } catch {
      throw badRequest('CONTRACT_ID_INVALID', 'Contract id is not valid.');
    }
  }
  return {
    limit: Number(limitText),
    sort: sort as SortField,
    contractId,
    cursor: input.cursor ? decodeCursor(sort as SortField, input.cursor) : undefined,
  };
}

function sandboxSignatureMatches(rawBody: string, signature: string, secret: string): boolean {
  if (secret.length < 16) throw new Error('SANDBOX_SECRET_UNCONFIGURED');
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const left = Buffer.from(expected);
  const right = Buffer.from(signature.trim().toLowerCase());
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

async function replayOrReserve(
  tx: Parameters<Parameters<LeadStore['transaction']>[0]>[0],
  scope: string,
  key: string,
  hash: string,
): Promise<StoredReply | null> {
  const existing = await tx.findIdempotency(scope, key);
  if (!existing) return null;
  if (existing.requestHash !== hash) {
    throw new ApiFailure(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency key was already used with a different request.');
  }
  return existing;
}

function mapDomainError(error: unknown): never {
  if (!(error instanceof Error)) throw error;
  switch (error.message) {
    case 'CONTRACT_NOT_READY':
      throw new ApiFailure(409, 'CONTRACT_NOT_READY', 'Payment schedule requires a draft contract.');
    case 'PAYMENT_SCHEDULE_EMPTY':
      throw badRequest('PAYMENT_SCHEDULE_EMPTY', 'Payment schedule needs installments.');
    case 'PAYMENT_CURRENCY_INVALID':
      throw badRequest('PAYMENT_CURRENCY_INVALID', 'Currency is not valid.');
    case 'PAYMENT_AMOUNT_INVALID':
      throw badRequest('PAYMENT_AMOUNT_INVALID', 'Installment amount is not valid.');
    case 'PAYMENT_SEQUENCE_INVALID':
    case 'PAYMENT_SEQUENCE_DUPLICATE':
      throw badRequest(error.message, 'Installment sequence is not valid.');
    case 'PAYMENT_PROVIDER_SURFACE_FORBIDDEN':
      throw badRequest('PAYMENT_PROVIDER_SURFACE_FORBIDDEN', 'Provider payment fields are forbidden.');
    case 'PAYMENT_SCHEDULE_LOCKED':
      throw new ApiFailure(409, 'PAYMENT_SCHEDULE_LOCKED', 'Schedule lines can no longer be replaced.');
    case 'PAYMENT_CONTRACT_MISMATCH':
      throw badRequest('PAYMENT_CONTRACT_MISMATCH', 'Schedule does not belong to the contract.');
    case 'PAYMENT_INSTALLMENT_UNKNOWN':
      throw new ApiFailure(404, 'PAYMENT_INSTALLMENT_NOT_FOUND', 'Installment was not found.');
    case 'PAYMENT_TRANSITION_FORBIDDEN':
      throw new ApiFailure(409, 'PAYMENT_TRANSITION_FORBIDDEN', 'Installment transition is not allowed.');
    case 'PAYMENT_STATUS_INVALID':
      throw badRequest('PAYMENT_STATUS_INVALID', 'Installment status is not valid.');
    case 'SANDBOX_SIGNATURE_INVALID':
      throw new ApiFailure(401, 'SANDBOX_SIGNATURE_INVALID', 'Sandbox webhook signature is not valid.');
    case 'SANDBOX_SECRET_UNCONFIGURED':
      throw new ApiFailure(503, 'SANDBOX_SECRET_UNCONFIGURED', 'Sandbox webhook secret is not configured.');
    case 'SANDBOX_INTENT_MISMATCH':
      throw new ApiFailure(409, 'SANDBOX_INTENT_MISMATCH', 'Sandbox webhook does not match the intent.');
    case 'SANDBOX_WEBHOOK_INVALID':
      throw badRequest('SANDBOX_WEBHOOK_INVALID', 'Sandbox webhook body is not valid.');
    case 'SANDBOX_PROVIDER_FORBIDDEN':
      throw badRequest('SANDBOX_PROVIDER_FORBIDDEN', 'Only the sandbox provider is accepted.');
    case 'SANDBOX_INTENT_ID_GUESSABLE':
      throw badRequest('SANDBOX_INTENT_ID_INVALID', 'Sandbox intent id is not valid.');
    default:
      throw error;
  }
}

export async function createPaymentScheduleRecord(
  store: LeadStore,
  input: {
    contractId: string;
    currency: string;
    installments: ReadonlyArray<{ sequence: number; amountMinor: number; dueAt?: string | null }>;
  },
  actor: Actor,
  idempotencyKey: string,
  at: string,
): Promise<PaymentSchedule> {
  const hash = requestHash({
    scope: 'payment-schedule.create',
    contractId: input.contractId,
    currency: input.currency,
    installments: input.installments,
  });
  return store.transaction(async tx => {
    const replay = await replayOrReserve(tx, 'payment-schedule.create', idempotencyKey, hash);
    if (replay) return replay.responseBody as PaymentSchedule;
    const contract = await tx.findContract(input.contractId);
    if (!contract) throw new ApiFailure(404, 'CONTRACT_NOT_FOUND', 'Contract was not found.');
    const existing = await tx.findPaymentScheduleByContract(input.contractId);
    if (existing) throw new ApiFailure(409, 'PAYMENT_SCHEDULE_EXISTS', 'A payment schedule already exists for this contract.');
    const offer = await tx.findOffer(contract.offerId);
    if (!offer) throw new ApiFailure(404, 'OFFER_NOT_FOUND', 'Offer was not found.');
    const opportunity = await tx.findOpportunity(offer.opportunityId);
    if (!opportunity) throw new ApiFailure(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity was not found.');
    let schedule: PaymentSchedule;
    try {
      schedule = createPaymentSchedule(
        newPaymentScheduleId(),
        contract,
        input.currency,
        input.installments.map((item) => ({
          id: newPaymentInstallmentId(),
          sequence: item.sequence,
          amountMinor: item.amountMinor,
          ...(item.dueAt !== undefined ? { dueAt: item.dueAt } : {}),
        })),
        at,
      );
    } catch (error) {
      mapDomainError(error);
    }
    await tx.insertPaymentSchedule(schedule);
    await tx.insertAudit({
      id: newOpaqueId('a'),
      action: 'payment.schedule_created',
      actorId: actor.actorId,
      leadId: opportunity.leadId,
      at,
      metadata: {
        status: contract.status,
        contractId: contract.id,
        scheduleId: schedule.id,
      },
    });
    await tx.saveIdempotency(
      'payment-schedule.create',
      idempotencyKey,
      { requestHash: hash, responseStatus: 201, responseBody: schedule },
      at,
    );
    return schedule;
  });
}

export async function replacePaymentScheduleRecord(
  store: LeadStore,
  scheduleId: string,
  installments: ReadonlyArray<{ sequence: number; amountMinor: number; dueAt?: string | null }>,
  actor: Actor,
  idempotencyKey: string,
  at: string,
): Promise<PaymentSchedule> {
  const hash = requestHash({
    scope: 'payment-schedule.replace',
    scheduleId,
    installments,
  });
  return store.transaction(async tx => {
    const replay = await replayOrReserve(tx, 'payment-schedule.replace', idempotencyKey, hash);
    if (replay) return replay.responseBody as PaymentSchedule;
    const current = await tx.findPaymentSchedule(scheduleId);
    if (!current) throw new ApiFailure(404, 'PAYMENT_SCHEDULE_NOT_FOUND', 'Payment schedule was not found.');
    const contract = await tx.findContract(current.contractId);
    if (!contract) throw new ApiFailure(404, 'CONTRACT_NOT_FOUND', 'Contract was not found.');
    const offer = await tx.findOffer(contract.offerId);
    if (!offer) throw new ApiFailure(404, 'OFFER_NOT_FOUND', 'Offer was not found.');
    const opportunity = await tx.findOpportunity(offer.opportunityId);
    if (!opportunity) throw new ApiFailure(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity was not found.');
    let schedule: PaymentSchedule;
    try {
      schedule = replacePaymentScheduleInstallments(
        current,
        contract,
        installments.map((item) => ({
          id: newPaymentInstallmentId(),
          sequence: item.sequence,
          amountMinor: item.amountMinor,
          ...(item.dueAt !== undefined ? { dueAt: item.dueAt } : {}),
        })),
        at,
      );
    } catch (error) {
      mapDomainError(error);
    }
    await tx.savePaymentSchedule(schedule);
    await tx.insertAudit({
      id: newOpaqueId('a'),
      action: 'payment.schedule_replaced',
      actorId: actor.actorId,
      leadId: opportunity.leadId,
      at,
      metadata: {
        status: contract.status,
        contractId: contract.id,
        scheduleId: schedule.id,
      },
    });
    await tx.saveIdempotency(
      'payment-schedule.replace',
      idempotencyKey,
      { requestHash: hash, responseStatus: 200, responseBody: schedule },
      at,
    );
    return schedule;
  });
}

export async function transitionPaymentInstallmentRecord(
  store: LeadStore,
  scheduleId: string,
  installmentId: string,
  nextStatus: Exclude<PaymentInstallmentStatus, 'scheduled'>,
  actor: Actor,
  idempotencyKey: string,
  at: string,
): Promise<PaymentSchedule> {
  const hash = requestHash({
    scope: 'payment-installment.transition',
    scheduleId,
    installmentId,
    status: nextStatus,
  });
  return store.transaction(async tx => {
    const replay = await replayOrReserve(tx, 'payment-installment.transition', idempotencyKey, hash);
    if (replay) return replay.responseBody as PaymentSchedule;
    const current = await tx.findPaymentSchedule(scheduleId);
    if (!current) throw new ApiFailure(404, 'PAYMENT_SCHEDULE_NOT_FOUND', 'Payment schedule was not found.');
    const contract = await tx.findContract(current.contractId);
    if (!contract) throw new ApiFailure(404, 'CONTRACT_NOT_FOUND', 'Contract was not found.');
    const offer = await tx.findOffer(contract.offerId);
    if (!offer) throw new ApiFailure(404, 'OFFER_NOT_FOUND', 'Offer was not found.');
    const opportunity = await tx.findOpportunity(offer.opportunityId);
    if (!opportunity) throw new ApiFailure(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity was not found.');
    let schedule: PaymentSchedule;
    try {
      schedule = transitionPaymentInstallment(current, installmentId, nextStatus, at);
    } catch (error) {
      mapDomainError(error);
    }
    await tx.savePaymentSchedule(schedule);
    await tx.insertAudit({
      id: newOpaqueId('a'),
      action: 'payment.installment_transitioned',
      actorId: actor.actorId,
      leadId: opportunity.leadId,
      at,
      metadata: {
        status: nextStatus,
        contractId: contract.id,
        scheduleId: schedule.id,
        installmentId,
      },
    });
    await tx.saveIdempotency(
      'payment-installment.transition',
      idempotencyKey,
      { requestHash: hash, responseStatus: 200, responseBody: schedule },
      at,
    );
    return schedule;
  });
}

export async function createSandboxIntentRecord(
  store: LeadStore,
  scheduleId: string,
  installmentId: string,
  actor: Actor,
  idempotencyKey: string,
  at: string,
): Promise<SandboxPaymentIntent> {
  const hash = requestHash({ scope: 'payment.sandbox-intent', scheduleId, installmentId });
  return store.transaction(async tx => {
    const replay = await replayOrReserve(tx, 'payment.sandbox-intent', idempotencyKey, hash);
    if (replay) return replay.responseBody as SandboxPaymentIntent;
    const schedule = await tx.findPaymentSchedule(scheduleId);
    if (!schedule) throw new ApiFailure(404, 'PAYMENT_SCHEDULE_NOT_FOUND', 'Payment schedule was not found.');
    const existing = await tx.findSandboxIntentByInstallment(installmentId);
    if (existing) throw new ApiFailure(409, 'SANDBOX_INTENT_EXISTS', 'A sandbox intent already exists for this installment.');
    const contract = await tx.findContract(schedule.contractId);
    if (!contract) throw new ApiFailure(404, 'CONTRACT_NOT_FOUND', 'Contract was not found.');
    const offer = await tx.findOffer(contract.offerId);
    if (!offer) throw new ApiFailure(404, 'OFFER_NOT_FOUND', 'Offer was not found.');
    const opportunity = await tx.findOpportunity(offer.opportunityId);
    if (!opportunity) throw new ApiFailure(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity was not found.');
    let intent: SandboxPaymentIntent;
    try {
      intent = openSandboxIntent(schedule, installmentId, assertOpaqueSandboxIntentId(newOpaqueId('b')), at);
    } catch (error) {
      mapDomainError(error);
    }
    await tx.insertSandboxIntent(intent);
    await tx.insertAudit({
      id: newOpaqueId('a'),
      action: 'payment.sandbox_intent_created',
      actorId: actor.actorId,
      leadId: opportunity.leadId,
      at,
      metadata: {
        status: intent.status,
        contractId: contract.id,
        scheduleId: schedule.id,
        installmentId,
      },
    });
    await tx.saveIdempotency(
      'payment.sandbox-intent',
      idempotencyKey,
      { requestHash: hash, responseStatus: 201, responseBody: intent },
      at,
    );
    return intent;
  });
}

export async function acceptSandboxWebhookRecord(
  store: LeadStore,
  rawBody: string,
  signature: string,
  secret: string,
  at: string,
): Promise<PaymentSchedule> {
  let intentId = '';
  try {
    const parsed = JSON.parse(rawBody) as { intentId?: unknown };
    if (typeof parsed.intentId !== 'string') throw new Error('SANDBOX_WEBHOOK_INVALID');
    intentId = parsed.intentId;
  } catch (error) {
    if (error instanceof Error && error.message === 'SANDBOX_WEBHOOK_INVALID') mapDomainError(error);
    throw badRequest('SANDBOX_WEBHOOK_INVALID', 'Sandbox webhook body is not valid.');
  }
  return store.transaction(async tx => {
    const intent = await tx.findSandboxIntent(intentId);
    if (!intent) throw new ApiFailure(404, 'SANDBOX_INTENT_NOT_FOUND', 'Sandbox intent was not found.');
    const schedule = await tx.findPaymentSchedule(intent.scheduleId);
    if (!schedule) throw new ApiFailure(404, 'PAYMENT_SCHEDULE_NOT_FOUND', 'Payment schedule was not found.');
    let next: { intent: SandboxPaymentIntent; schedule: PaymentSchedule };
    try {
      next = acceptSandboxWebhook(
        intent,
        schedule,
        rawBody,
        signature,
        (body) => sandboxSignatureMatches(body, signature, secret),
        at,
      );
    } catch (error) {
      mapDomainError(error);
    }
    if (next.intent.status === 'confirmed' && intent.status === 'pending') {
      await tx.saveSandboxIntent(next.intent);
      await tx.savePaymentSchedule(next.schedule);
      const contract = await tx.findContract(next.schedule.contractId);
      const offer = contract ? await tx.findOffer(contract.offerId) : null;
      const opportunity = offer ? await tx.findOpportunity(offer.opportunityId) : null;
      if (opportunity) {
        await tx.insertAudit({
          id: newOpaqueId('a'),
          action: 'payment.sandbox_webhook_confirmed',
          actorId: null,
          leadId: opportunity.leadId,
          at,
          metadata: {
            status: 'confirmed',
            scheduleId: next.schedule.id,
            installmentId: next.intent.installmentId,
          },
        });
      }
    }
    return next.schedule;
  });
}

export async function readPaymentSchedule(store: LeadStore, id: string): Promise<PaymentSchedule | null> {
  return store.transaction(tx => tx.findPaymentSchedule(id));
}

export async function listVisiblePaymentSchedules(
  store: LeadStore,
  query: PaymentScheduleListQuery,
): Promise<{ items: PaymentSchedule[]; nextCursor: string | null }> {
  const rows = await store.transaction(tx => tx.listPaymentSchedules({ ...query, limit: query.limit + 1 }));
  const page = rows.slice(0, query.limit);
  const last = page.at(-1);
  const nextCursor = rows.length > query.limit && last
    ? encodeCursor(query.sort, query.sort.includes('updatedAt') ? last.updatedAt : last.createdAt, last.id)
    : null;
  return { items: page, nextCursor };
}

export function pathPaymentScheduleId(value: string): string {
  try {
    return assertOpaquePaymentScheduleId(decodeURIComponent(value));
  } catch {
    throw badRequest('PAYMENT_SCHEDULE_ID_INVALID', 'Payment schedule id is not valid.');
  }
}

export function pathPaymentInstallmentId(value: string): string {
  try {
    return assertOpaquePaymentInstallmentId(decodeURIComponent(value));
  } catch {
    throw badRequest('PAYMENT_INSTALLMENT_ID_INVALID', 'Payment installment id is not valid.');
  }
}
