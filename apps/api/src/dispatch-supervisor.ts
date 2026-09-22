import { parseRuntimeConfig } from './config.ts';
import { migrate, openDatabase } from './db.ts';
import { dispatchOutbox } from './outbox.ts';
import { runOutboxSupervisorLoop } from './outbox-supervisor.ts';

function config() {
  try {
    return parseRuntimeConfig(process.env);
  } catch (error) {
    const code = error instanceof Error ? error.message : 'CONFIG_INVALID';
    console.error(JSON.stringify({ msg: 'api.config', code }));
    process.exit(1);
  }
}

function idleMs(): number {
  const raw = process.env.OUTBOX_IDLE_MS ?? '1000';
  if (!/^\d{1,7}$/.test(raw)) {
    console.error(JSON.stringify({ msg: 'api.config', code: 'IDLE_MS_INVALID' }));
    process.exit(1);
  }
  return Number(raw);
}

const runtime = config();
const { db, pool } = openDatabase(runtime.databaseUrl);
try {
  await migrate(db);
} catch {
  console.error(JSON.stringify({ msg: 'api.migrate', code: 'MIGRATION_FAILED' }));
  await pool.end();
  process.exit(1);
}

const controller = new AbortController();
const onStop = () => controller.abort();
process.once('SIGINT', onStop);
process.once('SIGTERM', onStop);

const result = await runOutboxSupervisorLoop({
  idleMs: idleMs(),
  signal: controller.signal,
  sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
  now: () => new Date(),
  log: record => console.log(JSON.stringify(record)),
  async dispatch(now) {
    return dispatchOutbox(db, {
      async deliver(message) {
        console.log(JSON.stringify({ msg: 'outbox.delivered', id: message.id, eventType: message.eventType }));
      },
    }, {
      limit: 20,
      maxAttempts: 5,
      leaseMs: 30_000,
      now,
    });
  },
});

console.log(JSON.stringify({
  msg: 'outbox.supervisor.stop',
  stoppedBy: result.stoppedBy,
  passes: result.passes,
  published: result.totals.published,
  retried: result.totals.retried,
  poisoned: result.totals.poisoned,
}));
await pool.end();
