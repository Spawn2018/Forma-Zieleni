import { readFileSync } from 'node:fs';
import { classifyMcp, classifyShell, decideFollowup } from './policy.mjs';
import { readSession, writeSession } from './live.mjs';

function readInput() {
  const raw = readFileSync(0, 'utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

function emit(value) {
  process.stdout.write(JSON.stringify(value));
}

function deny(userMessage, agentMessage) {
  emit({
    permission: 'deny',
    user_message: userMessage,
    agent_message: agentMessage,
  });
}

export function runStopHook() {
  try {
    const current = readSession();
    const decision = decideFollowup(current, readInput());
    if (decision.session && decision.session !== current) writeSession(decision.session);
    emit(decision.followup ? { followup_message: decision.followup } : {});
  } catch {
    emit({});
  }
}

export function runDangerousShell() {
  try {
    emit(classifyShell(readInput().command || ''));
  } catch {
    deny(
      'The safety hook could not read the shell command.',
      'Do not run this command until the hook input can be read.',
    );
  }
}

export function runDangerousMcp() {
  try {
    emit(classifyMcp(readInput()));
  } catch {
    deny(
      'The safety hook could not read the MCP call.',
      'Do not run this MCP call until the hook input can be read.',
    );
  }
}

export function runSessionStart() {
  emit({
    additional_context: 'Forma Zieleni workspace. Read START-HERE-CURSOR.md. Canon is authority. The FZ orchestrator selects READY work. Owner gates cannot be bypassed. An active /noc window, if any, is .fz-noc/live.json. Before editing, reconstruct HEAD and docs/engineering/requirements/execution-journal.json.',
  });
}

export function runPreCompact() {
  emit({
    user_message: 'Forma Zieleni state lives in the repository. After compaction, re-read START-HERE-CURSOR.md, docs/engineering/FZ-CONTEXT-MAP.json, and docs/engineering/requirements/execution-journal.json. Do not edit until HEAD is reconstructed.',
  });
}
