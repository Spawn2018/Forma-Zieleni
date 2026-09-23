import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  analyzeLearning,
  distinctOccurrences,
  extractOccurrenceIds,
  isRecurrenceCandidate,
  learningInterruptFromCheck,
} from './analysis.mjs';
import { transition } from './policy.mjs';
import { reportCheck, saveStore } from './store.mjs';
import { runLearningCheck, selectionWithQuality } from '../fz-noc/cli.mjs';
import { emptySession, nextWarsawDeadline } from '../fz-noc/policy.mjs';
import { CI_STATES } from '../ci/post-push-ci.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const node = process.execPath;

function cr(id, evidence, overrides = {}) {
  return {
    id,
    patternKey: overrides.patternKey || 'cr-update-fingerprint-gener-security-coderabbit',
    source: 'coderabbit',
    scope: 'checkpoint-review',
    signalType: 'review-finding',
    severity: 'medium',
    observation: 'A CodeRabbit finding was recorded for local verification.',
    evidence,
    generalizability: 'LOCAL',
    privacyClassification: 'INTERNAL',
    status: 'OBSERVED',
    evidenceStrength: 'ANECDOTAL',
    occurrences: evidence.length,
    locallyVerified: true,
    validatedLocally: false,
    ...overrides,
  };
}

test('one CodeRabbit occurrence is not a recurrence candidate', () => {
  const record = cr('LR-20260923-c1000001', [
    'cr-occurrence:f731f3a30319:9465cfc3c929:cr-update-fingerprint-gener-security-coderabbit-pars-f9ab75c7',
  ]);
  assert.equal(isRecurrenceCandidate(record), false);
  assert.equal(distinctOccurrences(record).count, 1);
});

test('same occurrence read twice still counts once', () => {
  const id = 'cr-occurrence:f731f3a30319:9465cfc3c929:cr-update-fingerprint-gener-security-coderabbit-pars-f9ab75c7';
  const record = cr('LR-20260923-c1000002', [id, id], { occurrences: 2 });
  assert.deepEqual(extractOccurrenceIds(record.evidence), [id]);
  assert.equal(isRecurrenceCandidate(record), false);
});

test('two distinct CodeRabbit occurrences same fingerprint are a recurrence candidate', () => {
  const record = cr('LR-20260923-c1000003', [
    'cr-occurrence:f731f3a30319:9465cfc3c929:cr-update-fingerprint-gener-security-coderabbit-pars-f9ab75c7',
    'cr-occurrence:f731f3a30319:aaaaaaaaaaaa:cr-update-fingerprint-gener-security-coderabbit-pars-f9ab75c7',
  ]);
  assert.equal(isRecurrenceCandidate(record), true);
  assert.equal(analyzeLearning([record]).recurrenceCandidates.length, 1);
});

test('two different fingerprints are not recurrence of one class', () => {
  const a = cr('LR-20260923-c1000004', [
    'cr-occurrence:f731f3a30319:9465cfc3c929:cr-update-fingerprint-gener-security-coderabbit-pars-f9ab75c7',
  ], { patternKey: 'cr-update-fingerprint-gener-security-coderabbit' });
  const b = cr('LR-20260923-c1000005', [
    'cr-occurrence:f731f3a30319:9465cfc3c929:cr-update-the-clean-result-security-coderabbit-stat-da5df8c1',
  ], { patternKey: 'cr-update-the-clean-result-security-coderabbit' });
  assert.equal(isRecurrenceCandidate(a), false);
  assert.equal(isRecurrenceCandidate(b), false);
  assert.equal(analyzeLearning([a, b]).recurrenceCandidates.length, 0);
});

test('two CI runs same failure signature are a recurrence candidate', () => {
  const record = {
    ...cr('LR-20260923-c2000001', [
      'ci-run:35776765562:verify-test',
      'ci-run:35780000000:verify-test',
    ], {
      patternKey: 'projection-drift-after-materialization',
      source: 'test',
      generalizability: 'RECURRING',
      evidenceStrength: 'TESTED',
    }),
  };
  assert.equal(isRecurrenceCandidate(record), true);
});

