import {
  currentBindingDepthExhausted,
  masterProductScopeExhausted,
  missingExecutablePathDeclarations,
  missingRequiredDepths,
  portalCapabilityIsProductComplete,
  registryMaterializationGap,
  scopeCoverageGaps,
} from '../requirements/executable-path.mjs';
import { loadParentModels, loadProductScope } from '../requirements/product-scope.mjs';
import { requirements as loadRequirements } from '../requirements/registry.mjs';

const WARSAW = 'Europe/Warsaw';
const HOUR_MS = 60 * 60 * 1000;
const SILENT_STALL = 3;
const SILENT_STOP = 5;
const SHUTDOWN_TURNS = 3;
const REPEAT_LIMIT = 3;

const BLOCKING_GATES = new Set(['OWNER-DECISION', 'OWNER-ONLY', 'DANGEROUS']);

export { portalCapabilityIsProductComplete };

export const CONTINUE_MESSAGE =
  'Under the still-active Forma Zieleni /noc deadline, re-read repository state through the FZ orchestrator and continue the next READY safe work. Refresh the execution graph before selecting. Do not repeat the previous command blindly. Do not ask the Owner to continue.';

export const STALL_MESSAGE =
  'The active /noc window has seen repeated turns without a heartbeat, slice, or commit change. Mark the current slice blocked with the session CLI, refresh the execution graph, and work-steal the next READY AUTO/REVIEW slice. If none remains, report the blocker and stop the session. Do not bypass an Owner gate.';

export const SHUTDOWN_MESSAGE =
  'The /noc deadline has passed. Do not start a new slice. Finish or checkpoint the current atomic work, do not mark incomplete work complete, validate what finished, commit locally only if that work is complete, report the result and the next READY state, then stop the session.';

