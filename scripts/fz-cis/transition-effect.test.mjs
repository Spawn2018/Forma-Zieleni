import assert from 'node:assert/strict';
import test from 'node:test';
import { transition } from './policy.mjs';
import { evaluateEffect } from './effect.mjs';

function base(overrides = {}) {
  return {
    id: 'LR-20260923-aaaa0001',
    patternKey: 'projection-drift-after-materialization',
    source: 'test',
    scope: 'gate',
    signalType: 'failure',
    severity: 'high',
    observation: 'Projection drift escaped before the durable gate.',
    evidence: ['ci-run:35776765562:verify-test'],
    generalizability: 'RECURRING',
    privacyClassification: 'INTERNAL',
    status: 'VALIDATING',
    evidenceStrength: 'TESTED',
    locallyVerified: true,
    validatedLocally: false,
    promotionTarget: 'AUTOMATION',
    ...overrides,
  };
}

const plan = {
  method: 'DETERMINISTIC_REPLAY',
  successSignal: 'Gate refuses push when projection drift is reproduced',
  failureSignal: 'Drift escapes to CI or push proceeds',
  minimumEvidence: 1,
};

const observation = {
  id: 'effect:replay:projection-drift:transition-1',
  at: '2026-09-23T01:00:00.000Z',
  type: 'REPLAY_CAUGHT',
  evidence: ['isolated push-main refused after readme projection failure'],
  afterControl: true,
  controlCommit: '98d98fd',
};

function supported(extra = {}) {
  return {
    controlRef: 'scripts/ci/pre-push-gate.mjs',
    controlCommit: '98d98fd',
    effectPlan: plan,
    effectObservations: [observation],
    validatedLocally: true,
    evidenceStrength: 'TESTED',
    ...extra,
  };
}

test('A: VALIDATING without effect plan cannot become PROVEN', () => {
  assert.throws(
    () => transition(base(), 'PROVEN', { validatedLocally: true, evidenceStrength: 'TESTED' }),
    /MISSING_EFFECT_PLAN/,
  );
});

test('B: effect plan without observations cannot become PROVEN', () => {
  assert.throws(
    () => transition(base({ effectPlan: plan }), 'PROVEN', {
      validatedLocally: true,
      evidenceStrength: 'TESTED',
      effectPlan: plan,
    }),
    /EFFECT_NOT_SUPPORTED/,
  );
});

test('C: effect INCONCLUSIVE cannot become PROVEN', () => {
  const mixed = base({
    effectPlan: plan,
    effectObservations: [
      observation,
      {
        id: 'effect:replay:projection-drift:transition-miss',
        at: '2026-09-23T01:00:00.000Z',
        type: 'REPLAY_MISSED',
        evidence: ['isolated replay failed to catch the class'],
        afterControl: true,
      },
    ],
  });
  assert.equal(evaluateEffect(mixed).effectState, 'INCONCLUSIVE');
  assert.throws(
    () => transition(mixed, 'PROVEN', { validatedLocally: true, evidenceStrength: 'TESTED' }),
    /EFFECT_NOT_SUPPORTED/,
  );
});

test('D: effect NOT_SUPPORTED cannot become PROVEN', () => {
  const missed = base({
    effectPlan: plan,
    effectObservations: [{
      ...observation,
      id: 'effect:replay:projection-drift:not-supported',
      type: 'REPLAY_MISSED',
    }],
  });
  assert.equal(evaluateEffect(missed).effectState, 'NOT_SUPPORTED');
  assert.throws(
    () => transition(missed, 'PROVEN', { validatedLocally: true, evidenceStrength: 'TESTED' }),
    /EFFECT_NOT_SUPPORTED/,
  );
});

test('E: effect SUPPORTED with valid deterministic evidence can become PROVEN', () => {
  const proven = transition(base(), 'PROVEN', supported());
  assert.equal(proven.status, 'PROVEN');
  assert.equal(proven.effectState, 'SUPPORTED');
  assert.equal(proven.validatedLocally, true);
});

test('F: PROVEN without real controlRef cannot become PROMOTED', () => {
  const proven = transition(base(), 'PROVEN', supported());
  const { controlRef, ...without } = proven;
  void controlRef;
  assert.throws(
    () => transition(without, 'PROMOTED', {
      validatedLocally: true,
      promotionTarget: 'AUTOMATION',
      controlCommit: '98d98fd',
    }),
    /MISSING_CONTROL_REF/,
  );
});

test('G: PROVEN with tracked controlRef and supported effect can become PROMOTED', () => {
  const proven = transition(base(), 'PROVEN', supported());
  const promoted = transition(proven, 'PROMOTED', {
    validatedLocally: true,
    promotionTarget: 'AUTOMATION',
  });
  assert.equal(promoted.status, 'PROMOTED');
  assert.equal(promoted.controlRef, 'scripts/ci/pre-push-gate.mjs');
});

test('H: Owner gate erosion attempt is refused', () => {
  const gated = base({
    ownerGate: 'OWNER-DECISION',
    gateDisposition: 'PRESERVED',
    signalType: 'near-miss',
  });
  assert.throws(
    () => transition(gated, 'PROVEN', supported({ gateDisposition: 'AUTO' })),
    /GATE_EROSION/,
  );
});

test('I: external finding locallyVerified=false cannot be promoted', () => {
  const external = base({
    source: 'coderabbit',
    locallyVerified: false,
    generalizability: 'LOCAL',
    evidenceStrength: 'TESTED',
  });
  assert.throws(
    () => transition(external, 'PROVEN', supported()),
    /EXTERNAL_NON_AUTHORITATIVE/,
  );
});

test('J: one anecdotal external finding cannot become class-wide PROVEN', () => {
  const anecdotal = base({
    source: 'coderabbit',
    locallyVerified: true,
    generalizability: 'RECURRING',
    evidenceStrength: 'ANECDOTAL',
  });
  assert.throws(
    () => transition(anecdotal, 'PROVEN', supported({ evidenceStrength: 'ANECDOTAL' })),
    /INSUFFICIENT_EVIDENCE/,
  );
});
