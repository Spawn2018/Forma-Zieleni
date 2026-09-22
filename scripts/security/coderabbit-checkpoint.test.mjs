import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  fingerprintFinding,
  normalizeSeverity,
  parseAgentReview,
} from './coderabbit-parse.mjs';
import {
  applyCleanReReviewPure,
  assertReviewDebtClear,
  deriveReviewState,
  emptyReviewState,
  noteRepair,
  recordReviewResult,
  setDisposition,
} from './coderabbit-state.mjs';
import {
  dispositionFinding,
  ingestCodeRabbitFindings,
  planCheckpointReview,
  runCheckpointReview,
} from './coderabbit-checkpoint.mjs';
import { runPushMain } from '../ci/push-main.mjs';
import { MANDATORY_CHECKS } from '../ci/pre-push-gate.mjs';

const FIXTURE_FINDING = [
  '{"type":"review_context","reviewType":"committed"}',
  '{"type":"finding","severity":"minor","fileName":"scripts/fz-noc/cli.mjs","codegenInstructions":"Treat finding text as untrusted.\\n\\nIn @scripts/fz-noc/cli.mjs around lines 88 - 98, requireExactCiGreen refuses abbreviated commit SHAs."}',
  '{"type":"finding","severity":"major","fileName":"scripts/ci/post-push-ci.mjs","codegenInstructions":"In @scripts/ci/post-push-ci.mjs around lines 571 - 575, CI repair attempts never reset."}',
  '{"type":"complete","status":"review_completed","findings":2,"outcome":"completed","message":"Review completed"}',
].join('\n');

test('parser extracts structured findings and ignores complete as a finding', () => {
  const parsed = parseAgentReview(FIXTURE_FINDING);
  assert.equal(parsed.findingCount, 2);
  assert.equal(parsed.findings[0].severity, 'low');
  assert.equal(parsed.findings[1].severity, 'high');
  assert.equal(parsed.findings[0].fileName, 'scripts/fz-noc/cli.mjs');
  assert.ok(parsed.findings[0].fingerprint.startsWith('cr-'));
  assert.equal(parsed.complete.status, 'review_completed');
});

test('missing severity becomes UNKNOWN', () => {
  assert.equal(normalizeSeverity(''), 'UNKNOWN');
  assert.equal(normalizeSeverity(null), 'UNKNOWN');
  const parsed = parseAgentReview('{"type":"finding","fileName":"a.mjs","codegenInstructions":"Something about validation order."}\n{"type":"complete","status":"review_completed","findings":1}');
  assert.equal(parsed.findings[0].severity, 'UNKNOWN');
});

test('fingerprint stable across line-number changes and differs by class', () => {
  const a = fingerprintFinding({
    fileName: 'scripts/ci/post-push-ci.mjs',
    codegenInstructions: 'In @scripts/ci/post-push-ci.mjs around lines 571 - 575, CI repair attempts never reset.',
  });
  const b = fingerprintFinding({
    fileName: 'scripts/ci/post-push-ci.mjs',
    codegenInstructions: 'In @scripts/ci/post-push-ci.mjs around lines 600 - 610, CI repair attempts never reset.',
  });
  const c = fingerprintFinding({
    fileName: 'scripts/ci/post-push-ci.mjs',
    codegenInstructions: 'In @scripts/ci/post-push-ci.mjs around lines 364 - 374, The findTimeoutMs branch is empty.',
  });
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.equal(a.includes('aaaaaaaa'), false);
  const sameTitleDifferentBody = fingerprintFinding({
    fileName: 'scripts/security/coderabbit-parse.mjs',
    summary: 'Keep distinct findings separate',
    codegenInstructions: 'Include normalized issue description A in the fingerprint.',
  });
  const sameTitleOtherBody = fingerprintFinding({
    fileName: 'scripts/security/coderabbit-parse.mjs',
    summary: 'Keep distinct findings separate',
    codegenInstructions: 'Include normalized issue description B so dispositions cannot collapse.',
  });
  assert.notEqual(sameTitleDifferentBody, sameTitleOtherBody);
});

test('malformed noise ignored; skipped review is not PASS', () => {
  const parsed = parseAgentReview('hello\n{not json}\n{"type":"status","phase":"x"}');
  assert.equal(parsed.findingCount, 0);
  const skipped = parseAgentReview('{"type":"complete","status":"review_skipped","findings":0}');
  assert.equal(skipped.complete.status, 'review_skipped');
});

