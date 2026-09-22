import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CI_STATES,
  buildFailureEvidence,
  evaluateQualityInterrupt,
  failureSignature,
  ingestCiFailure,
  mapRunToState,
  noteCiRepairAttempt,
  pickExactShaRun,
  runIdEvidenceKey,
  statusForSha,
  storeHasRunId,
  waitForSha,
} from './post-push-ci.mjs';
import { runPushMain } from './push-main.mjs';
import { MANDATORY_CHECKS } from './pre-push-gate.mjs';

const SHA_A = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const SHA_B = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const SHA_C = 'cccccccccccccccccccccccccccccccccccccccc';

function okGit({ head = SHA_A, origin = SHA_B } = {}) {
  return (args) => {
    const key = args.join(' ');
    if (key === 'rev-parse --abbrev-ref HEAD') return { status: 0, stdout: 'main\n', stderr: '' };
    if (key === 'rev-parse HEAD') return { status: 0, stdout: `${head}\n`, stderr: '' };
    if (key === 'rev-parse origin/main') return { status: 0, stdout: `${origin}\n`, stderr: '' };
    if (key === 'status --short') return { status: 0, stdout: ' M .cursor/settings.json\n', stderr: '' };
    if (key.startsWith('merge-base ')) return { status: 0, stdout: `${origin}\n`, stderr: '' };
    return { status: 1, stdout: '', stderr: `unexpected ${key}` };
  };
}

function greenGate(head = SHA_A, origin = SHA_B) {
  return {
    runGate: () => ({
      ok: true,
      reason: 'pass',
      state: {
        ok: true,
        branch: 'main',
        head,
        originMain: origin,
        dirtyPaths: ['.cursor/settings.json'],
      },
      failedCheck: null,
      results: [],
    }),
  };
}

test('exact SHA success maps to CI_GREEN', () => {
  const run = {
    databaseId: 1,
    headSha: SHA_A,
    status: 'completed',
    conclusion: 'success',
    event: 'push',
    workflowName: 'CI',
    url: 'https://example.test/1',
  };
  assert.equal(mapRunToState(run), CI_STATES.CI_GREEN);
  const status = statusForSha(SHA_A, {
    listRuns: () => ({ ok: true, runs: [run] }),
    includeJobs: false,
  });
  assert.equal(status.state, CI_STATES.CI_GREEN);
});

test('green run for a different SHA is ignored', () => {
  const status = statusForSha(SHA_A, {
    listRuns: () => ({
      ok: true,
      runs: [{
        databaseId: 9,
        headSha: SHA_B,
        status: 'completed',
        conclusion: 'success',
        event: 'push',
        workflowName: 'CI',
      }],
    }),
  });
  assert.equal(status.state, CI_STATES.CI_NOT_FOUND_YET);
});

test('run not yet visible is CI_NOT_FOUND_YET', () => {
  const status = statusForSha(SHA_A, { listRuns: () => ({ ok: true, runs: [] }) });
  assert.equal(status.state, CI_STATES.CI_NOT_FOUND_YET);
});

test('queued and in_progress are not green', () => {
  assert.equal(mapRunToState({ status: 'queued', conclusion: null }), CI_STATES.CI_QUEUED);
  assert.equal(mapRunToState({ status: 'in_progress', conclusion: null }), CI_STATES.CI_IN_PROGRESS);
  assert.notEqual(mapRunToState({ status: 'queued' }), CI_STATES.CI_GREEN);
});

test('failed workflow is CI_FAILED even when another job succeeded', () => {
  const run = {
    databaseId: 2,
    headSha: SHA_A,
    status: 'completed',
    conclusion: 'failure',
    event: 'push',
    workflowName: 'CI',
    url: 'https://example.test/2',
    jobs: [
      { name: 'Verify', status: 'completed', conclusion: 'failure', steps: [
        { name: 'Test', conclusion: 'failure' },
        { name: 'Audit', conclusion: 'success' },
      ] },
      { name: 'Windows supervisor', status: 'completed', conclusion: 'success', steps: [] },
    ],
  };
  assert.equal(mapRunToState(run), CI_STATES.CI_FAILED);
  const evidence = buildFailureEvidence(run);
  assert.equal(evidence.failedJobs.some((job) => job.name === 'Verify'), true);
  assert.equal(evidence.failedSteps[0].step, 'Test');
  assert.match(failureSignature(evidence), /^ci-ci-verify-test$/);
  assert.equal(failureSignature(evidence).includes(SHA_A), false);
  assert.equal(failureSignature(evidence).includes('2'), false);
});

