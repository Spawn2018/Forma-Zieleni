import test from 'node:test';
import assert from 'node:assert/strict';
import { failClosedAuthenticator, mintTestSession, testAuthenticator } from './auth.ts';
import { createApp } from './app.ts';
import { PersistenceFailure } from './errors.ts';
import { MemoryLeadStore } from './memory-store.ts';
import { WindowLimiter } from './rate-limit.ts';

const SECRET = 'test-secret-value';
const PHONE = '+48 600 111 222';
const NAME = 'Anna Testowa';

const staff = {
  actorId: 'actor_staff_ana',
  issuer: 'test-issuer',
  sub: 'staff-ana',
  clientId: 'admin',
  capabilities: ['leads:read', 'leads:qualify'],
};

const portal = {
  actorId: 'actor_portal_ola',
  issuer: 'test-issuer',
  sub: 'portal-ola',
  clientId: 'portal',
  capabilities: [],
};

function appFor(store = new MemoryLeadStore(), logs = [], limit = 100) {
  let tick = 0;
  return {
    store,
    logs,
    app: createApp({
      store,
      authenticator: testAuthenticator(SECRET),
      logs,
      limiter: new WindowLimiter(limit, 60_000),
      now: () => new Date(Date.UTC(2026, 8, 21, 12, 0, tick++)).toISOString(),
    }),
  };
}

function json(body, headers = {}) {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': 'idem-key-01', ...headers },
    body: JSON.stringify(body),
  };
}

const capture = {
  source: 'www',
  name: NAME,
  phone: PHONE,
  email: 'anna@example.invalid',
  locality: 'Kraków',
  siteAnalysisRequested: false,
};

function bearer(actor) {
  return { authorization: `Bearer ${mintTestSession(SECRET, actor)}` };
}

test('public capture persists a lead and rejects bad bodies, types, sources and size', async () => {
  const { app, store } = appFor();
  const created = await app.request('/v1/leads', json(capture));
  assert.equal(created.status, 201);
  const lead = await created.json();
  assert.equal(lead.source, 'www');
  assert.equal(lead.status, 'received');
  assert.equal(lead.contact.phone, PHONE);
  assert.equal(lead.qualification.result, 'pending');
  assert.match(lead.id, /^[a-z][a-z0-9]{15,63}$/);
  const saved = await store.transaction(tx => tx.findLead(lead.id));
  assert.deepEqual(saved, lead);
  const outbox = store.state.outbox;
  assert.equal(outbox.length, 1);
  assert.equal(JSON.stringify(outbox[0].payload).includes(PHONE), false);
  assert.equal(JSON.stringify(store.state.audits).includes(NAME), false);

  const malformed = await app.request('/v1/leads', { method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': 'idem-key-02' }, body: '{' });
  assert.equal(malformed.status, 400);
  const wrongType = await app.request('/v1/leads', json({ ...capture, phone: 600111222, name: { given: NAME } }, { 'idempotency-key': 'idem-key-03' }));
  assert.equal(wrongType.status, 400);
  assert.equal((await wrongType.json()).error.details[0].reason, 'STRING_REQUIRED');
  const missing = await app.request('/v1/leads', json({ source: 'www' }, { 'idempotency-key': 'idem-key-04' }));
  assert.equal(missing.status, 400);
  const spoof = await app.request('/v1/leads', json({ ...capture, source: 'admin' }, { 'idempotency-key': 'idem-key-05' }));
  assert.equal(spoof.status, 400);
  assert.equal((await spoof.json()).error.details[0].reason, 'LEAD_SOURCE_INVALID');
  const extra = await app.request('/v1/leads', json({ ...capture, budget_min_pln: 10 }, { 'idempotency-key': 'idem-key-06' }));
  assert.equal(extra.status, 400);
  const text = await app.request('/v1/leads', { method: 'POST', headers: { 'content-type': 'text/plain', 'idempotency-key': 'idem-key-07' }, body: 'nope' });
  assert.equal(text.status, 400);
  const oversized = await app.request('/v1/leads', json({ ...capture, name: 'A'.repeat(9000) }, { 'idempotency-key': 'idem-key-08', 'content-length': '9000' }));
  assert.equal(oversized.status, 400);
  assert.equal((await oversized.json()).error.code, 'BODY_TOO_LARGE');
  const streamed = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{"source":"www","name":"'));
      controller.enqueue(new Uint8Array(9000));
      controller.close();
    },
  });
  const uncapped = await app.request('/v1/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': 'idem-key-09' },
    body: streamed,
    duplex: 'half',
  });
  assert.equal(uncapped.status, 400);
  assert.equal((await uncapped.json()).error.code, 'BODY_TOO_LARGE');
});

