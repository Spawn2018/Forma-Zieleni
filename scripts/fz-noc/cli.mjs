import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  activeExecutionGraph,
  emptySession,
  nextWarsawDeadline,
  noteAttempt,
  noteSelection,
  parseHour,
  selectReady,
} from './policy.mjs';
import { livePath, readSession, repoRoot, writeSession } from './live.mjs';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function graph() {
  const architecture = path.join(repoRoot(), 'docs', 'architecture');
  const cms = readFileSync(path.join(architecture, 'NEXT-SLICES-CMS.md'), 'utf8');
  const main = readFileSync(path.join(architecture, 'NEXT-SLICES-MAIN.md'), 'utf8');
  return activeExecutionGraph(cms, main);
}

function selection(session) {
  const blocked = new Set([...(session?.blocked || []), ...(session?.completed || [])]);
  return selectReady(graph(), { blockedIds: [...blocked] });
}

function print(value) {
  console.log(JSON.stringify(value, null, 2));
}

function option(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || !process.argv[index + 1]) fail(`missing ${name}`);
  return process.argv[index + 1];
}

const command = process.argv[2];

if (command === 'deadline') {
  print(nextWarsawDeadline(parseHour(process.argv[3])));
} else if (command === 'start') {
  const existing = readSession();
  const active = existing && existing.status !== 'stop' && Date.parse(existing.untilUtc || existing.until) > Date.now();
  if (active) fail(`a /noc window is already active until ${existing.until}`);
  const deadline = nextWarsawDeadline(parseHour(process.argv[3]));
  const session = emptySession(deadline);
  const picked = selection(session);
  session.nextCandidates = picked.ready;
  session.selectionReason = picked.reason;
  writeSession(session);
  print({ ...deadline, live: livePath(), selected: picked.selected, ready: picked.ready, reason: picked.reason });
} else if (command === 'stop') {
  const session = readSession() || emptySession(nextWarsawDeadline(0));
  session.status = 'stop';
  session.lastBeat = new Date().toISOString();
  writeSession(session);
  print({ status: 'stop', until: session.until });
} else if (command === 'beat') {
  const session = readSession();
  if (!session) fail('no active /noc session');
  session.lastBeat = new Date().toISOString();
  session.status = session.status === 'stop' ? 'stop' : 'busy';
  writeSession(session);
  print({ lastBeat: session.lastBeat, status: session.status });
} else if (command === 'status' || command === 'ready') {
  const session = readSession();
  const picked = selection(session);
  print({
    session,
    selected: picked.selected,
    ready: picked.ready,
    reason: picked.reason,
    withheld: picked.withheld,
  });
} else if (command === 'select') {
  const session = readSession();
  if (!session || session.status === 'stop') fail('no active /noc session');
  const commit = option('--commit');
  let picked = selection(session);
  if (!picked.selected) {
    session.currentSlice = null;
    session.nextCandidates = [];
    session.selectionReason = picked.reason;
    writeSession(session);
    print(picked);
  } else {
    const noted = noteSelection(session, { slice: picked.selected, commit });
    const next = noted.repeated ? selection(noted.session) : picked;
    if (noted.repeated) {
      noted.session.currentSlice = next.selected;
      noted.session.selectionReason = next.selected
        ? `${picked.selected} repeated without a new commit; work-stolen to ${next.selected}`
        : `${picked.selected} repeated without a new commit and no other safe READY slice remains`;
    } else {
      noted.session.selectionReason = next.reason;
    }
    noted.session.nextCandidates = next.ready;
    noted.session.lastBeat = new Date().toISOString();
    noted.session.status = 'busy';
    writeSession(noted.session);
    print({
      selected: noted.session.currentSlice,
      ready: next.ready,
      reason: noted.session.selectionReason,
      blocked: noted.session.blocked,
    });
  }
} else if (command === 'attempt') {
  const session = readSession();
  if (!session) fail('no active /noc session');
  const next = noteAttempt(session, {
    slice: option('--slice'),
    commit: option('--commit'),
    signature: option('--signature'),
  });
  next.lastBeat = new Date().toISOString();
  writeSession(next);
  print({ blocked: next.blocked, currentSlice: next.currentSlice });
} else if (command === 'complete') {
  const session = readSession();
  if (!session) fail('no active /noc session');
  const slice = option('--slice');
  session.lastCompletedSlice = slice;
  session.completed = [...new Set([...(session.completed || []), slice])];
  session.currentSlice = null;
  session.lastVerifiedCommit = option('--commit');
  session.status = 'idle';
  session.lastBeat = new Date().toISOString();
  session.silentFollowups = 0;
  const picked = selection(session);
  session.nextCandidates = picked.ready.filter((id) => id !== slice);
  session.selectionReason = picked.reason;
  writeSession(session);
  print({ lastCompletedSlice: slice, next: picked.selected, ready: session.nextCandidates });
} else {
  fail('usage: deadline|start|stop|beat|status|ready|select|attempt|complete');
}
