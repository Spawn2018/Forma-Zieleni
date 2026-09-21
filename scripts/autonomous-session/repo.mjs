import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, openSync, closeSync, readFileSync, readdirSync, realpathSync, renameSync, writeFileSync, unlinkSync, fsyncSync } from 'node:fs';
import path from 'node:path';
import { classify, validateSlices, limits } from './policy.ts';

export const CANON = Object.freeze([
  'START-HERE-CURSOR.md', 'docs/constitution/PROJECT-CONSTITUTION.md',
  'docs/knowledge/POST-V2-DECISIONS.md', 'docs/architecture/DECISIONS.md',
  'docs/vision/PRODUCT-CANON.md', 'docs/vision/MASTER-PLAN.md',
  'docs/design/VISUAL-PRODUCT-CANON.md', 'docs/ux/UX-PRODUCT-CANON.md',
  'docs/content/CONTENT-AND-VOICE-CANON.md', 'docs/architecture/CURRENT-ARCHITECTURE.md',
  'docs/workflows/AUTONOMOUS-SLICES.md', 'docs/workflows/DECISION-GATES.md',
  'docs/cursor-os/CURSOR-OS-2026.md', 'docs/cursor-os/GROK-BOT-OPERATING-MODEL.md',
  'docs/cursor-os/ORCHESTRATION-AND-MODEL-ROUTING.md', 'docs/cursor-os/PRE-PUSH-ORCHESTRATION.md',
  'docs/engineering/ENGINEERING-STANDARD.md', 'docs/engineering/PRE-PUSH-GATE.md',
  'docs/architecture/AGENTIC-OPERATIONS-CANON.md', 'docs/engineering/FAILURE-ENGINEERING.md',
  'docs/security/SECURITY-ASSURANCE.md',
]);
const SOURCE = ['policy.ts', 'engine.ts', 'repo.mjs', 'decision.mjs', 'cli.mjs', 'package.json'].map(f => `scripts/autonomous-session/${f}`);
export const digest = value => createHash('sha256').update(value).digest('hex');

export function safePath(root, relative) {
  if (typeof relative !== 'string' || !relative || /[\\:\x00-\x1f]/.test(relative) || path.isAbsolute(relative) ||
      relative.split('/').some(p => !p || /[. ]$/.test(p) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p))) throw new Error('UNSAFE_PATH');
  let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    // lstat also sees dangling links; existsSync would follow them and report false.
    const info = lstatSync(current, { throwIfNoEntry: false });
    if (info?.isSymbolicLink()) throw new Error('UNSAFE_LINK');
  }
  return current;
}

export function readBounded(root, relative, max = 262144) {
  const file = safePath(root, relative);
  const info = lstatSync(file);
  if (!info.isFile() || info.size > max || info.nlink > 1) throw new Error('UNSAFE_FILE');
  return readFileSync(file, 'utf8');
}

