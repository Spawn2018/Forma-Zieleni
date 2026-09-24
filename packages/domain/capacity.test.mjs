import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertPromisedDateInsideCapacity,
  createCapacityWindow,
  decidePromisedDate,
} from './src/capacity.ts';

const AT = '2026-09-24T12:00:00.000Z';
const ACTOR = 'astaffactor00001';

test('capacity windows record opaque actor ids without calendar SaaS or PII fields', () => {
  const window = createCapacityWindow(
    'cwindowopaque0001',
    ACTOR,
    'consultation',
    '2026-10-01T08:00:00.000Z',
    '2026-10-01T12:00:00.000Z',
    AT,
  );
  assert.equal(window.actorId, ACTOR);
  assert.equal(window.kind, 'consultation');
  assert.equal(Object.hasOwn(window, 'google'), false);
  assert.equal(Object.hasOwn(window, 'email'), false);
  assert.equal(Object.hasOwn(window, 'phone'), false);
  assert.equal(Object.hasOwn(window, 'customer'), false);
  assert.throws(
    () => createCapacityWindow('cap1', ACTOR, 'consultation', '2026-10-01T08:00:00.000Z', '2026-10-01T12:00:00.000Z', AT),
    /CAPACITY_WINDOW_ID_GUESSABLE/,
  );
  assert.throws(
    () => createCapacityWindow('cwindowopaque0002', ACTOR, 'consultation', '2026-10-01T12:00:00.000Z', '2026-10-01T08:00:00.000Z', AT),
    /CAPACITY_RANGE_INVALID/,
  );
  assert.throws(
    () => createCapacityWindow('cwindowopaque0003', 'user1', 'consultation', '2026-10-01T08:00:00.000Z', '2026-10-01T12:00:00.000Z', AT),
    /CAPACITY_ACTOR_ID_GUESSABLE/,
  );
});

test('createCapacityWindow refuses smuggled calendar SaaS keys on the input bag', () => {
  assert.throws(
    () => createCapacityWindow(
      'cwindowopaque0004',
      ACTOR,
      'consultation',
      '2026-10-01T08:00:00.000Z',
      '2026-10-01T12:00:00.000Z',
      AT,
      { google: 'cal-1' },
    ),
    /CAPACITY_CALENDAR_SURFACE_FORBIDDEN/,
  );
});

test('promised consultation outside capacity is refused; inside is accepted', () => {
  const window = createCapacityWindow(
    'cwindowopaque0010',
    ACTOR,
    'consultation',
    '2026-10-01T08:00:00.000Z',
    '2026-10-01T12:00:00.000Z',
    AT,
  );
  assert.deepEqual(decidePromisedDate([], 'consultation', '2026-10-01T09:00:00.000Z'), {
    ok: false,
    reason: 'CAPACITY_EMPTY',
  });
  assert.deepEqual(decidePromisedDate([window], 'consultation', '2026-10-01T13:00:00.000Z'), {
    ok: false,
    reason: 'CAPACITY_OUTSIDE',
  });
  assert.deepEqual(decidePromisedDate([window], 'start', '2026-10-01T09:00:00.000Z'), {
    ok: false,
    reason: 'CAPACITY_KIND_MISMATCH',
  });
  const inside = decidePromisedDate([window], 'consultation', '2026-10-01T09:00:00.000Z');
  assert.deepEqual(inside, { ok: true, windowId: window.id });
  assert.equal(
    assertPromisedDateInsideCapacity([window], 'consultation', '2026-10-01T09:00:00.000Z'),
    window.id,
  );
  assert.throws(
    () => assertPromisedDateInsideCapacity([window], 'consultation', '2026-10-01T12:00:00.000Z'),
    /CAPACITY_OUTSIDE/,
  );
});

test('start capacity is distinct from consultation capacity', () => {
  const start = createCapacityWindow(
    'cwindowopaque0020',
    ACTOR,
    'start',
    '2026-11-01T00:00:00.000Z',
    '2026-11-08T00:00:00.000Z',
    AT,
  );
  assert.equal(assertPromisedDateInsideCapacity([start], 'start', '2026-11-03T12:00:00.000Z'), start.id);
  assert.throws(
    () => assertPromisedDateInsideCapacity([start], 'consultation', '2026-11-03T12:00:00.000Z'),
    /CAPACITY_KIND_MISMATCH/,
  );
});

test('actor-scoped promises ignore another staff window and reject calendar-normalized dates', () => {
  const other = 'bstaffactor00002';
  const mine = createCapacityWindow(
    'cwindowopaque0030',
    ACTOR,
    'consultation',
    '2026-10-01T08:00:00.000Z',
    '2026-10-01T12:00:00.000Z',
    AT,
  );
  const theirs = createCapacityWindow(
    'cwindowopaque0031',
    other,
    'consultation',
    '2026-10-01T08:00:00.000Z',
    '2026-10-01T12:00:00.000Z',
    AT,
  );
  assert.equal(
    assertPromisedDateInsideCapacity([mine, theirs], 'consultation', '2026-10-01T09:00:00.000Z', ACTOR),
    mine.id,
  );
  assert.deepEqual(
    decidePromisedDate([theirs], 'consultation', '2026-10-01T09:00:00.000Z', ACTOR),
    { ok: false, reason: 'CAPACITY_EMPTY' },
  );
  assert.throws(
    () => createCapacityWindow('cwindowopaque0032', ACTOR, 'consultation', '2026-02-30T08:00:00.000Z', '2026-02-30T12:00:00.000Z', AT),
    /CAPACITY_START_INVALID|CAPACITY_END_INVALID/,
  );
});
