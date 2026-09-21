import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'coderabbit-quota.mjs');

test('quota helper reports the conservative three-review budget without creating a PASS', () => {
  const parent = path.dirname(script);
  const first = mkdtempSync(path.join(parent, 'quota-a-'));
  const second = mkdtempSync(path.join(parent, 'quota-b-'));
  try {
    const results = [first, second].map(cwd => spawnSync(process.execPath, [script], { cwd, encoding: 'utf8', windowsHide: true }));
    for (const result of results) {
      assert.equal(result.status, 0, result.stderr);
      const body = JSON.parse(result.stdout);
      assert.equal(body.budget, 3);
      assert.ok(body.remaining >= 0 && body.remaining <= 3);
      assert.notEqual(body.status, 'PASS');
    }
    assert.deepEqual(JSON.parse(results[0].stdout), JSON.parse(results[1].stdout));
  } finally {
    rmSync(first, { recursive: true, force: true });
    rmSync(second, { recursive: true, force: true });
  }
});
