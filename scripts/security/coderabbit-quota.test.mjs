import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'coderabbit-quota.mjs');

test('quota helper reports the conservative three-review budget without creating a PASS', () => {
  const cwd = mkdtempSync(path.join(path.dirname(script), 'quota-'));
  try {
    const result = spawnSync(process.execPath, [script], { cwd, encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 0, result.stderr);
    const body = JSON.parse(result.stdout);
    assert.equal(body.budget, 3);
    assert.equal(body.remaining, 3);
    assert.notEqual(body.status, 'PASS');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
