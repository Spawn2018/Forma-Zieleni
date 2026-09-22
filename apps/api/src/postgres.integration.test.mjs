import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { mintTestSession, testAuthenticator, betterAuthAuthenticator } from './auth.ts';
import { createApp } from './app.ts';
import { migrate, openDatabase } from './db.ts';
import { createLeadAuth, ensureActor } from './identity.ts';
import { dispatchOutbox } from './outbox.ts';
import { PostgresLeadStore } from './postgres-store.ts';

const SECRET = 'test-secret-value';
const staff = {
  actorId: 'actor_staff_ana',
  issuer: 'test-issuer',
  sub: 'staff-ana',
  clientId: 'admin',
  capabilities: ['leads:read', 'leads:qualify'],
};

function pgBin() {
  if (process.env.FORMA_PG_BIN) return process.env.FORMA_PG_BIN;
  try {
    const command = process.platform === 'win32' ? 'where.exe' : 'which';
    const found = execFileSync(command, ['psql'], { encoding: 'utf8' }).split(/\r?\n/).find(Boolean);
    return found ? path.dirname(found) : null;
  } catch {
    return null;
  }
}

function run(bin, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd, stdio: 'ignore' });
    child.on('error', reject);
    child.on('exit', code => (code === 0 ? resolve() : reject(new Error(`${path.basename(bin)} ${code}`))));
  });
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('PORT'));
        return;
      }
      const { port } = address;
      server.close(() => resolve(port));
    });
  });
}

async function ephemeralDatabase() {
  if (process.env.LEAD_DATABASE_URL) return { url: process.env.LEAD_DATABASE_URL, stop: async () => {}, port: null, exe: null, owned: false };
  const bin = pgBin();
  if (!bin) return null;
  const root = await mkdtemp(path.join(tmpdir(), 'fz-lead-pg-'));
  const data = path.join(root, 'data');
  const port = await freePort();
  const exe = name => path.join(bin, process.platform === 'win32' ? `${name}.exe` : name);
  try {
    await run(exe('initdb'), ['-D', data, '-U', 'forma', '--auth-host=trust', '--auth-local=trust', '--encoding=UTF8']);
    const listen = `-p ${port} -h 127.0.0.1`;
    await run(exe('pg_ctl'), ['-D', data, '-l', path.join(root, 'server.log'), '-o', listen, 'start']);
  } catch {
    await rm(root, { recursive: true, force: true });
    return null;
  }
  return {
    url: `postgres://forma@127.0.0.1:${port}/postgres`,
    port,
    exe,
    owned: true,
    async stop() {
      await run(exe('pg_ctl'), ['-D', data, 'stop', '-m', 'fast']).catch(() => undefined);
      await rm(root, { recursive: true, force: true });
    },
  };
}

