import type { DispatchCounts } from './outbox.ts';

export type SupervisorLoopInput = {
  dispatch: (now: Date) => Promise<DispatchCounts>;
  idleMs: number;
  signal: AbortSignal;
  sleep: (ms: number) => Promise<void>;
  now: () => Date;
  maxPasses?: number;
  log?: (record: Record<string, unknown>) => void;
};

function emptyCounts(): DispatchCounts {
  return { published: 0, retried: 0, poisoned: 0 };
}

function addCounts(left: DispatchCounts, right: DispatchCounts): DispatchCounts {
  return {
    published: left.published + right.published,
    retried: left.retried + right.retried,
    poisoned: left.poisoned + right.poisoned,
  };
}

export async function runOutboxSupervisorLoop(input: SupervisorLoopInput): Promise<{
  passes: number;
  totals: DispatchCounts;
  stoppedBy: 'signal' | 'maxPasses';
}> {
  if (!Number.isInteger(input.idleMs) || input.idleMs < 0 || input.idleMs > 3_600_000) {
    throw new Error('IDLE_MS_INVALID');
  }
  let passes = 0;
  let totals = emptyCounts();
  while (!input.signal.aborted) {
    if (input.maxPasses !== undefined && passes >= input.maxPasses) {
      return { passes, totals, stoppedBy: 'maxPasses' };
    }
    const now = input.now();
    const counts = await input.dispatch(now);
    passes += 1;
    totals = addCounts(totals, counts);
    input.log?.({
      msg: 'outbox.supervisor.pass',
      pass: passes,
      published: counts.published,
      retried: counts.retried,
      poisoned: counts.poisoned,
    });
    if (input.maxPasses !== undefined && passes >= input.maxPasses) {
      return { passes, totals, stoppedBy: 'maxPasses' };
    }
    if (input.signal.aborted) break;
    const worked = counts.published + counts.retried + counts.poisoned;
    if (worked === 0 && input.idleMs > 0) await input.sleep(input.idleMs);
  }
  return { passes, totals, stoppedBy: 'signal' };
}
