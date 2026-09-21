import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOUR = 60 * 60 * 1000;
const BUDGET = 3;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const file = path.join(root, 'tmp', 'coderabbit-reviews.json');

function load() {
  if (!existsSync(file)) return [];
  const value = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(value)) throw new Error('INVALID_QUOTA_LOG');
  return value.filter(entry => typeof entry.startedAt === 'string' && Number.isFinite(Date.parse(entry.startedAt)));
}

const now = Date.now();
const recent = load().filter(entry => now - Date.parse(entry.startedAt) < HOUR);
const remaining = Math.max(0, BUDGET - recent.length);
if (process.argv[2] === 'record') {
  if (remaining < 1) {
    console.log(JSON.stringify({ status: 'DEFERRED', reason: 'CODERABBIT_RATE_LIMIT', remaining: 0, budget: BUDGET }));
    process.exitCode = 2;
  } else {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify([...recent, { startedAt: new Date(now).toISOString() }], null, 2));
    console.log(JSON.stringify({ status: 'RESERVED', remaining: remaining - 1, budget: BUDGET }));
  }
} else {
  console.log(JSON.stringify({ status: remaining ? 'AVAILABLE' : 'DEFERRED', remaining, budget: BUDGET, source: 'conservative-until-account-verified' }));
}
