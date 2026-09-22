import { assertOpaqueOfferId } from '../../domain/src/offer.ts';

export type FieldError = { field: string; reason: string };

export type ContractCreateRequest = { offerId: string };

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
