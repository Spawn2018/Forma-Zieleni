import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateEffect } from './effect.mjs';
import { distinctOccurrences, isRecurrenceCandidate, analyzeLearning, learningInterruptFromCheck } from './analysis.mjs';
import { shouldIngest } from './ingest.mjs';
import {
  LEARNING_SUBJECTS,
  checkLearningCoverage,
  forbiddenLearningStores,
  humanCorrectionToSignal,
  normalizeLearningSignal,
} from './learning-coverage.mjs';
import { incorporate, learningDebt, transition } from './policy.mjs';
import { loadProductScope } from '../requirements/product-scope.mjs';

function base(overrides = {}) {
  return {
    patternKey: 'public-gps-marker',
    source: 'test',
    scope: 'media',
    signalType: 'failure',
    severity: 'high',
    observation: 'A public derivative still carried a GPS marker.',
    evidence: ['derivatives test failed on the marker'],
    generalizability: 'LOCAL',
    privacyClassification: 'INTERNAL',
    ...overrides,
  };
}

function cloneCatalog() {
  return structuredClone(LEARNING_SUBJECTS);
}

test('every binding capability and required subject has one learning classification', () => {
  const checked = checkLearningCoverage();
  assert.equal(checked.ok, true, checked.errors.join('; '));
  assert.equal(checked.summary.unclassifiedBinding, 0);
  assert.equal(checked.summary.unknown, 0);
  assert.equal(checked.summary.secondStore, false);
  assert.equal(checked.summary.missingEffectMethod, 0);
  assert.equal(checked.summary.missingCounterEvidence, 0);
  for (const capability of loadProductScope()) {
    assert.equal(LEARNING_SUBJECTS.some((item) => item.id === capability.id), true, capability.id);
  }
});

test('a binding capability with no learning classification fails coverage', () => {
  const catalog = cloneCatalog().filter((item) => item.id !== 'PORTAL');
  const checked = checkLearningCoverage({ catalog });
  assert.equal(checked.ok, false);
  assert.equal(checked.errors.includes('MISSING_CLASSIFICATION:PORTAL'), true);
});

test('a learning loop with signals but no effect method is incomplete', () => {
  const catalog = cloneCatalog();
  const www = catalog.find((item) => item.id === 'WWW');
  www.effectMethod = 'SCORE';
  const checked = checkLearningCoverage({ catalog });
  assert.equal(checked.ok, false);
  assert.equal(checked.errors.some((error) => error.startsWith('WWW:MISSING_EFFECT_METHOD')), true);
});

test('promotion without supported effect is blocked', () => {
  const created = incorporate([], base({ id: 'LR-20260923-a1000001' })).record;
  const hypothesis = transition(created, 'HYPOTHESIS', { hypothesis: 'The marker can be copied again.' });
  const validating = transition(hypothesis, 'VALIDATING', { validationMethod: 'replay the derivative fixture' });
  assert.throws(
    () => transition(validating, 'PROVEN', { evidenceStrength: 'TESTED', validatedLocally: true }),
    /MISSING_EFFECT_PLAN/,
  );
});

test('promotion without a durable control is blocked', () => {
  const proven = {
    ...base({ id: 'LR-20260923-a1000002', status: 'PROVEN', validatedLocally: true, evidenceStrength: 'TESTED' }),
    effectPlan: {
      method: 'DETERMINISTIC_REPLAY',
      successSignal: 'The fixture catches the marker class',
      failureSignal: 'The marker class escapes the fixture',
    },
    effectObservations: [{
      id: 'effect:replay:marker-class',
      at: '2026-09-23T00:00:00.000Z',
      type: 'REPLAY_CAUGHT',
      evidence: ['fixture caught the marker'],
    }],
    promotionTarget: 'TEST',
  };
  assert.throws(() => transition(proven, 'PROMOTED', { validatedLocally: true, promotionTarget: 'TEST' }), /MISSING_CONTROL_REF/);
});

