import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
import {
  CI_STATES,
  clearCiRepairAttempts,
  evaluateQualityInterrupt,
  isGreen,
  noteCiRepairAttempt,
  statusForSha,
} from '../ci/post-push-ci.mjs';
import { captureRepoState } from '../ci/pre-push-gate.mjs';

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

function productSelection(session) {
  const blocked = new Set([...(session?.blocked || []), ...(session?.completed || [])]);
  return selectReady(graph(), { blockedIds: [...blocked] });
}

/**
 * Quality interrupt wins over product READY selection.
 * Injected deps keep unit tests network-free.
 */
export function selectionWithQuality(session, options = {}) {
  const state = options.repoState || captureRepoState({ cwd: repoRoot() });
  const interrupt = evaluateQualityInterrupt({
    head: state.head,
    originMain: state.originMain,
    statusFor: options.statusFor || statusForSha,
    repairAttempts: session?.attempts || {},
  });

  if (interrupt.qualityInterrupt) {
    return {
      selected: null,
      ready: [],
      withheld: [],
      reason: interrupt.reason,
      exhaustionAllowed: false,
      qualityInterrupt: interrupt.qualityInterrupt,
      repoState: { head: state.head, originMain: state.originMain, branch: state.branch },
      sessionPatch: null,
    };
  }

  const cleared = interrupt.reason === 'ci_green'
    ? clearCiRepairAttempts(session || { attempts: {} })
    : session;
  const picked = productSelection(cleared);
  return {
    ...picked,
    qualityInterrupt: null,
    repoState: { head: state.head, originMain: state.originMain, branch: state.branch },
    sessionPatch: interrupt.reason === 'ci_green' ? { attempts: cleared.attempts } : null,
  };
}

function selection(session, options = {}) {
  return selectionWithQuality(session, options);
}

function print(value) {
  console.log(JSON.stringify(value, null, 2));
}

function option(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || !process.argv[index + 1]) fail(`missing ${name}`);
  return process.argv[index + 1];
}

export function requireExactCiGreen(commit, options = {}) {
  const want = String(commit || '').trim().toLowerCase();
  const state = options.repoState || captureRepoState({ cwd: repoRoot() });
  const published = String(state.originMain || '').trim().toLowerCase();
  const head = String(state.head || '').trim().toLowerCase();
  const matches = (full) => /^[0-9a-f]{7,40}$/.test(want) && full.startsWith(want);
  if (!want || (!matches(published) && !matches(head))) {
    return {
      ok: false,
      reason: 'commit_not_current_published_or_head',
      detail: { commit: want, head, originMain: published },
    };
  }
  if (head !== published) {
    return {
      ok: false,
      reason: 'head_not_published',
      detail: { commit: want, head, originMain: published },
    };
  }
  const status = (options.statusFor || statusForSha)(published);
  if (!isGreen(status.state)) {
    return {
      ok: false,
      reason: 'ci_not_green',
      ciState: status.state,
      runId: status.run?.databaseId || null,
      url: status.run?.url || null,
    };
  }
  if (status.run?.headSha && String(status.run.headSha).toLowerCase() !== published) {
    return { ok: false, reason: 'ci_sha_mismatch', ciState: status.state };
  }
  return {
    ok: true,
    ciState: CI_STATES.CI_GREEN,
    runId: status.run?.databaseId || null,
    sha: published,
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
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
  print({
    ...deadline,
    live: livePath(),
    selected: picked.selected,
    ready: picked.ready,
    reason: picked.reason,
    qualityInterrupt: picked.qualityInterrupt || null,
  });
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
    qualityInterrupt: picked.qualityInterrupt || null,
  });
} else if (command === 'select') {
  const session = readSession();
  if (!session || session.status === 'stop') fail('no active /noc session');
  const commit = option('--commit');
  let picked = selection(session);
  if (picked.qualityInterrupt) {
    session.currentSlice = null;
    session.nextCandidates = [];
    session.selectionReason = picked.reason;
    session.exhausted = false;
    writeSession(session);
    print({
      selected: null,
      ready: [],
      reason: picked.reason,
      qualityInterrupt: picked.qualityInterrupt,
      exhaustionAllowed: false,
    });
  } else if (!picked.selected) {
    session.currentSlice = null;
    session.nextCandidates = [];
    session.selectionReason = picked.reason;
    session.exhausted = picked.exhaustionAllowed === true;
    if (picked.sessionPatch?.attempts) session.attempts = picked.sessionPatch.attempts;
    writeSession(session);
    print(picked);
  } else {
    let working = session;
    if (picked.sessionPatch?.attempts) {
      working = { ...session, attempts: picked.sessionPatch.attempts };
    }
    const noted = noteSelection(working, { slice: picked.selected, commit });
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
    if (next.selected) noted.session.exhausted = false;
    writeSession(noted.session);
    print({
      selected: noted.session.currentSlice,
      ready: next.ready,
      reason: noted.session.selectionReason,
      blocked: noted.session.blocked,
      qualityInterrupt: next.qualityInterrupt || null,
    });
  }
} else if (command === 'attempt') {
  const session = readSession();
  if (!session) fail('no active /noc session');
  const signature = option('--signature');
  const slice = option('--slice');
  let next;
  if (slice === 'CI-REPAIR' || process.argv.includes('--ci-repair')) {
    next = noteCiRepairAttempt(session, { signature });
  } else {
    next = noteAttempt(session, {
      slice,
      commit: option('--commit'),
      signature,
    });
  }
  next.lastBeat = new Date().toISOString();
  writeSession(next);
  print({ blocked: next.blocked, currentSlice: next.currentSlice, attempts: next.attempts });
} else if (command === 'complete') {
  const session = readSession();
  if (!session) fail('no active /noc session');
  const slice = option('--slice');
  const commit = option('--commit');
  const ciGate = requireExactCiGreen(commit);
  if (!ciGate.ok) {
    print({
      completed: false,
      reason: ciGate.reason,
      ciState: ciGate.ciState || null,
      detail: ciGate.detail || null,
      runId: ciGate.runId || null,
      url: ciGate.url || null,
    });
    process.exitCode = 1;
  } else {
    session.lastCompletedSlice = slice;
    session.completed = [...new Set([...(session.completed || []), slice])];
    session.currentSlice = null;
    session.lastVerifiedCommit = ciGate.sha || commit;
    session.status = 'idle';
    session.lastBeat = new Date().toISOString();
    session.silentFollowups = 0;
    const picked = selection(session);
    session.nextCandidates = (picked.ready || []).filter((id) => id !== slice);
    session.selectionReason = picked.reason;
    if (picked.selected) session.exhausted = false;
    else session.exhausted = picked.exhaustionAllowed === true;
    writeSession(session);
    print({
      completed: true,
      lastCompletedSlice: slice,
      next: picked.selected,
      ready: session.nextCandidates,
      ciState: CI_STATES.CI_GREEN,
      qualityInterrupt: picked.qualityInterrupt || null,
    });
  }
} else {
  fail('usage: deadline|start|stop|beat|status|ready|select|attempt|complete');
}
}