const GIT = '(?:^|[;&|]|\\n|\\s|["\'])git(?:\\.exe)?(?:\\s+-C\\s+\\S+|\\s+-[^\\s]+)*\\s+';
const GIT_PUSH = new RegExp(`${GIT}push\\b`, 'i');
/** node -e spawnSync('git', ['push', ...]) / execFile argv form */
const GIT_PUSH_ARGV = /['"]git(?:\.exe)?['"]\s*,\s*\[(?:[^\]]*)['"]push['"]/i;
const PUSH_DANGEROUS = /--force(?:-with-lease)?|--mirror|--delete|\s\+\S/;
const PUSH_NO_VERIFY = /--no-verify\b/;
const SHELL_ASK = [
  { id: 'git-reset-hard', re: new RegExp(`${GIT}reset\\s+--hard\\b`, 'i') },
  { id: 'git-clean', re: new RegExp(`${GIT}clean\\b`, 'i') },
  { id: 'wrangler', re: /\bwrangler\b/i },
  { id: 'cloudflare-api', re: /api\.cloudflare\.com/i },
  { id: 'drop-sql', re: /\bdrop\s+(database|schema|table)\b/i },
  { id: 'truncate-sql', re: /\btruncate\s+(table\s+)?["'`\w.]+\b/i },
];

const MCP_ASK = new Set([
  'kv_namespace_create',
  'kv_namespace_delete',
  'kv_namespace_update',
  'r2_bucket_create',
  'r2_bucket_delete',
  'd1_database_create',
  'd1_database_delete',
  'd1_database_query',
  'hyperdrive_config_delete',
  'hyperdrive_config_edit',
]);

export function warsawParts(date) {
  const bag = {};
  for (const part of new Intl.DateTimeFormat('en-US', {
    timeZone: WARSAW,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)) {
    if (part.type !== 'literal') bag[part.type] = part.value;
  }
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: Number(bag.hour),
    minute: Number(bag.minute),
    second: Number(bag.second),
  };
}

function offsetMs(date) {
  const parts = warsawParts(date);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - date.getTime();
}

function isoWithOffset(date) {
  const parts = warsawParts(date);
  const minutes = Math.round(offsetMs(date) / 60000);
  const sign = minutes >= 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const pad = (value) => String(value).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

export function parseHour(value) {
  if (typeof value === 'number' && Number.isInteger(value)) {
    if (value < 0 || value > 23) throw new TypeError('hour must be an integer from 0 through 23');
    return value;
  }
  const text = String(value ?? '').trim();
  if (!/^\d{1,2}$/.test(text)) throw new TypeError('hour must be an integer from 0 through 23');
  return parseHour(Number(text));
}

export function nextWarsawDeadline(hour, now = new Date()) {
  const target = parseHour(hour);
  const limit = now.getTime() + 72 * HOUR_MS;
  let cursor = now.getTime();
  cursor += cursor % 60000 === 0 ? 60000 : 60000 - (cursor % 60000);
  while (cursor <= limit) {
    const parts = warsawParts(new Date(cursor));
    if (parts.hour === target && parts.minute === 0) {
      const at = new Date(cursor);
      return {
        hour: target,
        timeZone: WARSAW,
        until: isoWithOffset(at),
        untilUtc: at.toISOString(),
      };
    }
    const stepMinutes = parts.minute === 0 ? 60 : 60 - parts.minute;
    cursor += stepMinutes * 60000;
  }
  throw new Error('no Europe/Warsaw deadline within 72 hours');
}

function field(body, name) {
  const match = body.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'));
  return match ? match[1].trim() : '';
}

function identifiers(line) {
  return [...line.matchAll(/\b[A-Z][A-Z0-9]+(?:-[A-Z0-9]+)+\b/g)].map((match) => match[0]);
}

function classifyGate(line) {
  const first = line.split('.')[0];
  if (/\bOWNER-ONLY\b/.test(first)) return 'OWNER-ONLY';
  if (/\bOWNER-DECISION\b/.test(first)) return 'OWNER-DECISION';
  if (/^\s*DANGEROUS\b/.test(first)) return 'DANGEROUS';
  if (/\bAUTO\b/.test(first) && !/\bREVIEW\b/.test(first)) return 'AUTO';
  return 'REVIEW';
}

/**
 * After RETURN-ROADMAP is COMPLETE on the CMS graph, /noc selects from
 * the main product graph. Until then, selection stays on CMS/Search.
 */
export function activeExecutionGraph(cmsMarkdown, mainMarkdown) {
  const cms = parseExecutionGraph(cmsMarkdown);
  const returned = cms.find((slice) => slice.id === 'RETURN-ROADMAP');
  if (returned && returned.status === 'COMPLETE') {
    return parseExecutionGraph(mainMarkdown);
  }
  return cms;
}

export function parseExecutionGraph(markdown) {
  const slices = [];
  for (const chunk of markdown.split(/^### /m).slice(1)) {
    const breakAt = chunk.indexOf('\n');
    const title = (breakAt === -1 ? chunk : chunk.slice(0, breakAt)).trim();
    if (!/^[A-Z][A-Z0-9]+(?:-[A-Z0-9]+)+$/.test(title)) continue;
    const body = breakAt === -1 ? '' : chunk.slice(breakAt + 1);
    const autonomous = field(body, 'Autonomous');
    const dependencies = field(body, 'Dependencies');
    slices.push({
      id: title,
      status: /COMPLETE/i.test(field(body, 'Status')) ? 'COMPLETE' : 'OPEN',
      gate: classifyGate(field(body, 'Gate')),
      dependsOn: [...new Set(identifiers(dependencies))].filter((id) => id !== title),
      next: [...new Set(identifiers(field(body, 'Next')))],
      reportOnly: /report only/i.test(autonomous),
      autonomous: /^yes\b/i.test(autonomous) || /fixtures only/i.test(autonomous),
      dependencyText: dependencies,
      externalUnmet: false,
    });
  }
  const ids = new Set(slices.map((slice) => slice.id));
  for (const slice of slices) {
    // A named internal app is not an external dependency. The phrase is unmet
    // only while the graph has no executable WWW-APP row.
    slice.externalUnmet = /www app slice/i.test(slice.dependencyText) && !ids.has('WWW-APP');
  }
  return slices;
}

/**
 * Named WWW app prose without an executable WWW-APP row remains a gap.
 * Generic unfinished requirements use registry executableSlice metadata.
 */
export function internalPrerequisiteGap(slices, requirementRows = loadRequirements()) {
  const ids = new Set(slices.map((slice) => slice.id));
  const namedMissingApp = slices.some((slice) => /www app slice/i.test(slice.dependencyText || ''));
  if (namedMissingApp && !ids.has('WWW-APP')) {
    return {
      id: 'WWW-APP',
      reason: 'ADR-014 requires a React Router Framework Mode WWW app. The graph named that prerequisite without an executable WWW-APP slice.',
    };
  }
  return registryMaterializationGap(requirementRows, slices);
}

/** @deprecated Prefer registryMaterializationGap; kept for existing tests. */
export function bindingMaterializationGap(slices, requirementRows = loadRequirements()) {
  return registryMaterializationGap(requirementRows, slices);
}

export {
  missingExecutablePathDeclarations,
  registryMaterializationGap,
};

export function selectReady(slices, options = {}) {
  const blocked = new Set(options.blockedIds || []);
  const known = new Set(slices.map((slice) => slice.id));
  const complete = new Set(slices.filter((slice) => slice.status === 'COMPLETE').map((slice) => slice.id));
  const acceptance = new Set(slices.filter((slice) => slice.reportOnly).map((slice) => slice.id));
  const ready = slices.filter((slice) => {
    if (slice.status === 'COMPLETE' || slice.reportOnly || !slice.autonomous) return false;
    if (blocked.has(slice.id) || slice.externalUnmet) return false;
    if (BLOCKING_GATES.has(slice.gate)) return false;
    return slice.dependsOn.filter((id) => known.has(id) && !acceptance.has(id)).every((id) => complete.has(id));
  });
  const critical = new Set();
  for (const slice of slices) {
    if (slice.status !== 'COMPLETE') continue;
    for (const id of slice.next) {
      if (ready.some((item) => item.id === id)) critical.add(id);
    }
  }
  const dependents = new Map();
  for (const slice of slices) {
    if (slice.status === 'COMPLETE') continue;
    for (const id of slice.dependsOn) dependents.set(id, (dependents.get(id) || 0) + 1);
  }
  const ranked = [...ready].sort((a, b) => {
    const criticalDelta = Number(critical.has(b.id)) - Number(critical.has(a.id));
    if (criticalDelta) return criticalDelta;
    const unblockDelta = (dependents.get(b.id) || 0) - (dependents.get(a.id) || 0);
    if (unblockDelta) return unblockDelta;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  const selected = ranked[0] || null;
  let reason = 'no safe READY AUTO/REVIEW slice';
  if (selected && critical.has(selected.id)) {
    reason = `${selected.id} is named Next by a completed slice and its dependencies are complete`;
  } else if (selected) {
    reason = `${selected.id} is the highest-priority safe READY slice after the critical path`;
  }
  const requirementRows = options.requirements || loadRequirements();
  const useLiveScope = options.requirements === undefined && options.scope === undefined;
  const scope = useLiveScope ? loadProductScope() : (options.scope || []);
  const models = useLiveScope ? loadParentModels() : (options.parentModels || []);
  const gap = internalPrerequisiteGap(slices, requirementRows);
  const undeclared = missingExecutablePathDeclarations(requirementRows);
  const scopeGaps = scopeCoverageGaps(scope, requirementRows);
  const depthGaps = missingRequiredDepths(requirementRows, models);
  if (!selected && gap) {
    reason = `${gap.reason} Do not mark the session exhausted for an omitted internal materialization.`;
  } else if (!selected && undeclared.length > 0) {
    reason = `Unfinished binding internal requirements lack executableSlice metadata (${undeclared.slice(0, 3).join(', ')}). That is a validation failure, not exhaustion.`;
  } else if (!selected && scopeGaps.length > 0) {
    reason = `Scope coverage gap ${scopeGaps[0]}. Approved product scope has no requirement.`;
  } else if (!selected && depthGaps.length > 0) {
    reason = `Missing binding depth ${depthGaps[0]}. A boundary or foundation is not the parent product.`;
  }
  const currentDepthExhausted = currentBindingDepthExhausted(requirementRows, slices);
  const masterExhausted = masterProductScopeExhausted(requirementRows, slices, scope, models);
  return {
    selected: selected ? selected.id : null,
    reason,
    ready: ranked.map((slice) => slice.id),
    withheld: slices
      .filter((slice) => slice.status !== 'COMPLETE' && BLOCKING_GATES.has(slice.gate))
      .map((slice) => ({ id: slice.id, gate: slice.gate })),
    internalGap: gap || (undeclared.length > 0
      ? { id: undeclared[0], reason: reason }
      : null),
    scopeGaps,
    depthGaps,
    currentBindingDepthExhausted: currentDepthExhausted,
    masterProductScopeExhausted: masterExhausted,
    exhaustionAllowed: selected == null && gap == null && undeclared.length === 0
      && scopeGaps.length === 0 && depthGaps.length === 0 && masterExhausted,
  };
}

/** Routine work does not call Grok. Research or an adversarial challenge does. Grok stays evidence. */
export const GROK_STATES = Object.freeze([
  'GROK_NOT_NEEDED',
  'GROK_REQUESTED',
  'GROK_SUCCEEDED',
  'GROK_FAILED',
  'GROK_DEFERRED',
  'GROK_FINDING_ADOPTED_AFTER_LOCAL_VERIFICATION',
  'GROK_FINDING_REJECTED',
]);

export function grokDisposition(input = {}) {
  const triggered = input.externalResearch === true || input.adversarial === true;
  if (!triggered || input.routine === true) return 'GROK_NOT_NEEDED';
  if (input.unavailable === true) return 'GROK_DEFERRED';
  if (input.failed === true) return 'GROK_FAILED';
  if (input.succeeded === true && input.adopted === true) return 'GROK_FINDING_ADOPTED_AFTER_LOCAL_VERIFICATION';
  if (input.succeeded === true && input.rejected === true) return 'GROK_FINDING_REJECTED';
  if (input.succeeded === true) return 'GROK_SUCCEEDED';
  return 'GROK_REQUESTED';
}

/**
 * CodeRabbit is advisory checkpoint evidence, not Canon authority.
 * Use on coherent checkpoint diffs only — never every micro-edit.
 */
export const CODERABBIT_STATES = Object.freeze([
  'CODERABBIT_NOT_NEEDED',
  'CODERABBIT_REQUESTED',
  'CODERABBIT_PASS',
  'CODERABBIT_FINDINGS',
  'CODERABBIT_FINDINGS_FIXED',
  'CODERABBIT_RE_REVIEW_REQUIRED',
  'CODERABBIT_PASS_AFTER_REPAIR',
  'CODERABBIT_FINDINGS_REJECTED_WITH_REASON',
  'CODERABBIT_REVIEW_BLOCKED',
  'CODERABBIT_DEFERRED_RATE_LIMIT',
  'CODERABBIT_DEFERRED_UNAVAILABLE',
  'CODERABBIT_FAILED',
]);

const EXTERNAL_REVIEW_DENY = [
  /(^|\/)\.env(\.|$)/i,
  /(^|\/)(secrets?|credentials?)(\/|$)/i,
  /\.(pem|p12|pfx|jks|keystore)$/i,
  /(^|\/)id_(rsa|ed25519|ecdsa)(\.pub)?$/i,
  /(^|\/)(customer-data|client-data|private)\//i,
  /\b(payment|iban|pesel|passport)\b/i,
];

const EXTERNAL_REVIEW_CONTENT = [
  /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/,
  /Bearer [A-Za-z0-9\-._~+/]{20,}/i,
  // Word boundaries avoid false positives like `pathToken =` / `classToken =`.
  /\b(?:api[_-]?key|secret|password|token)\b\s*[:=]\s*['"]?[^\s'"]{12,}/i,
  /\b(?:pesel|iban|customer[_-]?email)\b\s*[:=]/i,
];

/** Paths that must not leave the machine for external AI review. */
export function coderabbitPrivacyBlocked(paths = []) {
  const blocked = [];
  for (const raw of paths) {
    const file = String(raw || '').replace(/\\/g, '/');
    if (!file) continue;
    if (EXTERNAL_REVIEW_DENY.some((re) => re.test(file))) blocked.push(file);
  }
  return [...new Set(blocked)];
}

/**
 * Material sent externally is HEAD content. For unified diffs, only scan
 * added lines so deleting a secret-shaped test fixture cannot block review.
 */
function contentScopeForPrivacyScan(diffText) {
  const text = String(diffText || '');
  if (!text) return '';
  const looksUnified =
    /^diff --git /m.test(text) || /^@@ /m.test(text) || /^\+\+\+ /m.test(text);
  if (!looksUnified) return text;
  return text
    .split(/\r?\n/)
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1))
    .join('\n');
}

/** Diff body that must not leave the machine for external AI review. */
export function coderabbitDiffContentBlocked(diffText = '') {
  const text = contentScopeForPrivacyScan(diffText);
  if (!text) return [];
  const hits = [];
  for (const re of EXTERNAL_REVIEW_CONTENT) {
    if (re.test(text)) hits.push(re.source.slice(0, 48));
  }
  return hits;
}

export function coderabbitDisposition(input = {}) {
  if (input.trivial === true || input.needed === false) return 'CODERABBIT_NOT_NEEDED';
  if (input.privacyBlocked === true) return 'CODERABBIT_DEFERRED_UNAVAILABLE';
  if (input.rateLimited === true) return 'CODERABBIT_DEFERRED_RATE_LIMIT';
  if (input.unavailable === true) return 'CODERABBIT_DEFERRED_UNAVAILABLE';
  if (input.failed === true) return 'CODERABBIT_FAILED';
  if (input.reviewBlocked === true) return 'CODERABBIT_REVIEW_BLOCKED';
  if (input.passAfterRepair === true) return 'CODERABBIT_PASS_AFTER_REPAIR';
  if (input.reReviewRequired === true) return 'CODERABBIT_RE_REVIEW_REQUIRED';
  if (input.findingsFixed === true) return 'CODERABBIT_FINDINGS_FIXED';
  if (input.findingsRejected === true) return 'CODERABBIT_FINDINGS_REJECTED_WITH_REASON';
  if (input.findings === true) return 'CODERABBIT_FINDINGS';
  if (input.passed === true) return 'CODERABBIT_PASS';
  if (input.requested === true || input.checkpoint === true) return 'CODERABBIT_REQUESTED';
  return 'CODERABBIT_NOT_NEEDED';
}

export function emptySession(deadline, now = new Date()) {
  return {
    until: deadline.until,
    untilUtc: deadline.untilUtc,
    hour: deadline.hour,
    timeZone: deadline.timeZone,
    status: 'busy',
    lastBeat: now.toISOString(),
    role: 'coordinator',
    currentSlice: null,
    lastCompletedSlice: null,
    blocked: [],
    nextCandidates: [],
    lastVerifiedCommit: null,
    selectionReason: null,
    attempts: {},
    completed: [],
    silentFollowups: 0,
    shutdownFollowups: 0,
    errorFollowups: 0,
    exhausted: false,
    lastFollowupBeat: null,
    lastFollowupSlice: null,
    lastFollowupCommit: null,
  };
}

export function noteAttempt(session, { slice, commit, signature }) {
  const key = `${slice}|${commit}|${signature}`;
  const attempts = { ...session.attempts, [key]: (session.attempts[key] || 0) + 1 };
  const blocked = new Set(session.blocked);
  if (attempts[key] >= REPEAT_LIMIT) blocked.add(slice);
  return {
    ...session,
    attempts,
    blocked: [...blocked],
    currentSlice: blocked.has(slice) ? null : session.currentSlice,
  };
}

export function noteSelection(session, { slice, commit }) {
  const key = `select|${slice}|${commit}`;
  const attempts = { ...session.attempts, [key]: (session.attempts[key] || 0) + 1 };
  const blocked = new Set(session.blocked);
  const repeated = attempts[key] >= REPEAT_LIMIT;
  if (repeated) blocked.add(slice);
  return {
    session: {
      ...session,
      attempts,
      blocked: [...blocked],
      currentSlice: repeated ? null : slice,
      lastVerifiedCommit: commit,
    },
    repeated,
  };
}

function copySession(session) {
  return {
    ...session,
    blocked: [...(session.blocked || [])],
    nextCandidates: [...(session.nextCandidates || [])],
    attempts: { ...(session.attempts || {}) },
  };
}

export function decideFollowup(session, input, now = new Date()) {
  if (!session || input?.status === 'aborted' || session.status === 'stop' || session.exhausted) {
    return { followup: null, session };
  }
  const next = copySession(session);
  if (input?.status === 'error') {
    next.errorFollowups += 1;
    if (next.errorFollowups > 2) {
      next.exhausted = true;
      next.status = 'stop';
      return { followup: null, session: next };
    }
    return { followup: CONTINUE_MESSAGE, session: next };
  }
  if (input?.status !== 'completed') return { followup: null, session: next };
  if (Date.parse(next.untilUtc || next.until) <= now.getTime()) {
    next.shutdownFollowups += 1;
    if (next.shutdownFollowups > SHUTDOWN_TURNS) {
      next.status = 'stop';
      return { followup: null, session: next };
    }
    return { followup: SHUTDOWN_MESSAGE, session: next };
  }
  const unchanged = next.lastFollowupBeat !== null
    && next.lastFollowupBeat === next.lastBeat
    && next.lastFollowupSlice === next.currentSlice
    && next.lastFollowupCommit === next.lastVerifiedCommit;
  next.silentFollowups = unchanged ? next.silentFollowups + 1 : 0;
  next.lastFollowupBeat = next.lastBeat;
  next.lastFollowupSlice = next.currentSlice;
  next.lastFollowupCommit = next.lastVerifiedCommit;
  if (next.silentFollowups >= SILENT_STOP) {
    next.exhausted = true;
    next.status = 'stop';
    return { followup: null, session: next };
  }
  if (next.silentFollowups >= SILENT_STALL) return { followup: STALL_MESSAGE, session: next };
  return { followup: CONTINUE_MESSAGE, session: next };
}

/**
 * For node -e/--eval fixtures only, remove quoted literals so classifyShell
 * does not false-positive on embedded example strings. PowerShell/cmd
 * wrappers keep their quoted payloads so `powershell -Command "git push
 * --force"` remains denied.
 *
 * Exception: if the eval payload also invokes a process spawner
 * (child_process / spawn / exec*), keep the raw command for push
 * detection so agents cannot hide `git push` inside quoted node -e.
 */
export function shellCommandForPolicy(command) {
  const text = String(command || '');
  if (!/\bnode(?:\.exe)?\s+(-e|--eval|--input-type=module\s+-e)\b/i.test(text)) return text;
  return text
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/`(?:\\.|[^`\\])*`/g, '``');
}

const NODE_EVAL_SPAWNER = /\b(child_process|spawnSync|execSync|execFileSync|spawn\s*\(|exec\s*\(|execFile\s*\()/i;

/**
 * Probe text for git-push rules. Prefer stripped node -e fixtures, but keep
 * the raw command when the eval clearly spawns a subprocess.
 */
export function pushPolicyProbe(command) {
  const raw = String(command || '');
  if (/\bnode(?:\.exe)?\s+(-e|--eval|--input-type=module\s+-e)\b/i.test(raw)
    && NODE_EVAL_SPAWNER.test(raw)) {
    return raw;
  }
  return shellCommandForPolicy(raw);
}

export function classifyShell(command) {
  const raw = String(command || '');
  const text = shellCommandForPolicy(raw);
  const pushText = pushPolicyProbe(raw);
  const trimmed = text.trim();
  // A lone git checkpoint/read command must not deny merely because the
  // commit message or args mention the words "git push".
  const loneGitCheckpoint = /^git(?:\.exe)?\s+(commit|add|status|diff|show|log|rev-parse|branch|fetch|merge-base|ls-files|grep|symbolic-ref|cat-file|describe|name-rev|shortlog|check-ignore|config)\b/i.test(trimmed)
    && !/(?:&&|\|\||;|\n)/.test(trimmed);
  if (!loneGitCheckpoint && (GIT_PUSH.test(pushText) || GIT_PUSH_ARGV.test(pushText))) {
    if (PUSH_DANGEROUS.test(pushText)) {
      return {
        permission: 'deny',
        user_message: 'This shell command matches a protected operation (git-push-force) and is blocked.',
        agent_message: 'Force, mirror, and delete pushes are DANGEROUS and stay denied. A /noc window is not approval for history rewrite. Owner may run the command manually outside the agent if intentionally required.',
      };
    }
    if (PUSH_NO_VERIFY.test(pushText)) {
      return {
        permission: 'deny',
        user_message: 'This shell command matches a protected operation (git-push-no-verify) and is blocked.',
        agent_message: 'git push --no-verify is not a bypass. Use pnpm push:main, which runs scripts/ci/pre-push-gate.mjs before a safe fast-forward push.',
      };
    }
    return {
      permission: 'deny',
      user_message: 'Direct git push is blocked. Use the canonical safe push path.',
      agent_message: 'Do not run git push directly. A safe fast-forward checkpoint push is AUTO only through pnpm push:main (scripts/ci/push-main.mjs), which runs the mandatory local pre-push gate first.',
    };
  }
  const hit = SHELL_ASK.find((rule) => rule.re.test(text));
  if (!hit) return { permission: 'allow' };
  return {
    permission: 'deny',
    user_message: `This shell command matches a protected operation (${hit.id}) and is blocked.`,
    agent_message: `Do not run ${hit.id} without explicit Owner action outside the agent. Cursor hook ask is unreliable; deny enforces the Decision Gate. A /noc window is not approval. Local commit is separate from push, deploy, and production mutation.`,
  };
}

export function classifyMcp(input) {
  const tool = String(input?.tool_name || '');
  const server = String(input?.mcp_server_name || '');
  const cloudflareServer = /cloudflare/i.test(server);
  if (MCP_ASK.has(tool) && (server.length === 0 || cloudflareServer)) {
    return {
      permission: 'deny',
      user_message: `MCP tool ${tool} can mutate infrastructure and is blocked.`,
      agent_message: 'Do not treat an active /noc window as approval for Cloudflare, DNS, database, or credential mutation. Owner may run an approved mutation outside the agent.',
    };
  }
  return { permission: 'allow' };
}
