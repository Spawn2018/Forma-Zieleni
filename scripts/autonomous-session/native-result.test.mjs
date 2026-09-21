import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectNativeResult } from './native-result.mjs';

const reply = { session_id: 's', task_id: 't', status: 'COMPLETE', summary: 'Measured fixture', observed_nonce: 'nonce', write_denied: true, outside_read_denied: true, security_events: [], blockers: [] };
const message = value => JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: JSON.stringify(value) } });
const end = JSON.stringify({ type: 'turn.completed' });
const inspect = text => inspectNativeResult(text, 's', 't');

test('native structured transport validates IDs, fields and terminal event independently of success', () => {
  assert.equal(inspect(`${message(reply)}\n${end}`).structured, true);
  const blocked = inspect(`${message({ ...reply, status: 'BLOCKED', observed_nonce: '' })}\n${end}`);
  assert.equal(blocked.structured, true);
  assert.equal(blocked.reply.status, 'BLOCKED');
  for (const bad of [{ ...reply, classification: 'AUTO' }, { ...reply, session_id: 'other' }, { ...reply, write_denied: 'true' }, { ...reply, status: 'APPROVED' }, { ...reply, blockers: [42] }]) {
    assert.equal(inspect(`${message(bad)}\n${end}`).structured, false);
  }
});

test('malformed, duplicated, failed, incomplete and trailing output invalidate an earlier reply', () => {
  for (const text of [message(reply), `${message(reply)}\nnot-json\n${end}`, `${message(reply)}\n${message(reply)}\n${end}`,
    `${message(reply)}\n${JSON.stringify({ type: 'error' })}\n${end}`, `${message(reply)}\n${end}\n${end}`,
    `${message(reply)}\n${JSON.stringify({ type: 'unknown' })}\n${end}`]) assert.equal(inspect(text).structured, false);
});