test('the same occurrence id is not independent recurrence', () => {
  const record = {
    status: 'OBSERVED',
    evidence: [
      'cr-occurrence:abcde12345:same-finding',
      'cr-occurrence:abcde12345:same-finding',
    ],
  };
  assert.equal(distinctOccurrences(record).count, 1);
  assert.equal(isRecurrenceCandidate(record), false);
});

test('distinct occurrence ids are independent recurrence', () => {
  const record = {
    status: 'OBSERVED',
    evidence: [
      'cr-occurrence:abcde12345:finding-one',
      'cr-occurrence:abcde12345:finding-two',
    ],
  };
  assert.equal(distinctOccurrences(record).count, 2);
  assert.equal(isRecurrenceCandidate(record), true);
});

test('counter-evidence puts a promoted learning into demotion review', () => {
  const promoted = base({
    id: 'LR-20260923-a1000003',
    status: 'PROMOTED',
    validatedLocally: true,
    promotionTarget: 'TEST',
    controlRef: 'scripts/fz-cis/policy.mjs',
    effectObservations: [{
      id: 'effect:escape:marker-class',
      at: '2026-09-23T03:00:00.000Z',
      type: 'DOWNSTREAM_ESCAPE',
      evidence: ['the class escaped after promotion'],
    }],
  });
  assert.equal(analyzeLearning([promoted]).demotionReview.length, 1);
  const demoted = transition(promoted, 'SUPERSEDED', { demotionReason: 'HARMFUL' });
  assert.equal(demoted.status, 'SUPERSEDED');
});

test('an AI finding supported only by another AI opinion is not effect evidence', () => {
  const evaluated = evaluateEffect({
    effectPlan: {
      method: 'DETERMINISTIC_REPLAY',
      successSignal: 'A local replay catches the class',
      failureSignal: 'The class still escapes',
    },
    effectObservations: [{
      id: 'effect:replay:ai-agreement-only',
      at: '2026-09-23T00:00:00.000Z',
      type: 'REPLAY_CAUGHT',
      evidence: ['a second model agreed with the first model'],
      evidenceClass: 'AI_AGREEMENT',
    }],
  });
  assert.equal(evaluated.supported, false);
  assert.equal(evaluated.reason, 'AI_CIRCULAR_EVIDENCE');
  const normalized = normalizeLearningSignal({
    capability: 'GROK',
    signalId: 'review-finding',
    patternKey: 'grok-ai-agreement',
    observation: 'Two models described the same suspected defect',
    evidence: ['grok-note', 'coderabbit-note'],
    supportedOnlyByAi: true,
  });
  assert.equal(normalized.ok, false);
  assert.equal(normalized.reason, 'AI_CIRCULAR_EVIDENCE');
});

test('a project-scoped human correction cannot become global', () => {
  const corrected = humanCorrectionToSignal({
    capability: 'GARDENOS',
    role: 'CLIENT',
    action: 'correction',
    entity: 'garden-17',
    scope: 'PROJECT',
    learningScope: 'GLOBAL',
    patternKey: 'garden-local-correction',
    tenantId: 'tenant-a',
  });
  assert.equal(corrected.reason, 'SCOPE_PROMOTION_REFUSED');
  const kept = humanCorrectionToSignal({
    capability: 'GARDENOS',
    role: 'CLIENT',
    action: 'correction',
    entity: 'garden-17',
    scope: 'GARDEN',
    patternKey: 'garden-local-correction',
    tenantId: 'tenant-a',
  });
  assert.equal(kept.ok, true);
  assert.equal(kept.outcome.learningScope, 'GARDEN');
  assert.equal(kept.wroteCanon, false);
});

