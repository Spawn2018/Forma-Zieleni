import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appDir = path.join(root, 'tmp', 'vendors', 'payload-lab');
const evidencePath = path.join(root, 'evidence', 'payload-exercise.json');
const evidence = {
  researchDate: '2026-09-21',
  product: 'payload',
  version: '3.90.1',
  executed: false,
};

if (!existsSync(path.join(appDir, 'node_modules', 'payload', 'package.json'))) {
  evidence.reason = 'payload package not installed in isolated lab';
  mkdirSync(path.dirname(evidencePath), { recursive: true });
  writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  process.exit(0);
}

const tsx = path.join(appDir, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const result = spawnSync(process.execPath, [tsx, path.join(appDir, 'scripts', 'fz-exercise.ts')], {
  cwd: appDir,
  encoding: 'utf8',
  windowsHide: true,
  timeout: 420_000,
});
if (!existsSync(evidencePath) || result.status !== 0) {
  const previous = existsSync(evidencePath) ? JSON.parse(readFileSync(evidencePath, 'utf8')) : evidence;
  if (!previous.executed) {
    writeFileSync(evidencePath, JSON.stringify({
      ...previous,
      spawnStatus: result.status,
      error: previous.error || (result.error ? String(result.error.message) : (result.stderr || result.stdout || '').slice(-4000)),
    }, null, 2));
  }
}
console.log(JSON.stringify({
  status: result.status,
  executedFile: existsSync(evidencePath),
  stderr: (result.stderr || '').slice(-2000),
  stdout: (result.stdout || '').slice(-2000),
}, null, 2));

