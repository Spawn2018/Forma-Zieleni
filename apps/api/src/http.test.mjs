import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
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
  capabilities: ['leads:read', 'leads:qualify', 'opportunities:read', 'opportunities:create', 'offers:read', 'offers:create', 'contracts:read', 'contracts:create', 'contracts:lifecycle', 'projects:read', 'projects:create', 'files:read', 'files:create', 'milestones:read', 'milestones:create', 'payments:read', 'payments:write', 'gardens:read', 'gardens:create', 'siteintel:read', 'siteintel:create', 'capacity:read', 'capacity:write', 'semantic:review'],
};

const portal = {
  actorId: 'actor_portal_ola',
  issuer: 'test-issuer',
  sub: 'portal-ola',
  clientId: 'portal',
  capabilities: ['offers:portal-read', 'contracts:portal-read', 'projects:portal-read', 'files:portal-read', 'gardens:portal-read', 'siteintel:portal-read', 'milestones:portal-read'],
};

const portalOther = {
  actorId: 'actor_portal_other',
  issuer: 'test-issuer',
  sub: 'portal-other',
  clientId: 'portal',
  capabilities: ['offers:portal-read', 'contracts:portal-read', 'projects:portal-read', 'files:portal-read', 'gardens:portal-read', 'siteintel:portal-read', 'milestones:portal-read'],
};

