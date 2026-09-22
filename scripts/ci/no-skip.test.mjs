import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'no-skip.mjs');

function run(source) {
  const dir = mkdtempSync(path.join(tmpdir(), 'fz-no-skip-'));
  const file = path.join(dir, 'sample.test.mjs');
  writeFileSync(file, source);
  const result = spawnSync(process.execPath, [script, file], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  rmSync(dir, { recursive: true, force: true });
  return result;
}

test('no-skip fails when a test is skipped', () => {
  const result = run("import test from 'node:test'; test('later', { skip: 'absent' }, () => {});\n");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no-skip: \d+ skipped/);
});

test('no-skip passes when every test runs', () => {
  const result = run("import test from 'node:test'; import assert from 'node:assert/strict'; test('runs', () => { assert.equal(1, 1); });\n");
  assert.equal(result.status, 0, result.stderr);
});
