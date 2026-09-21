import { LEAD_SOURCES, normalizeCapture, type LeadCapture, type LeadSource } from '../../domain/src/lead.ts';

export type LeadCaptureRequest = LeadCapture & { source: LeadSource };

export type FieldError = { field: string; reason: string };

export function validateLeadCaptureRequest(value: unknown): { ok: true; value: LeadCaptureRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object') return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  const body = value as Record<string, unknown>;
  const extra = Object.keys(body).filter(key => !['name', 'phone', 'email', 'locality', 'siteAnalysisRequested', 'source'].includes(key));
  if (extra.length) return { ok: false, errors: extra.map(field => ({ field, reason: 'UNKNOWN_FIELD' })) };
  if (typeof body.source !== 'string' || !LEAD_SOURCES.includes(body.source as LeadSource)) {
    return { ok: false, errors: [{ field: 'source', reason: 'LEAD_SOURCE_INVALID' }] };
  }
  if (typeof body.siteAnalysisRequested !== 'boolean') {
    return { ok: false, errors: [{ field: 'siteAnalysisRequested', reason: 'BOOLEAN_REQUIRED' }] };
  }
  try {
    return {
      ok: true,
      value: {
        ...normalizeCapture({
          name: String(body.name ?? ''),
          phone: String(body.phone ?? ''),
          email: body.email === undefined ? undefined : String(body.email),
          locality: body.locality === undefined ? undefined : String(body.locality),
          siteAnalysisRequested: body.siteAnalysisRequested,
        }),
        source: body.source as LeadSource,
      },
    };
  } catch (error) {
    return { ok: false, errors: [{ field: 'contact', reason: error instanceof Error ? error.message : 'LEAD_INVALID' }] };
  }
}

export function problem(code: string, message: string, requestId: string, details: FieldError[] = []) {
  return { error: { code, message, requestId, details } };
}
