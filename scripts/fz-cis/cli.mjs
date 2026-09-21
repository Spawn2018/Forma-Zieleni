import { readFileSync } from 'node:fs';
import path from 'node:path';
import { classifyFreshness, validateRecord } from './policy.mjs';
import { addRecord, changeStatus, reportBlockers, reportDebt, reportDora } from './store.mjs';

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
  } else if (command === 'transition') {
    const extra = arg('--extra') ? JSON.parse(arg('--extra')) : {};
    console.log(JSON.stringify(changeStatus(arg('--id'), arg('--status'), extra)));
  } else if (command === 'debt') {
    console.log(JSON.stringify(reportDebt()));
  } else if (command === 'blockers') {
    console.log(JSON.stringify(reportBlockers()));
  } else if (command === 'dora') {
    console.log(JSON.stringify(reportDora(readJsonArg())));
  } else if (command === 'freshness') {
    console.log(JSON.stringify(classifyFreshness(arg('--topic'))));
  } else {
    console.error('usage: validate|record|transition|debt|blockers|dora|freshness');
    process.exitCode = 1;
  }
} catch (err) {
  console.error(err.code || err.message);
  process.exitCode = 1;
}
