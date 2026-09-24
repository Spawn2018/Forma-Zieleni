/** Owner/designer capacity windows. No calendar SaaS and no spend. */

export const CAPACITY_KINDS = ['consultation', 'start'] as const;

export type CapacityKind = (typeof CAPACITY_KINDS)[number];

/** Availability window for an opaque staff actor. No customer PII. */
export type CapacityWindow = {
  id: string;
  actorId: string;
  kind: CapacityKind;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CapacityDecision =
  | { ok: true; windowId: string }
  | { ok: false; reason: 'CAPACITY_EMPTY' | 'CAPACITY_OUTSIDE' | 'CAPACITY_KIND_MISMATCH' };

const OPAQUE_ID = /^[a-z][a-z0-9]{15,63}$/;
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const FORBIDDEN_KEYS = new Set([
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

export function assertOpaqueCapacityWindowId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:cap|capacity|window|id)\d+$/i.test(id)) {
    throw new Error('CAPACITY_WINDOW_ID_GUESSABLE');
  }
  return id;
}

export function assertOpaqueCapacityActorId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:actor|user|staff|id)\d+$/i.test(id)) {
    throw new Error('CAPACITY_ACTOR_ID_GUESSABLE');
  }
  return id;
}

function assertNoCalendarSurface(input: object): void {
  for (const key of Object.keys(input)) {
    if (FORBIDDEN_KEYS.has(key)) throw new Error('CAPACITY_CALENDAR_SURFACE_FORBIDDEN');
  }
}

function assertInstant(value: string, code: string): string {
  if (typeof value !== 'string' || !INSTANT.test(value)) throw new Error(code);
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) throw new Error(code);
  const match = value.match(/^(.*)(\.\d{1,3})?Z$/);
  const fraction = match?.[2] ? match[2].slice(1).padEnd(3, '0') : '000';
  const normalized = `${match?.[1] ?? value.replace(/Z$/, '')}.${fraction}Z`;
  if (new Date(ms).toISOString() !== normalized) throw new Error(code);
  return value;
}

export function createCapacityWindow(
  id: string,
  actorId: string,
  kind: CapacityKind,
  startsAt: string,
  endsAt: string,
  at: string,
  surface: Record<string, unknown> = {},
): CapacityWindow {
  assertNoCalendarSurface({ id, actorId, kind, startsAt, endsAt, ...surface });
  if (!CAPACITY_KINDS.includes(kind)) throw new Error('CAPACITY_KIND_INVALID');
  const start = assertInstant(startsAt, 'CAPACITY_START_INVALID');
  const end = assertInstant(endsAt, 'CAPACITY_END_INVALID');
  const created = assertInstant(at, 'CAPACITY_AT_INVALID');
  if (Date.parse(end) <= Date.parse(start)) throw new Error('CAPACITY_RANGE_INVALID');
  return {
    id: assertOpaqueCapacityWindowId(id),
    actorId: assertOpaqueCapacityActorId(actorId),
    kind,
    startsAt: start,
    endsAt: end,
    createdAt: created,
    updatedAt: created,
  };
}

/**
 * Refuse a promised consultation or project start outside recorded capacity.
 * Empty capacity never authorizes a promise. When actorId is set, only that
 * staff actor's windows count.
 */
export function decidePromisedDate(
  windows: readonly CapacityWindow[],
  kind: CapacityKind,
  promisedAt: string,
  actorId?: string,
): CapacityDecision {
  if (!CAPACITY_KINDS.includes(kind)) throw new Error('CAPACITY_KIND_INVALID');
  const instant = assertInstant(promisedAt, 'CAPACITY_PROMISE_INVALID');
  const ms = Date.parse(instant);
  const actor = actorId === undefined ? null : assertOpaqueCapacityActorId(actorId);
  const matching = windows.filter((window) => {
    if (window.kind !== kind) return false;
    if (actor !== null && window.actorId !== actor) return false;
    return true;
  });
  if (matching.length === 0) {
    if (windows.length === 0) return { ok: false, reason: 'CAPACITY_EMPTY' };
    if (actor !== null && windows.some((window) => window.kind === kind)) {
      return { ok: false, reason: 'CAPACITY_EMPTY' };
    }
    return windows.some((window) => window.kind === kind)
      ? { ok: false, reason: 'CAPACITY_OUTSIDE' }
      : { ok: false, reason: 'CAPACITY_KIND_MISMATCH' };
  }
  for (const window of matching) {
    const start = Date.parse(window.startsAt);
    const end = Date.parse(window.endsAt);
    if (ms >= start && ms < end) return { ok: true, windowId: window.id };
  }
  return { ok: false, reason: 'CAPACITY_OUTSIDE' };
}

export function assertPromisedDateInsideCapacity(
  windows: readonly CapacityWindow[],
  kind: CapacityKind,
  promisedAt: string,
  actorId?: string,
): string {
  const decision = decidePromisedDate(windows, kind, promisedAt, actorId);
  if (!decision.ok) throw new Error(decision.reason);
  return decision.windowId;
}