function appFor(store = new MemoryLeadStore(), logs = [], limit = 100, sandboxWebhookSecret, signingSandboxSecret) {
  let tick = 0;
  return {
    store,
    logs,
    app: createApp({
      store,
      authenticator: testAuthenticator(SECRET),
      logs,
      limiter: new WindowLimiter(limit, 60_000),
      addressOf: () => '198.51.100.10',
      now: () => new Date(Date.UTC(2026, 8, 21, 12, 0, tick++)).toISOString(),
      ...(sandboxWebhookSecret ? { sandboxWebhookSecret } : {}),
      ...(signingSandboxSecret ? { signingSandboxSecret } : {}),
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

const draftId = 'ct8k2n4p6q8r0s2t';
const publicId = 'pu8k2n4p6q8r0s2t';

test('unpublished content stays private and a content role does not grant CRM access', async () => {
  const documents = {
    [draftId]: { title: 'Szkic usługi', status: 'draft' },
    [publicId]: { title: 'Usługa opublikowana', status: 'published' },
  };
  const app = createApp({
    store: new MemoryLeadStore(),
    authenticator: testAuthenticator(SECRET),
    logs: [],
    limiter: new WindowLimiter(100, 60_000),
    addressOf: () => '198.51.100.10',
    contentDocuments: documents,
  });
  const anonymous = await app.request(`/v1/content/${draftId}`);
  assert.equal(anonymous.status, 401);
  const staffDenied = await app.request(`/v1/content/${draftId}`, { headers: bearer(staff) });
  assert.equal(staffDenied.status, 403);
  const editor = {
    actorId: 'actoreditor000001',
    issuer: 'test-issuer',
    sub: 'editor-1',
    clientId: 'admin',
    capabilities: ['content:read-draft'],
  };
  const allowed = await app.request(`/v1/content/${draftId}`, { headers: bearer(editor) });
  assert.equal(allowed.status, 200);
  assert.equal((await allowed.json()).status, 'draft');
  assert.equal(allowed.headers.get('cache-control'), 'private, no-store');
  const published = await app.request(`/v1/content/${publicId}`);
  assert.equal(published.status, 200);
  assert.equal(published.headers.get('cache-control'), null);
  const supplied = await app.request(`/v1/content/${draftId}?role=admin`);
  assert.equal(supplied.status, 400);
  const leads = await app.request('/v1/leads', { headers: bearer(editor) });
  assert.equal(leads.status, 403);
});

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

test('portal session returns identity only and refuses anonymous callers', async () => {
  const { app } = appFor();
  assert.equal((await app.request('/v1/portal/session')).status, 401);
  const portalSession = await app.request('/v1/portal/session', { headers: bearer(portal) });
  assert.equal(portalSession.status, 200);
  const portalBody = await portalSession.json();
  assert.deepEqual(portalBody, { authenticated: true, clientId: 'portal' });
  assert.equal(Object.hasOwn(portalBody, 'offers'), false);
  assert.equal(Object.hasOwn(portalBody, 'projects'), false);
  const staffSession = await app.request('/v1/portal/session', { headers: bearer(staff) });
  assert.equal(staffSession.status, 200);
  assert.equal((await staffSession.json()).clientId, 'admin');
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
  const response = await app.request('/v1/leads', json(capture, {
    'x-request-id': 'req-fixed-01',
    authorization: `Bearer ${token}`,
    cookie: 'better-auth.session_token=sekret-cookie-value',
  }));
  assert.equal(response.headers.get('x-request-id'), 'req-fixed-01');
  assert.equal(response.status, 201);
  const line = JSON.stringify(logs);
  assert.match(line, /req-fixed-01/);
  assert.equal(line.includes(PHONE), false);
  assert.equal(line.includes(NAME), false);
  assert.equal(line.includes('anna@example.invalid'), false);
  assert.equal(line.includes(token), false);
  assert.equal(line.includes('Bearer'), false);
  assert.equal(line.includes('session_token'), false);
  assert.equal(line.includes('sekret-cookie-value'), false);
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
  const app = createApp({ store: broken, authenticator: testAuthenticator(SECRET), addressOf: () => '198.51.100.20' });
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

test('authorization does not reveal leads before the capability check', async () => {
  const { app } = appFor();
  const created = await app.request('/v1/leads', json(capture, { 'idempotency-key': 'enum-key-0001' }));
  const lead = await created.json();
  const reader = { ...staff, capabilities: ['leads:read'] };
  assert.equal((await app.request(`/v1/leads/${lead.id}`)).status, 401);
  assert.equal((await app.request(`/v1/leads/${lead.id}`, { headers: bearer(portal) })).status, 403);
  assert.equal((await app.request('/v1/leads/missinglead0000000', { headers: bearer(portal) })).status, 403);
  assert.equal((await app.request(`/v1/leads/${lead.id}`, { headers: bearer(reader) })).status, 200);
  assert.equal((await app.request('/v1/leads/missinglead0000000', { headers: bearer(reader) })).status, 404);
  const qualify = await app.request(`/v1/leads/${lead.id}/qualify`, json({ capacityHold: false }, { ...bearer(reader), 'idempotency-key': 'enum-qual-0001' }));
  assert.equal(qualify.status, 403);
});

test('spoofed forwarding does not open a new capture bucket', async () => {
  const app = createApp({
    store: new MemoryLeadStore(),
    authenticator: testAuthenticator(SECRET),
    limiter: new WindowLimiter(1, 60_000),
    addressOf: () => '127.0.0.1',
  });
  const first = await app.request('/v1/leads', json(capture, { 'idempotency-key': 'spoof-key-001', 'x-forwarded-for': '203.0.113.8' }));
  const second = await app.request('/v1/leads', json(capture, { 'idempotency-key': 'spoof-key-002', 'x-forwarded-for': '203.0.113.9' }));
  assert.equal(first.status, 201);
  assert.equal(second.status, 429);
});

test('a trusted proxy uses the appended client address', async () => {
  const app = createApp({
    store: new MemoryLeadStore(),
    authenticator: testAuthenticator(SECRET),
    limiter: new WindowLimiter(1, 60_000),
    addressOf: () => '127.0.0.1',
    trustProxy: true,
    trustedPeers: ['127.0.0.1'],
  });
  const left = await app.request('/v1/leads', json(capture, { 'idempotency-key': 'proxy-key-001', 'x-forwarded-for': '198.51.100.8, 203.0.113.4' }));
  const right = await app.request('/v1/leads', json({ ...capture, name: 'Beata Testowa' }, { 'idempotency-key': 'proxy-key-002', 'x-forwarded-for': '198.51.100.8, 203.0.113.5' }));
  assert.equal(left.status, 201);
  assert.equal(right.status, 201);
});

test('readiness is separate from liveness', async () => {
  const app = createApp({
    store: new MemoryLeadStore(),
    authenticator: testAuthenticator(SECRET),
    ready: async () => false,
  });
  assert.deepEqual(await (await app.request('/v1/health')).json(), { ok: true });
  const ready = await app.request('/v1/ready');
  assert.equal(ready.status, 503);
  assert.equal((await ready.json()).error.code, 'NOT_READY');
});

test('cors allows only configured origins', async () => {
  const app = createApp({
    store: new MemoryLeadStore(),
    authenticator: testAuthenticator(SECRET),
    trustedOrigins: ['http://127.0.0.1:3000'],
    addressOf: () => '198.51.100.40',
  });
  const allowed = await app.request('/v1/health', { headers: { origin: 'http://127.0.0.1:3000' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://127.0.0.1:3000');
  const denied = await app.request('/v1/health', { headers: { origin: 'https://evil.example' } });
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
  const preflight = await app.request('/v1/leads', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } });
  assert.equal(preflight.status, 403);
});

test('a marketing plan route compiles a synthetic plan and cannot authorize spend', async () => {
  const { app } = appFor();
  const planner = {
    actorId: 'actor_growth_plan',
    issuer: 'test-issuer',
    sub: 'growth-plan',
    clientId: 'admin',
    capabilities: ['growth:plan'],
  };
  const anonymous = await app.request('/v1/growth/plans', json({ goal: 'Wiecej kwalifikowanych rozmow', budgetPln: 8000, horizonDays: 90 }));
  assert.equal(anonymous.status, 401);
  const crm = await app.request('/v1/growth/plans', json({ goal: 'Wiecej kwalifikowanych rozmow', budgetPln: 8000, horizonDays: 90 }, bearer(staff)));
  assert.equal(crm.status, 403);
  const denied = await app.request('/v1/growth/plans', json({ goal: 'Wiecej kwalifikowanych rozmow', budgetPln: 8000, horizonDays: 90, spend: true }, bearer(planner)));
  assert.equal(denied.status, 400);
  const created = await app.request('/v1/growth/plans', json({ goal: 'Wiecej kwalifikowanych rozmow', budgetPln: 8000, horizonDays: 90 }, bearer(planner)));
  assert.equal(created.status, 201);
  const plan = await created.json();
  assert.equal(plan.synthetic, true);
  assert.equal(plan.authorizesSpend, false);
  assert.equal(plan.authorizesPublication, false);
  assert.equal(plan.simulator.status, 'NOT_ENOUGH_DATA');
  assert.ok(plan.articleCount >= 1);
});

async function captureAndQualify(app) {
  const created = await app.request('/v1/leads', json({
    source: 'www',
    name: NAME,
    phone: PHONE,
    locality: 'Kraków',
    siteAnalysisRequested: true,
  }, { 'idempotency-key': `lead-${Math.random().toString(36).slice(2, 10)}` }));
  assert.equal(created.status, 201);
  const lead = await created.json();
  const qualified = await app.request(`/v1/leads/${lead.id}/qualify`, json({ capacityHold: false }, {
    'idempotency-key': `qual-${Math.random().toString(36).slice(2, 10)}`,
    ...bearer(staff),
  }));
  assert.equal(qualified.status, 200);
  return qualified.json();
}

test('anonymous and portal actors cannot create, list or get opportunities; staff can', async () => {
  const { app } = appFor();
  const lead = await captureAndQualify(app);
  const createPath = '/v1/opportunities';
  assert.equal((await app.request(createPath, json({ leadId: lead.id }))).status, 401);
  assert.equal((await app.request(createPath, json({ leadId: lead.id }, bearer(portal)))).status, 403);
  assert.equal((await app.request('/v1/opportunities', { headers: bearer(portal) })).status, 403);
  const created = await app.request(createPath, json({ leadId: lead.id }, {
    'idempotency-key': 'opp-create-1',
    ...bearer(staff),
  }));
  assert.equal(created.status, 201);
  const opportunity = await created.json();
  assert.equal(opportunity.status, 'open');
  assert.equal(opportunity.leadId, lead.id);
  assert.equal(Object.hasOwn(opportunity, 'price'), false);
  const listed = await app.request('/v1/opportunities', { headers: bearer(staff) });
  assert.equal(listed.status, 200);
  const page = await listed.json();
  assert.equal(page.items.length, 1);
  const got = await app.request(`/v1/opportunities/${opportunity.id}`, { headers: bearer(staff) });
  assert.equal(got.status, 200);
  assert.equal((await app.request(`/v1/opportunities/${opportunity.id}`, { headers: bearer(portal) })).status, 403);
  assert.equal((await app.request('/v1/opportunities/missingopp00000000', { headers: bearer(portal) })).status, 403);
  assert.equal((await app.request('/v1/opportunities/missingopp00000000', { headers: bearer(staff) })).status, 404);
});

test('opportunity create rejects unqualified leads, duplicate leads and client status', async () => {
  const { app } = appFor();
  const captured = await app.request('/v1/leads', json({
    source: 'www',
    name: NAME,
    phone: PHONE,
    locality: 'Kraków',
    siteAnalysisRequested: false,
  }, { 'idempotency-key': 'opp-unqual-lead' }));
  assert.equal(captured.status, 201);
  const lead = await captured.json();
  const unqual = await app.request('/v1/opportunities', json({ leadId: lead.id }, {
    'idempotency-key': 'opp-unqual-1',
    ...bearer(staff),
  }));
  assert.equal(unqual.status, 409);
  const qualified = await captureAndQualify(app);
  const withStatus = await app.request('/v1/opportunities', json({ leadId: qualified.id, status: 'open' }, {
    'idempotency-key': 'opp-status-1',
    ...bearer(staff),
  }));
  assert.equal(withStatus.status, 400);
  const first = await app.request('/v1/opportunities', json({ leadId: qualified.id }, {
    'idempotency-key': 'opp-dup-1',
    ...bearer(staff),
  }));
  assert.equal(first.status, 201);
  const second = await app.request('/v1/opportunities', json({ leadId: qualified.id }, {
    'idempotency-key': 'opp-dup-2',
    ...bearer(staff),
  }));
  assert.equal(second.status, 409);
});

test('anonymous and portal actors cannot create, list or get offers; staff can', async () => {
  const { app } = appFor();
  const lead = await captureAndQualify(app);
  const opportunityCreated = await app.request('/v1/opportunities', json({ leadId: lead.id }, {
    'idempotency-key': 'offer-opp-1',
    ...bearer(staff),
  }));
  assert.equal(opportunityCreated.status, 201);
  const opportunity = await opportunityCreated.json();
  const createPath = '/v1/offers';
  assert.equal((await app.request(createPath, json({ opportunityId: opportunity.id }))).status, 401);
  assert.equal((await app.request(createPath, json({ opportunityId: opportunity.id }, bearer(portal)))).status, 403);
  assert.equal((await app.request('/v1/offers', { headers: bearer(portal) })).status, 403);
  const created = await app.request(createPath, json({ opportunityId: opportunity.id }, {
    'idempotency-key': 'offer-create-1',
    ...bearer(staff),
  }));
  assert.equal(created.status, 201);
  const offer = await created.json();
  assert.equal(offer.status, 'draft');
  assert.equal(offer.opportunityId, opportunity.id);
  assert.equal(Object.hasOwn(offer, 'price'), false);
  const listed = await app.request('/v1/offers', { headers: bearer(staff) });
  assert.equal(listed.status, 200);
  const page = await listed.json();
  assert.equal(page.items.length, 1);
  const got = await app.request(`/v1/offers/${offer.id}`, { headers: bearer(staff) });
  assert.equal(got.status, 200);
  assert.equal((await app.request(`/v1/offers/${offer.id}`, { headers: bearer(portal) })).status, 403);
  assert.equal((await app.request('/v1/offers/missingoffer0000000', { headers: bearer(portal) })).status, 403);
  assert.equal((await app.request('/v1/offers/missingoffer0000000', { headers: bearer(staff) })).status, 404);
});

test('offer create rejects missing opportunity, duplicate opportunity and client commercial fields', async () => {
  const { app } = appFor();
  const missing = await app.request('/v1/offers', json({ opportunityId: 'p9k2n4p6q8r0s2t4' }, {
    'idempotency-key': 'offer-missing-1',
    ...bearer(staff),
  }));
  assert.equal(missing.status, 404);
  const lead = await captureAndQualify(app);
  const opportunityCreated = await app.request('/v1/opportunities', json({ leadId: lead.id }, {
    'idempotency-key': 'offer-opp-2',
    ...bearer(staff),
  }));
  assert.equal(opportunityCreated.status, 201);
  const opportunity = await opportunityCreated.json();
  const withPrice = await app.request('/v1/offers', json({ opportunityId: opportunity.id, price: 1000 }, {
    'idempotency-key': 'offer-price-1',
    ...bearer(staff),
  }));
  assert.equal(withPrice.status, 400);
  const first = await app.request('/v1/offers', json({ opportunityId: opportunity.id }, {
    'idempotency-key': 'offer-dup-1',
    ...bearer(staff),
  }));
  assert.equal(first.status, 201);
  const second = await app.request('/v1/offers', json({ opportunityId: opportunity.id }, {
    'idempotency-key': 'offer-dup-2',
    ...bearer(staff),
  }));
  assert.equal(second.status, 409);
});

test('anonymous and portal actors cannot create, list or get contracts; staff can', async () => {
  const { app } = appFor();
  const lead = await captureAndQualify(app);
  const opportunityCreated = await app.request('/v1/opportunities', json({ leadId: lead.id }, {
    'idempotency-key': 'ctr-opp-1',
    ...bearer(staff),
  }));
  const opportunity = await opportunityCreated.json();
  const offerCreated = await app.request('/v1/offers', json({ opportunityId: opportunity.id }, {
    'idempotency-key': 'ctr-offer-1',
    ...bearer(staff),
  }));
  assert.equal(offerCreated.status, 201);
  const offer = await offerCreated.json();
  const createPath = '/v1/contracts';
  assert.equal((await app.request(createPath, json({ offerId: offer.id }))).status, 401);
  assert.equal((await app.request(createPath, json({ offerId: offer.id }, bearer(portal)))).status, 403);
  assert.equal((await app.request('/v1/contracts', { headers: bearer(portal) })).status, 403);
  const created = await app.request(createPath, json({ offerId: offer.id }, {
    'idempotency-key': 'ctr-create-1',
    ...bearer(staff),
  }));
  assert.equal(created.status, 201);
  const contract = await created.json();
  assert.equal(contract.status, 'draft');
  assert.equal(contract.offerId, offer.id);
  assert.equal(Object.hasOwn(contract, 'provider'), false);
  const listed = await app.request('/v1/contracts', { headers: bearer(staff) });
  assert.equal(listed.status, 200);
  assert.equal((await listed.json()).items.length, 1);
  assert.equal((await app.request(`/v1/contracts/${contract.id}`, { headers: bearer(staff) })).status, 200);
  assert.equal((await app.request(`/v1/contracts/${contract.id}`, { headers: bearer(portal) })).status, 403);
  assert.equal((await app.request('/v1/contracts/missingcontract000', { headers: bearer(staff) })).status, 404);
});

test('contract create rejects missing offer, duplicate offer and client lifecycle fields', async () => {
  const { app } = appFor();
  const missing = await app.request('/v1/contracts', json({ offerId: 'f9k2n4p6q8r0s2t4' }, {
    'idempotency-key': 'ctr-missing-1',
    ...bearer(staff),
  }));
  assert.equal(missing.status, 404);
  const lead = await captureAndQualify(app);
  const opportunity = await (await app.request('/v1/opportunities', json({ leadId: lead.id }, {
    'idempotency-key': 'ctr-opp-2',
    ...bearer(staff),
  }))).json();
  const offer = await (await app.request('/v1/offers', json({ opportunityId: opportunity.id }, {
    'idempotency-key': 'ctr-offer-2',
    ...bearer(staff),
  }))).json();
  const withProvider = await app.request('/v1/contracts', json({ offerId: offer.id, provider: 'x' }, {
    'idempotency-key': 'ctr-provider-1',
    ...bearer(staff),
  }));
  assert.equal(withProvider.status, 400);
  const first = await app.request('/v1/contracts', json({ offerId: offer.id }, {
    'idempotency-key': 'ctr-dup-1',
    ...bearer(staff),
  }));
  assert.equal(first.status, 201);
  const second = await app.request('/v1/contracts', json({ offerId: offer.id }, {
    'idempotency-key': 'ctr-dup-2',
    ...bearer(staff),
  }));
  assert.equal(second.status, 409);
});

test('staff can advance contract lifecycle; portal cannot; illegal transitions rejected', async () => {
  const { app, store } = appFor();
  const lead = await captureAndQualify(app);
  const opportunity = await (await app.request('/v1/opportunities', json({ leadId: lead.id }, {
    'idempotency-key': 'life-opp-1',
    ...bearer(staff),
  }))).json();
  const offer = await (await app.request('/v1/offers', json({ opportunityId: opportunity.id }, {
    'idempotency-key': 'life-offer-1',
    ...bearer(staff),
  }))).json();
  const contract = await (await app.request('/v1/contracts', json({ offerId: offer.id }, {
    'idempotency-key': 'life-ctr-1',
    ...bearer(staff),
  }))).json();
  const path = `/v1/contracts/${contract.id}/lifecycle`;
  assert.equal((await app.request(path, json({ status: 'internal_review' }))).status, 401);
  assert.equal((await app.request(path, json({ status: 'internal_review' }, {
    'idempotency-key': 'life-port-1',
    ...bearer(portal),
  }))).status, 403);
  const skip = await app.request(path, json({ status: 'approved' }, {
    'idempotency-key': 'life-skip-1',
    ...bearer(staff),
  }));
  assert.equal(skip.status, 409);
  assert.equal((await skip.json()).error.code, 'CONTRACT_TRANSITION_FORBIDDEN');
  const vendor = await app.request(path, json({ status: 'internal_review', provider: 'x' }, {
    'idempotency-key': 'life-vendor-1',
    ...bearer(staff),
  }));
  assert.equal(vendor.status, 400);
  const reviewed = await app.request(path, json({ status: 'internal_review' }, {
    'idempotency-key': 'life-ok-1',
    ...bearer(staff),
  }));
  assert.equal(reviewed.status, 200);
  assert.equal((await reviewed.json()).status, 'internal_review');
  const replay = await app.request(path, json({ status: 'internal_review' }, {
    'idempotency-key': 'life-ok-1',
    ...bearer(staff),
  }));
  assert.equal(replay.status, 200);
  assert.equal((await replay.json()).status, 'internal_review');
  const approved = await app.request(path, json({ status: 'approved' }, {
    'idempotency-key': 'life-ok-2',
    ...bearer(staff),
  }));
  assert.equal(approved.status, 200);
  assert.equal((await approved.json()).status, 'approved');
  const sent = await app.request(path, json({ status: 'sent' }, {
    'idempotency-key': 'life-ok-3',
    ...bearer(staff),
  }));
  assert.equal(sent.status, 200);
  assert.equal((await sent.json()).status, 'sent');
  const terminal = await app.request(path, json({ status: 'sent' }, {
    'idempotency-key': 'life-term-1',
    ...bearer(staff),
  }));
  assert.equal(terminal.status, 409);
  const lifecycleAudits = store.state.audits.filter(event => event.action === 'contract.lifecycle_advanced');
  assert.equal(lifecycleAudits.length, 3);
  const auditish = JSON.stringify(lifecycleAudits);
  assert.equal(auditish.includes(PHONE), false);
  assert.equal(auditish.includes(NAME), false);
  assert.equal(auditish.includes('provider'), false);
  assert.equal(Object.hasOwn(lifecycleAudits[0].metadata, 'contractId'), true);
  assert.equal(Object.hasOwn(lifecycleAudits[0].metadata, 'fromStatus'), true);
  assert.equal(Object.hasOwn(lifecycleAudits[0].metadata, 'status'), true);
});

test('anonymous and portal actors cannot create, list or get projects; staff can', async () => {
  const { app } = appFor();
  const lead = await captureAndQualify(app);
  const opportunity = await (await app.request('/v1/opportunities', json({ leadId: lead.id }, {
    'idempotency-key': 'prj-opp-1',
    ...bearer(staff),
  }))).json();
  const offer = await (await app.request('/v1/offers', json({ opportunityId: opportunity.id }, {
    'idempotency-key': 'prj-offer-1',
    ...bearer(staff),
  }))).json();
  const contract = await (await app.request('/v1/contracts', json({ offerId: offer.id }, {
    'idempotency-key': 'prj-ctr-1',
    ...bearer(staff),
  }))).json();
  const createPath = '/v1/projects';
  assert.equal((await app.request(createPath, json({ contractId: contract.id }))).status, 401);
  assert.equal((await app.request(createPath, json({ contractId: contract.id }, bearer(portal)))).status, 403);
  assert.equal((await app.request('/v1/projects', { headers: bearer(portal) })).status, 403);
  const created = await app.request(createPath, json({ contractId: contract.id }, {
    'idempotency-key': 'prj-create-1',
    ...bearer(staff),
  }));
  assert.equal(created.status, 201);
  const project = await created.json();
  assert.equal(project.status, 'planned');
  assert.equal(project.contractId, contract.id);
  assert.equal(Object.hasOwn(project, 'provider'), false);
  assert.equal(Object.hasOwn(project, 'payment'), false);
  const listed = await app.request('/v1/projects', { headers: bearer(staff) });
  assert.equal(listed.status, 200);
  assert.equal((await listed.json()).items.length, 1);
  assert.equal((await app.request(`/v1/projects/${project.id}`, { headers: bearer(staff) })).status, 200);
  assert.equal((await app.request(`/v1/projects/${project.id}`, { headers: bearer(portal) })).status, 403);
  assert.equal((await app.request('/v1/projects/missingproject0000', { headers: bearer(staff) })).status, 404);
});

test('project create rejects missing contract, duplicate contract and client lifecycle fields', async () => {
  const { app } = appFor();
  const missing = await app.request('/v1/projects', json({ contractId: 'c9k2n4p6q8r0s2t4' }, {
    'idempotency-key': 'prj-missing-1',
    ...bearer(staff),
  }));
  assert.equal(missing.status, 404);
  const lead = await captureAndQualify(app);
  const opportunity = await (await app.request('/v1/opportunities', json({ leadId: lead.id }, {
    'idempotency-key': 'prj-opp-2',
    ...bearer(staff),
  }))).json();
  const offer = await (await app.request('/v1/offers', json({ opportunityId: opportunity.id }, {
    'idempotency-key': 'prj-offer-2',
    ...bearer(staff),
  }))).json();
  const contract = await (await app.request('/v1/contracts', json({ offerId: offer.id }, {
    'idempotency-key': 'prj-ctr-2',
    ...bearer(staff),
  }))).json();
  const withPayment = await app.request('/v1/projects', json({ contractId: contract.id, payment: true }, {
    'idempotency-key': 'prj-payment-1',
    ...bearer(staff),
  }));
  assert.equal(withPayment.status, 400);
  const first = await app.request('/v1/projects', json({ contractId: contract.id }, {
    'idempotency-key': 'prj-dup-1',
    ...bearer(staff),
  }));
  assert.equal(first.status, 201);
  const second = await app.request('/v1/projects', json({ contractId: contract.id }, {
    'idempotency-key': 'prj-dup-2',
    ...bearer(staff),
  }));
  assert.equal(second.status, 409);
});

test('portal project projection is read-only, empty without grant, and BOLA-isolated', async () => {
  const { app } = appFor();
  assert.equal((await app.request('/v1/portal/projects')).status, 401);
  assert.equal((await app.request('/v1/portal/projects', { headers: bearer(staff) })).status, 403);
  const empty = await app.request('/v1/portal/projects', { headers: bearer(portal) });
  assert.equal(empty.status, 200);
  assert.deepEqual((await empty.json()).items, []);

  const lead = await captureAndQualify(app);
  const opportunity = await (await app.request('/v1/opportunities', json({ leadId: lead.id }, {
    'idempotency-key': 'opp-port-prj',
    ...bearer(staff),
  }))).json();
  const offer = await (await app.request('/v1/offers', json({ opportunityId: opportunity.id }, {
    'idempotency-key': 'off-port-prj',
    ...bearer(staff),
  }))).json();
  const contract = await (await app.request('/v1/contracts', json({ offerId: offer.id }, {
    'idempotency-key': 'ctr-port-prj',
    ...bearer(staff),
  }))).json();
  const project = await (await app.request('/v1/projects', json({
    contractId: contract.id,
    clientSubject: 'portal-ola',
  }, {
    'idempotency-key': 'prj-port-1',
    ...bearer(staff),
  }))).json();
  assert.equal(project.clientSubject, 'portal-ola');

  const listed = await app.request('/v1/portal/projects', { headers: bearer(portal) });
  assert.equal(listed.status, 200);
  const body = await listed.json();
  assert.equal(body.items.length, 1);
  assert.equal(body.items[0].id, project.id);
  assert.equal(Object.hasOwn(body.items[0], 'payment'), false);
  assert.equal(Object.hasOwn(body.items[0], 'clientSubject'), false);

  assert.equal((await app.request(`/v1/portal/projects/${project.id}`, { headers: bearer(portal) })).status, 200);
  assert.equal((await app.request(`/v1/portal/projects/${project.id}`, { headers: bearer(portalOther) })).status, 404);
  const otherList = await (await app.request('/v1/portal/projects', { headers: bearer(portalOther) })).json();
  assert.deepEqual(otherList.items, []);
  assert.equal((await app.request(`/v1/projects/${project.id}`, { headers: bearer(portal) })).status, 403);
});

test('portal offer projection is read-only, empty without grant, and BOLA-isolated', async () => {
  const { app } = appFor();
  assert.equal((await app.request('/v1/portal/offers')).status, 401);
  assert.equal((await app.request('/v1/portal/offers', { headers: bearer(staff) })).status, 403);
  const empty = await app.request('/v1/portal/offers', { headers: bearer(portal) });
  assert.equal(empty.status, 200);
  assert.deepEqual((await empty.json()).items, []);

  const lead = await captureAndQualify(app);
  const opportunity = await (await app.request('/v1/opportunities', json({ leadId: lead.id }, {
    'idempotency-key': 'opp-port-off',
    ...bearer(staff),
  }))).json();
  const offer = await (await app.request('/v1/offers', json({
    opportunityId: opportunity.id,
    clientSubject: 'portal-ola',
  }, {
    'idempotency-key': 'off-port-1',
    ...bearer(staff),
  }))).json();
  assert.equal(offer.clientSubject, 'portal-ola');

  const listed = await app.request('/v1/portal/offers', { headers: bearer(portal) });
  assert.equal(listed.status, 200);
  const body = await listed.json();
  assert.equal(body.items.length, 1);
  assert.equal(body.items[0].id, offer.id);
  assert.equal(Object.hasOwn(body.items[0], 'price'), false);
  assert.equal(Object.hasOwn(body.items[0], 'clientSubject'), false);

  assert.equal((await app.request(`/v1/portal/offers/${offer.id}`, { headers: bearer(portal) })).status, 200);
  assert.equal((await app.request(`/v1/portal/offers/${offer.id}`, { headers: bearer(portalOther) })).status, 404);
  const otherList = await (await app.request('/v1/portal/offers', { headers: bearer(portalOther) })).json();
  assert.deepEqual(otherList.items, []);
  assert.equal((await app.request(`/v1/offers/${offer.id}`, { headers: bearer(portal) })).status, 403);
});

test('portal contract projection is read-only, empty without grant, and BOLA-isolated', async () => {
  const { app } = appFor();
  assert.equal((await app.request('/v1/portal/contracts')).status, 401);
  assert.equal((await app.request('/v1/portal/contracts', { headers: bearer(staff) })).status, 403);
  const empty = await app.request('/v1/portal/contracts', { headers: bearer(portal) });
  assert.equal(empty.status, 200);
  assert.deepEqual((await empty.json()).items, []);

  const lead = await captureAndQualify(app);
  const opportunity = await (await app.request('/v1/opportunities', json({ leadId: lead.id }, {
    'idempotency-key': 'opp-port-ctr',
    ...bearer(staff),
  }))).json();
  const offer = await (await app.request('/v1/offers', json({
    opportunityId: opportunity.id,
    clientSubject: 'portal-ola',
  }, {
    'idempotency-key': 'off-port-ctr',
    ...bearer(staff),
  }))).json();
  const contract = await (await app.request('/v1/contracts', json({ offerId: offer.id }, {
    'idempotency-key': 'ctr-port-1',
    ...bearer(staff),
  }))).json();
  const staffLead = await captureAndQualify(app);
  const staffOpportunity = await (await app.request('/v1/opportunities', json({ leadId: staffLead.id }, {
    'idempotency-key': 'opp-port-ctr-staff',
    ...bearer(staff),
  }))).json();
  const staffOffer = await (await app.request('/v1/offers', json({
    opportunityId: staffOpportunity.id,
  }, {
    'idempotency-key': 'off-port-ctr-staff',
    ...bearer(staff),
  }))).json();
  const staffContract = await (await app.request('/v1/contracts', json({ offerId: staffOffer.id }, {
    'idempotency-key': 'ctr-port-staff',
    ...bearer(staff),
  }))).json();

  const listed = await app.request('/v1/portal/contracts', { headers: bearer(portal) });
  assert.equal(listed.status, 200);
  const body = await listed.json();
  assert.equal(body.items.length, 1);
  assert.equal(body.items[0].id, contract.id);
  assert.equal(body.items[0].offerId, offer.id);
  assert.equal(body.items[0].status, 'draft');
  assert.equal(Object.hasOwn(body.items[0], 'amount'), false);
  assert.equal(Object.hasOwn(body.items[0], 'updatedAt'), false);
  assert.equal(Object.hasOwn(body.items[0], 'signing'), false);
  assert.equal(Object.hasOwn(body.items[0], 'clientSubject'), false);

  assert.equal((await app.request(`/v1/portal/contracts/${contract.id}`, { headers: bearer(portal) })).status, 200);
  assert.equal((await app.request(`/v1/portal/contracts/${contract.id}`, { headers: bearer(portalOther) })).status, 404);
  assert.equal((await app.request(`/v1/portal/contracts/${staffContract.id}`, { headers: bearer(portal) })).status, 404);
  const otherList = await (await app.request('/v1/portal/contracts', { headers: bearer(portalOther) })).json();
  assert.deepEqual(otherList.items, []);
  assert.equal((await app.request(`/v1/contracts/${contract.id}`, { headers: bearer(portal) })).status, 403);
});

test('portal file projection is read-only, empty without grant, and BOLA-isolated', async () => {
  const { app } = appFor();
  assert.equal((await app.request('/v1/portal/files')).status, 401);
  assert.equal((await app.request('/v1/portal/files', { headers: bearer(staff) })).status, 403);
  assert.equal((await app.request('/v1/files', { headers: bearer(portal) })).status, 403);
  const empty = await app.request('/v1/portal/files', { headers: bearer(portal) });
  assert.equal(empty.status, 200);
  assert.deepEqual((await empty.json()).items, []);
  const staffFilesEmpty = await app.request('/v1/files', { headers: bearer(staff) });
  assert.equal(staffFilesEmpty.status, 200);
  assert.deepEqual((await staffFilesEmpty.json()).items, []);

  const lead = await captureAndQualify(app);
  const opportunity = await (await app.request('/v1/opportunities', json({ leadId: lead.id }, {
    'idempotency-key': 'opp-port-file',
    ...bearer(staff),
  }))).json();
  const offer = await (await app.request('/v1/offers', json({ opportunityId: opportunity.id }, {
    'idempotency-key': 'off-port-file',
    ...bearer(staff),
  }))).json();
  const contract = await (await app.request('/v1/contracts', json({ offerId: offer.id }, {
    'idempotency-key': 'ctr-port-file',
    ...bearer(staff),
  }))).json();
  const project = await (await app.request('/v1/projects', json({
    contractId: contract.id,
    clientSubject: 'portal-ola',
  }, {
    'idempotency-key': 'prj-port-file',
    ...bearer(staff),
  }))).json();
  const file = await (await app.request('/v1/files', json({
    projectId: project.id,
    name: 'plan.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 2048,
  }, {
    'idempotency-key': 'file-port-1',
    ...bearer(staff),
  }))).json();
  assert.equal(file.clientSubject, 'portal-ola');
  assert.equal(Object.hasOwn(file, 'storageKey'), false);

  const staffLead = await captureAndQualify(app);
  const staffOpp = await (await app.request('/v1/opportunities', json({ leadId: staffLead.id }, {
    'idempotency-key': 'opp-staff-file',
    ...bearer(staff),
  }))).json();
  const staffOffer = await (await app.request('/v1/offers', json({ opportunityId: staffOpp.id }, {
    'idempotency-key': 'off-staff-file',
    ...bearer(staff),
  }))).json();
  const staffContract = await (await app.request('/v1/contracts', json({ offerId: staffOffer.id }, {
    'idempotency-key': 'ctr-staff-file',
    ...bearer(staff),
  }))).json();
  const staffProject = await (await app.request('/v1/projects', json({
    contractId: staffContract.id,
  }, {
    'idempotency-key': 'prj-staff-file',
    ...bearer(staff),
  }))).json();
  const staffFile = await (await app.request('/v1/files', json({
    projectId: staffProject.id,
    name: 'staff-notes.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 100,
  }, {
    'idempotency-key': 'file-staff-1',
    ...bearer(staff),
  }))).json();
  assert.equal(staffFile.clientSubject, null);

  const staffListed = await (await app.request('/v1/files', { headers: bearer(staff) })).json();
  assert.equal(staffListed.items.length, 2);
  assert.ok(staffListed.items.some((item) => item.id === file.id));
  assert.ok(staffListed.items.some((item) => item.id === staffFile.id));
  assert.equal(Object.hasOwn(staffListed.meta, 'limit'), true);

  const listed = await app.request('/v1/portal/files', { headers: bearer(portal) });
  assert.equal(listed.status, 200);
  const body = await listed.json();
  assert.equal(body.items.length, 1);
  assert.equal(body.items[0].id, file.id);
  assert.equal(body.items[0].name, 'plan.pdf');
  assert.equal(Object.hasOwn(body.items[0], 'clientSubject'), false);
  assert.equal(Object.hasOwn(body.items[0], 'storageKey'), false);

  assert.equal((await app.request(`/v1/portal/files/${file.id}`, { headers: bearer(portal) })).status, 200);
  assert.equal((await app.request(`/v1/portal/files/${staffFile.id}`, { headers: bearer(portal) })).status, 404);
  assert.equal((await app.request(`/v1/portal/files/${file.id}`, { headers: bearer(portalOther) })).status, 404);
  const otherList = await (await app.request('/v1/portal/files', { headers: bearer(portalOther) })).json();
  assert.deepEqual(otherList.items, []);
  assert.equal((await app.request(`/v1/files/${file.id}`, { headers: bearer(portal) })).status, 403);
});

test('staff can store and download local private file bytes; portal cannot', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'fz-http-file-bytes-'));
  try {
    let tick = 0;
    const store = new MemoryLeadStore();
    const app = createApp({
      store,
      authenticator: testAuthenticator(SECRET),
      limiter: new WindowLimiter(100, 60_000),
      addressOf: () => '198.51.100.10',
      fileBytesRoot: root,
      trustedOrigins: ['https://admin.example.test'],
      now: () => new Date(Date.UTC(2026, 8, 21, 12, 0, tick++)).toISOString(),
    });
    const lead = await (await app.request('/v1/leads', json(capture))).json();
    await app.request(`/v1/leads/${lead.id}/qualify`, json({ capacityHold: false }, {
      'idempotency-key': 'qual-bytes-001',
      ...bearer(staff),
    }));
    const opp = await (await app.request('/v1/opportunities', json({ leadId: lead.id }, {
      'idempotency-key': 'opp-bytes-001',
      ...bearer(staff),
    }))).json();
    const offer = await (await app.request('/v1/offers', json({ opportunityId: opp.id }, {
      'idempotency-key': 'off-bytes-001',
      ...bearer(staff),
    }))).json();
    const contract = await (await app.request('/v1/contracts', json({ offerId: offer.id }, {
      'idempotency-key': 'ctr-bytes-001',
      ...bearer(staff),
    }))).json();
    const project = await (await app.request('/v1/projects', json({ contractId: contract.id }, {
      'idempotency-key': 'prj-bytes-001',
      ...bearer(staff),
    }))).json();
    const bytes = Buffer.from('synthetic-private-bytes');
    const meta = await (await app.request('/v1/files', json({
      projectId: project.id,
      name: 'notes.bin',
      mimeType: 'application/octet-stream',
      sizeBytes: bytes.length,
    }, {
      'idempotency-key': 'meta-bytes-001',
      ...bearer(staff),
    }))).json();

    assert.equal((await app.request(`/v1/files/${meta.id}/content`, {
      method: 'PUT',
      headers: bearer(portal),
      body: bytes,
    })).status, 403);

    const put = await app.request(`/v1/files/${meta.id}/content`, {
      method: 'PUT',
      headers: {
        ...bearer(staff),
        'content-type': 'application/octet-stream',
        'content-length': String(bytes.length),
      },
      body: bytes,
    });
    assert.equal(put.status, 201);
    const receipt = await put.json();
    assert.equal(receipt.id, meta.id);
    assert.equal(receipt.publicUrl, null);
    assert.equal(Object.hasOwn(receipt, 'storageKey'), false);
    assert.equal(Object.hasOwn(receipt, 'relativePath'), false);

    assert.equal((await app.request(`/v1/files/${meta.id}/content`, { headers: bearer(portal) })).status, 403);

    const get = await app.request(`/v1/files/${meta.id}/content`, {
      headers: {
        ...bearer(staff),
        'x-request-id': 'req-file-bytes-get-01',
        origin: 'https://admin.example.test',
      },
    });
    assert.equal(get.status, 200);
    assert.equal(get.headers.get('content-type'), 'application/octet-stream');
    assert.equal(get.headers.get('x-content-checksum-sha256'), receipt.checksum);
    assert.equal(get.headers.get('x-request-id'), 'req-file-bytes-get-01');
    assert.equal(get.headers.get('access-control-allow-origin'), 'https://admin.example.test');
    assert.match(get.headers.get('content-disposition') || '', /^attachment;/);
    assert.equal(Buffer.from(await get.arrayBuffer()).equals(bytes), true);

    const mismatch = await app.request(`/v1/files/${meta.id}/content`, {
      method: 'PUT',
      headers: {
        ...bearer(staff),
        'content-type': 'application/octet-stream',
        'content-length': '14',
      },
      body: Buffer.from('wrong-length!!'),
    });
    assert.equal(mismatch.status, 400);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('staff create and list project milestones and decision log; portal cannot mutate (BOLA)', async () => {
  const { app } = appFor();
  assert.equal((await app.request('/v1/milestones')).status, 401);
  assert.equal((await app.request('/v1/milestones', { headers: bearer(portal) })).status, 403);
  assert.equal((await app.request('/v1/decision-log', { headers: bearer(portal) })).status, 403);

  const lead = await captureAndQualify(app);
  const opportunity = await (await app.request('/v1/opportunities', json({ leadId: lead.id }, {
    ...bearer(staff),
    'idempotency-key': 'ms-opp-0001',
  }))).json();
  const offer = await (await app.request('/v1/offers', json({ opportunityId: opportunity.id }, {
    ...bearer(staff),
    'idempotency-key': 'ms-offer-0001',
  }))).json();
  const contract = await (await app.request('/v1/contracts', json({ offerId: offer.id }, {
    ...bearer(staff),
    'idempotency-key': 'ms-contract-01',
  }))).json();
  const project = await (await app.request('/v1/projects', json({ contractId: contract.id }, {
    ...bearer(staff),
    'idempotency-key': 'ms-project-01',
  }))).json();

  assert.equal((await app.request('/v1/milestones', json({
    projectId: project.id,
    title: 'Koncepcja',
  }, { ...bearer(portal), 'idempotency-key': 'ms-create-port' }))).status, 403);

  const created = await app.request('/v1/milestones', json({
    projectId: project.id,
    title: 'Koncepcja',
    dueAt: '2026-10-15T12:00:00.000Z',
  }, { ...bearer(staff), 'idempotency-key': 'ms-create-0001' }));
  assert.equal(created.status, 201);
  const milestone = await created.json();
  assert.equal(milestone.projectId, project.id);
  assert.equal(milestone.title, 'Koncepcja');
  assert.equal(Object.hasOwn(milestone, 'payment'), false);

  const listed = await app.request(`/v1/milestones?projectId=${project.id}`, { headers: bearer(staff) });
  assert.equal(listed.status, 200);
  const page = await listed.json();
  assert.equal(page.items.length, 1);
  assert.equal(page.items[0].id, milestone.id);

  assert.equal((await app.request(`/v1/milestones/${milestone.id}`, { headers: bearer(portal) })).status, 403);
  assert.equal((await app.request(`/v1/milestones/${milestone.id}`, { headers: bearer(staff) })).status, 200);

  assert.equal((await app.request('/v1/decision-log', json({
    projectId: project.id,
    kind: 'decision',
    summary: 'Zatwierdzono układ',
  }, { ...bearer(portal), 'idempotency-key': 'dl-create-port' }))).status, 403);

  const decision = await app.request('/v1/decision-log', json({
    projectId: project.id,
    kind: 'decision',
    summary: 'Zatwierdzono układ',
    relatedMilestoneId: milestone.id,
  }, { ...bearer(staff), 'idempotency-key': 'dl-create-0001' }));
  assert.equal(decision.status, 201);
  const entry = await decision.json();
  assert.equal(entry.kind, 'decision');
  assert.equal(entry.relatedMilestoneId, milestone.id);
  assert.equal(Object.hasOwn(entry, 'email'), false);

  const change = await app.request('/v1/decision-log', json({
    projectId: project.id,
    kind: 'change_order',
    summary: 'Dodano strefę grillową',
  }, { ...bearer(staff), 'idempotency-key': 'dl-create-0002' }));
  assert.equal(change.status, 201);

  const logPage = await (await app.request(`/v1/decision-log?projectId=${project.id}`, { headers: bearer(staff) })).json();
  assert.equal(logPage.items.length, 2);

  const paymentRejected = await app.request('/v1/milestones', json({
    projectId: project.id,
    title: 'X',
    payment: true,
  }, { ...bearer(staff), 'idempotency-key': 'ms-create-bad1' }));
  assert.equal(paymentRejected.status, 400);
});

test('staff create, replace and transition payment schedules; portal cannot (BOLA)', async () => {
  const { app } = appFor();
  assert.equal((await app.request('/v1/payment-schedules')).status, 401);
  assert.equal((await app.request('/v1/payment-schedules', { headers: bearer(portal) })).status, 403);

  const lead = await captureAndQualify(app);
  const opportunity = await (await app.request('/v1/opportunities', json({ leadId: lead.id }, {
    ...bearer(staff),
    'idempotency-key': 'pay-opp-0001',
  }))).json();
  const offer = await (await app.request('/v1/offers', json({ opportunityId: opportunity.id }, {
    ...bearer(staff),
    'idempotency-key': 'pay-offer-0001',
  }))).json();
  const contract = await (await app.request('/v1/contracts', json({ offerId: offer.id }, {
    ...bearer(staff),
    'idempotency-key': 'pay-contract-0001',
  }))).json();

  assert.equal((await app.request('/v1/payment-schedules', json({
    contractId: contract.id,
    currency: 'PLN',
    installments: [{ sequence: 1, amountMinor: 100_00 }],
    provider: 'stripe',
  }, { ...bearer(staff), 'idempotency-key': 'pay-create-bad1' }))).status, 400);

  const created = await app.request('/v1/payment-schedules', json({
    contractId: contract.id,
    currency: 'PLN',
    installments: [
      { sequence: 1, amountMinor: 400_00 },
      { sequence: 2, amountMinor: 600_00 },
    ],
  }, { ...bearer(staff), 'idempotency-key': 'pay-create-0001' }));
  assert.equal(created.status, 201);
  const schedule = await created.json();
  assert.equal(schedule.contractId, contract.id);
  assert.equal(schedule.currency, 'PLN');
  assert.equal(schedule.installments.length, 2);
  assert.equal(Object.hasOwn(schedule, 'provider'), false);

  assert.equal((await app.request('/v1/payment-schedules', json({
    contractId: contract.id,
    currency: 'PLN',
    installments: [{ sequence: 1, amountMinor: 100_00 }],
  }, { ...bearer(staff), 'idempotency-key': 'pay-create-0002' }))).status, 409);

  const listed = await app.request(`/v1/payment-schedules?contractId=${contract.id}`, { headers: bearer(staff) });
  assert.equal(listed.status, 200);
  assert.equal((await listed.json()).items[0].id, schedule.id);
  assert.equal((await app.request(`/v1/payment-schedules/${schedule.id}`, { headers: bearer(portal) })).status, 403);
  assert.equal((await app.request(`/v1/payment-schedules/${schedule.id}`, { headers: bearer(staff) })).status, 200);

  const replaced = await app.request(`/v1/payment-schedules/${schedule.id}`, {
    method: 'PUT',
    headers: {
      ...bearer(staff),
      'content-type': 'application/json',
      'idempotency-key': 'pay-replace-0001',
    },
    body: JSON.stringify({
      installments: [{ sequence: 1, amountMinor: 250_00 }],
    }),
  });
  assert.equal(replaced.status, 200);
  const afterReplace = await replaced.json();
  assert.equal(afterReplace.installments.length, 1);
  assert.equal(afterReplace.installments[0].amountMinor, 250_00);

  const installmentId = afterReplace.installments[0].id;
  const due = await app.request(
    `/v1/payment-schedules/${schedule.id}/installments/${installmentId}/transition`,
    json({ status: 'due' }, { ...bearer(staff), 'idempotency-key': 'pay-due-0001' }),
  );
  assert.equal(due.status, 200);
  assert.equal((await due.json()).installments[0].status, 'due');

  assert.equal((await app.request(
    `/v1/payment-schedules/${schedule.id}/installments/${installmentId}/transition`,
    json({ status: 'due' }, { ...bearer(portal), 'idempotency-key': 'pay-due-portal' }),
  )).status, 403);

  assert.equal((await app.request(
    `/v1/payment-schedules/${schedule.id}/installments/${installmentId}/transition`,
    json({ status: 'due', chargeId: 'x' }, { ...bearer(staff), 'idempotency-key': 'pay-due-bad' }),
  )).status, 400);
});

test('przelewy24 sandbox intent and signed webhook record a due installment without a live charge', async () => {
  const { createHmac } = await import('node:crypto');
  const sandboxSecret = 'sandbox-webhook-secret';
  const logs = [];
  const { app } = appFor(undefined, logs, 100, sandboxSecret);
  const lead = await captureAndQualify(app);
  const opportunity = await (await app.request('/v1/opportunities', json({ leadId: lead.id }, {
    ...bearer(staff),
    'idempotency-key': 'sbx-opp-0001',
  }))).json();
  const offer = await (await app.request('/v1/offers', json({ opportunityId: opportunity.id }, {
    ...bearer(staff),
    'idempotency-key': 'sbx-offer-0001',
  }))).json();
  const contract = await (await app.request('/v1/contracts', json({ offerId: offer.id }, {
    ...bearer(staff),
    'idempotency-key': 'sbx-contract-01',
  }))).json();
  const created = await app.request('/v1/payment-schedules', json({
    contractId: contract.id,
    currency: 'PLN',
    installments: [{ sequence: 1, amountMinor: 15000 }],
  }, { ...bearer(staff), 'idempotency-key': 'sbx-sched-0001' }));
  const schedule = await created.json();
  const installmentId = schedule.installments[0].id;
  assert.equal((await app.request(
    `/v1/payment-schedules/${schedule.id}/installments/${installmentId}/transition`,
    json({ status: 'due' }, { ...bearer(staff), 'idempotency-key': 'sbx-due-00001' }),
  )).status, 200);

  const intentPath = `/v1/payment-schedules/${schedule.id}/installments/${installmentId}/sandbox-intent`;
  assert.equal((await app.request(intentPath, json({}, { ...bearer(portal), 'idempotency-key': 'sbx-intent-port' }))).status, 403);
  const intentResponse = await app.request(intentPath, json({}, { ...bearer(staff), 'idempotency-key': 'sbx-intent-0001' }));
  assert.equal(intentResponse.status, 201);
  const intent = await intentResponse.json();
  assert.equal(intent.provider, 'przelewy24-sandbox');
  assert.equal(intent.status, 'pending');
  assert.equal(Object.hasOwn(intent, 'secret'), false);

  const raw = JSON.stringify({
    intentId: intent.id,
    scheduleId: intent.scheduleId,
    installmentId: intent.installmentId,
    status: 'confirmed',
  });
  const webhook = '/v1/payments/przelewy24/sandbox-webhook';
  const forged = await app.request(webhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...bearer(portal), 'x-fz-sandbox-signature': 'deadbeef' },
    body: raw,
  });
  assert.equal(forged.status, 401);
  const stillDue = await (await app.request(`/v1/payment-schedules/${schedule.id}`, { headers: bearer(staff) })).json();
  assert.equal(stillDue.installments[0].status, 'due');

  const signature = createHmac('sha256', sandboxSecret).update(raw).digest('hex');
  const confirmed = await app.request(webhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-fz-sandbox-signature': signature },
    body: raw,
  });
  assert.equal(confirmed.status, 200);
  assert.equal((await confirmed.json()).installments[0].status, 'recorded');
  assert.equal(JSON.stringify(logs).includes(sandboxSecret), false);
});

test('documenso sandbox envelope completes only with a signed webhook and never claims QES', async () => {
  const { createHmac } = await import('node:crypto');
  const signingSecret = 'signing-sandbox-secret';
  const logs = [];
  const { app } = appFor(undefined, logs, 100, undefined, signingSecret);
  const lead = await captureAndQualify(app);
  const opportunity = await (await app.request('/v1/opportunities', json({ leadId: lead.id }, {
    ...bearer(staff),
    'idempotency-key': 'sgn-opp-0001',
  }))).json();
  const offer = await (await app.request('/v1/offers', json({ opportunityId: opportunity.id }, {
    ...bearer(staff),
    'idempotency-key': 'sgn-offer-0001',
  }))).json();
  const contract = await (await app.request('/v1/contracts', json({ offerId: offer.id }, {
    ...bearer(staff),
    'idempotency-key': 'sgn-ctr-00001',
  }))).json();
  const lifecycle = `/v1/contracts/${contract.id}/lifecycle`;
  for (const [status, key] of [['internal_review', 'sgn-life-0001'], ['approved', 'sgn-life-0002'], ['sent', 'sgn-life-0003']]) {
    assert.equal((await app.request(lifecycle, json({ status }, { ...bearer(staff), 'idempotency-key': key }))).status, 200);
  }
  const path = `/v1/contracts/${contract.id}/signing-sandbox-envelope`;
  assert.equal((await app.request(path, json({}, { ...bearer(portal), 'idempotency-key': 'sgn-env-portal' }))).status, 403);
  const created = await app.request(path, json({}, { ...bearer(staff), 'idempotency-key': 'sgn-env-00001' }));
  assert.equal(created.status, 201);
  const envelope = await created.json();
  assert.equal(envelope.provider, 'documenso-sandbox');
  assert.equal(envelope.status, 'pending');
  assert.equal(envelope.qesClaimed, false);
  const read = await app.request(path, { headers: bearer(staff) });
  assert.equal(read.status, 200);
  assert.equal((await read.json()).status, 'pending');
  assert.equal((await app.request(path, { headers: bearer(portal) })).status, 403);
  const raw = JSON.stringify({
    envelopeId: envelope.id,
    contractId: envelope.contractId,
    status: 'completed',
  });
  const webhook = '/v1/signing/documenso/sandbox-webhook';
  const forged = await app.request(webhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...bearer(portal), 'x-fz-signing-sandbox-signature': 'deadbeef' },
    body: raw,
  });
  assert.equal(forged.status, 401);
  const signature = createHmac('sha256', signingSecret).update(raw).digest('hex');
  const completed = await app.request(webhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-fz-signing-sandbox-signature': signature },
    body: raw,
  });
  assert.equal(completed.status, 200);
  const body = await completed.json();
  assert.equal(body.status, 'completed');
  assert.equal(body.qesClaimed, false);
  assert.equal(JSON.stringify(logs).includes(signingSecret), false);
});

test('staff can list and review synthetic approval proposals; portal cannot; spend override refused', async () => {
  const { app } = appFor();
  const { getApprovalFabric } = await import('./approvals.ts');
  getApprovalFabric({ reset: true });
  assert.equal((await app.request('/v1/approvals/proposals')).status, 401);
  assert.equal((await app.request('/v1/approvals/proposals', { headers: bearer(portal) })).status, 403);
  const listed = await app.request('/v1/approvals/proposals', { headers: bearer(staff) });
  assert.equal(listed.status, 200);
  const body = await listed.json();
  assert.equal(body.items.length, 1);
  assert.equal(body.items[0].synthetic, true);
  const id = body.items[0].id;
  const rejected = await app.request(`/v1/approvals/proposals/${id}/review`, json({
    action: 'REJECT',
  }, bearer(staff)));
  assert.equal(rejected.status, 200);
  assert.equal((await rejected.json()).status, 'REJECTED');
  getApprovalFabric({ reset: true });
  const again = await (await app.request('/v1/approvals/proposals', { headers: bearer(staff) })).json();
  const defer = await app.request(`/v1/approvals/proposals/${again.items[0].id}/review`, json({
    action: 'DEFER',
  }, bearer(staff)));
  assert.equal(defer.status, 200);
  assert.equal((await app.request(`/v1/approvals/proposals/${again.items[0].id}/review`, json({
    action: 'spend',
  }, bearer(staff)))).status, 400);
  assert.equal((await app.request(`/v1/approvals/proposals/${again.items[0].id}/review`, json({
    action: 'REJECT',
  }, bearer(portal)))).status, 403);
});

async function createDeliveredProject(app, { clientSubject = null, suffix = '1' } = {}) {
  const lead = await captureAndQualify(app);
  const opportunity = await (await app.request('/v1/opportunities', json({ leadId: lead.id }, {
    'idempotency-key': `gdn-opp-${suffix}`,
    ...bearer(staff),
  }))).json();
  const offer = await (await app.request('/v1/offers', json({ opportunityId: opportunity.id }, {
    'idempotency-key': `gdn-offer-${suffix}`,
    ...bearer(staff),
  }))).json();
  const contract = await (await app.request('/v1/contracts', json({ offerId: offer.id }, {
    'idempotency-key': `gdn-ctr-${suffix}`,
    ...bearer(staff),
  }))).json();
  const body = { contractId: contract.id };
  if (clientSubject) body.clientSubject = clientSubject;
  const project = await (await app.request('/v1/projects', json(body, {
    'idempotency-key': `gdn-prj-${suffix}`,
    ...bearer(staff),
  }))).json();
  const delivered = await app.request(`/v1/projects/${project.id}/deliver`, json({}, {
    'idempotency-key': `gdn-del-${suffix}`,
    ...bearer(staff),
  }));
  assert.equal(delivered.status, 200);
  const result = await delivered.json();
  assert.equal(result.status, 'delivered');
  return result;
}

test('staff can deliver a project; portal cannot; already delivered rejected', async () => {
  const { app } = appFor();
  const lead = await captureAndQualify(app);
  const opportunity = await (await app.request('/v1/opportunities', json({ leadId: lead.id }, {
    'idempotency-key': 'del-opp-1',
    ...bearer(staff),
  }))).json();
  const offer = await (await app.request('/v1/offers', json({ opportunityId: opportunity.id }, {
    'idempotency-key': 'del-offer-1',
    ...bearer(staff),
  }))).json();
  const contract = await (await app.request('/v1/contracts', json({ offerId: offer.id }, {
    'idempotency-key': 'del-ctr-1',
    ...bearer(staff),
  }))).json();
  const project = await (await app.request('/v1/projects', json({ contractId: contract.id }, {
    'idempotency-key': 'del-prj-1',
    ...bearer(staff),
  }))).json();
  assert.equal(project.status, 'planned');
  assert.equal((await app.request(`/v1/projects/${project.id}/deliver`, json({}, bearer(portal)))).status, 403);
  const first = await app.request(`/v1/projects/${project.id}/deliver`, json({}, {
    'idempotency-key': 'del-ok-1',
    ...bearer(staff),
  }));
  assert.equal(first.status, 200);
  assert.equal((await first.json()).status, 'delivered');
  const again = await app.request(`/v1/projects/${project.id}/deliver`, json({}, {
    'idempotency-key': 'del-ok-2',
    ...bearer(staff),
  }));
  assert.equal(again.status, 409);
  const withPayment = await app.request(`/v1/projects/${project.id}/deliver`, json({ payment: true }, {
    'idempotency-key': 'del-pay-1',
    ...bearer(staff),
  }));
  assert.equal(withPayment.status, 400);
});

test('garden HTTP create/list/get requires delivered project; rejects twin invent; BOLA on portal', async () => {
  const { app } = appFor();
  assert.equal((await app.request('/v1/gardens')).status, 401);
  assert.equal((await app.request('/v1/gardens', { headers: bearer(portal) })).status, 403);
  assert.equal((await app.request('/v1/portal/gardens')).status, 401);
  assert.equal((await app.request('/v1/portal/gardens', { headers: bearer(staff) })).status, 403);

  const plannedLead = await captureAndQualify(app);
  const opportunity = await (await app.request('/v1/opportunities', json({ leadId: plannedLead.id }, {
    'idempotency-key': 'gdn-plan-opp',
    ...bearer(staff),
  }))).json();
  const offer = await (await app.request('/v1/offers', json({ opportunityId: opportunity.id }, {
    'idempotency-key': 'gdn-plan-offer',
    ...bearer(staff),
  }))).json();
  const contract = await (await app.request('/v1/contracts', json({ offerId: offer.id }, {
    'idempotency-key': 'gdn-plan-ctr',
    ...bearer(staff),
  }))).json();
  const planned = await (await app.request('/v1/projects', json({ contractId: contract.id }, {
    'idempotency-key': 'gdn-plan-prj',
    ...bearer(staff),
  }))).json();
  const notDelivered = await app.request('/v1/gardens', json({ projectId: planned.id }, {
    'idempotency-key': 'gdn-plan-create',
    ...bearer(staff),
  }));
  assert.equal(notDelivered.status, 409);

  const project = await createDeliveredProject(app, { clientSubject: 'portal-ola', suffix: 'a' });
  const twin = await app.request('/v1/gardens', json({ projectId: project.id, twinDatabase: true }, {
    'idempotency-key': 'gdn-twin-1',
    ...bearer(staff),
  }));
  assert.equal(twin.status, 400);

  const created = await app.request('/v1/gardens', json({ projectId: project.id }, {
    'idempotency-key': 'gdn-create-1',
    ...bearer(staff),
  }));
  assert.equal(created.status, 201);
  const garden = await created.json();
  assert.equal(garden.projectId, project.id);
  assert.equal(garden.clientSubject, 'portal-ola');
  assert.equal(Object.hasOwn(garden, 'twinDatabase'), false);
  assert.equal(Object.hasOwn(garden, 'liveGarden'), false);
  assert.equal(Object.hasOwn(garden, 'sensorFeed'), false);

  const listed = await app.request('/v1/gardens', { headers: bearer(staff) });
  assert.equal(listed.status, 200);
  assert.equal((await listed.json()).items.length, 1);
  assert.equal((await app.request(`/v1/gardens/${garden.id}`, { headers: bearer(staff) })).status, 200);
  assert.equal((await app.request(`/v1/gardens/${garden.id}`, { headers: bearer(portal) })).status, 403);

  const duplicate = await app.request('/v1/gardens', json({ projectId: project.id }, {
    'idempotency-key': 'gdn-create-2',
    ...bearer(staff),
  }));
  assert.equal(duplicate.status, 409);

  const portalList = await app.request('/v1/portal/gardens', { headers: bearer(portal) });
  assert.equal(portalList.status, 200);
  const portalBody = await portalList.json();
  assert.equal(portalBody.items.length, 1);
  assert.equal(portalBody.items[0].id, garden.id);
  assert.equal(Object.hasOwn(portalBody.items[0], 'clientSubject'), false);
  assert.equal(Object.hasOwn(portalBody.items[0], 'liveGarden'), false);
  assert.equal((await app.request(`/v1/portal/gardens/${garden.id}`, { headers: bearer(portal) })).status, 200);
  assert.equal((await app.request(`/v1/portal/gardens/${garden.id}`, { headers: bearer(portalOther) })).status, 404);
  const otherList = await (await app.request('/v1/portal/gardens', { headers: bearer(portalOther) })).json();
  assert.deepEqual(otherList.items, []);

  const staffOnly = await createDeliveredProject(app, { suffix: 'b' });
  const staffGarden = await (await app.request('/v1/gardens', json({ projectId: staffOnly.id }, {
    'idempotency-key': 'gdn-staff-only',
    ...bearer(staff),
  }))).json();
  assert.equal(staffGarden.clientSubject, null);
  assert.equal((await app.request(`/v1/portal/gardens/${staffGarden.id}`, { headers: bearer(portal) })).status, 404);
});

async function createOwnedProject(app, { clientSubject = null, suffix = 'si1' } = {}) {
  const lead = await captureAndQualify(app);
  const opportunity = await (await app.request('/v1/opportunities', json({ leadId: lead.id }, {
    'idempotency-key': `si-opp-${suffix}`,
    ...bearer(staff),
  }))).json();
  const offer = await (await app.request('/v1/offers', json({ opportunityId: opportunity.id }, {
    'idempotency-key': `si-offer-${suffix}`,
    ...bearer(staff),
  }))).json();
  const contract = await (await app.request('/v1/contracts', json({ offerId: offer.id }, {
    'idempotency-key': `si-ctr-${suffix}`,
    ...bearer(staff),
  }))).json();
  const body = { contractId: contract.id };
  if (clientSubject) body.clientSubject = clientSubject;
  return (await app.request('/v1/projects', json(body, {
    'idempotency-key': `si-prj-${suffix}`,
    ...bearer(staff),
  }))).json();
}

test('site intelligence HTTP create/list/get from synthetic RULES; rejects AI invent; BOLA on portal', async () => {
  const { app } = appFor();
  assert.equal((await app.request('/v1/site-intelligence')).status, 401);
  assert.equal((await app.request('/v1/site-intelligence', { headers: bearer(portal) })).status, 403);
  assert.equal((await app.request('/v1/portal/site-intelligence')).status, 401);
  assert.equal((await app.request('/v1/portal/site-intelligence', { headers: bearer(staff) })).status, 403);

  const project = await createOwnedProject(app, { clientSubject: 'portal-ola', suffix: 'a' });
  const invent = await app.request('/v1/site-intelligence', json({
    projectId: project.id,
    observations: [{
      observationId: 'obs-slope-01',
      kind: 'slope',
      normalized: true,
      source: 'normalized',
      synthetic: true,
    }],
    inventedSiteFacts: true,
  }, {
    'idempotency-key': 'si-invent-1',
    ...bearer(staff),
  }));
  assert.equal(invent.status, 400);

  const live = await app.request('/v1/site-intelligence', json({
    projectId: project.id,
    observations: [{
      observationId: 'obs-slope-01',
      kind: 'slope',
      normalized: true,
      source: 'normalized',
      synthetic: false,
    }],
  }, {
    'idempotency-key': 'si-live-1',
    ...bearer(staff),
  }));
  assert.equal(live.status, 400);

  const credentials = await app.request('/v1/site-intelligence', json({
    projectId: project.id,
    observations: [{
      observationId: 'obs-slope-01',
      kind: 'slope',
      normalized: true,
      source: 'normalized',
      synthetic: true,
    }],
    thirdPartyCredentials: true,
  }, {
    'idempotency-key': 'si-cred-1',
    ...bearer(staff),
  }));
  assert.equal(credentials.status, 400);

  const created = await app.request('/v1/site-intelligence', json({
    projectId: project.id,
    observations: [
      {
        observationId: 'obs-slope-01',
        kind: 'slope',
        normalized: true,
        source: 'normalized',
        synthetic: true,
      },
      {
        observationId: 'obs-sun-0001',
        kind: 'sun',
        normalized: true,
        source: 'normalized',
        synthetic: true,
      },
    ],
  }, {
    'idempotency-key': 'si-create-1',
    ...bearer(staff),
  }));
  assert.equal(created.status, 201);
  const record = await created.json();
  assert.equal(record.projectId, project.id);
  assert.equal(record.clientSubject, 'portal-ola');
  assert.equal(record.sourceStage, 'RULES');
  assert.equal(record.constraints[0].code, 'slope-constraint');
  assert.equal(record.opportunities[0].code, 'sun-exposure');
  assert.equal(Object.hasOwn(record, 'twinDatabase'), false);
  assert.equal(Object.hasOwn(record, 'aiConclusion'), false);

  const listed = await app.request('/v1/site-intelligence', { headers: bearer(staff) });
  assert.equal(listed.status, 200);
  assert.equal((await listed.json()).items.length, 1);
  assert.equal((await app.request(`/v1/site-intelligence/${record.id}`, { headers: bearer(staff) })).status, 200);
  assert.equal((await app.request(`/v1/site-intelligence/${record.id}`, { headers: bearer(portal) })).status, 403);

  const duplicate = await app.request('/v1/site-intelligence', json({
    projectId: project.id,
    observations: [{
      observationId: 'obs-slope-02',
      kind: 'slope',
      normalized: true,
      source: 'normalized',
      synthetic: true,
    }],
  }, {
    'idempotency-key': 'si-create-2',
    ...bearer(staff),
  }));
  assert.equal(duplicate.status, 409);

  const portalList = await app.request('/v1/portal/site-intelligence', { headers: bearer(portal) });
  assert.equal(portalList.status, 200);
  const portalBody = await portalList.json();
  assert.equal(portalBody.items.length, 1);
  assert.equal(portalBody.items[0].id, record.id);
  assert.equal(Object.hasOwn(portalBody.items[0], 'clientSubject'), false);
  assert.equal(Object.hasOwn(portalBody.items[0], 'aiConclusion'), false);
  assert.equal((await app.request(`/v1/portal/site-intelligence/${record.id}`, { headers: bearer(portal) })).status, 200);
  assert.equal((await app.request(`/v1/portal/site-intelligence/${record.id}`, { headers: bearer(portalOther) })).status, 404);
  const otherList = await (await app.request('/v1/portal/site-intelligence', { headers: bearer(portalOther) })).json();
  assert.deepEqual(otherList.items, []);

  const staffOnly = await createOwnedProject(app, { suffix: 'b' });
  const staffRecord = await (await app.request('/v1/site-intelligence', json({
    projectId: staffOnly.id,
    observations: [{
      observationId: 'obs-soil-0001',
      kind: 'soil',
      normalized: true,
      source: 'normalized',
      synthetic: true,
    }],
  }, {
    'idempotency-key': 'si-staff-only',
    ...bearer(staff),
  }))).json();
  assert.equal(staffRecord.clientSubject, null);
  assert.equal((await app.request(`/v1/portal/site-intelligence/${staffRecord.id}`, { headers: bearer(portal) })).status, 404);
});

test('capacity windows are staff-only and refuse a promised instant outside the window', async () => {
  const { app } = appFor();
  const actorId = 'staffdesignerana1';
  const windowBody = {
    actorId,
    kind: 'consultation',
    startsAt: '2026-06-01T08:00:00.000Z',
    endsAt: '2026-06-01T12:00:00.000Z',
  };
  assert.equal((await app.request('/v1/capacity-windows')).status, 401);
  assert.equal((await app.request('/v1/capacity-windows', { headers: bearer(portal) })).status, 403);
  assert.equal((await app.request('/v1/capacity-decisions', json({
    kind: 'consultation',
    promisedAt: '2026-06-01T09:00:00.000Z',
  }, bearer(portal)))).status, 403);

  const empty = await app.request('/v1/capacity-decisions', json({
    kind: 'consultation',
    promisedAt: '2026-06-01T09:00:00.000Z',
    actorId,
  }, bearer(staff)));
  assert.equal(empty.status, 200);
  assert.deepEqual(await empty.json(), { ok: false, reason: 'CAPACITY_EMPTY' });

  const calendar = await app.request('/v1/capacity-windows', json({ ...windowBody, email: 'a@b.c' }, {
    'idempotency-key': 'cap-mail-1',
    ...bearer(staff),
  }));
  assert.equal(calendar.status, 400);

  const created = await app.request('/v1/capacity-windows', json(windowBody, {
    'idempotency-key': 'cap-create-1',
    ...bearer(staff),
  }));
  assert.equal(created.status, 201);
  const window = await created.json();
  assert.equal(window.actorId, actorId);
  assert.equal(window.kind, 'consultation');
  assert.equal(Object.hasOwn(window, 'email'), false);

  const replay = await app.request('/v1/capacity-windows', json(windowBody, {
    'idempotency-key': 'cap-create-1',
    ...bearer(staff),
  }));
  assert.equal(replay.status, 201);
  assert.equal((await replay.json()).id, window.id);

  const conflict = await app.request('/v1/capacity-windows', json({
    ...windowBody,
    endsAt: '2026-06-01T13:00:00.000Z',
  }, {
    'idempotency-key': 'cap-create-1',
    ...bearer(staff),
  }));
  assert.equal(conflict.status, 409);

  const inside = await app.request('/v1/capacity-decisions', json({
    kind: 'consultation',
    promisedAt: '2026-06-01T09:00:00.000Z',
    actorId,
  }, bearer(staff)));
  assert.equal(inside.status, 200);
  assert.deepEqual(await inside.json(), { ok: true, windowId: window.id });

  const outside = await app.request('/v1/capacity-decisions', json({
    kind: 'consultation',
    promisedAt: '2026-06-01T13:00:00.000Z',
    actorId,
  }, bearer(staff)));
  assert.equal(outside.status, 200);
  assert.deepEqual(await outside.json(), { ok: false, reason: 'CAPACITY_OUTSIDE' });

  const mismatch = await app.request('/v1/capacity-decisions', json({
    kind: 'start',
    promisedAt: '2026-06-01T09:00:00.000Z',
    actorId,
  }, bearer(staff)));
  assert.equal(mismatch.status, 200);
  assert.deepEqual(await mismatch.json(), { ok: false, reason: 'CAPACITY_KIND_MISMATCH' });

  const listed = await app.request('/v1/capacity-windows', { headers: bearer(staff) });
  assert.equal(listed.status, 200);
  const page = await listed.json();
  assert.equal(page.items.length, 1);
  assert.equal(page.items[0].id, window.id);
  assert.equal((await app.request(`/v1/capacity-windows/${window.id}`, { headers: bearer(staff) })).status, 200);
  assert.equal((await app.request(`/v1/capacity-windows/${window.id}`, { headers: bearer(portal) })).status, 403);
});

test('portal milestone projection follows the owning project subject (BOLA)', async () => {
  const { app } = appFor();
  assert.equal((await app.request('/v1/portal/milestones')).status, 401);
  assert.equal((await app.request('/v1/portal/milestones', { headers: bearer(staff) })).status, 403);
  assert.equal((await app.request('/v1/portal/decision-log', { headers: bearer(portal) })).status, 404);

  const project = await createDeliveredProject(app, { clientSubject: 'portal-ola', suffix: 'pms' });
  const hidden = await createDeliveredProject(app, { suffix: 'pmh' });
  const created = await app.request('/v1/milestones', json({
    projectId: project.id,
    title: 'Sadzenie',
    dueAt: '2026-11-01T10:00:00.000Z',
  }, { ...bearer(staff), 'idempotency-key': 'pms-create-1' }));
  assert.equal(created.status, 201);
  const milestone = await created.json();
  const hiddenCreated = await app.request('/v1/milestones', json({
    projectId: hidden.id,
    title: 'Ukryty kamień',
  }, { ...bearer(staff), 'idempotency-key': 'pms-create-hidden' }));
  assert.equal(hiddenCreated.status, 201);
  const hiddenMilestone = await hiddenCreated.json();

  const portalList = await app.request('/v1/portal/milestones', { headers: bearer(portal) });
  assert.equal(portalList.status, 200);
  const portalBody = await portalList.json();
  assert.equal(portalBody.items.length, 1);
  assert.equal(portalBody.items[0].id, milestone.id);
  assert.equal(portalBody.items[0].title, 'Sadzenie');
  assert.equal(portalBody.items[0].status, 'planned');
  assert.equal(portalBody.items[0].dueAt, '2026-11-01T10:00:00.000Z');
  assert.equal(Object.hasOwn(portalBody.items[0], 'updatedAt'), false);
  assert.equal(Object.hasOwn(portalBody.items[0], 'clientSubject'), false);
  assert.equal(Object.hasOwn(portalBody.items[0], 'payment'), false);

  const own = await app.request(`/v1/portal/milestones/${milestone.id}`, { headers: bearer(portal) });
  assert.equal(own.status, 200);
  assert.equal((await own.json()).title, 'Sadzenie');
  assert.equal((await app.request(`/v1/portal/milestones/${milestone.id}`, { headers: bearer(portalOther) })).status, 404);
  assert.equal((await app.request(`/v1/portal/milestones/${hiddenMilestone.id}`, { headers: bearer(portal) })).status, 404);
  const otherList = await (await app.request('/v1/portal/milestones', { headers: bearer(portalOther) })).json();
  assert.equal(otherList.items.length, 0);
  assert.equal((await app.request(`/v1/milestones/${milestone.id}`, { headers: bearer(portal) })).status, 403);
  assert.equal((await app.request(`/v1/milestones/${milestone.id}`, { headers: bearer(staff) })).status, 200);

  const skipped = await app.request(`/v1/milestones/${milestone.id}/status`, json({ status: 'done' }, {
    ...bearer(staff),
    'idempotency-key': 'pms-status-skip',
  }));
  assert.equal(skipped.status, 409);
  const forbidden = await app.request(`/v1/milestones/${milestone.id}/status`, json({ status: 'active', payment: true }, {
    ...bearer(staff),
    'idempotency-key': 'pms-status-pay',
  }));
  assert.equal(forbidden.status, 400);
  assert.equal((await app.request(`/v1/milestones/${milestone.id}/status`, json({ status: 'active' }, {
    ...bearer(portal),
    'idempotency-key': 'pms-status-portal',
  }))).status, 403);
  const started = await app.request(`/v1/milestones/${milestone.id}/status`, json({ status: 'active' }, {
    ...bearer(staff),
    'idempotency-key': 'pms-status-active',
  }));
  assert.equal(started.status, 200);
  assert.equal((await started.json()).status, 'active');
  const replay = await app.request(`/v1/milestones/${milestone.id}/status`, json({ status: 'active' }, {
    ...bearer(staff),
    'idempotency-key': 'pms-status-active',
  }));
  assert.equal(replay.status, 200);
  const finished = await app.request(`/v1/milestones/${milestone.id}/status`, json({ status: 'done' }, {
    ...bearer(staff),
    'idempotency-key': 'pms-status-done',
  }));
  assert.equal(finished.status, 200);
  assert.equal((await finished.json()).status, 'done');
  const portalAfter = await (await app.request('/v1/portal/milestones', { headers: bearer(portal) })).json();
  assert.equal(portalAfter.items[0].status, 'done');
  assert.equal(Object.hasOwn(portalAfter.items[0], 'updatedAt'), false);
  assert.equal((await app.request(`/v1/milestones/${milestone.id}/status`, json({ status: 'active' }, {
    ...bearer(staff),
    'idempotency-key': 'pms-status-back',
  }))).status, 409);
});