test('idempotency replays the same lead and conflicts when the body changes', async () => {
  const { app } = appFor();
  const first = await app.request('/v1/leads', json(capture, { 'idempotency-key': 'idem-same-1' }));
  const second = await app.request('/v1/leads', json(capture, { 'idempotency-key': 'idem-same-1' }));
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  assert.equal((await second.json()).id, (await first.json()).id);
  const conflict = await app.request('/v1/leads', json({ ...capture, locality: 'Gdańsk' }, { 'idempotency-key': 'idem-same-1' }));
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).error.code, 'IDEMPOTENCY_CONFLICT');
});

test('anonymous and portal actors cannot list, get or qualify; staff can', async () => {
  const { app } = appFor();
  const created = await app.request('/v1/leads', json({ ...capture, locality: 'Kraków', siteAnalysisRequested: true }));
  const lead = await created.json();
  for (const path of ['/v1/leads', `/v1/leads/${lead.id}`]) {
    assert.equal((await app.request(path)).status, 401);
    assert.equal((await app.request(path, { headers: bearer(portal) })).status, 403);
  }
  const qualifyPath = `/v1/leads/${lead.id}/qualify`;
  assert.equal((await app.request(qualifyPath, json({ capacityHold: false }, { 'idempotency-key': 'qual-anon-1' }))).status, 401);
  assert.equal((await app.request(qualifyPath, json({ capacityHold: false }, { 'idempotency-key': 'qual-port-1', ...bearer(portal) }))).status, 403);
  const listed = await app.request('/v1/leads?limit=10', { headers: bearer(staff) });
  assert.equal(listed.status, 200);
  assert.equal((await listed.json()).items[0].id, lead.id);
  const got = await app.request(`/v1/leads/${lead.id}`, { headers: bearer(staff) });
  assert.equal(got.status, 200);
  const missing = await app.request('/v1/leads/lmissinglead00000', { headers: bearer(staff) });
  assert.equal(missing.status, 404);
  const forged = await app.request('/v1/leads', { headers: { authorization: 'Bearer {"capabilities":["leads:read"]}' } });
  assert.equal(forged.status, 401);
});

test('qualification uses domain rules, records one audit, and keeps idempotency', async () => {
  const { app, store } = appFor();
  const created = await (await app.request('/v1/leads', json(capture))).json();
  const qualified = await app.request(`/v1/leads/${created.id}/qualify`, json({ capacityHold: false }, { 'idempotency-key': 'qual-ok-0001', ...bearer(staff) }));
  assert.equal(qualified.status, 200);
  const body = await qualified.json();
  assert.equal(body.status, 'qualified');
  assert.equal(body.qualification.result, 'qualified');
  assert.deepEqual(body.qualification.reasons, ['ready_for_consultation']);
  const again = await app.request(`/v1/leads/${created.id}/qualify`, json({ capacityHold: false }, { 'idempotency-key': 'qual-ok-0001', ...bearer(staff) }));
  assert.equal((await again.json()).updatedAt, body.updatedAt);
  assert.equal(store.state.audits.filter(event => event.action === 'lead.qualified').length, 1);
  assert.equal(store.state.audits.find(event => event.action === 'lead.qualified')?.actorId, staff.actorId);
  const conflict = await app.request(`/v1/leads/${created.id}/qualify`, json({ capacityHold: true }, { 'idempotency-key': 'qual-ok-0001', ...bearer(staff) }));
  assert.equal(conflict.status, 409);
  const invalid = await app.request(`/v1/leads/${created.id}/qualify`, json({ capacityHold: 'yes' }, { 'idempotency-key': 'qual-bad-0001', ...bearer(staff) }));
  assert.equal(invalid.status, 400);
  const absent = await app.request('/v1/leads/lmissinglead00000/qualify', json({ capacityHold: true }, { 'idempotency-key': 'qual-miss-001', ...bearer(staff) }));
  assert.equal(absent.status, 404);
  const hold = await app.request('/v1/leads', json({ ...capture, locality: undefined, name: 'Beata Testowa', phone: '+48 600 111 333' }, { 'idempotency-key': 'idem-hold-01' }));
  const heldLead = await hold.json();
  const reviewed = await app.request(`/v1/leads/${heldLead.id}/qualify`, json({ capacityHold: true }, { 'idempotency-key': 'qual-hold-001', ...bearer(staff) }));
  assert.equal((await reviewed.json()).qualification.result, 'needs_review');
});