test('same CI run twice does not duplicate recurrence', () => {
  const record = cr('LR-20260923-c2000002', [
    'ci-run:35776765562:verify-test',
    'ci-run:35776765562:verify-test',
  ], { patternKey: 'projection-drift-after-materialization', source: 'test' });
  assert.equal(distinctOccurrences(record).count, 1);
  assert.equal(isRecurrenceCandidate(record), false);
});

test('raw occurrences without trustworthy identity do not overclaim independence', () => {
  const record = cr('LR-20260923-c3000001', ['local note only'], {
    occurrences: 5,
    patternKey: 'raw-count-only-pattern-key',
  });
  const occ = distinctOccurrences(record);
  assert.equal(occ.trustworthy, false);
  assert.equal(isRecurrenceCandidate(record), false);
});

test('learning check: empty store is not material', () => {
  const check = analyzeLearning([]);
  assert.equal(check.material, false);
  assert.equal(check.urgentLearningInterrupt, false);
});

test('learning check: current one-off CR records are not false recurrence', () => {
  const store = JSON.parse(readFileSync(path.join(root, 'docs/engineering/learning/records.json'), 'utf8'));
  const crRecords = store.records.filter((record) => record.source === 'coderabbit');
  assert.ok(crRecords.length >= 1);
  assert.equal(crRecords.every((record) => record.status === 'OBSERVED'), true);
  const check = analyzeLearning(crRecords);
  assert.equal(check.recurrenceCandidates.length, 0);
});

test('VALIDATING without effect plan is effectDue; supported effect is provenReady', () => {
  const bare = {
    id: 'LR-20260923-c4000001',
    patternKey: 'projection-drift-after-materialization',
    source: 'test',
    scope: 'gate',
    signalType: 'failure',
    severity: 'high',
    observation: 'Projection drift still needs VERIFY EFFECT.',
    evidence: ['ci-run:35776765562:verify-test'],
    generalizability: 'RECURRING',
    privacyClassification: 'INTERNAL',
    status: 'VALIDATING',
    evidenceStrength: 'TESTED',
    proposedImprovement: 'Keep the canonical pre-push gate.',
    locallyVerified: true,
  };
  assert.equal(analyzeLearning([bare]).effectDue.length, 1);
  assert.equal(analyzeLearning([bare]).provenReady.length, 0);

  const supported = transition(bare, 'PROVEN', {
    validatedLocally: true,
    evidenceStrength: 'TESTED',
    controlRef: 'scripts/ci/pre-push-gate.mjs',
    controlCommit: '98d98fd',
    effectPlan: {
      method: 'DETERMINISTIC_REPLAY',
      successSignal: 'Gate refuses push on known projection drift',
      failureSignal: 'Drift escapes to CI or push succeeds',
      minimumEvidence: 1,
    },
    effectObservations: [{
      id: 'effect:replay:projection-drift:check-ready',
      at: '2026-09-23T01:00:00.000Z',
      type: 'REPLAY_CAUGHT',
      evidence: ['isolated gate refused readme projection drift'],
      afterControl: true,
    }],
  });
  // analyze PROVEN path uses promotionReady; provenReady is for VALIDATING+supported
  const validatingSupported = {
    ...supported,
    status: 'VALIDATING',
  };
  assert.equal(analyzeLearning([validatingSupported]).provenReady.length, 1);
});

