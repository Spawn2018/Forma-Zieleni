import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validateDecisionLogCreateRequest,
  validateProjectMilestoneCreateRequest,
} from './src/project-milestone.ts';

test('validateProjectMilestoneCreateRequest accepts staff milestone bodies', () => {
  const ok = validateProjectMilestoneCreateRequest({
    projectId: 'j9k2n4p6q8r0s2t4',
    title: 'Koncepcja',
    status: 'planned',
    dueAt: '2026-10-15T12:00:00.000Z',
  });
  assert.equal(ok.ok, true);
});

test('validateProjectMilestoneCreateRequest rejects payment/signing fields', () => {
  const bad = validateProjectMilestoneCreateRequest({
    projectId: 'j9k2n4p6q8r0s2t4',
    title: 'X',
    payment: true,
  });
  assert.equal(bad.ok, false);
});

test('validateDecisionLogCreateRequest accepts decision and change_order', () => {
  const decision = validateDecisionLogCreateRequest({
    projectId: 'j9k2n4p6q8r0s2t4',
    kind: 'decision',
    summary: 'Zatwierdzono układ',
  });
  assert.equal(decision.ok, true);
  const change = validateDecisionLogCreateRequest({
    projectId: 'j9k2n4p6q8r0s2t4',
    kind: 'change_order',
    summary: 'Zmiana scope',
    relatedMilestoneId: 'm9k2n4p6q8r0s2t4',
  });
  assert.equal(change.ok, true);
});

test('validateDecisionLogCreateRequest rejects client-supplied actor id', () => {
  const bad = validateDecisionLogCreateRequest({
    projectId: 'j9k2n4p6q8r0s2t4',
    kind: 'decision',
    summary: 'X',
    recordedByActorId: 'astaffactor00001',
  });
  assert.equal(bad.ok, false);
});
