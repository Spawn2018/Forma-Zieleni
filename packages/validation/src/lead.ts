import { PUBLIC_LEAD_SOURCES, normalizeCapture, type LeadCapture, type PublicLeadSource } from '../../domain/src/lead.ts';

export type LeadCaptureRequest = LeadCapture & { source: PublicLeadSource };

export type FieldError = { field: string; reason: string };

function stringField(value: unknown, field: string, optional = false): { ok: true; value?: string } | { ok: false; errors: FieldError[] } {
  if (value === undefined) {
    if (optional) return { ok: true };
    return { ok: false, errors: [{ field, reason: 'STRING_REQUIRED' }] };
  }
  if (typeof value !== 'string') return { ok: false, errors: [{ field, reason: 'STRING_REQUIRED' }] };
  return { ok: true, value };
}

export function validateLeadCaptureRequest(value: unknown): { ok: true; value: LeadCaptureRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object') return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  const body = value as Record<string, unknown>;
  const extra = Object.keys(body).filter(key => !['name', 'phone', 'email', 'locality', 'siteAnalysisRequested', 'source'].includes(key));
  if (extra.length) return { ok: false, errors: extra.map(field => ({ field, reason: 'UNKNOWN_FIELD' })) };
  if (typeof body.source !== 'string' || !PUBLIC_LEAD_SOURCES.includes(body.source as PublicLeadSource)) {
    return { ok: false, errors: [{ field: 'source', reason: 'LEAD_SOURCE_INVALID' }] };
  }
  if (typeof body.siteAnalysisRequested !== 'boolean') {
    return { ok: false, errors: [{ field: 'siteAnalysisRequested', reason: 'BOOLEAN_REQUIRED' }] };
  }
  const name = stringField(body.name, 'name');
  if (!name.ok) return name;
  const phone = stringField(body.phone, 'phone');
  if (!phone.ok) return phone;
  const email = stringField(body.email, 'email', true);
  if (!email.ok) return email;
  const locality = stringField(body.locality, 'locality', true);
  if (!locality.ok) return locality;
  try {
    return {
      ok: true,
      value: {
        ...normalizeCapture({
          name: name.value ?? '',
          phone: phone.value ?? '',
          email: email.value,
          locality: locality.value,
          siteAnalysisRequested: body.siteAnalysisRequested,
        }),
        source: body.source as PublicLeadSource,
      },
    };
  } catch (error) {
    return { ok: false, errors: [{ field: 'contact', reason: error instanceof Error ? error.message : 'LEAD_INVALID' }] };
  }
}

export function problem(code: string, message: string, requestId: string, details: FieldError[] = []) {
  return { error: { code, message, requestId, details } };
}
