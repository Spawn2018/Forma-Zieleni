import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  planCheckpointReview,
  runCheckpointReview,
} from './coderabbit-checkpoint.mjs';
import { coderabbitDisposition, coderabbitPrivacyBlocked } from '../fz-noc/policy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('CodeRabbit privacy gate blocks secret and customer paths', () => {
  const blocked = coderabbitPrivacyBlocked([
    'apps/web/app/home.tsx',
    '.env.local',
    'docs/private/offer.pdf',
    'customer-data/export.csv',
  ]);
  assert.deepEqual(blocked.sort(), ['.env.local', 'customer-data/export.csv', 'docs/private/offer.pdf'].sort());
  assert.equal(coderabbitDisposition({ privacyBlocked: true }), 'CODERABBIT_DEFERRED_UNAVAILABLE');
});

test('checkpoint planner skips trivial or rate-limited reviews', () => {
  assert.equal(
    planCheckpointReview({ paths: ['scripts/security/coderabbit-checkpoint.mjs'], trivial: true }).state,
    'CODERABBIT_NOT_NEEDED',
  );
  assert.equal(
    planCheckpointReview({
      paths: ['scripts/security/coderabbit-checkpoint.mjs'],
      quota: { status: 'DEFERRED', remaining: 0 },
      bin: 'coderabbit',
    }).state,
    'CODERABBIT_DEFERRED_RATE_LIMIT',
  );
  assert.equal(
    planCheckpointReview({
      paths: ['.env'],
      quota: { status: 'AVAILABLE', remaining: 2 },
      bin: 'coderabbit',
    }).state,
    'CODERABBIT_DEFERRED_UNAVAILABLE',
  );
  assert.equal(
    planCheckpointReview({
      paths: ['apps/api/src/config.ts'],
      diffText: 'password = "hunter2hunter2"',
      quota: { status: 'AVAILABLE', remaining: 2 },
      bin: 'coderabbit',
    }).state,
    'CODERABBIT_DEFERRED_UNAVAILABLE',
  );
});

test('dry-run checkpoint review does not invoke the CLI', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'fz-cr-'));
  try {
    const fake = path.join(dir, 'coderabbit.cmd');
    writeFileSync(fake, 'echo should-not-run\r\nexit /b 1\r\n');
    const result = runCheckpointReview({
      paths: ['scripts/security/coderabbit-checkpoint.mjs'],
      dryRun: true,
      bin: fake,
      quota: { status: 'AVAILABLE', remaining: 2 },
    });
    assert.equal(result.ok, true);
    assert.equal(result.dryRun, true);
    assert.equal(result.state, 'CODERABBIT_REQUESTED');
    assert.equal(result.action, 'review');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('disposition ladder covers pass findings and failure', () => {
  assert.equal(coderabbitDisposition({ passed: true }), 'CODERABBIT_PASS');
  assert.equal(coderabbitDisposition({ findings: true }), 'CODERABBIT_FINDINGS');
  assert.equal(coderabbitDisposition({ findingsFixed: true }), 'CODERABBIT_FINDINGS_FIXED');
  assert.equal(coderabbitDisposition({ findingsRejected: true }), 'CODERABBIT_FINDINGS_REJECTED_WITH_REASON');
  assert.equal(coderabbitDisposition({ failed: true }), 'CODERABBIT_FAILED');
  assert.ok(root.includes('Forma-zieleni') || root.toLowerCase().includes('forma'));
});
