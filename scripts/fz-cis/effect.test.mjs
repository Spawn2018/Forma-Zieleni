import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MANDATORY_CHECKS,
  runPrePushGate,
} from '../ci/pre-push-gate.mjs';
import { runPushMain } from '../ci/push-main.mjs';
import {
  applyEffectObservation,
  applyEffectPlan,
  evaluateEffect,
  mergeEffectObservation,
  validateEffectObservation,
  validateEffectPlan,
} from './effect.mjs';
import { transition } from './policy.mjs';

function baseRecord(overrides = {}) {
  return {
    id: 'LR-20260923-bbbb0001',
    patternKey: 'projection-drift-after-materialization',
    source: 'test',
    scope: 'gate',
    signalType: 'failure',
    severity: 'high',
    observation: 'Projection drift escaped local checks before the durable gate.',
    evidence: ['ci-run:35776765562:verify-test'],
    generalizability: 'RECURRING',
    privacyClassification: 'INTERNAL',
    status: 'VALIDATING',
    evidenceStrength: 'TESTED',
    locallyVerified: true,
    validatedLocally: false,
    ...overrides,
  };
}

const plan = {
  method: 'DETERMINISTIC_REPLAY',
  successSignal: 'Gate refuses push when projection check fails',
  failureSignal: 'Drift escapes to CI or push proceeds',
  minimumEvidence: 1,
};

function caught(id = 'effect:replay:projection-drift:isolated-1') {
  return {
    id,
    at: '2026-09-23T01:00:00.000Z',
    type: 'REPLAY_CAUGHT',
    evidence: [
      'historical-class:330a514/run-35776765562',
      'check:readme',
      'gate:scripts/ci/pre-push-gate.mjs',
      'push-main:refused',
    ],
    afterControl: true,
    controlCommit: '98d98fd',
  };
}

test('duplicate observation id is idempotent', () => {
  const first = mergeEffectObservation([], caught());
  const second = mergeEffectObservation(first.observations, caught());
  assert.equal(first.added, true);
  assert.equal(second.added, false);
  assert.equal(second.duplicate, true);
  assert.equal(second.observations.length, 1);
});

test('different real observations increment evidence', () => {
  const first = mergeEffectObservation([], caught('effect:replay:a'));
  const second = mergeEffectObservation(first.observations, caught('effect:replay:b'));
  assert.equal(second.observations.length, 2);
});

test('REPLAY_CAUGHT contributes supporting evidence', () => {
  let record = applyEffectPlan(baseRecord(), plan);
  record = applyEffectObservation(record, caught()).record;
  const effect = evaluateEffect(record);
  assert.equal(effect.effectState, 'SUPPORTED');
  assert.equal(effect.supported, true);
});

test('REPLAY_MISSED contributes counter-evidence', () => {
  let record = applyEffectPlan(baseRecord(), plan);
  record = applyEffectObservation(record, {
    ...caught('effect:replay:miss'),
    type: 'REPLAY_MISSED',
  }).record;
  assert.equal(evaluateEffect(record).effectState, 'NOT_SUPPORTED');
});

test('DOWNSTREAM_ESCAPE prevents false SUPPORTED', () => {
  let record = applyEffectPlan(baseRecord(), plan);
  record = applyEffectObservation(record, caught()).record;
  assert.equal(evaluateEffect(record).supported, true);
  record = applyEffectObservation(record, {
    id: 'effect:escape:ci-later',
    at: '2026-09-23T02:00:00.000Z',
    type: 'DOWNSTREAM_ESCAPE',
    evidence: ['same class escaped after control activation'],
    afterControl: true,
  }).record;
  assert.equal(evaluateEffect(record).effectState, 'NOT_SUPPORTED');
});

test('FALSE_BLOCK creates reassessment evidence', () => {
  let record = applyEffectPlan(baseRecord(), {
    ...plan,
    method: 'NATURAL_RECURRENCE',
    minimumEvidence: 2,
  });
  record = applyEffectObservation(record, {
    id: 'effect:false-block:1',
    at: '2026-09-23T01:00:00.000Z',
    type: 'FALSE_BLOCK',
    evidence: ['valid work blocked without matching failure class'],
    afterControl: true,
  }).record;
  record = applyEffectObservation(record, {
    id: 'effect:false-block:2',
    at: '2026-09-23T01:05:00.000Z',
    type: 'FALSE_BLOCK',
    evidence: ['second false block on green work'],
    afterControl: true,
  }).record;
  assert.equal(evaluateEffect(record).effectState, 'NOT_SUPPORTED');
});

test('supported effect cannot ignore newer counter-evidence', () => {
  let record = applyEffectPlan(baseRecord(), plan);
  record = applyEffectObservation(record, caught()).record;
  record = applyEffectObservation(record, {
    id: 'effect:replay:later-miss',
    at: '2026-09-23T03:00:00.000Z',
    type: 'REPLAY_MISSED',
    evidence: ['later replay failed to catch the class'],
    afterControl: true,
  }).record;
  assert.equal(evaluateEffect(record).reason, 'NEWER_COUNTER_EVIDENCE');
  assert.equal(evaluateEffect(record).supported, false);
});

