import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backend = path.join(root, 'tmp', 'vendors', 'apos-lab', 'backend');
const evidencePath = path.join(root, 'evidence', 'apostrophe-exercise.json');
const evidence = {
  researchDate: '2026-09-21',
  product: 'apostrophe',
  executed: false,
};

if (!existsSync(path.join(backend, 'app.js')) || !existsSync(path.join(backend, 'node_modules', 'apostrophe', 'package.json'))) {
  evidence.reason = 'Apostrophe backend or apostrophe@installed missing';
  mkdirSync(path.dirname(evidencePath), { recursive: true });
  writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  process.exit(0);
}

const result = spawnSync(process.execPath, ['app', 'fz-lab-exercise:run'], {
  cwd: backend,
  encoding: 'utf8',
  windowsHide: true,
  timeout: 240_000,
  env: {
    ...process.env,
    APOS_DEFAULT_DB_ADAPTER: 'sqlite',
    APOS_EXTERNAL_FRONT_KEY: 'dev',
    APOS_DEV: '1',
  },
});

evidence.spawnStatus = result.status;
evidence.error = result.error ? String(result.error.message) : null;
evidence.stderr = (result.stderr || '').slice(-4000);
evidence.stdout = (result.stdout || '').slice(-4000);
if (!existsSync(evidencePath)) {
  mkdirSync(path.dirname(evidencePath), { recursive: true });
  writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
}
console.log(JSON.stringify({ status: result.status, executedFile: existsSync(evidencePath) }, null, 2));
if (result.status !== 0) process.exit(0);