test('synthetic and test data cannot create production learning', () => {
  const rejected = normalizeLearningSignal({
    capability: 'PORTAL',
    signalId: 'auth-failure',
    patternKey: 'portal-auth-fixture',
    observation: 'A synthetic session failed an authorization check',
    evidence: ['portal-auth-fixture'],
    provenanceEnvironment: 'TEST',
    learningClaim: 'PRODUCTION',
  });
  assert.equal(rejected.reason, 'SYNTHETIC_PRODUCTION_REJECTED');
});

test('manual verification without a human evidence class does not support effect', () => {
  const evaluated = evaluateEffect({
    effectPlan: {
      method: 'MANUAL_VERIFICATION',
      successSignal: 'Two editors confirm the same correction',
      failureSignal: 'An unlabeled note is treated as confirmation',
    },
    effectObservations: [
      {
        id: 'effect:caught:unlabeled-one',
        at: '2026-09-23T00:00:00.000Z',
        type: 'CONTROL_CAUGHT',
        evidence: ['an agent filled the human field'],
      },
      {
        id: 'effect:caught:unlabeled-two',
        at: '2026-09-23T01:00:00.000Z',
        type: 'CONTROL_CAUGHT',
        evidence: ['a second note repeated the first'],
      },
    ],
  });
  assert.equal(evaluated.supported, false);
});

test('a customer-scoped signal without a tenant is refused', () => {
  const missing = humanCorrectionToSignal({
    capability: 'GARDENOS',
    role: 'CLIENT',
    action: 'correction',
    entity: 'garden-17',
    scope: 'GARDEN',
    patternKey: 'garden-missing-tenant',
  });
  assert.equal(missing.reason, 'MISSING_TENANT');
});

test('customer evidence cannot be applied to another customer', () => {
  const leaked = normalizeLearningSignal({
    capability: 'FILES',
    signalId: 'bola-denial',
    patternKey: 'file-tenant-boundary',
    observation: 'A file read was denied for the other client',
    evidence: ['authz-fixture-bola'],
    tenantId: 'tenant-a',
    targetTenantId: 'tenant-b',
  });
  assert.equal(leaked.reason, 'CROSS_TENANT_LEAK');
});

test('a routine pass does not become learning noise', () => {
  assert.equal(shouldIngest({ kind: 'pass', observation: 'suite passed cleanly' }).reason, 'noise_skip');
  const skipped = normalizeLearningSignal({
    capability: 'ENGINEERING',
    kind: 'pass',
    observation: 'lint passed on the branch',
    evidence: ['lint-ok'],
    patternKey: 'lint-pass-noise',
  });
  assert.equal(skipped.reason, 'noise_skip');
});

test('urgent security learning may interrupt and ordinary debt does not', () => {
  const urgent = base({
    id: 'LR-20260923-a1000004',
    patternKey: 'authz-bypass-class',
    source: 'security',
    generalizability: 'CRITICAL',
    severity: 'critical',
    status: 'OBSERVED',
  });
  const ordinary = base({
    id: 'LR-20260923-a1000005',
    patternKey: 'copy-nit-recurring',
    source: 'ux',
    generalizability: 'RECURRING',
    severity: 'low',
    status: 'HYPOTHESIS',
    proposedImprovement: 'Adjust one label later.',
  });
  const urgentCheck = analyzeLearning([urgent]);
  assert.equal(urgentCheck.urgentLearningInterrupt, true);
  assert.equal(learningInterruptFromCheck(urgentCheck).type, 'LEARNING_INTERRUPT');
  const debt = analyzeLearning([ordinary]);
  assert.equal(debt.urgentLearningInterrupt, false);
  assert.equal(learningInterruptFromCheck(debt), null);
  assert.equal(learningDebt([ordinary]).length, 1);
});