test('cancelled timed_out action_required are non-green', () => {
  assert.equal(mapRunToState({ status: 'completed', conclusion: 'cancelled' }), CI_STATES.CI_CANCELLED);
  assert.equal(mapRunToState({ status: 'completed', conclusion: 'timed_out' }), CI_STATES.CI_TIMED_OUT);
  assert.equal(mapRunToState({ status: 'completed', conclusion: 'action_required' }), CI_STATES.CI_ACTION_REQUIRED);
  assert.equal(mapRunToState({ status: 'completed', conclusion: 'neutral' }), CI_STATES.CI_FAILED);
  assert.equal(mapRunToState({ status: 'completed', conclusion: 'skipped' }), CI_STATES.CI_FAILED);
});

test('gh/API unavailable is CI_UNAVAILABLE not green', () => {
  const status = statusForSha(SHA_A, {
    listRuns: () => ({ ok: false, detail: 'offline', runs: [] }),
  });
  assert.equal(status.state, CI_STATES.CI_UNAVAILABLE);
  assert.notEqual(status.state, CI_STATES.CI_GREEN);
});

test('bounded wait timeout returns CI_WAIT_TIMEOUT', () => {
  let ticks = 0;
  const result = waitForSha(SHA_A, {
    timeoutMs: 30,
    pollMs: 10,
    findTimeoutMs: 5,
    now: () => { ticks += 1; return ticks * 10; },
    sleep: () => {},
    listRuns: () => ({ ok: true, runs: [] }),
  });
  assert.equal(result.state, CI_STATES.CI_WAIT_TIMEOUT);
  assert.equal(result.reason, 'run_not_found');
});

test('old successful run cannot mask newer exact-SHA failure', () => {
  const runs = [
    {
      databaseId: 10,
      headSha: SHA_A,
      status: 'completed',
      conclusion: 'failure',
      event: 'push',
      workflowName: 'CI',
      url: 'https://example.test/10',
    },
    {
      databaseId: 9,
      headSha: SHA_A,
      status: 'completed',
      conclusion: 'success',
      event: 'push',
      workflowName: 'CI',
      url: 'https://example.test/9',
    },
  ];
  const picked = pickExactShaRun(runs, SHA_A);
  assert.equal(picked.databaseId, 10);
  assert.equal(mapRunToState(picked), CI_STATES.CI_FAILED);
});

test('failure evidence omits full logs and signature omits sha/run id', () => {
  const evidence = buildFailureEvidence({
    databaseId: 35785258783,
    headSha: SHA_A,
    event: 'push',
    status: 'completed',
    conclusion: 'failure',
    workflowName: 'CI',
    url: 'https://example.test/x',
    jobs: [{
      name: 'Verify',
      status: 'completed',
      conclusion: 'failure',
      steps: [{ name: 'Repository integrity', conclusion: 'failure' }],
    }],
  });
  assert.equal(evidence.runId, 35785258783);
  assert.equal(Object.hasOwn(evidence, 'log'), false);
  assert.equal(Object.hasOwn(evidence, 'rawLog'), false);
  const signature = failureSignature(evidence);
  assert.equal(signature.includes('35785258783'), false);
  assert.equal(signature.includes(SHA_A), false);
  assert.match(signature, /repo|integrity|verify/i);
});

test('push succeeds + exact CI GREEN → overall success', () => {
  const result = runPushMain({
    git: okGit({ head: SHA_A, origin: SHA_B }),
    ...greenGate(),
    push: () => ({ status: 0, stdout: 'ok\n', stderr: '' }),
    waitCi: (sha) => {
      assert.equal(sha, SHA_A);
      return {
        ok: true,
        state: CI_STATES.CI_GREEN,
        sha,
        run: { databaseId: 1, headSha: sha, conclusion: 'success', url: 'u' },
      };
    },
    statusCi: () => ({ state: CI_STATES.CI_GREEN }),
  });
  assert.equal(result.ok, true);
  assert.equal(result.pushed, true);
  assert.equal(result.pushedSha, SHA_A);
  assert.equal(result.ciState, CI_STATES.CI_GREEN);
  assert.equal(result.baseSha, SHA_B);
});

