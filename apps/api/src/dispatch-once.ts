import { parseRuntimeConfig } from './config.ts';
import { migrate, openDatabase } from './db.ts';
import { dispatchOutbox } from './outbox.ts';

function config() {
  try {
    return parseRuntimeConfig(process.env);
  } catch (error) {
    const code = error instanceof Error ? error.message : 'CONFIG_INVALID';
    console.error(JSON.stringify({ msg: 'api.config', code }));
    process.exit(1);
  }
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

const counts = await dispatchOutbox(db, {
  async deliver(message) {
    console.log(JSON.stringify({ msg: 'outbox.delivered', id: message.id, eventType: message.eventType }));
  },
}, {
  limit: 20,
  maxAttempts: 5,
  leaseMs: 30_000,
  now: new Date(),
});
console.log(JSON.stringify({ msg: 'outbox.dispatch', ...counts }));
await pool.end();
