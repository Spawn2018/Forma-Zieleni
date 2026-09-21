import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(root, 'scripts', 'repo-integrity.mjs');

test('repo integrity check passes against the current manifest', () => {
  const result = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /repo-integrity: ok/);
});

test('current manifest excludes itself and local IDE settings', () => {
  const sums = readFileSync(path.join(root, 'SHA256SUMS.txt'), 'utf8');
  assert.equal(sums.includes('SHA256SUMS.txt'), false);
  assert.equal(sums.includes('.cursor/settings.json'), false);
  assert.equal(sums.includes('\r'), false);
});