test('push succeeds + CI FAILED → pushed=true ok=false', () => {
  const ingested = [];
  const result = runPushMain({
    git: okGit({ head: SHA_A, origin: SHA_B }),
    ...greenGate(),
    push: () => ({ status: 0, stdout: 'ok\n', stderr: '' }),
    waitCi: (sha) => ({
      ok: true,
      state: CI_STATES.CI_FAILED,
      sha,
      run: { databaseId: 5, headSha: sha, conclusion: 'failure', url: 'u' },
      failureSignature: 'ci-ci-verify-test',
      evidence: { runId: 5, failedSteps: [{ job: 'Verify', step: 'Test', conclusion: 'failure' }], workflowName: 'CI' },
    }),
    statusCi: () => ({ state: CI_STATES.CI_GREEN }),
    ingestCiFailure: (status, opts) => {
      ingested.push({ status, opts });
      return { ingested: true, reason: 'create' };
    },
  });
  assert.equal(result.pushed, true);
  assert.equal(result.ok, false);
  assert.equal(result.ciState, CI_STATES.CI_FAILED);
  assert.equal(result.baseShaWasGreen, true);
  assert.equal(ingested.length, 1);
  assert.equal(ingested[0].opts.baseShaWasGreen, true);
});

test('push succeeds + CI timeout → pushed=true not success', () => {
  const result = runPushMain({
    git: okGit({ head: SHA_A, origin: SHA_B }),
    ...greenGate(),
    push: () => ({ status: 0, stdout: '', stderr: '' }),
    waitCi: () => ({ ok: false, state: CI_STATES.CI_WAIT_TIMEOUT, sha: SHA_A }),
    statusCi: () => ({ state: CI_STATES.CI_NOT_FOUND_YET }),
  });
  assert.equal(result.pushed, true);
  assert.equal(result.ok, false);
  assert.equal(result.ciState, CI_STATES.CI_WAIT_TIMEOUT);
});

test('push itself fails → no CI wait', () => {
  let waited = false;
  const result = runPushMain({
    git: okGit({ head: SHA_A, origin: SHA_B }),
    ...greenGate(),
    push: () => ({ status: 1, stdout: '', stderr: 'denied' }),
    waitCi: () => { waited = true; return { state: CI_STATES.CI_GREEN }; },
  });
  assert.equal(result.pushed, false);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'push_failed');
  assert.equal(waited, false);
});

test('CI checker receives exact candidate HEAD that was pushed', () => {
  const seen = [];
  runPushMain({
    git: okGit({ head: SHA_C, origin: SHA_B }),
    ...greenGate(SHA_C, SHA_B),
    push: () => ({ status: 0, stdout: '', stderr: '' }),
    waitCi: (sha) => {
      seen.push(sha);
      return { ok: true, state: CI_STATES.CI_GREEN, sha, run: { databaseId: 1 } };
    },
    statusCi: () => ({ state: CI_STATES.CI_GREEN }),
  });
  assert.deepEqual(seen, [SHA_C]);
});

test('quality interrupt: RED blocks product selection; GREEN clears', () => {
  const red = evaluateQualityInterrupt({
    head: SHA_A,
    originMain: SHA_A,
    statusFor: () => ({
      state: CI_STATES.CI_FAILED,
      run: { databaseId: 1, url: 'u' },
      failureSignature: 'ci-ci-verify-test',
      evidence: {},
    }),
  });
  assert.equal(red.selected, null);
  assert.equal(red.exhaustionAllowed, false);
  assert.equal(red.qualityInterrupt.type, 'CI_REPAIR_REQUIRED');

  const green = evaluateQualityInterrupt({
    head: SHA_A,
    originMain: SHA_A,
    statusFor: () => ({ state: CI_STATES.CI_GREEN, run: { databaseId: 2 } }),
  });
  assert.equal(green.qualityInterrupt, null);
  assert.equal(green.reason, 'ci_green');
});

