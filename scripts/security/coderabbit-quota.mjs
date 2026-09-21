import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOUR = 60 * 60 * 1000;
const BUDGET = 3;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const file = process.env.CODERABBIT_QUOTA_LOG || path.join(root, 'tmp', 'coderabbit-reviews.json');

function load() {
  if (!existsSync(file)) return [];
  const value = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(value)) throw new Error('INVALID_QUOTA_LOG');
  return value.filter(entry => typeof entry.startedAt === 'string' && Number.isFinite(Date.parse(entry.startedAt)));
}

function usedOf(entries) {
  return entries.filter(entry => entry.outcome === 'success').length;
}

function report(used, extra = {}) {
  const remaining = Math.max(0, BUDGET - used);
  return {
    status: remaining ? 'AVAILABLE' : 'DEFERRED',
    used,
    remaining,
    budget: BUDGET,
    usedOfBudget: `${used}/${BUDGET}`,
    availableOfBudget: `${remaining}/${BUDGET}`,
    source: 'conservative-3-per-rolling-hour',
    ...extra,
  };
}

const now = Date.now();
const recent = load().filter(entry => now - Date.parse(entry.startedAt) < HOUR);
const used = usedOf(recent);
const command = process.argv[2];
const outcome = command === 'record' ? process.argv[3] : command;

if (!command) {
  console.log(JSON.stringify(report(used)));
} else if (outcome === 'success' || outcome === 'fail') {
  if (outcome === 'success' && used >= BUDGET) {
    console.log(JSON.stringify({ ...report(used), reason: 'CODERABBIT_RATE_LIMIT' }));
    process.exitCode = 2;
  } else {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify([...recent, { startedAt: new Date(now).toISOString(), outcome }], null, 2));
    console.log(JSON.stringify({ ...report(used + (outcome === 'success' ? 1 : 0)), recorded: outcome }));
  }
} else {
  console.log(JSON.stringify({ ...report(used), reason: 'INVALID_QUOTA_COMMAND' }));
  process.exitCode = 2;
}