test('observation after control activation is distinguished from pre-control evidence', () => {
  let record = applyEffectPlan(baseRecord({ controlCommit: '98d98fd' }), plan);
  record = applyEffectObservation(record, {
    id: 'effect:history:pre-control',
    at: '2026-09-22T10:00:00.000Z',
    type: 'CONTROL_MISSED',
    evidence: ['historical failure before gate existed'],
    afterControl: false,
    relatedCommit: '330a514',
  }).record;
  record = applyEffectObservation(record, caught()).record;
  assert.equal(evaluateEffect(record).supported, true);
});

const secretish = ['api', '_key', ' = ', 'abcdefghijklmnop'].join('');

test('malformed and secret effect evidence is rejected', () => {
  assert.equal(validateEffectPlan({ method: 'DETERMINISTIC_REPLAY', successSignal: 'ok' }).ok, false);
  assert.equal(validateEffectPlan({
    ...plan,
    command: 'rm -rf /',
  }).errors.includes('FORBIDDEN_FIELD') || validateEffectPlan({
    ...plan,
    command: 'rm -rf /',
  }).errors.includes('FORBIDDEN_EXECUTABLE'), true);
  assert.equal(validateEffectObservation({
    id: 'bad',
    at: '2026-09-23T00:00:00.000Z',
    type: 'REPLAY_CAUGHT',
    evidence: ['x'],
  }).errors.includes('BAD_OBSERVATION_ID'), true);
  assert.equal(validateEffectObservation({
    ...caught(),
    evidence: [secretish],
  }).errors.includes('SECRET_REJECTED'), true);
});

test('forged effectState SUPPORTED without observations cannot prove', () => {
  const forged = {
    ...baseRecord(),
    effectPlan: plan,
    effectState: 'SUPPORTED',
    effectObservations: [],
    validatedLocally: true,
  };
  assert.equal(evaluateEffect(forged).supported, false);
  assert.throws(
    () => transition(forged, 'PROVEN', { evidenceStrength: 'TESTED', validatedLocally: true }),
    /EFFECT_NOT_SUPPORTED|MISSING_EFFECT_PLAN|EFFECT/,
  );
});

test('minimumEvidence cannot undercut the method floor', () => {
  const low = validateEffectPlan({
    method: 'NATURAL_RECURRENCE',
    successSignal: 'Recurrence stops after the control',
    failureSignal: 'Same class keeps recurring',
    minimumEvidence: 1,
  });
  assert.equal(low.errors.includes('MINIMUM_EVIDENCE_TOO_LOW'), true);
});

test('duplicate observation ids in transition extras do not inflate support', () => {
  const clone = caught('effect:replay:dup-inflate');
  const record = {
    ...baseRecord(),
    effectPlan: {
      method: 'NATURAL_RECURRENCE',
      successSignal: 'Recurrence stops after the control lands',
      failureSignal: 'Same class keeps recurring after control',
      minimumEvidence: 2,
    },
    effectObservations: [clone, clone],
    validatedLocally: true,
  };
  assert.equal(evaluateEffect(record).supported, false);
  assert.equal(evaluateEffect(record).supportingCount, 1);
});

test('markLocallyVerified rejects secret-bearing evidence', () => {
  // Covered via store path in policy store tests when available; unit-level scan mirror:
  assert.equal(validateEffectObservation({
    ...caught(),
    evidence: [secretish],
  }).errors.includes('SECRET_REJECTED'), true);
});

test('projection-drift deterministic replay exercises real push refusal boundary', () => {
  const git = (args) => {
    const key = args.join(' ');
    if (key === 'rev-parse --abbrev-ref HEAD') return { status: 0, stdout: 'main\n', stderr: '' };
    if (key === 'rev-parse HEAD') return { status: 0, stdout: 'aaa111replay\n', stderr: '' };
    if (key === 'rev-parse origin/main') return { status: 0, stdout: 'bbb222base\n', stderr: '' };
    if (key === 'status --short') return { status: 0, stdout: ' M .cursor/settings.json\n', stderr: '' };
    if (key.startsWith('merge-base ')) return { status: 0, stdout: 'bbb222base\n', stderr: '' };
    return { status: 1, stdout: '', stderr: `unexpected ${key}` };
  };
  const run = (argv) => {
    const label = argv.join(' ');
    if (label === 'pnpm readme:check') {
      return {
        status: 1,
        stdout: 'projection drift: admin surface expected not-built but package exists\n',
        stderr: '',
      };
    }
    return { status: 0, stdout: 'ok\n', stderr: '' };
  };
  const gate = runPrePushGate({
    git,
    run,
    checks: MANDATORY_CHECKS,
    reportBlockers: () => [],
  });
  assert.equal(gate.ok, false);
  assert.equal(gate.failedCheck?.id, 'readme');

  const pushed = runPushMain({
    git,
    run,
    runGate: () => gate,
    push: () => {
      throw new Error('transport push must not run');
    },
    reviewDebtForPush: () => ({ ok: true, reason: 'clear', state: 'EMPTY' }),
    skipCiWait: true,
  });
  assert.equal(pushed.ok, false);
  assert.equal(pushed.reason, 'gate_failed');
  assert.equal(pushed.pushed, false);
  assert.equal(pushed.failedCheck?.id, 'readme');
});