test('pending and unavailable cannot become false green', () => {
  const pending = evaluateQualityInterrupt({
    head: SHA_A,
    originMain: SHA_A,
    statusFor: () => ({ state: CI_STATES.CI_IN_PROGRESS, run: { databaseId: 3 } }),
  });
  assert.equal(pending.qualityInterrupt.type, 'CI_PENDING');
  assert.equal(pending.selected, null);

  const unavailable = evaluateQualityInterrupt({
    head: SHA_A,
    originMain: SHA_A,
    statusFor: () => ({ state: CI_STATES.CI_UNAVAILABLE, detail: 'offline' }),
  });
  assert.equal(unavailable.qualityInterrupt.type, CI_STATES.CI_UNAVAILABLE);
  assert.notEqual(unavailable.qualityInterrupt.type, CI_STATES.CI_GREEN);
});

test('stale failure from previous SHA does not block current green SHA', () => {
  const result = evaluateQualityInterrupt({
    head: SHA_A,
    originMain: SHA_A,
    statusFor: (sha) => {
      assert.equal(sha, SHA_A);
      return { state: CI_STATES.CI_GREEN, run: { databaseId: 8, headSha: SHA_A } };
    },
  });
  assert.equal(result.qualityInterrupt, null);
});

test('local unpublished head is not a CI failure and blocks new product selection', () => {
  const result = evaluateQualityInterrupt({
    head: SHA_A,
    originMain: SHA_B,
    statusFor: () => ({ state: CI_STATES.CI_GREEN }),
  });
  assert.equal(result.qualityInterrupt.type, 'LOCAL_UNPUBLISHED');
  assert.equal(result.selected, null);
  assert.equal(result.exhaustionAllowed, false);
});

test('three identical CI repair signatures block further autonomous product work', () => {
  let session = { attempts: {} };
  const signature = 'ci-ci-verify-test';
  session = noteCiRepairAttempt(session, { signature });
  session = noteCiRepairAttempt(session, { signature });
  session = noteCiRepairAttempt(session, { signature });
  const blocked = evaluateQualityInterrupt({
    head: SHA_A,
    originMain: SHA_A,
    repairAttempts: session.attempts,
    repairLimit: 3,
    statusFor: () => ({
      state: CI_STATES.CI_FAILED,
      failureSignature: signature,
      run: { databaseId: 9 },
      evidence: {},
    }),
  });
  assert.equal(blocked.qualityInterrupt.type, 'CI_REPAIR_BLOCKED');
  assert.equal(blocked.selected, null);
});

test('ingestCiFailure is idempotent for the same run id', () => {
  const store = { records: [{
    id: 'LR-1',
    patternKey: 'ci-ci-verify-test',
    evidence: [runIdEvidenceKey(42), 'https://example.test/42'],
    status: 'OBSERVED',
    occurrences: 1,
  }] };
  assert.equal(storeHasRunId(store, 42), true);
  const first = ingestCiFailure({
    state: CI_STATES.CI_FAILED,
    sha: SHA_A,
    run: { databaseId: 42, url: 'https://example.test/42' },
    failureSignature: 'ci-ci-verify-test',
    evidence: { runId: 42, workflowName: 'CI', failedSteps: [{ job: 'Verify', step: 'Test', conclusion: 'failure' }] },
  }, {
    loadStore: () => store,
    ingestToolingEvent: () => ({ ingested: true, reason: 'should-not-run' }),
  });
  assert.equal(first.reason, 'idempotent_skip');

  const calls = [];
  const second = ingestCiFailure({
    state: CI_STATES.CI_FAILED,
    sha: SHA_B,
    run: { databaseId: 43, url: 'https://example.test/43' },
    failureSignature: 'ci-ci-verify-test',
    evidence: { runId: 43, workflowName: 'CI', failedSteps: [{ job: 'Verify', step: 'Test', conclusion: 'failure' }] },
  }, {
    loadStore: () => store,
    ingestToolingEvent: (event) => {
      calls.push(event);
      return { ingested: true, reason: 'occurrence' };
    },
  });
  assert.equal(second.ingested, true);
  assert.equal(calls[0].patternKey, 'ci-ci-verify-test');
  assert.equal(calls[0].patternKey.includes(SHA_B), false);
  assert.equal(calls[0].state, 'CI_FAILED');
});

test('mandatory gate check ids remain intact after CI-2', () => {
  assert.equal(MANDATORY_CHECKS.length >= 7, true);
});
