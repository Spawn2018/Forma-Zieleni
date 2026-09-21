import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'coderabbit-quota.mjs');

function run(log, args = [], cwd = path.dirname(script)) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    env: { ...process.env, CODERABBIT_QUOTA_LOG: log },
  });
}

function body(result) {
  assert.equal(result.status === 0 || result.status === 2, true, result.stderr);
  return JSON.parse(result.stdout);
}

test('quota helper reports the conservative three-review budget without creating a PASS', () => {
  const parent = path.dirname(script);
  const first = mkdtempSync(path.join(parent, 'quota-a-'));
  const second = mkdtempSync(path.join(parent, 'quota-b-'));
  const log = path.join(first, 'coderabbit-reviews.json');
  try {
    const results = [first, second].map(cwd => run(log, [], cwd));
    for (const result of results) {
      const report = body(result);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(report.budget, 3);
      assert.equal(report.used, 0);
      assert.equal(report.remaining, 3);
      assert.equal(report.usedOfBudget, '0/3');
      assert.equal(report.availableOfBudget, '3/3');
      assert.notEqual(report.status, 'PASS');
    }
    assert.deepEqual(JSON.parse(results[0].stdout), JSON.parse(results[1].stdout));
  } finally {
    rmSync(first, { recursive: true, force: true });
    rmSync(second, { recursive: true, force: true });
  }
});

test('one successful review is 1/3 used and 2/3 available; failures and bare record do not consume', () => {
  const dir = mkdtempSync(path.join(path.dirname(script), 'quota-count-'));
  const log = path.join(dir, 'coderabbit-reviews.json');
  try {
    const now = Date.now();
    writeFileSync(log, JSON.stringify([
      { startedAt: new Date(now - 20 * 60 * 1000).toISOString(), outcome: 'fail' },
      { startedAt: new Date(now - 10 * 60 * 1000).toISOString(), outcome: 'success' },
    ]));
    const report = body(run(log));
    assert.equal(report.used, 1);
    assert.equal(report.remaining, 2);
    assert.equal(report.usedOfBudget, '1/3');
    assert.equal(report.availableOfBudget, '2/3');
    assert.equal(report.status, 'AVAILABLE');

    const failed = body(run(log, ['fail']));
    assert.equal(failed.recorded, 'fail');
    assert.equal(failed.usedOfBudget, '1/3');
    assert.equal(failed.availableOfBudget, '2/3');

    writeFileSync(log, JSON.stringify([
      { startedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
      { startedAt: new Date(Date.now() - 60 * 1000).toISOString(), outcome: 'success' },
    ]));
    const legacy = body(run(log));
    assert.equal(legacy.usedOfBudget, '1/3');
    assert.equal(legacy.availableOfBudget, '2/3');

    const reserved = run(log, ['record']);
    assert.equal(reserved.status, 2);
    const rejected = body(reserved);
    assert.equal(rejected.reason, 'INVALID_QUOTA_COMMAND');
    assert.equal(rejected.usedOfBudget, '1/3');
    assert.equal(rejected.availableOfBudget, '2/3');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
