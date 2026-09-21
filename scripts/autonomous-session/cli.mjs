import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSession } from './engine.ts';
import { limits, validateSlices } from './policy.ts';
import { audit, guard, git, loadCanon, modifiedFiles, policyHash, readBounded, repository, SessionStore } from './repo.mjs';
import { decideOwner, safeText } from './decision.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const controller = new AbortController();
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => controller.abort());

function args() {
  const [command, ...raw] = process.argv.slice(2);
  if (!['start', 'resume', 'status'].includes(command)) throw new Error('INVALID_COMMAND');
  const flags = {};
  const allowed = command === 'start' ? ['objective', 'plan', 'deadline', 'max-iterations', 'retry-budget', 'decision', 'online'] : command === 'resume' ? ['id', 'decision', 'online'] : ['id'];
  for (let i = 0; i < raw.length; i++) {
    const name = raw[i].replace(/^--/, '');
    if (!raw[i].startsWith('--') || !allowed.includes(name) || Object.hasOwn(flags, name)) throw new Error('INVALID_ARGUMENT');
    if (name === 'online') flags[name] = true;
    else {
      if (!raw[i + 1] || raw[i + 1].startsWith('--')) throw new Error('INVALID_ARGUMENT');
      flags[name] = raw[++i];
    }
  }
  return { command, flags };
}

let store;
try {
  const { command, flags } = args();
  const repo = repository(root);
  loadCanon(repo);
  if (command === 'start') {
    const objective = safeText(flags.objective);
    const maxIterations = Number(flags['max-iterations'] ?? 10);
    const retryBudget = Number(flags['retry-budget'] ?? 1);
    const deadline = flags.deadline ?? null;
    limits(maxIterations, retryBudget, deadline);
    const slices = validateSlices(flags.plan ? JSON.parse(readBounded(repo, flags.plan, 16384)) : [
      { id: 'repo', capability: 'repo-audit', classification: 'AUTO', dependsOn: [] },
      { id: 'canon', capability: 'canon-audit', classification: 'REVIEW', dependsOn: [] },
    ]);
    safeText(JSON.stringify(slices), 16384);
    const id = randomUUID();
    const now = new Date().toISOString();
    const head = git(repo, 'head');
    const files = modifiedFiles(repo);
    const state = {
      version: 1, id, objective, repo, createdAt: now, updatedAt: now, deadline,
      maxIterations, retryBudget, iterationCount: 0, currentSlice: null, status: 'READY',
      slices, completedWork: [], pendingWork: slices.map(s => s.id), blockers: [], decisions: [], evidence: [], attempts: {},
      gitHeadBefore: head, gitHeadAfter: head, modifiedFiles: files, baselineFiles: files, policyHash: policyHash(repo), apiCalls: 0,
    };
    store = new SessionStore(repo, id);
    store.write(state);
  } else store = new SessionStore(repo, flags.id);
  const state = store.read();
  if (command !== 'status') await runSession(state, {
    now: Date.now, checkpoint: value => store.write(value), guard: value => guard(repo, value),
    stopped: () => controller.signal.aborted,
    decide: (_slice, value) => Promise.resolve(decideOwner(value, { reply: flags.decision })),
    execute: async (capability, value) => audit(repo, capability, value),
  });
  // Free text, repository contents, provider output and exception details never go to stdout.
  console.log(JSON.stringify({ id: state.id, status: state.status, iterations: state.iterationCount, completed: state.completedWork.length, blockers: state.blockers.length, apiCalls: state.apiCalls }));
  if (state.status !== 'COMPLETE' && command !== 'status') process.exitCode = 2;
} catch {
  console.error('SESSION_FAILED: check arguments, main branch, Canon integrity and session lock. No exception payload was logged.');
  process.exitCode = 1;
} finally {
  try { store?.close(); } catch {
    console.error('LOCK_RELEASE_FAILED: inspect the session lock before resuming.');
    process.exitCode = 1;
  }
}
