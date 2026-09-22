import assert from 'node:assert/strict';
import test from 'node:test';
import { grokDisposition } from '../fz-noc/policy.mjs';
import { grokChannelStatus, planGrokChallenge, runSyntheticProbe } from './grok-callable.mjs';

test('Grok challenge skips routine work and defers when unavailable', () => {
  assert.equal(planGrokChallenge({ routine: true }).state, 'GROK_NOT_NEEDED');
  const requested = planGrokChallenge({ adversarial: true });
  assert.ok(['GROK_REQUESTED', 'GROK_DEFERRED'].includes(requested.state));
});

test('channel status never exposes auth material', () => {
  const status = grokChannelStatus();
  assert.equal(status.channel, 'grok-cli');
  assert.equal(typeof status.installed, 'boolean');
  assert.equal(typeof status.authenticated, 'boolean');
  assert.equal(status.mutation, 'read-only-required');
  assert.equal(JSON.stringify(status).includes('access_token'), false);
  assert.equal(JSON.stringify(status).includes('refresh_token'), false);
});

test('synthetic probe dry-run does not call the model', () => {
  const result = runSyntheticProbe({ dryRun: true, requireAuth: false, persist: false });
  assert.equal(result.ok, true);
  assert.equal(result.dryRun, true);
  assert.equal(result.state, 'GROK_REQUESTED');
});

test('disposition helper stays aligned with callable planner', () => {
  assert.equal(grokDisposition({ adversarial: true, succeeded: true }), 'GROK_SUCCEEDED');
});