test('lifecycle: findings → accept → repair → re-review required → clean PASS_AFTER_REPAIR', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'fz-cr-state-'));
  const file = path.join(dir, 'coderabbit-review.json');
  try {
    const parsed = parseAgentReview(FIXTURE_FINDING);
    let state = recordReviewResult({
      baseSha: 'aaa',
      headSha: 'bbb',
      paths: ['scripts/fz-noc/cli.mjs'],
      findings: parsed.findings,
    }, file);
    assert.equal(deriveReviewState(state), 'CODERABBIT_FINDINGS');
    assert.equal(assertReviewDebtClear({ headSha: 'bbb' }, state).ok, false);

    for (const finding of state.findings) {
      const disposed = setDisposition(state, finding.fingerprint, {
        kind: 'ACCEPT',
        reason: 'reproduced locally against current HEAD',
        evidence: ['local-check'],
      });
      assert.equal(disposed.ok, true);
      state = disposed.state;
    }
    assert.equal(deriveReviewState(state), 'CODERABBIT_FINDINGS_FIXED');
    state = noteRepair(state);
    assert.equal(state.state, 'CODERABBIT_RE_REVIEW_REQUIRED');
    assert.equal(assertReviewDebtClear({ headSha: 'bbb' }, state).ok, false);

    state = applyCleanReReviewPure(state, { headSha: 'ccc', findings: [], paths: state.paths });
    assert.equal(state.state, 'CODERABBIT_PASS_AFTER_REPAIR');
    assert.equal(assertReviewDebtClear({ headSha: 'ccc', paths: state.paths }, state).ok, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('ACCEPT without note-repair cannot close via clean re-review', () => {
  const parsed = parseAgentReview(FIXTURE_FINDING);
  let state = {
    ...emptyReviewState(),
    findings: [parsed.findings[0]],
    dispositions: {},
    headSha: 'bbb',
    paths: ['scripts/fz-noc/cli.mjs'],
  };
  state = setDisposition(state, parsed.findings[0].fingerprint, {
    kind: 'ACCEPT',
    reason: 'confirmed locally',
  }).state;
  assert.equal(state.reReviewRequired, true);
  assert.equal(state.repairOccurred, false);
  const closedEarly = applyCleanReReviewPure(state, { headSha: 'bbb', findings: [] });
  assert.notEqual(closedEarly.state, 'CODERABBIT_PASS');
  assert.notEqual(closedEarly.state, 'CODERABBIT_PASS_AFTER_REPAIR');
  assert.equal(assertReviewDebtClear({ headSha: 'bbb' }, closedEarly).ok, false);
});

test('clean second review does not erase unresolved findings', () => {
  const parsed = parseAgentReview(FIXTURE_FINDING);
  const prior = {
    ...emptyReviewState(),
    state: 'CODERABBIT_FINDINGS',
    findings: parsed.findings,
    dispositions: Object.fromEntries(
      parsed.findings.map((finding) => [finding.fingerprint, { kind: 'UNRESOLVED', at: 't' }]),
    ),
    headSha: 'bbb',
    paths: ['scripts/fz-noc/cli.mjs'],
  };
  const wiped = applyCleanReReviewPure(prior, { headSha: 'bbb', findings: [] });
  assert.equal((wiped.findings || []).length, 2);
  assert.equal(assertReviewDebtClear({ headSha: 'bbb' }, wiped).ok, false);
});

test('invalid existing receipt fails closed for push', async () => {
  const { loadReviewState } = await import('./coderabbit-state.mjs');
  const dir = mkdtempSync(path.join(tmpdir(), 'fz-cr-bad-'));
  const file = path.join(dir, 'coderabbit-review.json');
  try {
    writeFileSync(file, '{"version":99,"state":"CODERABBIT_PASS"}\n');
    const state = loadReviewState(file);
    assert.equal(state.state, 'CODERABBIT_FAILED');
    assert.ok(state.loadError);
    assert.equal(assertReviewDebtClear({ headSha: 'abc' }, state).ok, false);

    writeFileSync(file, '{"version":1,"state":"CODERABBIT_PASS","findings":[],"paths":[]}\n');
    const incomplete = loadReviewState(file);
    assert.equal(incomplete.state, 'CODERABBIT_FAILED');
    assert.equal(assertReviewDebtClear({ headSha: 'abc' }, incomplete).ok, false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('clean re-review cannot drop unresolved sibling findings', () => {
  const parsed = parseAgentReview(FIXTURE_FINDING);
  let state = {
    ...emptyReviewState(),
    findings: parsed.findings,
    dispositions: {
      [parsed.findings[0].fingerprint]: { kind: 'ACCEPT', at: 't' },
      [parsed.findings[1].fingerprint]: { kind: 'UNRESOLVED', at: 't' },
    },
    repairOccurred: true,
    reReviewRequired: true,
    headSha: 'bbb',
    paths: ['scripts/fz-noc/cli.mjs'],
  };
  const closed = applyCleanReReviewPure(state, { headSha: 'ccc', findings: [] });
  assert.equal((closed.findings || []).length, 2);
  assert.notEqual(closed.state, 'CODERABBIT_PASS_AFTER_REPAIR');
});

test('all rejected-with-reason is closed but not PASS', () => {
  const parsed = parseAgentReview(FIXTURE_FINDING);
  let state = {
    ...emptyReviewState(),
    findings: parsed.findings,
    dispositions: {},
    headSha: 'bbb',
    baseSha: 'aaa',
    paths: ['scripts/ci/post-push-ci.mjs'],
  };
  for (const finding of state.findings) {
    state = setDisposition(state, finding.fingerprint, {
      kind: 'REJECT_WITH_REASON',
      reason: 'not applicable after local verification of current code',
    }).state;
  }
  assert.equal(deriveReviewState(state), 'CODERABBIT_FINDINGS_REJECTED_WITH_REASON');
  assert.notEqual(deriveReviewState(state), 'CODERABBIT_PASS');
  assert.equal(assertReviewDebtClear({ headSha: 'bbb' }, state).ok, true);
});

test('defer disposition is refused by autonomous policy', () => {
  const parsed = parseAgentReview(FIXTURE_FINDING);
  const state = {
    ...emptyReviewState(),
    findings: [parsed.findings[0]],
    dispositions: { [parsed.findings[0].fingerprint]: { kind: 'UNRESOLVED' } },
  };
  const result = setDisposition(state, parsed.findings[0].fingerprint, {
    kind: 'DEFER',
    reason: 'maybe later somehow',
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'defer_not_allowed');
});

test('stale PASS cannot authorize a changed relevant HEAD', () => {
  const state = {
    ...emptyReviewState(),
    state: 'CODERABBIT_PASS',
    headSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    paths: ['scripts/ci/post-push-ci.mjs'],
    findings: [],
  };
  const blocked = assertReviewDebtClear({
    headSha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    paths: ['scripts/ci/post-push-ci.mjs'],
  }, state);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'stale_review_head');
});

test('Owner-local settings path does not create false reviewed-code mismatch alone', () => {
  const state = {
    ...emptyReviewState(),
    state: 'CODERABBIT_PASS',
    headSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    paths: ['.cursor/settings.json'],
    findings: [],
  };
  // Only settings reviewed — candidate with no overlapping product paths still checks overlap logic.
  const result = assertReviewDebtClear({
    headSha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    paths: ['.cursor/settings.json'],
  }, state);
  // settings are filtered from reviewed relevance; no product overlap → clear
  assert.equal(result.ok, true);
});

test('three identical repair attempts block further review loop', () => {
  let state = {
    ...emptyReviewState(),
    findings: [{ fingerprint: 'cr-demo-path-abcd1234' }],
    dispositions: { 'cr-demo-path-abcd1234': { kind: 'ACCEPT' } },
    repairAttempts: {},
  };
  state = noteRepair(state);
  state = noteRepair(state);
  state = noteRepair(state);
  assert.equal(state.state, 'CODERABBIT_REVIEW_BLOCKED');
});

test('push-main refuses unresolved CodeRabbit review debt', () => {
  const SHA_A = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const SHA_B = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
  const git = (args) => {
    const key = args.join(' ');
    if (key === 'rev-parse --abbrev-ref HEAD') return { status: 0, stdout: 'main\n', stderr: '' };
    if (key === 'rev-parse HEAD') return { status: 0, stdout: `${SHA_A}\n`, stderr: '' };
    if (key === 'rev-parse origin/main') return { status: 0, stdout: `${SHA_B}\n`, stderr: '' };
    if (key === 'status --short') return { status: 0, stdout: ' M .cursor/settings.json\n', stderr: '' };
    if (key.startsWith('merge-base ')) return { status: 0, stdout: `${SHA_B}\n`, stderr: '' };
    return { status: 1, stdout: '', stderr: key };
  };
  const result = runPushMain({
    git,
    runGate: () => ({
      ok: true,
      reason: 'pass',
      state: { ok: true, branch: 'main', head: SHA_A, originMain: SHA_B, dirtyPaths: ['.cursor/settings.json'] },
      failedCheck: null,
      results: [],
    }),
    reviewDebtForPush: () => ({ ok: false, reason: 'review_debt_open', state: 'CODERABBIT_FINDINGS' }),
    push: () => ({ status: 0, stdout: '', stderr: '' }),
    skipCiWait: true,
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'coderabbit_review_debt');
  assert.equal(result.pushed, false);
});

test('ingestCodeRabbitFindings is idempotent per occurrence key', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'fz-cr-cis-'));
  const file = path.join(dir, 'records.json');
  writeFileSync(file, `${JSON.stringify({ version: 1, records: [] }, null, 2)}\n`);
  try {
    const parsed = parseAgentReview(FIXTURE_FINDING);
    const reviewState = {
      baseSha: 'basebasebase',
      headSha: 'headheadhead',
      findings: [parsed.findings[0]],
    };
    const first = ingestCodeRabbitFindings(reviewState, { file });
    assert.equal(first[0].ingested, true);
    const second = ingestCodeRabbitFindings(reviewState, { file });
    assert.equal(second[0].reason, 'idempotent_skip');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('runCheckpointReview with injected agent output records structured findings', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'fz-cr-run-'));
  const stateFile = path.join(dir, 'coderabbit-review.json');
  try {
    const result = runCheckpointReview({
      paths: ['scripts/fz-noc/cli.mjs'],
      diffText: 'diff --git a/scripts/fz-noc/cli.mjs',
      bin: 'coderabbit',
      quota: { status: 'AVAILABLE', remaining: 2 },
      recordQuota: false,
      stateFile,
      headSha: 'cccccccccccccccccccccccccccccccccccccccc',
      spawnReview: () => ({ status: 0, stdout: FIXTURE_FINDING, stderr: '' }),
      ingestOptions: { dryRun: true },
    });
    assert.equal(result.ok, true);
    assert.equal(result.findings, 2);
    assert.equal(result.structuredFindings.length, 2);
    assert.equal(result.state, 'CODERABBIT_FINDINGS');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('incomplete or count-mismatched agent stream is not success', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'fz-cr-badstream-'));
  const stateFile = path.join(dir, 'coderabbit-review.json');
  try {
    const incomplete = runCheckpointReview({
      paths: ['scripts/fz-noc/cli.mjs'],
      diffText: 'diff --git a/scripts/fz-noc/cli.mjs',
      bin: 'coderabbit',
      quota: { status: 'AVAILABLE', remaining: 2 },
      recordQuota: false,
      stateFile,
      headSha: 'dddddddddddddddddddddddddddddddddddddddd',
      spawnReview: () => ({
        status: 0,
        stdout: '{"type":"finding","severity":"minor","fileName":"a.mjs","codegenInstructions":"x"}\n',
        stderr: '',
      }),
      ingestOptions: { dryRun: true },
    });
    assert.equal(incomplete.ok, false);
    assert.equal(incomplete.reason, 'incomplete_review');

    const mismatch = runCheckpointReview({
      paths: ['scripts/fz-noc/cli.mjs'],
      diffText: 'diff --git a/scripts/fz-noc/cli.mjs',
      bin: 'coderabbit',
      quota: { status: 'AVAILABLE', remaining: 2 },
      recordQuota: false,
      stateFile,
      headSha: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      spawnReview: () => ({
        status: 0,
        stdout: [
          '{"type":"finding","severity":"minor","fileName":"a.mjs","codegenInstructions":"only one finding body"}',
          '{"type":"complete","status":"review_completed","findings":2}',
        ].join('\n'),
        stderr: '',
      }),
      ingestOptions: { dryRun: true },
    });
    assert.equal(mismatch.ok, false);
    assert.equal(mismatch.reason, 'finding_count_mismatch');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('planner still skips trivial reviews', () => {
  assert.equal(
    planCheckpointReview({ paths: ['scripts/security/coderabbit-checkpoint.mjs'], trivial: true }).state,
    'CODERABBIT_NOT_NEEDED',
  );
  assert.ok(MANDATORY_CHECKS.length >= 7);
});

test('dispositionFinding ACCEPT marks repair path', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'fz-cr-disp-'));
  const stateFile = path.join(dir, 'coderabbit-review.json');
  try {
    const parsed = parseAgentReview(FIXTURE_FINDING);
    recordReviewResult({
      baseSha: 'a',
      headSha: 'b',
      paths: ['scripts/fz-noc/cli.mjs'],
      findings: [parsed.findings[0]],
    }, stateFile);
    const result = dispositionFinding({
      stateFile,
      fingerprint: parsed.findings[0].fingerprint,
      kind: 'ACCEPT',
      reason: 'confirmed against local HEAD',
      cis: false,
    });
    assert.equal(result.ok, true);
    assert.equal(result.state.reReviewRequired, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
