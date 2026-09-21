import { serve } from '@hono/node-server';
import { sql } from 'kysely';
import { testAuthenticator } from './auth.ts';
import { betterAuthAuthenticator } from './auth.ts';
import { createApp } from './app.ts';
import { parseRuntimeConfig } from './config.ts';
import { migrate, openDatabase } from './db.ts';
import { createLeadAuth, ensureActor } from './identity.ts';
import { PostgresLeadStore } from './postgres-store.ts';

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
  process.exit(1);
}

const identity = runtime.authMode === 'better-auth'
  ? createLeadAuth({
    pool,
    secret: runtime.betterAuthSecret ?? '',
    baseURL: runtime.baseURL,
    trustedOrigins: runtime.trustedOrigins,
    allowSignUp: false,
  })
  : null;

const app = createApp({
  store: new PostgresLeadStore(db),
  authenticator: identity
    ? betterAuthAuthenticator({
      lookup: headers => identity.lookup(headers),
      loadActor: subject => ensureActor(db, runtime.issuer, subject),
      trustedOrigins: runtime.trustedOrigins,
    })
    : testAuthenticator(runtime.testAuthSecret ?? ''),
  trustProxy: runtime.trustProxy,
  trustedPeers: runtime.trustedPeers,
  trustedOrigins: runtime.trustedOrigins,
  authHandler: identity ? request => identity.handler(request) : undefined,
  ready: async () => {
    try {
      await sql`select 1 as ok`.execute(db);
      return true;
    } catch {
      return false;
    }
  },
});

serve({ fetch: app.fetch, port: runtime.port, hostname: '127.0.0.1' }, () => {
  console.log(JSON.stringify({ msg: 'api.listening', host: '127.0.0.1', port: runtime.port, authMode: runtime.authMode }));
});
