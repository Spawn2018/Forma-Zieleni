import { assertOpaqueOfferId } from '../../domain/src/offer.ts';
import {
  CONTRACT_STATUSES,
  type ContractStatus,
} from '../../domain/src/contract.ts';

export type FieldError = { field: string; reason: string };

export type ContractCreateRequest = { offerId: string };

export type ContractLifecycleAdvanceRequest = { status: ContractStatus };

const FORBIDDEN_LIFECYCLE_KEYS = new Set([
  'payment',
  'provider',
  'providerRef',
  'provider_ref',
  'signing',
  'signature',
  'qes',
  'qualified',
  'webhook',
  'document',
  'pdf',
  'secret',
  'amount',
  'amountPln',
  'blik',
  'card',
  'offerId',
  'signedAt',
  'fromStatus',
]);

export function validateContractCreateRequest(
  value: unknown,
): { ok: true; value: ContractCreateRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  if (Object.hasOwn(body, 'status') || Object.hasOwn(body, 'signedAt') || Object.hasOwn(body, 'provider')) {
    return { ok: false, errors: [{ field: 'status', reason: 'CLIENT_LIFECYCLE_FORBIDDEN' }] };
  }
  const extra = Object.keys(body).filter(key => key !== 'offerId');
  if (extra.length) return { ok: false, errors: extra.map(field => ({ field, reason: 'UNKNOWN_FIELD' })) };
  if (typeof body.offerId !== 'string') {
    return { ok: false, errors: [{ field: 'offerId', reason: 'STRING_REQUIRED' }] };
  }
  try {
    return { ok: true, value: { offerId: assertOpaqueOfferId(body.offerId) } };
  } catch {
    return { ok: false, errors: [{ field: 'offerId', reason: 'OFFER_ID_INVALID' }] };
  }
}

export function validateContractLifecycleAdvanceRequest(
  value: unknown,
): { ok: true; value: ContractLifecycleAdvanceRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  for (const key of Object.keys(body)) {
    if (FORBIDDEN_LIFECYCLE_KEYS.has(key)) {
      return { ok: false, errors: [{ field: key, reason: 'CONTRACT_SURFACE_FORBIDDEN' }] };
    }
  }
  const extra = Object.keys(body).filter(key => key !== 'status');
  if (extra.length) return { ok: false, errors: extra.map(field => ({ field, reason: 'UNKNOWN_FIELD' })) };
  if (typeof body.status !== 'string') {
    return { ok: false, errors: [{ field: 'status', reason: 'STRING_REQUIRED' }] };
  }
  if (!(CONTRACT_STATUSES as readonly string[]).includes(body.status)) {
    return { ok: false, errors: [{ field: 'status', reason: 'STATUS_INVALID' }] };
  }
  return { ok: true, value: { status: body.status as ContractStatus } };
}