test('a loop without production telemetry is not marked operational', () => {
  const www = LEARNING_SUBJECTS.find((item) => item.id === 'WWW');
  assert.equal(www.classification, 'LEARNING_LOOP_IMPLEMENTED_NOT_OPERATIONAL');
  assert.equal(www.signals.some((signal) => signal.availability === 'REPOSITORY_NOW'), false);
  const catalog = cloneCatalog();
  catalog.find((item) => item.id === 'WWW').classification = 'LEARNING_LOOP_OPERATIONAL';
  catalog.find((item) => item.id === 'WWW').readiness = 'OPERATIONAL';
  const checked = checkLearningCoverage({ catalog });
  assert.equal(checked.errors.some((error) => error === 'WWW:FALSE_OPERATIONAL'), true);
});

test('NO_LEARNING_REQUIRED without a justification fails', () => {
  const catalog = cloneCatalog();
  const row = catalog.find((item) => item.id === 'HOSTING');
  row.classification = 'NO_LEARNING_REQUIRED';
  row.justification = 'later';
  const checked = checkLearningCoverage({ catalog });
  assert.equal(checked.errors.some((error) => error === 'HOSTING:MISSING_NO_LEARNING_JUSTIFICATION'), true);
});

test('domain guards refuse silent mutation and fake production signals', () => {
  const cases = [
    ['ATLAS', { behaviorImpliesBotanicalTruth: true, signalId: 'editor-correction' }, 'BOTANICAL_TRUTH_FROM_BEHAVIOR'],
    ['SKETCHUP', { pluginOwnsBusinessTruth: true, signalId: 'mapping-failure' }, 'SKETCHUP_NOT_BUSINESS_TRUTH'],
    ['CONNECTED', { overwriteHumanLock: true, signalId: 'human-correction' }, 'HUMAN_LOCK_PROTECTED'],
    ['GROWTH', { authorizeSpend: true, signalId: 'plan-retrospective' }, 'SPEND_OWNER_GATED'],
    ['PAYMENT', { liveTransaction: true, signalId: 'idempotency-failure' }, 'LIVE_TRANSACTION_FORBIDDEN'],
    ['PXI', { universalScore: true, signalId: 'signal-contract' }, 'UNIVERSAL_SCORE_FORBIDDEN'],
    ['CMS', { autoPublish: true, signalId: 'editor-correction' }, 'AUTO_PUBLISH_FORBIDDEN'],
    ['SEARCH', { universalScore: true, signalId: 'technical-audit' }, 'UNIVERSAL_SCORE_FORBIDDEN'],
    ['SITEINTEL', { aiOverwritesDomain: true, signalId: 'rule-miss' }, 'AI_CANNOT_OVERWRITE_DOMAIN'],
    ['OFFER', { changePrice: true, signalId: 'offer-correction' }, 'PRICE_HUMAN_GATED'],
  ];
  for (const [capability, extra, reason] of cases) {
    const result = normalizeLearningSignal({
      capability,
      patternKey: 'domain-guard-case',
      observation: 'A domain event tried to cross a learning guard',
      evidence: ['guard-fixture'],
      ...extra,
    });
    assert.equal(result.reason, reason, capability);
  }
  const quiet = normalizeLearningSignal({
    capability: 'SEARCH',
    signalId: 'traffic',
    patternKey: 'search-traffic-fake',
    observation: 'Traffic appeared to move after a title change',
    evidence: ['no-baseline'],
  });
  assert.equal(quiet.reason, 'NOT_YET_OBSERVABLE');
});

test('there is no second learning store and staff review does not train a model', () => {
  assert.deepEqual(forbiddenLearningStores([
    'docs/search-learning-db.json',
    'scripts/fz-cis/learning-coverage.mjs',
  ]), ['docs/search-learning-db.json']);
  const review = humanCorrectionToSignal({
    capability: 'ADMIN',
    signalId: 'staff-correction',
    role: 'AGNIESZKA',
    action: 'partial_approve',
    entity: 'offer-4',
    scope: 'ENTITY',
    patternKey: 'admin-partial-approve',
    trainModel: true,
  });
  assert.equal(review.reason, 'AUTONOMOUS_MUTATION_FORBIDDEN');
});
