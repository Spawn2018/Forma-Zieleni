import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { mintTestSession, testAuthenticator } from './auth.ts';
import { createApp } from './app.ts';
import { migrate, openDatabase } from './db.ts';
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
  if (process.env.LEAD_DATABASE_URL) return { url: process.env.LEAD_DATABASE_URL, stop: async () => {} };
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
    const app = createApp({ store, authenticator: testAuthenticator(SECRET) });
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
