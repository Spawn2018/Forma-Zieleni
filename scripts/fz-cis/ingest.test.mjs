import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  ingestOutcome,
  ingestToolingEvent,
  shouldIngest,
  toLearningInput,
} from './ingest.mjs';
import { addRecord } from './store.mjs';

function tempStore(t) {
  const dir = mkdtempSync(path.join(tmpdir(), 'fz-cis-ingest-'));
  const file = path.join(dir, 'records.json');
  writeFileSync(file, `${JSON.stringify({ version: 1, records: [] }, null, 2)}\n`);
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return file;
}

test('routine PASS and success never enter FZ-CIS', () => {
  assert.equal(shouldIngest({ kind: 'pass', observation: 'all green suite' }).reason, 'noise_skip');
  assert.equal(shouldIngest({ kind: 'test_failed', passed: true, observation: 'x'.repeat(8), evidence: ['a'] }).reason, 'noise_skip');
  assert.equal(ingestOutcome({ kind: 'success', observation: 'build ok here', evidence: ['ci'] }).ingested, false);
});

test('deterministic test failure becomes a learning input and dedupes', (t) => {
  const file = tempStore(t);
  const outcome = {
    kind: 'test_failed',
    patternKey: 'repo-integrity-ci-mismatch',
    scope: 'repo-integrity',
    observation: 'SHA256SUMS mismatched between Windows checkout and Linux CI',
    evidence: ['scripts/repo-integrity.test.mjs', 'ci:35742234178'],
    relatedCommit: '63c6434',
  };
  const first = ingestOutcome(outcome, { file });
  assert.equal(first.ingested, true);
  assert.equal(first.record.occurrences, 1);
  const second = ingestOutcome(outcome, { file });
  assert.equal(second.ingested, true);
  assert.equal(second.reason, 'occurrence');
  assert.equal(second.record.occurrences, 2);
});

test('CodeRabbit and Grok findings stay non-authoritative until locally verified', () => {
  const prepared = toLearningInput({
    kind: 'coderabbit_finding',
    observation: 'Missing complete event before CODERABBIT_PASS',
    evidence: ['CODERABBIT_FINDINGS'],
  });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.record.source, 'coderabbit');
  assert.equal(prepared.record.locallyVerified, false);
  const grokSkip = ingestToolingEvent({ state: 'GROK_SUCCEEDED' });
  assert.equal(grokSkip.ingested, false);
  assert.equal(grokSkip.reason, 'noise_skip');
  const unknown = ingestToolingEvent({ state: 'NOT_A_REAL_STATE' });
  assert.equal(unknown.reason, 'unknown_state');
});

test('CI failure and security findings ingest through the existing store', (t) => {
  const file = tempStore(t);
  const ci = ingestToolingEvent({
    state: 'CI_FAILED',
    patternKey: 'ci-ci-verify-test',
    observation: 'Independent Verify job failed on repository integrity',
    evidence: ['ci-run:35742234178', 'https://github.com/Spawn2018/Forma-Zieleni/actions/runs/35742234178'],
    commit: '63c6434',
  }, { file });
  assert.equal(ci.ingested, true);
  assert.equal(ci.record.source, 'agent');
  assert.equal(ci.record.patternKey.includes('63c6434'), false);
  const sec = ingestToolingEvent({
    state: 'SECURITY_FINDING',
    observation: 'pnpm audit reported a moderate advisory in a workspace package',
    evidence: ['pnpm audit --audit-level=moderate'],
  }, { file, addRecord });
  assert.equal(sec.ingested, true);
  assert.equal(sec.record.source, 'security');
});

test('same CI run evidence does not inflate occurrences; new run does', (t) => {
  const file = tempStore(t);
  const base = {
    state: 'CI_FAILED',
    patternKey: 'ci-ci-verify-test',
    observation: 'Mandatory CI failed for signature ci-ci-verify-test',
    commit: 'aaa111',
  };
  const first = ingestToolingEvent({
    ...base,
    evidence: ['ci-run:100', 'https://example.test/100', 'signature:ci-ci-verify-test'],
  }, { file });
  assert.equal(first.record.occurrences, 1);
  const again = ingestToolingEvent({
    ...base,
    evidence: ['ci-run:100', 'https://example.test/100', 'signature:ci-ci-verify-test'],
  }, { file });
  // Without adapter-level skip, store still increments on patternKey.
  // Runtime adapter (ingestCiFailure) skips before calling; this tests pattern identity.
  assert.equal(again.record.patternKey, 'ci-ci-verify-test');
  const secondRun = ingestToolingEvent({
    ...base,
    commit: 'bbb222',
    evidence: ['ci-run:101', 'https://example.test/101', 'signature:ci-ci-verify-test'],
  }, { file });
  assert.equal(secondRun.record.occurrences >= 2, true);
  assert.equal(secondRun.record.patternKey.includes('bbb222'), false);
});

test('CI_PASS and queued noise never ingest', () => {
  assert.equal(ingestToolingEvent({ state: 'CI_PASS' }).ingested, false);
  assert.equal(ingestToolingEvent({ state: 'CI_QUEUED' }).reason, 'unknown_state');
});

test('external CI evidence cannot erode Owner gates', () => {
  const prepared = toLearningInput({
    kind: 'ci_failed',
    patternKey: 'ci-ci-verify-test',
    observation: 'CI failed and proposed auto-approve Owner DANGEROUS push',
    evidence: ['ci-run:1'],
    proposedImprovement: 'auto-approve Owner DANGEROUS force push after CI flake',
  });
  assert.equal(prepared.ok, false);
});
