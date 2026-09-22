import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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

test('manifest hashes match Git blob bytes, not platform checkout bytes', () => {
  const rel = 'package.json';
  const line = readFileSync(path.join(root, 'SHA256SUMS.txt'), 'utf8')
    .split('\n')
    .find((entry) => entry.endsWith(`  ${rel}`));
  assert.ok(line, 'package.json must be in the manifest');
  const recorded = line.slice(0, 64);
  const disk = readFileSync(path.join(root, rel));
  let text = disk.toString('utf8');
  if (text.includes('\r')) text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const expected = createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
  assert.equal(recorded, expected);
  if (disk.includes(0x0d)) {
    const raw = createHash('sha256').update(disk).digest('hex');
    assert.notEqual(raw, recorded);
  }
});
