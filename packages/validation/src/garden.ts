import { assertOpaqueProjectId } from '../../domain/src/project.ts';

export type FieldError = { field: string; reason: string };

export type GardenCreateRequest = { projectId: string };

const FORBIDDEN = new Set([
  'twinDatabase',
  'liveTwinUi',
  'liveGarden',
  'sensorFeed',
  'plants',
  'status',
  'clientSubject',
  'xr',
  'advice',
]);

export function validateGardenCreateRequest(
  value: unknown,
): { ok: true; value: GardenCreateRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  for (const key of Object.keys(body)) {
    if (FORBIDDEN.has(key)) {
      return { ok: false, errors: [{ field: key, reason: 'GARDEN_SURFACE_FORBIDDEN' }] };
    }
  }
  const extra = Object.keys(body).filter(key => key !== 'projectId');
  if (extra.length) return { ok: false, errors: extra.map(field => ({ field, reason: 'UNKNOWN_FIELD' })) };
  if (typeof body.projectId !== 'string') {
    return { ok: false, errors: [{ field: 'projectId', reason: 'STRING_REQUIRED' }] };
  }
  try {
    return { ok: true, value: { projectId: assertOpaqueProjectId(body.projectId) } };
  } catch {
    return { ok: false, errors: [{ field: 'projectId', reason: 'PROJECT_ID_INVALID' }] };
  }
}

/** Empty body for staff project delivery. Rejects provider/payment invent. */
export function validateProjectDeliverRequest(
  value: unknown,
): { ok: true; value: Record<string, never> } | { ok: false; errors: FieldError[] } {
  if (value === undefined || value === null) {
    return { ok: true, value: {} };
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  const keys = Object.keys(body);
  if (keys.length) {
    return { ok: false, errors: keys.map(field => ({
      field,
      reason: FORBIDDEN.has(field) || field === 'payment' || field === 'provider'
        ? 'CLIENT_LIFECYCLE_FORBIDDEN'
        : 'UNKNOWN_FIELD',
    })) };
  }
  return { ok: true, value: {} };
}
