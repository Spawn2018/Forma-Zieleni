import test from 'node:test';
import assert from 'node:assert/strict';
import { runOutboxSupervisorLoop } from './outbox-supervisor.ts';

test('supervisor loop runs bounded passes, idles when empty, and stops on signal', async () => {
  const sleeps = [];
  const logs = [];
  const controller = new AbortController();
  let calls = 0;
  const result = await runOutboxSupervisorLoop({
    idleMs: 25,
    signal: controller.signal,
    sleep: async ms => {
      sleeps.push(ms);
    },
    now: () => new Date('2026-09-22T18:00:00.000Z'),
    maxPasses: 3,
    log: record => logs.push(record),
    async dispatch() {
      calls += 1;
      if (calls === 1) return { published: 0, retried: 0, poisoned: 0 };
      if (calls === 2) return { published: 1, retried: 0, poisoned: 0 };
      return { published: 0, retried: 1, poisoned: 0 };
    },
  });
  assert.equal(result.stoppedBy, 'maxPasses');
  assert.equal(result.passes, 3);
  assert.deepEqual(result.totals, { published: 1, retried: 1, poisoned: 0 });
  assert.equal(sleeps.length, 1);
  assert.equal(sleeps[0], 25);
  assert.equal(logs.every(line => !JSON.stringify(line).includes('phone')), true);
  assert.equal(logs.every(line => !JSON.stringify(line).includes('@')), true);
  assert.equal(logs[0].msg, 'outbox.supervisor.pass');
});

test('supervisor abort mid-run stops without requiring a broker', async () => {
  const controller = new AbortController();
  let calls = 0;
  const result = await runOutboxSupervisorLoop({
    idleMs: 5,
    signal: controller.signal,
    sleep: async () => {
      controller.abort();
    },
    now: () => new Date('2026-09-22T18:00:00.000Z'),
    async dispatch() {
      calls += 1;
      return { published: 0, retried: 0, poisoned: 0 };
    },
  });
  assert.equal(result.stoppedBy, 'signal');
  assert.equal(calls, 1);
  assert.equal(result.passes, 1);
});

test('supervisor rejects invalid idle intervals', async () => {
  await assert.rejects(
    () => runOutboxSupervisorLoop({
      idleMs: -1,
      signal: new AbortController().signal,
      sleep: async () => {},
      now: () => new Date(),
      async dispatch() {
        return { published: 0, retried: 0, poisoned: 0 };
      },
    }),
    /IDLE_MS_INVALID/,
  );
});