test('postgresql lead vertical persists, constrains and qualifies', { timeout: 60_000 }, async t => {
  const database = await ephemeralDatabase();
  if (!database) {
    t.skip('DEFERRED: no LEAD_DATABASE_URL and no local PostgreSQL binaries');
    return;
  }
  const opened = openDatabase(database.url);
  try {
    await migrate(opened.db);
    const store = new PostgresLeadStore(opened.db);
    const app = createApp({ store, authenticator: testAuthenticator(SECRET), addressOf: () => '198.51.100.10' });
    const created = await app.request('/v1/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': 'pg-idem-0001' },
      body: JSON.stringify({
        source: 'www',
        name: "Anna'; drop table lead; --",
        phone: '+48 600 111 222',
        locality: 'Kraków',
        siteAnalysisRequested: false,
      }),
    });
    assert.equal(created.status, 201);
    const lead = await created.json();
    const row = await opened.db.selectFrom('lead').selectAll().where('id', '=', lead.id).executeTakeFirst();
    assert.equal(row?.contact_name, "Anna'; drop table lead; --");
    assert.equal(row?.contact_phone, '+48 600 111 222');
    const listed = await app.request('/v1/leads', { headers: { authorization: `Bearer ${mintTestSession(SECRET, staff)}` } });
    assert.equal(listed.status, 200);
    assert.equal((await listed.json()).items.length, 1);
    const qualified = await app.request(`/v1/leads/${lead.id}/qualify`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'pg-qual-0001',
        authorization: `Bearer ${mintTestSession(SECRET, staff)}`,
      },
      body: JSON.stringify({ capacityHold: false }),
    });
    assert.equal(qualified.status, 200);
    const audit = await opened.db.selectFrom('audit_event').selectAll().where('lead_id', '=', lead.id).where('action', '=', 'lead.qualified').execute();
    assert.equal(audit.length, 1);
    assert.equal(audit[0].actor_id, staff.actorId);
    assert.equal(JSON.stringify(audit[0].metadata).includes('600'), false);
    const outbox = await opened.db.selectFrom('domain_outbox').selectAll().where('lead_id', '=', lead.id).execute();
    assert.equal(outbox.length, 2);
    assert.equal(outbox.every(item => item.published_at === null), true);
    await assert.rejects(() => opened.db.insertInto('lead').values({
      id: 'not-an-opaque-id',
      source: 'www',
      status: 'received',
      contact_name: 'X',
      contact_phone: '123456789',
      contact_email: null,
      locality: null,
      site_analysis_requested: false,
      qualification_result: 'pending',
      qualification_reasons: [],
      created_at: new Date(),
      updated_at: new Date(),
    }).execute());
  } finally {
    await opened.pool.end();
    await database.stop();
  }
});

