import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCapacityDecisionRequest, validateCapacityWindowCloseRequest, validateCapacityWindowCreateRequest } from './src/capacity.ts';

const actorId = 'staffdesignerana1';
const windowBody = {
  actorId,
  kind: 'consultation',
  startsAt: '2026-06-01T08:00:00.000Z',
  endsAt: '2026-06-01T12:00:00.000Z',
};

test('validateCapacityWindowCreateRequest accepts an opaque staff window', () => {
  const ok = validateCapacityWindowCreateRequest(windowBody);
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.value.actorId, actorId);
});

test('validateCapacityWindowCreateRequest rejects calendar and customer fields', () => {
  for (const field of ['email', 'calendar', 'google', 'name', 'price']) {
    const bad = validateCapacityWindowCreateRequest({ ...windowBody, [field]: 'x' });
    assert.equal(bad.ok, false);
    if (!bad.ok) assert.equal(bad.errors[0].reason, 'CAPACITY_CALENDAR_SURFACE_FORBIDDEN');
  }
});

test('validateCapacityWindowCreateRequest rejects a reversed range and a guessable actor', () => {
  assert.equal(validateCapacityWindowCreateRequest({
    ...windowBody,
    endsAt: '2026-06-01T07:00:00.000Z',
  }).ok, false);
  assert.equal(validateCapacityWindowCreateRequest({ ...windowBody, actorId: 'actor1' }).ok, false);
});

test('validateCapacityWindowCloseRequest accepts only an empty body', () => {
  assert.equal(validateCapacityWindowCloseRequest({}).ok, true);
  assert.equal(validateCapacityWindowCloseRequest(null).ok, true);
  const mail = validateCapacityWindowCloseRequest({ email: 'a@b.c' });
  assert.equal(mail.ok, false);
  const range = validateCapacityWindowCloseRequest({ endsAt: '2026-06-01T13:00:00.000Z' });
  assert.equal(range.ok, false);
});

test('validateCapacityDecisionRequest accepts a promised instant', () => {
  const ok = validateCapacityDecisionRequest({
    kind: 'start',
    promisedAt: '2026-06-02T09:00:00.000Z',
    actorId,
  });
  assert.equal(ok.ok, true);
});
