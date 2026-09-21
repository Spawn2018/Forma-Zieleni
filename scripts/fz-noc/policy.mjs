const WARSAW = 'Europe/Warsaw';
const HOUR_MS = 60 * 60 * 1000;
const SILENT_STALL = 3;
const SILENT_STOP = 5;
const SHUTDOWN_TURNS = 3;
const REPEAT_LIMIT = 3;

const BLOCKING_GATES = new Set(['OWNER-DECISION', 'OWNER-ONLY', 'DANGEROUS']);

export const CONTINUE_MESSAGE =
  'Under the still-active Forma Zieleni /noc deadline, re-read repository state through the FZ orchestrator and continue the next READY safe work. Refresh the execution graph before selecting. Do not repeat the previous command blindly. Do not ask the Owner to continue.';

export const STALL_MESSAGE =
  'The active /noc window has seen repeated turns without a heartbeat, slice, or commit change. Mark the current slice blocked with the session CLI, refresh the execution graph, and work-steal the next READY AUTO/REVIEW slice. If none remains, report the blocker and stop the session. Do not bypass an Owner gate.';

export const SHUTDOWN_MESSAGE =
  'The /noc deadline has passed. Do not start a new slice. Finish or checkpoint the current atomic work, do not mark incomplete work complete, validate what finished, commit locally only if that work is complete, report the result and the next READY state, then stop the session.';

const GIT = '(?:^|[;&|]|\\n|\\s|["\'])git(?:\\.exe)?(?:\\s+-C\\s+\\S+|\\s+-[^\\s]+)*\\s+';
const GIT_PUSH = new RegExp(`${GIT}push\\b`, 'i');
const PUSH_NOT_AUTO = /--force(?:-with-lease)?|--mirror|--delete|\s\+\S/;
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
      externalUnmet: /www app slice/i.test(dependencies),
    });
  }
  return slices;
}

export function selectReady(slices, options = {}) {
  const blocked = new Set(options.blockedIds || []);
  const known = new Set(slices.map((slice) => slice.id));
  const complete = new Set(slices.filter((slice) => slice.status === 'COMPLETE').map((slice) => slice.id));
  const ready = slices.filter((slice) => {
    if (slice.status === 'COMPLETE' || slice.reportOnly || !slice.autonomous) return false;
    if (blocked.has(slice.id) || slice.externalUnmet) return false;
    if (BLOCKING_GATES.has(slice.gate)) return false;
    return slice.dependsOn.filter((id) => known.has(id)).every((id) => complete.has(id));
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
  return {
    selected: selected ? selected.id : null,
    reason,
    ready: ranked.map((slice) => slice.id),
    withheld: slices
      .filter((slice) => slice.status !== 'COMPLETE' && BLOCKING_GATES.has(slice.gate))
      .map((slice) => ({ id: slice.id, gate: slice.gate })),
  };
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

export function classifyShell(command) {
  const text = String(command || '');
  if (GIT_PUSH.test(text) && PUSH_NOT_AUTO.test(text)) {
    return {
      permission: 'ask',
      user_message: 'This shell command matches a protected operation (git-push-force) and needs Owner approval.',
      agent_message: 'A fast-forward checkpoint push is AUTO. Force, mirror, and delete pushes are not. A /noc window is not approval for history rewrite.',
    };
  }
  const hit = SHELL_ASK.find((rule) => rule.re.test(text));
  if (!hit) return { permission: 'allow' };
  return {
    permission: 'ask',
    user_message: `This shell command matches a protected operation (${hit.id}) and needs Owner approval.`,
    agent_message: `Do not run ${hit.id} without explicit Owner approval in this turn. A /noc window is not approval. Local commit is separate from push, deploy, and production mutation.`,
  };
}

export function classifyMcp(input) {
  const tool = String(input?.tool_name || '');
  const server = String(input?.mcp_server_name || '');
  const cloudflareServer = /cloudflare/i.test(server);
  if (MCP_ASK.has(tool) && (server.length === 0 || cloudflareServer)) {
    return {
      permission: 'ask',
      user_message: `MCP tool ${tool} can mutate infrastructure and needs Owner approval.`,
      agent_message: 'Do not treat an active /noc window as approval for Cloudflare, DNS, database, or credential mutation.',
    };
  }
  return { permission: 'allow' };
}