test('postgresql hardening covers sessions, outbox delivery, rollback and local restore', { timeout: 90_000 }, async t => {
  const database = await ephemeralDatabase();
  if (!database) {
    t.skip('DEFERRED: no LEAD_DATABASE_URL and no local PostgreSQL binaries');
    return;
  }
  const opened = openDatabase(database.url);
  const secret = 'better-auth-secret-value-32-chars-min';
  const origin = 'http://127.0.0.1:3000';
  try {
    await migrate(opened.db);
    const store = new PostgresLeadStore(opened.db);
    const signup = createLeadAuth({ pool: opened.pool, secret, baseURL: origin, trustedOrigins: [origin], allowSignUp: true });
    const createdUser = await signup.handler(new Request(`${origin}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({ email: 'staff@example.invalid', password: 'synthetic-pass-0001', name: 'Staff Test' }),
    }));
    assert.equal(createdUser.status, 200);
    const runtimeAuth = createLeadAuth({ pool: opened.pool, secret, baseURL: origin, trustedOrigins: [origin], allowSignUp: false });
    const blocked = await runtimeAuth.handler(new Request(`${origin}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({ email: 'other@example.invalid', password: 'synthetic-pass-0001', name: 'Other Test' }),
    }));
    assert.ok(blocked.status >= 400);
    const signedIn = await runtimeAuth.handler(new Request(`${origin}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({ email: 'staff@example.invalid', password: 'synthetic-pass-0001' }),
    }));
    assert.equal(signedIn.status, 200);
    const token = signedIn.headers.get('set-auth-token');
    assert.equal(typeof token, 'string');
    const logs = [];
    const app = createApp({
      store,
      logs,
      authenticator: betterAuthAuthenticator({
        lookup: headers => runtimeAuth.lookup(headers),
        loadActor: subject => ensureActor(opened.db, 'better-auth', subject),
        trustedOrigins: [origin],
      }),
      addressOf: () => '198.51.100.50',
      trustedOrigins: [origin],
      ready: async () => {
        try {
          await opened.pool.query('select 1');
          return true;
        } catch {
          return false;
        }
      },
    });
    const cookie = signedIn.headers.get('set-cookie') ?? '';
    const sessionCookie = cookie.split(',').map(item => item.trim()).find(item => item.startsWith('better-auth.session_token='))?.split(';')[0];
    const forged = await app.request('/v1/leads/lmissing000000000001/qualify', {
      method: 'POST',
      headers: {
        cookie: sessionCookie ?? '',
        origin: 'https://evil.example',
        'content-type': 'application/json',
        'idempotency-key': 'csrf-key-0001',
      },
      body: JSON.stringify({ capacityHold: false }),
    });
    assert.equal(forged.status, 403);
    assert.equal((await forged.json()).error.code, 'CSRF_ORIGIN');
    const ungranted = await app.request('/v1/leads', { headers: { authorization: `Bearer ${token}` } });
    assert.equal(ungranted.status, 403);
    const session = await runtimeAuth.lookup(new Headers({ authorization: `Bearer ${token}` }));
    const actor = await ensureActor(opened.db, 'better-auth', session.userId);
    await opened.db.updateTable('identity_principal').set({ client_id: 'admin' }).where('actor_id', '=', actor.actorId).execute();
    await opened.db.insertInto('actor_capability').values([
      { actor_id: actor.actorId, capability: 'leads:read' },
      { actor_id: actor.actorId, capability: 'leads:qualify' },
    ]).execute();
    const listed = await app.request('/v1/leads', { headers: { authorization: `Bearer ${token}` } });
    assert.equal(listed.status, 200);
    assert.equal(JSON.stringify(logs).includes(token), false);
    assert.equal(JSON.stringify(logs).includes('synthetic-pass'), false);
    await opened.pool.query(`update auth.session set "expiresAt" = now() - interval '1 minute'`);
    const expired = await app.request('/v1/leads', { headers: { authorization: `Bearer ${token}` } });
    assert.equal(expired.status, 401);
    const captured = await app.request('/v1/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': 'hard-idem-0001' },
      body: JSON.stringify({ source: 'www', name: 'Celina Testowa', phone: '+48 600 222 333', locality: 'Kraków', siteAnalysisRequested: false }),
    });
    assert.equal(captured.status, 201);
    const lead = await captured.json();
    const again = await app.request('/v1/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': 'hard-idem-0001' },
      body: JSON.stringify({ source: 'www', name: 'Celina Testowa', phone: '+48 600 222 333', locality: 'Kraków', siteAnalysisRequested: false }),
    });
    assert.equal(again.status, 201);
    assert.equal((await again.json()).id, lead.id);
    await assert.rejects(() => store.transaction(async tx => {
      await tx.insertLead({ ...lead, id: 'lrollback000000000001' });
      throw new Error('rollback');
    }));
    assert.equal(await opened.db.selectFrom('lead').select('id').where('id', '=', 'lrollback000000000001').executeTakeFirst(), undefined);
    const delivered = [];
    const now = new Date('2026-09-21T12:00:00.000Z');
    const firstDispatch = await dispatchOutbox(opened.db, {
      async deliver(message) { delivered.push(message.id); },
    }, { limit: 10, maxAttempts: 2, leaseMs: 30_000, now });
    assert.equal(firstDispatch.published >= 1, true);
    assert.equal(delivered.length, firstDispatch.published);
    const pending = await opened.db.selectFrom('domain_outbox').select(['id']).where('delivery_status', '=', 'pending').execute();
    assert.equal(pending.length, 0);
    await opened.db.updateTable('domain_outbox').set({ delivery_status: 'pending', published_at: null, attempts: 0, next_attempt_at: null, claimed_at: null }).where('lead_id', '=', lead.id).execute();
    const failed = await dispatchOutbox(opened.db, {
      async deliver() { throw new Error('phone +48 600 222 333'); },
    }, { limit: 10, maxAttempts: 2, leaseMs: 30_000, now });
    assert.equal(failed.retried >= 1, true);
    const retryRow = await opened.db.selectFrom('domain_outbox').select(['last_error', 'next_attempt_at']).where('lead_id', '=', lead.id).executeTakeFirst();
    assert.equal(retryRow.last_error, 'DELIVERY_FAILED');
    assert.equal(JSON.stringify(retryRow).includes('600'), false);
    await opened.db.updateTable('domain_outbox').set({ next_attempt_at: new Date('2026-09-21T12:00:00.000Z') }).where('lead_id', '=', lead.id).execute();
    const poison = await dispatchOutbox(opened.db, {
      async deliver() { throw new Error('still failing'); },
    }, { limit: 10, maxAttempts: 2, leaseMs: 30_000, now: new Date('2026-09-21T12:05:00.000Z') });
    assert.equal(poison.poisoned >= 1, true);
    const kept = await opened.db.selectFrom('domain_outbox').select('id').where('lead_id', '=', lead.id).where('delivery_status', '=', 'poison').execute();
    assert.equal(kept.length >= 1, true);
    await opened.db.insertInto('domain_outbox').values({
      id: 'orace0000000000000001',
      event_type: 'lead.captured',
      lead_id: lead.id,
      payload: { leadId: lead.id, status: 'received', source: 'www' },
      created_at: now,
      published_at: null,
      attempts: 0,
      next_attempt_at: null,
      claimed_at: null,
      claim_token: null,
      last_error: null,
      delivery_status: 'pending',
    }).execute();
    let raced = 0;
    const pair = await Promise.all([
      dispatchOutbox(opened.db, { async deliver() { raced += 1; } }, { limit: 5, maxAttempts: 5, leaseMs: 30_000, now }),
      dispatchOutbox(opened.db, { async deliver() { raced += 1; } }, { limit: 5, maxAttempts: 5, leaseMs: 30_000, now }),
    ]);
    assert.equal(pair[0].published + pair[1].published, 1);
    assert.equal(raced, 1);
    const ready = await app.request('/v1/ready');
    assert.equal(ready.status, 200);
    const health = await app.request('/v1/health');
    assert.deepEqual(await health.json(), { ok: true });
    if (database.owned && database.exe && database.port) {
      const file = path.join(tmpdir(), `fz-lead-${database.port}.dump`);
      await run(database.exe('pg_dump'), ['-h', '127.0.0.1', '-p', String(database.port), '-U', 'forma', '-d', 'postgres', '-Fc', '-f', file]);
      await run(database.exe('psql'), ['-h', '127.0.0.1', '-p', String(database.port), '-U', 'forma', '-d', 'postgres', '-c', 'CREATE DATABASE forma_restore']);
      await run(database.exe('pg_restore'), ['-h', '127.0.0.1', '-p', String(database.port), '-U', 'forma', '-d', 'forma_restore', '--no-owner', file]);
      const restored = openDatabase(`postgres://forma@127.0.0.1:${database.port}/forma_restore`);
      const names = await restored.db.selectFrom('lead').select('contact_name').execute();
      assert.equal(names.some(row => row.contact_name === 'Celina Testowa'), true);
      const audits = await restored.db.selectFrom('audit_event').select('id').execute();
      const outbox = await restored.db.selectFrom('domain_outbox').select('id').execute();
      assert.equal(audits.length >= 1, true);
      assert.equal(outbox.length >= 1, true);
      await restored.pool.end();
      await run(database.exe('psql'), ['-h', '127.0.0.1', '-p', String(database.port), '-U', 'forma', '-d', 'postgres', '-c', 'DROP DATABASE forma_restore']);
      await rm(file, { force: true });
    }
  } finally {
    await opened.pool.end();
    await database.stop();
  }
});

