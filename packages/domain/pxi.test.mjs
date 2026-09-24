import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXPERIENCE_SIGNAL_CONTRACT_VERSION,
  EXPERIENCE_SIGNAL_PII_KEYS,
  assertNoUniversalExperienceScore,
  enableSessionReplay,
  experienceSignalContract,
  recordExperienceSignal,
  sessionReplayStatus,
} from './src/pxi.ts';
import { recordBehavior } from './src/growth.ts';

test('experience signal contract is versioned and refuses score and replay', () => {
  const contract = experienceSignalContract();
  assert.equal(contract.version, EXPERIENCE_SIGNAL_CONTRACT_VERSION);
  assert.equal(contract.version, 1);
  assert.equal(contract.requirementId, 'FZ-REQ-PXI-001');
  assert.equal(contract.replay, 'OFF');
  assert.equal(contract.productionTelemetry, false);
  assert.equal(contract.universalExperienceScore, false);
  assert.equal(contract.rejectedPiiKeys.length, 9);
  assert.deepEqual([...contract.rejectedPiiKeys], [...EXPERIENCE_SIGNAL_PII_KEYS]);
  assert.equal(sessionReplayStatus(), 'OFF');
  assert.throws(() => enableSessionReplay(), /SESSION_REPLAY_OFF/);
  assert.throws(
    () => assertNoUniversalExperienceScore({ universalScore: true }),
    /UNIVERSAL_EXPERIENCE_SCORE_FORBIDDEN/,
  );
  assert.throws(
    () => assertNoUniversalExperienceScore({ experienceScore: 0.82 }),
    /UNIVERSAL_EXPERIENCE_SCORE_FORBIDDEN/,
  );
  assert.throws(
    () => assertNoUniversalExperienceScore({ pxiScore: 0.5 }),
    /UNIVERSAL_EXPERIENCE_SCORE_FORBIDDEN/,
  );
});

test('recordExperienceSignal rejects every declared PII key, replay, and scores', () => {
  const ok = recordExperienceSignal({ event: 'form_start' });
  assert.equal(ok.version, 1);
  assert.equal(ok.name, 'form_start');
  assert.equal(ok.conclusion, false);
  assert.equal(ok.score, null);

  for (const key of EXPERIENCE_SIGNAL_PII_KEYS) {
    assert.throws(
      () => recordExperienceSignal({ event: 'form_start', [key]: 'synthetic-value' }),
      /FORM_VALUE_REJECTED/,
      `expected ${key} to be rejected`,
    );
  }
  assert.throws(
    () => recordExperienceSignal({ event: 'form_start', sessionReplay: true }),
    /SESSION_REPLAY_OFF/,
  );
  assert.throws(
    () => recordExperienceSignal({ event: 'form_start', replayPayload: { frames: [] } }),
    /SESSION_REPLAY_OFF/,
  );
  assert.throws(
    () => recordExperienceSignal({ event: 'form_start', score: 0.9 }),
    /UNIVERSAL_EXPERIENCE_SCORE_FORBIDDEN/,
  );
  assert.throws(
    () => recordExperienceSignal({ event: 'form_start', universalScore: true }),
    /UNIVERSAL_EXPERIENCE_SCORE_FORBIDDEN/,
  );
  assert.throws(() => recordExperienceSignal({ event: 'click_heatmap' }), /EVENT_NAME_REJECTED/);
});

test('growth recordBehavior stays aligned with the PXI contract', () => {
  assert.equal(recordBehavior({ event: 'submit_success' }).conclusion, false);
  assert.throws(
    () => recordBehavior({ event: 'form_start', phone: '+48 111 111 111' }),
    /FORM_VALUE_REJECTED/,
  );
});
