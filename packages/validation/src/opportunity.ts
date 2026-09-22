import { assertOpaqueLeadId } from '../../domain/src/lead.ts';

export type FieldError = { field: string; reason: string };

export type OpportunityCreateRequest = { leadId: string };

export function validateOpportunityCreateRequest(
  value: unknown,
): { ok: true; value: OpportunityCreateRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  const extra = Object.keys(body).filter(key => key !== 'leadId');
  if (extra.length) return { ok: false, errors: extra.map(field => ({ field, reason: 'UNKNOWN_FIELD' })) };
  if (typeof body.leadId !== 'string') return { ok: false, errors: [{ field: 'leadId', reason: 'STRING_REQUIRED' }] };
  if (Object.hasOwn(body, 'status') || Object.hasOwn(body, 'stage')) {
    return { ok: false, errors: [{ field: 'status', reason: 'CLIENT_STATUS_FORBIDDEN' }] };
  }
  try {
    return { ok: true, value: { leadId: assertOpaqueLeadId(body.leadId) } };
  } catch {
    return { ok: false, errors: [{ field: 'leadId', reason: 'LEAD_ID_INVALID' }] };
  }
}