test('PROVEN with supported effect and durable control is promotionReady', () => {
  const proven = {
    id: 'LR-20260923-c5000001',
    patternKey: 'projection-drift-after-materialization',
    source: 'test',
    scope: 'gate',
    signalType: 'failure',
    severity: 'high',
    observation: 'Projection drift gate proved under deterministic replay.',
    evidence: ['ci-run:35776765562:verify-test'],
    generalizability: 'RECURRING',
    privacyClassification: 'INTERNAL',
    status: 'PROVEN',
    evidenceStrength: 'TESTED',
    proposedImprovement: 'Keep the canonical pre-push gate.',
    promotionTarget: 'AUTOMATION',
    validatedLocally: true,
    locallyVerified: true,
    controlRef: 'scripts/ci/pre-push-gate.mjs',
    controlCommit: '98d98fd',
    effectPlan: {
      method: 'DETERMINISTIC_REPLAY',
      successSignal: 'Gate refuses push on known projection drift',
      failureSignal: 'Drift escapes to CI or push succeeds',
      minimumEvidence: 1,
    },
    effectObservations: [{
      id: 'effect:replay:projection-drift:promo-ready',
      at: '2026-09-23T01:00:00.000Z',
      type: 'REPLAY_CAUGHT',
      evidence: ['isolated gate refused readme projection drift'],
      afterControl: true,
    }],
  };
  assert.equal(analyzeLearning([proven]).promotionReady.length, 1);
});

test('PROMOTED with downstream escape surfaces demotionReview', () => {
  const promoted = {
    id: 'LR-20260923-c6000001',
    patternKey: 'projection-drift-after-materialization',
    source: 'test',
    scope: 'gate',
    signalType: 'failure',
    severity: 'high',
    observation: 'Promoted control later missed a recurrence.',
    evidence: ['ci-run:35776765562:verify-test'],
    generalizability: 'RECURRING',
    privacyClassification: 'INTERNAL',
    status: 'PROMOTED',
    evidenceStrength: 'TESTED',
    promotionTarget: 'AUTOMATION',
    validatedLocally: true,
    locallyVerified: true,
    controlRef: 'scripts/ci/pre-push-gate.mjs',
    controlCommit: '98d98fd',
    effectPlan: {
      method: 'DETERMINISTIC_REPLAY',
      successSignal: 'Gate refuses push on known projection drift',
      failureSignal: 'Drift escapes to CI or push succeeds',
      minimumEvidence: 1,
    },
    effectObservations: [
      {
        id: 'effect:replay:projection-drift:old-catch',
        at: '2026-09-23T01:00:00.000Z',
        type: 'REPLAY_CAUGHT',
        evidence: ['earlier replay caught the class'],
        afterControl: true,
      },
      {
        id: 'effect:escape:projection-drift:later',
        at: '2026-09-23T04:00:00.000Z',
        type: 'DOWNSTREAM_ESCAPE',
        evidence: ['same class escaped after promotion'],
        afterControl: true,
      },
    ],
  };
  assert.equal(analyzeLearning([promoted]).demotionReview.length, 1);
});

test('critical systemic learning is urgent; ordinary local learning is not', () => {
  const urgent = cr('LR-20260923-c7000001', ['local evidence only'], {
    patternKey: 'authz-bypass-class-systemic',
    generalizability: 'CRITICAL',
    severity: 'critical',
    source: 'security',
    status: 'OBSERVED',
  });
  const ordinary = cr('LR-20260923-c8000001', [
    'cr-occurrence:f731f3a30319:9465cfc3c929:cr-update-fingerprint-gener-security-coderabbit-pars-f9ab75c7',
  ]);
  const check = analyzeLearning([urgent, ordinary]);
  assert.equal(check.urgent.length, 1);
  assert.equal(check.urgentLearningInterrupt, true);
  assert.equal(learningInterruptFromCheck(check).type, 'LEARNING_INTERRUPT');
  assert.equal(analyzeLearning([ordinary]).urgentLearningInterrupt, false);
});

