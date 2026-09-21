import { serve } from '@hono/node-server';
import { authenticatorFromEnv } from './auth.ts';
import { createApp } from './app.ts';
import { migrate, openDatabase } from './db.ts';
import { PostgresLeadStore } from './postgres-store.ts';

const connectionString = process.env.LEAD_DATABASE_URL;
if (!connectionString) {
  console.error('LEAD_DATABASE_URL is required. Production authentication is not complete; AUTH_MODE=test is only for local tests.');
  process.exit(1);
}

const { db } = openDatabase(connectionString);
await migrate(db);
const app = createApp({
  store: new PostgresLeadStore(db),
  authenticator: authenticatorFromEnv(process.env),
});
const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port, hostname: '127.0.0.1' }, () => {
  console.log(JSON.stringify({ msg: 'api.listening', host: '127.0.0.1', port }));
});
