import { readFileSync } from 'node:fs';
import path from 'node:path';
import { classifyFreshness, validateRecord } from './policy.mjs';
import {
  addRecord,
  changeStatus,
  evaluateRecordEffect,
  recordEffectObservation,
  reportBlockers,
  reportCheck,
  reportDebt,
  reportDora,
  setEffectPlan,
} from './store.mjs';
import { ingestOutcome, ingestToolingEvent } from './ingest.mjs';
import { learningCoverageReport } from './learning-coverage.mjs';

function readJsonArg() {
  const flag = process.argv.indexOf('--json');
  if (flag === -1) throw new Error('MISSING_JSON');
  const file = process.argv[flag + 1];
  if (!file || file.startsWith('-')) throw new Error('MISSING_JSON');
  const resolved = path.resolve(file);
  return JSON.parse(readFileSync(resolved, 'utf8'));
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? '' : process.argv[index + 1] || '';
}

const command = process.argv[2];
try {
  if (command === 'validate') {
    const result = validateRecord(readJsonArg(), 'create');
    console.log(JSON.stringify(result));
    if (!result.ok) process.exitCode = 1;
  } else if (command === 'record') {
    console.log(JSON.stringify(addRecord(readJsonArg())));
  } else if (command === 'ingest') {
    const payload = readJsonArg();
    const result = payload.state
      ? ingestToolingEvent(payload, { dryRun: process.argv.includes('--dry-run') })
      : ingestOutcome(payload, { dryRun: process.argv.includes('--dry-run') });
    console.log(JSON.stringify(result));
    if (!result.ingested && result.reason !== 'noise_skip') process.exitCode = 1;
  } else if (command === 'transition') {
    const extra = arg('--extra') ? JSON.parse(arg('--extra')) : {};
    console.log(JSON.stringify(changeStatus(arg('--id'), arg('--status'), extra)));
  } else if (command === 'effect-plan') {
    const plan = arg('--json') ? readJsonArg() : JSON.parse(arg('--plan') || '{}');
    const extra = {};
    if (arg('--control-ref')) extra.controlRef = arg('--control-ref');
    if (arg('--control-commit')) extra.controlCommit = arg('--control-commit');
    console.log(JSON.stringify(setEffectPlan(arg('--id'), plan.effectPlan || plan, extra)));
  } else if (command === 'effect-record') {
    const observation = arg('--json') ? readJsonArg() : JSON.parse(arg('--observation') || '{}');
    console.log(JSON.stringify(recordEffectObservation(arg('--id'), observation.observation || observation)));
  } else if (command === 'effect') {
    console.log(JSON.stringify(evaluateRecordEffect(arg('--id'))));
  } else if (command === 'check') {
    const coverage = learningCoverageReport();
    console.log(JSON.stringify({ ...reportCheck(), coverage: coverage.summary }, null, 2));
  } else if (command === 'coverage') {
    const report = learningCoverageReport();
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
  } else if (command === 'debt') {
    console.log(JSON.stringify(reportDebt()));
  } else if (command === 'blockers') {
    console.log(JSON.stringify(reportBlockers()));
  } else if (command === 'dora') {
    console.log(JSON.stringify(reportDora(readJsonArg())));
  } else if (command === 'freshness') {
    console.log(JSON.stringify(classifyFreshness(arg('--topic'))));
  } else {
    console.error('usage: validate|record|ingest|transition|effect-plan|effect-record|effect|check|coverage|debt|blockers|dora|freshness');
    process.exitCode = 1;
  }
} catch (err) {
  console.error(err.code || err.message);
  process.exitCode = 1;
}
