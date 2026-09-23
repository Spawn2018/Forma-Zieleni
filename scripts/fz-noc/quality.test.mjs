import assert from 'node:assert/strict';
import test from 'node:test';
import { selectionWithQuality, requireExactCiGreen } from './cli.mjs';
import { CI_STATES } from '../ci/post-push-ci.mjs';

const SHA = 'dddddddddddddddddddddddddddddddddddddddd';
const OTHER = 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

test('CI_GREEN allows normal product selection path to run', () => {
  const picked = selectionWithQuality(
    { blocked: [], completed: [], attempts: {} },
    {
      repoState: { head: SHA, originMain: SHA, branch: 'main', ok: true },
      statusFor: () => ({ state: CI_STATES.CI_GREEN, run: { databaseId: 1, headSha: SHA } }),
      skipLearningCheck: true,
    },
  );
  assert.equal(picked.qualityInterrupt, null);
  // Graph may be exhausted; still proves interrupt did not fire.
  assert.equal(picked.reason === 'ci_repair_required', false);
});

test('a green repair without a root-cause chain does not resume product selection', () => {
  const picked = selectionWithQuality(
    { blocked: [], completed: [], attempts: { 'ci-repair|ci-ci-verify-test': 1 } },
    {
      repoState: { head: SHA, originMain: SHA, branch: 'main', ok: true },
      statusFor: () => ({ state: CI_STATES.CI_GREEN, run: { databaseId: 4, headSha: SHA } }),
      skipLearningCheck: true,
    },
  );
  assert.equal(picked.selected, null);
  assert.equal(picked.qualityInterrupt.type, 'REPAIR_WITHOUT_ROOT_CAUSE');
});

test('a closed repair chain lets product selection continue', () => {
  const picked = selectionWithQuality(
    {
      blocked: [],
      completed: [],
      attempts: { 'ci-repair|ci-ci-verify-test': 1 },
      repairDisposition: {
        failure: 'ci verify',
        reproducer: 'pnpm test',
        rootCause: 'missing limit',
        blastRadius: 'list route',
        fix: 'bounded query',
        regression: 'query hazard test',
        effect: 'list stays bounded',
        durableControl: 'scanQueryHazards',
      },
    },
    {
      repoState: { head: SHA, originMain: SHA, branch: 'main', ok: true },
      statusFor: () => ({ state: CI_STATES.CI_GREEN, run: { databaseId: 4, headSha: SHA } }),
      skipLearningCheck: true,
    },
  );
  assert.equal(picked.qualityInterrupt, null);
  assert.equal(picked.sessionPatch.repairDisposition, null);
  assert.equal(picked.sessionPatch.attempts['ci-repair|ci-ci-verify-test'], undefined);
});

test('a disposition cannot rename itself out of the repair chain', () => {
  const picked = selectionWithQuality(
    {
      blocked: [],
      completed: [],
      attempts: { 'ci-repair|ci-ci-verify-test': 1 },
      repairDisposition: { kind: 'note' },
    },
    {
      repoState: { head: SHA, originMain: SHA, branch: 'main', ok: true },
      statusFor: () => ({ state: CI_STATES.CI_GREEN, run: { databaseId: 4, headSha: SHA } }),
      skipLearningCheck: true,
    },
  );
  assert.equal(picked.selected, null);
  assert.equal(picked.qualityInterrupt.type, 'REPAIR_WITHOUT_ROOT_CAUSE');
});

test('CI_FAILED current HEAD blocks READY product selection', () => {
  const picked = selectionWithQuality(
    { blocked: [], completed: [], attempts: {} },
    {
      repoState: { head: SHA, originMain: SHA, branch: 'main', ok: true },
      statusFor: () => ({
        state: CI_STATES.CI_FAILED,
        run: { databaseId: 2, url: 'https://example.test/2' },
        failureSignature: 'ci-ci-verify-test',
        evidence: {},
      }),
    },
  );
  assert.equal(picked.selected, null);
  assert.equal(picked.exhaustionAllowed, false);
  assert.equal(picked.qualityInterrupt.type, 'CI_REPAIR_REQUIRED');
});

test('CI_IN_PROGRESS blocks product selection', () => {
  const picked = selectionWithQuality(
    { blocked: [], completed: [], attempts: {} },
    {
      repoState: { head: SHA, originMain: SHA, branch: 'main', ok: true },
      statusFor: () => ({ state: CI_STATES.CI_IN_PROGRESS, run: { databaseId: 3 } }),
    },
  );
  assert.equal(picked.selected, null);
  assert.equal(picked.qualityInterrupt.type, 'CI_PENDING');
});

test('CI_UNAVAILABLE is not false green', () => {
  const picked = selectionWithQuality(
    { blocked: [], completed: [], attempts: {} },
    {
      repoState: { head: SHA, originMain: SHA, branch: 'main', ok: true },
      statusFor: () => ({ state: CI_STATES.CI_UNAVAILABLE, detail: 'offline' }),
    },
  );
  assert.notEqual(picked.qualityInterrupt?.type, CI_STATES.CI_GREEN);
  assert.equal(picked.selected, null);
});

test('complete requires exact CI GREEN and matching published SHA', () => {
  const green = requireExactCiGreen(SHA, {
    repoState: { head: SHA, originMain: SHA, branch: 'main' },
    statusFor: () => ({
      state: CI_STATES.CI_GREEN,
      run: { databaseId: 9, headSha: SHA },
    }),
  });
  assert.equal(green.ok, true);
  assert.equal(green.sha, SHA);

  const short = requireExactCiGreen(SHA.slice(0, 7), {
    repoState: { head: SHA, originMain: SHA, branch: 'main' },
    statusFor: () => ({
      state: CI_STATES.CI_GREEN,
      run: { databaseId: 9, headSha: SHA },
    }),
  });
  assert.equal(short.ok, true);
  assert.equal(short.sha, SHA);

  const red = requireExactCiGreen(SHA, {
    repoState: { head: SHA, originMain: SHA, branch: 'main' },
    statusFor: () => ({ state: CI_STATES.CI_FAILED, run: { databaseId: 9, headSha: SHA } }),
  });
  assert.equal(red.ok, false);
  assert.equal(red.reason, 'ci_not_green');

  const pending = requireExactCiGreen(SHA, {
    repoState: { head: SHA, originMain: SHA, branch: 'main' },
    statusFor: () => ({ state: CI_STATES.CI_IN_PROGRESS }),
  });
  assert.equal(pending.ok, false);

  const wrong = requireExactCiGreen(OTHER, {
    repoState: { head: SHA, originMain: SHA, branch: 'main' },
    statusFor: () => ({ state: CI_STATES.CI_GREEN, run: { headSha: SHA } }),
  });
  assert.equal(wrong.ok, false);
});
