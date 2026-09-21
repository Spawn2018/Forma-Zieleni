import test from 'node:test';
import assert from 'node:assert/strict';
import { runSession } from './engine.ts';

// This exercises routing and continuation only. Mock outcomes provide no native
// execution evidence and cannot establish a native adapter PASS.
test('simulation: completion, retry and mocked Owner decision continue; restricted work never invokes executor', async () => {
  const now = Date.parse('2026-09-20T12:00:00Z');
  const slices = [
    { id: 'complete', capability: 'repo-audit', classification: 'AUTO', dependsOn: [] },
    { id: 'retry', capability: 'repo-audit', classification: 'AUTO', dependsOn: ['complete'] },
    { id: 'decision', capability: 'choose-audit', classification: 'OWNER-DECISION', dependsOn: ['retry'] },
    { id: 'owner', capability: 'repo-audit', classification: 'OWNER-ONLY', dependsOn: [] },
    { id: 'danger', capability: 'deploy', classification: 'AUTO', dependsOn: [] },
  ];
  const state = {
    version: 1, id: 'native-routing-simulation', objective: 'Simulate continuation only', repo: 'fixture',
    createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
    deadline: null, maxIterations: 8, retryBudget: 1, iterationCount: 0, currentSlice: null,
    status: 'READY', slices, completedWork: [], pendingWork: slices.map(slice => slice.id),
    blockers: [], decisions: [], evidence: [], attempts: {}, gitHeadBefore: 'fixture', gitHeadAfter: 'fixture',
    modifiedFiles: [], baselineFiles: [], policyHash: 'fixture', apiCalls: 0,
  };
  const calls = [], snapshots = [];
  let decisionCalls = 0;
  await runSession(state, {
    now: () => now, guard: () => {}, stopped: () => false,
    checkpoint: current => snapshots.push(structuredClone(current)),
    decide: async () => { decisionCalls++; return { choice: 'canon-audit', rationale: 'Mock routing', review: 'Mock approval' }; },
    execute: async (capability, current) => {
      calls.push([current.currentSlice, capability]);
      if (current.currentSlice === 'decision') assert.equal(snapshots.at(-1).decisions[0].record.choice, 'canon-audit');
      return { status: current.currentSlice === 'retry' && current.attempts.retry === 1 ? 'RETRYABLE' : 'COMPLETE', evidence: [{ stage: 'simulation', result: 'NA', detail: 'Mock only; no native execution' }] };
    },
  });
  assert.deepEqual(calls, [['complete', 'repo-audit'], ['retry', 'repo-audit'], ['retry', 'repo-audit'], ['decision', 'canon-audit']]);
  assert.deepEqual(state.completedWork, ['complete', 'retry', 'decision']);
  assert.equal(state.iterationCount, 4, 'three completed slices plus one retry consume four attempts');
  assert.equal(decisionCalls, 1);
  assert.equal(state.apiCalls, 0);
  assert.deepEqual(state.blockers, [{ slice: 'owner', reason: 'OWNER-ONLY' }, { slice: 'danger', reason: 'DANGEROUS' }]);
  assert.deepEqual(state.pendingWork, []);
  assert.equal(state.status, 'BLOCKED');
  assert.ok(state.evidence.every(entry => entry.records.every(record => record.result === 'NA')));
});
