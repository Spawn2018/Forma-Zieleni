import { safeText } from './decision.mjs';

export function inspectNativeResult(stdout, sessionId, taskId) {
  const eventTypes = [], itemTypes = [];
  let reply = null, replies = 0, completed = 0, valid = true;
  const known = ['thread.started', 'turn.started', 'item.started', 'item.updated', 'item.completed', 'turn.completed', 'turn.failed', 'error'];
  for (const line of stdout.split(/\r?\n/).filter(Boolean)) {
    try {
      const event = JSON.parse(line);
      if (!known.includes(event.type) || completed) throw new Error('INVALID_EVENT');
      eventTypes.push(event.type);
      if (event.type === 'error' || event.type === 'turn.failed') valid = false;
      if (event.type === 'turn.completed') completed++;
      if (['agent_message', 'command_execution', 'reasoning', 'mcp_tool_call', 'file_change'].includes(event.item?.type)) itemTypes.push(event.item.type);
      if (event.type === 'item.completed' && event.item?.type === 'agent_message') {
        replies++;
        const candidate = JSON.parse(event.item.text);
        const required = ['session_id', 'task_id', 'status', 'summary', 'observed_nonce', 'write_denied', 'outside_read_denied', 'security_events', 'blockers'];
        if (!candidate || Object.keys(candidate).sort().join(',') !== required.sort().join(',') ||
            candidate.session_id !== sessionId || candidate.task_id !== taskId || !['COMPLETE', 'BLOCKED'].includes(candidate.status) ||
            typeof candidate.observed_nonce !== 'string' || candidate.observed_nonce.length > 64 ||
            typeof candidate.write_denied !== 'boolean' || typeof candidate.outside_read_denied !== 'boolean') throw new Error('INVALID_REPLY');
        safeText(candidate.summary);
        for (const key of ['security_events', 'blockers']) {
          if (!Array.isArray(candidate[key]) || candidate[key].length > 16) throw new Error('INVALID_REPLY');
          candidate[key].forEach(value => safeText(value));
        }
        reply = candidate;
      }
    } catch { valid = false; }
  }
  const structured = valid && completed === 1 && replies === 1 && reply !== null;
  return { structured, reply: structured ? reply : null, eventTypes: [...new Set(eventTypes)], itemTypes: [...new Set(itemTypes)] };
}
