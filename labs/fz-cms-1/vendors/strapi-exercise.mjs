import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appDir = path.join(root, 'tmp', 'vendors', 'strapi-lab');
const evidencePath = path.join(root, 'evidence', 'strapi-exercise.json');
const evidence = {
  researchDate: '2026-09-21',
  product: 'strapi',
  version: '5.54.0',
  executed: false,
};

if (!existsSync(path.join(appDir, 'node_modules', '@strapi', 'strapi', 'package.json'))) {
  evidence.reason = 'Strapi package not installed in isolated lab';
  mkdirSync(path.dirname(evidencePath), { recursive: true });
  writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  process.exit(0);
}

const result = spawnSync(process.execPath, [path.join(appDir, 'scripts', 'fz-exercise.cjs')], {
  cwd: appDir,
  encoding: 'utf8',
  windowsHide: true,
  timeout: 300_000,
});
if (!existsSync(evidencePath)) {
  evidence.spawnStatus = result.status;
  evidence.error = result.error ? String(result.error.message) : (result.stderr || '').slice(-4000);
  writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
}
console.log(JSON.stringify({
  status: result.status,
  executedFile: existsSync(evidencePath),
  stderr: (result.stderr || '').slice(-1500),
}, null, 2));