test('logs carry the request id and omit contact fields, tokens and payloads', async () => {
  const logs = [];
  const { app } = appFor(new MemoryLeadStore(), logs);
  const token = mintTestSession(SECRET, staff);
  const response = await app.request('/v1/leads', json(capture, { 'x-request-id': 'req-fixed-01', authorization: `Bearer ${token}` }));
  assert.equal(response.headers.get('x-request-id'), 'req-fixed-01');
  assert.equal(response.status, 201);
  const line = JSON.stringify(logs);
  assert.match(line, /req-fixed-01/);
  assert.equal(line.includes(PHONE), false);
  assert.equal(line.includes(NAME), false);
  assert.equal(line.includes('anna@example.invalid'), false);
  assert.equal(line.includes(token), false);
  assert.equal(line.includes('Bearer'), false);
  assert.equal(logs[0].path, '/v1/leads');
});

test('production authenticator rejects every CRM call', async () => {
  const app = createApp({ store: new MemoryLeadStore(), authenticator: failClosedAuthenticator() });
  const denied = await app.request('/v1/leads', { headers: bearer(staff) });
  assert.equal(denied.status, 401);
  const health = await app.request('/v1/health');
  assert.deepEqual(await health.json(), { ok: true });
});

test('database failure stays a safe 503', async () => {
  const broken = {
    async transaction(_run) {
      throw new PersistenceFailure();
    },
  };
  const app = createApp({ store: broken, authenticator: testAuthenticator(SECRET) });
  const response = await app.request('/v1/leads', json(capture));
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.error.code, 'PERSISTENCE_UNAVAILABLE');
  assert.equal(JSON.stringify(body).toLowerCase().includes('select'), false);
});

test('rate limit is enforced on public capture', async () => {
  const { app } = appFor(new MemoryLeadStore(), [], 2);
  assert.equal((await app.request('/v1/leads', json(capture, { 'idempotency-key': 'rate-key-001' }))).status, 201);
  assert.equal((await app.request('/v1/leads', json({ ...capture, name: 'Beata Testowa' }, { 'idempotency-key': 'rate-key-002' }))).status, 201);
  const limited = await app.request('/v1/leads', json(capture, { 'idempotency-key': 'rate-key-003' }));
  assert.equal(limited.status, 429);
});

test('staff list paginates with the contract cursor', async () => {
  const { app } = appFor();
  await app.request('/v1/leads', json(capture, { 'idempotency-key': 'page-key-0001' }));
  await app.request('/v1/leads', json({ ...capture, name: 'Beata Testowa', phone: '+48 600 111 333' }, { 'idempotency-key': 'page-key-0002' }));
  const first = await app.request('/v1/leads?limit=1&sort=-createdAt', { headers: bearer(staff) });
  const page = await first.json();
  assert.equal(page.items.length, 1);
  assert.equal(page.items[0].contact.name, 'Beata Testowa');
  assert.equal(typeof page.meta.nextCursor, 'string');
  const second = await app.request(`/v1/leads?limit=1&sort=-createdAt&cursor=${page.meta.nextCursor}`, { headers: bearer(staff) });
  const rest = await second.json();
  assert.equal(rest.items[0].contact.name, NAME);
  assert.equal(rest.meta.nextCursor, null);
});
