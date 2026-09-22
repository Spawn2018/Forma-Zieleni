import { assertOpaqueOpportunityId } from '../../domain/src/opportunity.ts';

export type FieldError = { field: string; reason: string };

export type OfferCreateRequest = { opportunityId: string };

export function validateOfferCreateRequest(
  value: unknown,
): { ok: true; value: OfferCreateRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  const extra = Object.keys(body).filter(key => key !== 'opportunityId');
  if (extra.length) return { ok: false, errors: extra.map(field => ({ field, reason: 'UNKNOWN_FIELD' })) };
  if (typeof body.opportunityId !== 'string') {
    return { ok: false, errors: [{ field: 'opportunityId', reason: 'STRING_REQUIRED' }] };
  }
  if (Object.hasOwn(body, 'status') || Object.hasOwn(body, 'price') || Object.hasOwn(body, 'amountPln')) {
    return { ok: false, errors: [{ field: 'status', reason: 'CLIENT_COMMERCIAL_FORBIDDEN' }] };
  }
  try {
    return { ok: true, value: { opportunityId: assertOpaqueOpportunityId(body.opportunityId) } };
  } catch {
    return { ok: false, errors: [{ field: 'opportunityId', reason: 'OPPORTUNITY_ID_INVALID' }] };
  }
}