test('postgresql staff logout invalidates lead list, get and qualify sessions', { timeout: 90_000 }, async t => {
  const database = await ephemeralDatabase();
  if (!database) {
    t.skip('DEFERRED: no LEAD_DATABASE_URL and no local PostgreSQL binaries');
    return;
  }
  const opened = openDatabase(database.url);
  const secret = 'better-auth-secret-value-32-chars-min';
  const origin = 'http://127.0.0.1:3000';
  try {
    await migrate(opened.db);
    const store = new PostgresLeadStore(opened.db);
    const signup = createLeadAuth({ pool: opened.pool, secret, baseURL: origin, trustedOrigins: [origin], allowSignUp: true });
    const createdUser = await signup.handler(new Request(`${origin}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({ email: 'logout@example.invalid', password: 'synthetic-pass-0002', name: 'Logout Staff' }),
    }));
    assert.equal(createdUser.status, 200);
    const runtimeAuth = createLeadAuth({ pool: opened.pool, secret, baseURL: origin, trustedOrigins: [origin], allowSignUp: false });
    const signedIn = await runtimeAuth.handler(new Request(`${origin}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({ email: 'logout@example.invalid', password: 'synthetic-pass-0002' }),
    }));
    assert.equal(signedIn.status, 200);
    const token = signedIn.headers.get('set-auth-token');
    assert.equal(typeof token, 'string');
    const cookie = signedIn.headers.get('set-cookie') ?? '';
    const sessionCookie = cookie.split(',').map(item => item.trim()).find(item => item.startsWith('better-auth.session_token='))?.split(';')[0];
    assert.ok(sessionCookie);
    const logs = [];
    const app = createApp({
      store,
      logs,
      authenticator: betterAuthAuthenticator({
        lookup: headers => runtimeAuth.lookup(headers),
        loadActor: subject => ensureActor(opened.db, 'better-auth', subject),
        trustedOrigins: [origin],
      }),
      authHandler: request => runtimeAuth.handler(request),
      addressOf: () => '198.51.100.51',
      trustedOrigins: [origin],
    });
    const session = await runtimeAuth.lookup(new Headers({ authorization: `Bearer ${token}` }));
    const actor = await ensureActor(opened.db, 'better-auth', session.userId);
    await opened.db.updateTable('identity_principal').set({ client_id: 'admin' }).where('actor_id', '=', actor.actorId).execute();
    await opened.db.insertInto('actor_capability').values([
      { actor_id: actor.actorId, capability: 'leads:read' },
      { actor_id: actor.actorId, capability: 'leads:qualify' },
    ]).execute();
    const captured = await app.request('/v1/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': 'logout-lead-0001' },
      body: JSON.stringify({
        source: 'www',
        name: 'Dana Testowa',
        phone: '+48 600 333 444',
        locality: 'Kraków',
        siteAnalysisRequested: false,
      }),
    });
    assert.equal(captured.status, 201);
    const lead = await captured.json();
    const before = await app.request('/v1/leads', { headers: { authorization: `Bearer ${token}` } });
    assert.equal(before.status, 200);
    const signedOut = await app.request('/api/auth/sign-out', {
      method: 'POST',
      headers: {
        cookie: sessionCookie,
        origin,
        'content-type': 'application/json',
      },
      body: '{}',
    });
    assert.ok(signedOut.status >= 200 && signedOut.status < 300);
    const listed = await app.request('/v1/leads', { headers: { authorization: `Bearer ${token}` } });
    assert.equal(listed.status, 401);
    const got = await app.request(`/v1/leads/${lead.id}`, { headers: { authorization: `Bearer ${token}` } });
    assert.equal(got.status, 401);
    const qualify = await app.request(`/v1/leads/${lead.id}/qualify`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'idempotency-key': 'logout-qual-0001',
      },
      body: JSON.stringify({ capacityHold: false }),
    });
    assert.equal(qualify.status, 401);
    const cookieAfter = await app.request('/v1/leads', {
      headers: { cookie: sessionCookie, origin },
    });
    assert.equal(cookieAfter.status, 401);
    assert.equal(JSON.stringify(logs).includes(token), false);
    assert.equal(JSON.stringify(logs).includes('synthetic-pass'), false);
    assert.equal(JSON.stringify(logs).includes('session_token'), false);
  } finally {
    await opened.pool.end();
    await database.stop();
  }
});