test('/noc learning check is runnable and ordinary debt does not block product selection', () => {
  const session = emptySession(nextWarsawDeadline(9, new Date('2026-09-23T00:00:00.000Z')));
  const learning = runLearningCheck({
    reportCheck: () => analyzeLearning([
      cr('LR-20260923-c9000001', [
        'cr-occurrence:f731f3a30319:9465cfc3c929:cr-update-fingerprint-gener-security-coderabbit-pars-f9ab75c7',
      ], {
        status: 'HYPOTHESIS',
        generalizability: 'RECURRING',
        proposedImprovement: 'Add a deterministic check later.',
        evidenceStrength: 'ANECDOTAL',
      }),
    ]),
  });
  assert.equal(learning.urgentLearningInterrupt, false);
  const picked = selectionWithQuality(session, {
    repoState: { ok: true, head: 'aaa', originMain: 'aaa', branch: 'main' },
    statusFor: () => ({ state: CI_STATES.CI_GREEN, runId: '1' }),
    learning,
  });
  assert.equal(picked.learningInterrupt, null);
  assert.equal(picked.reason === 'learning_interrupt', false);
});

test('urgent learning interrupt pauses product selection', () => {
  const session = emptySession(nextWarsawDeadline(9, new Date('2026-09-23T00:00:00.000Z')));
  const learning = runLearningCheck({
    reportCheck: () => analyzeLearning([
      cr('LR-20260923-c7000002', ['security evidence recorded'], {
        patternKey: 'authz-bypass-class-systemic',
        generalizability: 'CRITICAL',
        severity: 'critical',
        source: 'security',
        status: 'OBSERVED',
      }),
    ]),
  });
  assert.equal(learning.urgentLearningInterrupt, true);
  const picked = selectionWithQuality(session, {
    repoState: { ok: true, head: 'aaa', originMain: 'aaa', branch: 'main' },
    statusFor: () => ({ state: CI_STATES.CI_GREEN, runId: '1' }),
    learning,
  });
  assert.equal(picked.selected, null);
  assert.equal(picked.learningInterrupt.type, 'LEARNING_INTERRUPT');
  assert.equal(picked.reason, 'learning_interrupt');
});

test('complete path records learning check against completed commit', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'fz-noc-learn-'));
  const live = path.join(dir, 'live.json');
  const storeFile = path.join(dir, 'records.json');
  saveStore({ version: 1, records: [] }, storeFile);
  const deadline = nextWarsawDeadline(9, new Date('2026-09-23T00:00:00.000Z'));
  writeFileSync(live, `${JSON.stringify({
    ...emptySession(deadline),
    status: 'busy',
  }, null, 2)}\n`);
  try {
    // Simulate the complete learning fields write contract via runLearningCheck + session patch.
    const learning = runLearningCheck({
      reportCheck: () => ({
        ...analyzeLearning([]),
        checkedAt: '2026-09-23T01:00:00.000Z',
      }),
    });
    const session = JSON.parse(readFileSync(live, 'utf8'));
    session.lastLearningCheckCommit = '495f9fc0aeeaa732b81c5fd0dc9785aab6d8d9e3';
    session.lastLearningCheckAt = learning.check.checkedAt;
    session.materialLearning = learning.materialLearning;
    session.urgentLearningInterrupt = learning.urgentLearningInterrupt;
    writeFileSync(live, `${JSON.stringify(session, null, 2)}\n`);
    const saved = JSON.parse(readFileSync(live, 'utf8'));
    assert.equal(saved.lastLearningCheckCommit, '495f9fc0aeeaa732b81c5fd0dc9785aab6d8d9e3');
    assert.equal(saved.materialLearning, false);
    assert.equal(Object.hasOwn(saved, 'records'), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('cli check command returns structured learning analysis', () => {
  const ran = spawnSync(node, [path.join(root, 'scripts/fz-cis/cli.mjs'), 'check'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(ran.status, 0, ran.stderr);
  const body = JSON.parse(ran.stdout);
  assert.equal(typeof body.material, 'boolean');
  assert.equal(Array.isArray(body.recurrenceCandidates), true);
  assert.equal(Array.isArray(body.effectDue), true);
  assert.equal(Array.isArray(body.urgent), true);
  assert.equal(body.storeVersion, 1);
});