// Exact commands only. No shell, repository scripts, hooks, diff drivers or model arguments.
const gitCommands = Object.freeze({
  root: ['rev-parse', '--show-toplevel'], branch: ['branch', '--show-current'],
  head: ['rev-parse', 'HEAD'], status: ['status', '--porcelain=v1', '-uall'],
  diff: ['diff', '--no-ext-diff', '--no-textconv', '--check'],
  configKeys: ['config', '--local', '--no-includes', '--name-only', '--list'],
});
export function git(root, operation) {
  if (!Object.hasOwn(gitCommands, operation)) throw new Error('COMMAND_DENIED');
  // Git-related environment overrides must not redirect reads into another repository.
  const env = {};
  for (const key of ['PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP']) if (process.env[key]) env[key] = process.env[key];
  Object.assign(env, { GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null', GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0' });
  if (['status', 'diff'].includes(operation)) {
    const keys = git(root, 'configKeys').split(/\r?\n/);
    if (keys.some(key => /^(filter\.|include\.|includeif\.|extensions\.worktreeconfig$)/i.test(key))) throw new Error('UNSAFE_GIT_CONFIG');
  }
  try {
    return execFileSync('git', ['--no-pager', '-c', `safe.directory=${root.replaceAll('\\', '/')}`, '-c', 'core.autocrlf=input', '-c', 'core.fsmonitor=false', '-c', 'core.hooksPath=/dev/null', ...gitCommands[operation]], {
      cwd: root, env, shell: false, windowsHide: true, encoding: 'utf8', timeout: 5000, maxBuffer: 262144, stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch { throw new Error('GIT_CHECK_FAILED'); }
}

export function repository(root) {
  const resolved = realpathSync(root);
  const gitDir = safePath(resolved, '.git');
  if (!lstatSync(gitDir).isDirectory()) throw new Error('PHYSICAL_REPO_REQUIRED');
  if (path.resolve(git(resolved, 'root')).toLowerCase() !== resolved.toLowerCase() || git(resolved, 'branch') !== 'main') throw new Error('MAIN_ONLY_REPO_GUARD');
  return resolved;
}

export function modifiedFiles(root) {
  const output = git(root, 'status');
  return output ? output.split(/\r?\n/).map(line => line.trimStart()).filter(line => !line.includes('.autonomous-sessions/')) : [];
}

export function loadCanon(root) {
  const docs = Object.fromEntries(CANON.map(file => [file, readBounded(root, file)]));
  const loop = docs['docs/cursor-os/CURSOR-OS-2026.md'].match(/## Binding autonomous execution loop[\s\S]*?```text\s*([\s\S]*?)```/)?.[1];
  const stages = loop?.split(/\r?\n/).map(s => s.replace(/^→\s*/, '').trim()).filter(Boolean);
  if (!stages || stages.length !== 13 || stages[0] !== 'DISCOVER' || stages.at(-1) !== 'COMPLETE') throw new Error('BINDING_LOOP_INVALID');
  return { docs, stages };
}

function policyFiles(root, dir, budget = { files: 0 }) {
  if (dir.split('/').length > 8) throw new Error('POLICY_TREE_TOO_DEEP');
  const base = safePath(root, dir);
  if (!existsSync(base)) return [];
  const entries = readdirSync(base, { withFileTypes: true });
  budget.files += entries.length;
  if (budget.files > 512) throw new Error('POLICY_TREE_TOO_LARGE');
  return entries.sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const file = `${dir}/${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error('UNSAFE_LINK');
    return entry.isDirectory() ? policyFiles(root, file, budget) : [file];
  });
}

export function policyHash(root) {
  let bytes = 0;
  return digest([...new Set([...CANON, ...SOURCE, ...policyFiles(root, '.cursor'), ...policyFiles(root, '.agents')])].sort()
    .map(file => {
      const text = readBounded(root, file);
      bytes += Buffer.byteLength(text);
      if (bytes > 4194304) throw new Error('POLICY_BYTES_EXCEEDED');
      return `${file}\0${digest(text)}`;
    }).join('\n'));
}

export function guard(root, state) {
  repository(root);
  if (state.repo !== root || git(root, 'head') !== state.gitHeadBefore || policyHash(root) !== state.policyHash) throw new Error('SESSION_BASELINE_CHANGED');
  state.gitHeadAfter = git(root, 'head');
  state.modifiedFiles = modifiedFiles(root);
}

export class SessionStore {
  constructor(root, id) {
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error('INVALID_SESSION_ID');
    this.root = root;
    this.relative = `.autonomous-sessions/${id}`;
    this.dir = safePath(root, this.relative);
    mkdirSync(this.dir, { recursive: true });
    // A stale lock is intentionally not stolen. Review the dead process before removing it.
    this.lock = safePath(root, `${this.relative}/lock`);
    this.fd = openSync(this.lock, 'wx', 0o600);
    writeFileSync(this.fd, String(process.pid));
  }
  close() { closeSync(this.fd); unlinkSync(this.lock); }
  write(state) {
    const json = JSON.stringify(state, null, 2);
    if (Buffer.byteLength(json) > 2097152) throw new Error('STATE_TOO_LARGE');
    const temp = safePath(this.root, `${this.relative}/${randomUUID()}.tmp`);
    const target = safePath(this.root, `${this.relative}/state.json`);
    const fd = openSync(temp, 'wx', 0o600);
    try { writeFileSync(fd, json); fsyncSync(fd); } finally { closeSync(fd); }
    renameSync(temp, target);
  }
  read() {
    const state = JSON.parse(readBounded(this.root, `${this.relative}/state.json`, 2097152));
    validateState(state);
    if (state.id !== this.relative.split('/')[1] || state.repo !== this.root) throw new Error('INVALID_CHECKPOINT');
    return state;
  }
}

export function validateState(state) {
  if (!state || state.version !== 1 || typeof state.objective !== 'string' || state.objective.length > 1000) throw new Error('INVALID_CHECKPOINT');
  validateSlices(state.slices);
  limits(state.maxIterations, state.retryBudget, state.deadline);
  if (!Number.isInteger(state.iterationCount) || state.iterationCount < 0 || state.iterationCount > state.maxIterations ||
      !Number.isInteger(state.apiCalls) || state.apiCalls < 0 || state.apiCalls > 4) throw new Error('INVALID_CHECKPOINT');
  const ids = state.slices.map(s => s.id);
  for (const key of ['completedWork', 'pendingWork']) if (!Array.isArray(state[key]) || new Set(state[key]).size !== state[key].length || state[key].some(id => !ids.includes(id))) throw new Error('INVALID_CHECKPOINT');
  if (state.completedWork.some(id => state.pendingWork.includes(id)) || !Array.isArray(state.blockers) || !Array.isArray(state.evidence) || !Array.isArray(state.decisions) || !state.attempts || typeof state.attempts !== 'object') throw new Error('INVALID_CHECKPOINT');
  if (Object.entries(state.attempts).some(([id, count]) => !ids.includes(id) || !Number.isInteger(count) || count < 1 || count > state.retryBudget + 1) || Object.values(state.attempts).reduce((a, b) => a + b, 0) !== state.iterationCount) throw new Error('INVALID_CHECKPOINT');
  for (const d of state.decisions) if (!ids.includes(d.slice) || !d.record || !['repo-audit', 'canon-audit'].includes(d.record.choice) || typeof d.record.rationale !== 'string' || typeof d.record.review !== 'string') throw new Error('INVALID_CHECKPOINT');
  if (!['READY', 'RUNNING', 'STOPPED', 'DEADLINE', 'MAX_ITERATIONS', 'BLOCKED', 'COMPLETE'].includes(state.status) ||
      ![state.createdAt, state.updatedAt].every(value => typeof value === 'string' && Number.isFinite(Date.parse(value))) ||
      ![state.gitHeadBefore, state.gitHeadAfter].every(value => typeof value === 'string' && /^[a-f0-9]{40,64}$/.test(value)) ||
      typeof state.policyHash !== 'string' || !/^[a-f0-9]{64}$/.test(state.policyHash) ||
      !(state.currentSlice === null || ids.includes(state.currentSlice)) ||
      ![state.modifiedFiles, state.baselineFiles].every(files => Array.isArray(files) && files.every(file => typeof file === 'string'))) throw new Error('INVALID_CHECKPOINT');
  if (state.blockers.some(b => !b || ![...ids, 'session'].includes(b.slice) || typeof b.reason !== 'string' || !/^[A-Z_-]+$/.test(b.reason))) throw new Error('INVALID_CHECKPOINT');
  if (state.evidence.some(e => !e || !ids.includes(e.slice) || !Number.isInteger(e.iteration) || e.iteration < 1 || e.iteration > state.iterationCount ||
      !Array.isArray(e.records) || e.records.some(r => !r || typeof r.stage !== 'string' || !['PASS', 'NA'].includes(r.result) || typeof r.detail !== 'string'))) throw new Error('INVALID_CHECKPOINT');
  if (ids.some(id => !state.pendingWork.includes(id) && !state.completedWork.includes(id) && !state.blockers.some(b => b.slice === id))) throw new Error('INVALID_CHECKPOINT');
  if (state.completedWork.some(id => {
    const slice = state.slices.find(s => s.id === id);
    return ['OWNER-ONLY', 'DANGEROUS'].includes(classify(slice)) ||
      !slice.dependsOn.every(dep => state.completedWork.includes(dep)) ||
      !state.evidence.some(e => e.slice === id && e.records.some(r => r.stage === 'COMPLETE' && r.result === 'PASS')) ||
      (classify(slice) === 'OWNER-DECISION' && !state.decisions.some(d => d.slice === id));
  })) throw new Error('INVALID_CHECKPOINT');
  if (state.status === 'COMPLETE' && (state.completedWork.length !== ids.length || state.pendingWork.length || state.blockers.length)) throw new Error('INVALID_CHECKPOINT');
}

export function audit(root, capability, state) {
  if (!['repo-audit', 'canon-audit'].includes(capability)) return { status: 'BLOCKED', evidence: [], reason: 'CAPABILITY_DENIED' };
  const started = performance.now();
  const { stages, docs } = loadCanon(root);
  const evidence = [];
  // Handlers implement the stages loaded from Canon; they do not define stage order.
  const handlers = {
    DISCOVER: () => `Loaded ${Object.keys(docs).length} Canon references; content pinned by session policy hash.`,
    PLAN: () => `Scope: ${capability}; acceptance: main, unchanged HEAD/policy, valid contract and diff whitespace. No source edits.`,
    CONTRACT: () => { validateSlices(state.slices); return 'Plan schema, unique identifiers and earlier-only dependencies validated.'; },
    IMPLEMENT: () => null,
    TEST: () => {
      const probes = [['git-push', 'DANGEROUS'], ['dns', 'DANGEROUS'], ['unknown', 'OWNER-ONLY']];
      for (const [action, expected] of probes) if (classify({ id: 'probe', capability: action, classification: 'AUTO', dependsOn: [] }) !== expected) throw new Error('ADVERSARIAL_GATE_FAILED');
      return 'Three deterministic hostile capability probes passed; this is not a product test suite.';
    },
    REFACTOR: () => null,
    'SECURITY REVIEW': () => { guard(root, state); return 'Local deterministic fallback: main, HEAD and policy integrity checked. No shell/write capability. No semantic code review claimed.'; },
    'PERFORMANCE/DATA REVIEW when applicable': () => `Audit elapsed so far: ${Math.round(performance.now() - started)} ms; ${Object.values(docs).reduce((n, text) => n + Buffer.byteLength(text), 0)} Canon bytes read; per-file bound 262144 bytes. No data/schema changes.`,
    'UX/A11Y/VISUAL/CONTENT REVIEW when applicable': () => null,
    DOCUMENT: () => 'Stage records returned to controller for atomic checkpoint; session report is the documentation artifact.',
    'FINAL DIFF': () => { git(root, 'diff'); return `git diff --check passed; ${modifiedFiles(root).length} baseline/current status entries reported, not approved as unrelated implementation.`; },
    'PRE-PUSH GATE': () => { guard(root, state); return 'Read-only audit gates passed. No files to publish from this slice; no product release readiness or push authorization.'; },
    COMPLETE: () => 'Read-only audit acceptance met; controller persists completion with these records.',
  };
  for (const stage of stages) {
    if (!Object.hasOwn(handlers, stage)) throw new Error('UNKNOWN_BINDING_STAGE');
    const detail = handlers[stage]();
    evidence.push({ stage, result: detail === null ? 'NA' : 'PASS', detail: detail ?? 'Not applicable: read-only audit does not implement/refactor source or change UI/content.' });
  }
  return { status: 'COMPLETE', evidence };
}
