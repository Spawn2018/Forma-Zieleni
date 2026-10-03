import {
  CAPACITY_KINDS,
  assertOpaqueCapacityActorId,
  type CapacityKind,
} from '../../domain/src/capacity.ts';

export type FieldError = { field: string; reason: string };

export type CapacityWindowCreateRequest = {
  actorId: string;
  kind: CapacityKind;
  startsAt: string;
  endsAt: string;
};

export type CapacityDecisionRequest = {
  kind: CapacityKind;
  promisedAt: string;
  actorId?: string;
};

const FORBIDDEN = new Set([
  'google',
  'calendar',
  'ical',
  'outlook',
  'webhook',
  'secret',
  'email',
  'phone',
  'name',
  'customer',
  'client',
  'spend',
  'price',
]);

const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

function rejectSurface(body: Record<string, unknown>): FieldError[] | null {
  const errors: FieldError[] = [];
  for (const key of Object.keys(body)) {
    if (FORBIDDEN.has(key)) errors.push({ field: key, reason: 'CAPACITY_CALENDAR_SURFACE_FORBIDDEN' });
  }
  return errors.length ? errors : null;
}

function requireInstant(value: unknown, field: string): { ok: true; value: string } | { ok: false; error: FieldError } {
  if (typeof value !== 'string' || !INSTANT.test(value) || !Number.isFinite(Date.parse(value))) {
    return { ok: false, error: { field, reason: 'INSTANT_INVALID' } };
  }
  return { ok: true, value };
}

export function validateCapacityWindowCreateRequest(
  value: unknown,
): { ok: true; value: CapacityWindowCreateRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  const surface = rejectSurface(body);
  if (surface) return { ok: false, errors: surface };
  const allowed = new Set(['actorId', 'kind', 'startsAt', 'endsAt']);
  const extra = Object.keys(body).filter(key => !allowed.has(key));
  if (extra.length) return { ok: false, errors: extra.map(field => ({ field, reason: 'UNKNOWN_FIELD' })) };
  if (!CAPACITY_KINDS.includes(body.kind as CapacityKind)) {
    return { ok: false, errors: [{ field: 'kind', reason: 'CAPACITY_KIND_INVALID' }] };
  }
  if (typeof body.actorId !== 'string') {
    return { ok: false, errors: [{ field: 'actorId', reason: 'STRING_REQUIRED' }] };
  }
  let actorId: string;
  try {
    actorId = assertOpaqueCapacityActorId(body.actorId);
  } catch {
    return { ok: false, errors: [{ field: 'actorId', reason: 'CAPACITY_ACTOR_ID_INVALID' }] };
  }
  const starts = requireInstant(body.startsAt, 'startsAt');
  if (!starts.ok) return { ok: false, errors: [starts.error] };
  const ends = requireInstant(body.endsAt, 'endsAt');
  if (!ends.ok) return { ok: false, errors: [ends.error] };
  if (Date.parse(ends.value) <= Date.parse(starts.value)) {
    return { ok: false, errors: [{ field: 'endsAt', reason: 'CAPACITY_RANGE_INVALID' }] };
  }
  return {
    ok: true,
    value: {
      actorId,
      kind: body.kind as CapacityKind,
      startsAt: starts.value,
      endsAt: ends.value,
    },
  };
}

export function validateCapacityDecisionRequest(
  value: unknown,
): { ok: true; value: CapacityDecisionRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  const surface = rejectSurface(body);
  if (surface) return { ok: false, errors: surface };
  const allowed = new Set(['kind', 'promisedAt', 'actorId']);
  const extra = Object.keys(body).filter(key => !allowed.has(key));
  if (extra.length) return { ok: false, errors: extra.map(field => ({ field, reason: 'UNKNOWN_FIELD' })) };
  if (!CAPACITY_KINDS.includes(body.kind as CapacityKind)) {
    return { ok: false, errors: [{ field: 'kind', reason: 'CAPACITY_KIND_INVALID' }] };
  }
  const promised = requireInstant(body.promisedAt, 'promisedAt');
  if (!promised.ok) return { ok: false, errors: [promised.error] };
  if (body.actorId === undefined) {
    return { ok: true, value: { kind: body.kind as CapacityKind, promisedAt: promised.value } };
  }
  if (typeof body.actorId !== 'string') {
    return { ok: false, errors: [{ field: 'actorId', reason: 'STRING_REQUIRED' }] };
  }
  try {
    return {
      ok: true,
      value: {
        kind: body.kind as CapacityKind,
        promisedAt: promised.value,
        actorId: assertOpaqueCapacityActorId(body.actorId),
      },
    };
  } catch {
    return { ok: false, errors: [{ field: 'actorId', reason: 'CAPACITY_ACTOR_ID_INVALID' }] };
  }
}

/** Empty body. Callers cannot move the range or attach a calendar field. */
export function validateCapacityWindowCloseRequest(
  value: unknown,
): { ok: true; value: Record<string, never> } | { ok: false; errors: FieldError[] } {
  if (value === undefined || value === null) return { ok: true, value: {} };
  if (typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  const surface = rejectSurface(body);
  if (surface) return { ok: false, errors: surface };
  const extra = Object.keys(body);
  if (extra.length) return { ok: false, errors: extra.map(field => ({ field, reason: 'UNKNOWN_FIELD' })) };
  return { ok: true, value: {} };
}
