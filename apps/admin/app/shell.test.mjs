import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  adminErrorMessage,
  adminOriginAllowed,
  adminSessionCookiePresent,
  adminShell,
  classifyAdminSession,
  createAdminContract,
  createAdminOffer,
  createAdminOpportunity,
  createAdminProject,
  fetchAdminContracts,
  fetchAdminLeads,
  fetchAdminOffers,
  fetchAdminOpportunities,
  fetchAdminProjects,
  mapContractPage,
  mapLeadPage,
  mapOfferPage,
  mapOpportunityPage,
  mapProjectPage,
  qualifyAdminLead,
  resolveAdminHome,
} from './shell.ts';

const emptyCrm = {
  leads: { status: 'empty' },
  opportunities: { status: 'empty' },
  offers: { status: 'empty' },
  contracts: { status: 'empty' },
  projects: { status: 'empty' },
};

const prohibited = [
  'kompleksowe rozwiązania',
  'z pasją',
  'innowacyjne',
  'najwyższa jakość',
  'lider',
  'eksperci',
  'premium',
  'bezkonkurencyjny',
  'dowiedz się więcej',
];

const crmLeak = ['lead nr', 'oferta nr', 'umowa nr', 'faktura', 'płatność', 'projekt klienta'];

test('the admin shell is a signed-out staff gate without invented CRM rows', () => {
  const html = renderToStaticMarkup(adminShell({ state: 'signed-out' }));
  assert.match(html, /Forma Zieleni/);
  assert.match(html, /Panel personelu/);
  assert.match(html, /Zaloguj się, aby kontynuować pracę operacyjną\./);
  for (const phrase of [...prohibited, ...crmLeak]) {
    assert.equal(html.toLowerCase().includes(phrase), false, phrase);
  }
  assert.equal(adminErrorMessage(404), 'Nie ma takiej strony.');
  assert.match(adminErrorMessage(null), /Odśwież stronę/);
  assert.equal(adminErrorMessage(null).includes('stack'), false);
});

test('admin session classification enforces the admin trust zone', async () => {
  assert.deepEqual(classifyAdminSession(null), { state: 'signed-out' });
  assert.deepEqual(classifyAdminSession({ clientId: 'portal' }), { state: 'unauthorized' });
  assert.deepEqual(classifyAdminSession({ clientId: 'web' }), { state: 'unauthorized' });
  assert.deepEqual(classifyAdminSession({ clientId: 'admin' }), { state: 'signed-in' });
  assert.equal(adminOriginAllowed(null, ['http://127.0.0.1:5175']), false);
  assert.equal(adminOriginAllowed('http://evil.example', ['http://127.0.0.1:5175']), false);
  assert.equal(adminOriginAllowed('http://127.0.0.1:5175', ['http://127.0.0.1:5175']), true);
  assert.equal(adminSessionCookiePresent(null), false);
  assert.equal(adminSessionCookiePresent('better-auth.session_token=abc'), true);
  assert.deepEqual(await resolveAdminHome({}), { state: 'signed-out' });
  assert.deepEqual(
    await resolveAdminHome({ probe: async () => ({ clientId: 'admin' }) }),
    { state: 'signed-in', ...emptyCrm },
  );
  const signedIn = renderToStaticMarkup(
    adminShell({ state: 'signed-in', ...emptyCrm }),
  );
  assert.match(signedIn, /Jesteś zalogowany/);
  assert.match(signedIn, /Brak leadów do pokazania/);
  assert.match(signedIn, /Brak szans do pokazania/);
  assert.match(signedIn, /Brak ofert do pokazania/);
  assert.match(signedIn, /Brak umów do pokazania/);
  assert.match(signedIn, /Brak projektów do pokazania/);
  assert.match(signedIn, /Utwórz szansę/);
  assert.match(signedIn, /Utwórz ofertę/);
  assert.match(signedIn, /Utwórz umowę/);
  assert.match(signedIn, /Utwórz projekt/);
  for (const phrase of crmLeak) {
    assert.equal(signedIn.toLowerCase().includes(phrase), false, phrase);
  }
  const unauthorized = renderToStaticMarkup(adminShell({ state: 'unauthorized' }));
  assert.match(unauthorized, /nie ma dostępu/);
});

test('signed-in lead list renders empty, error, forbidden, and real rows without inventing customers', () => {
  assert.match(
    renderToStaticMarkup(adminShell({ state: 'signed-in', leads: { status: 'error' }, opportunities: { status: 'empty' }, offers: { status: 'empty' }, contracts: { status: 'empty' }, projects: { status: 'empty' } })),
    /Listy leadów nie udało się pobrać/,
  );
  assert.match(
    renderToStaticMarkup(adminShell({ state: 'signed-in', leads: { status: 'forbidden' }, opportunities: { status: 'empty' }, offers: { status: 'empty' }, contracts: { status: 'empty' }, projects: { status: 'empty' } })),
    /nie może odczytać listy leadów/,
  );
  const ready = renderToStaticMarkup(
    adminShell({
      state: 'signed-in',
      leads: {
        status: 'ready',
        items: [
          {
            id: 'ld8k2n4p6q8r0s2t',
            status: 'received',
            contactName: 'Anna Kowalska',
            locality: 'Kraków',
            qualificationResult: 'pending',
          },
        ],
      },
      opportunities: {
        status: 'ready',
        items: [
          {
            id: 'op8k2n4p6q8r0s2t',
            leadId: 'ld8k2n4p6q8r0s2t',
            status: 'open',
          },
        ],
      },
      offers: {
        status: 'ready',
        items: [
          {
            id: 'of8k2n4p6q8r0s2t',
            opportunityId: 'op8k2n4p6q8r0s2t',
            status: 'draft',
          },
        ],
      },
      contracts: {
        status: 'ready',
        items: [
          {
            id: 'ct8k2n4p6q8r0s2t',
            offerId: 'of8k2n4p6q8r0s2t',
            status: 'draft',
          },
        ],
      },
      projects: {
        status: 'ready',
        items: [
          {
            id: 'pr8k2n4p6q8r0s2t',
            contractId: 'ct8k2n4p6q8r0s2t',
            status: 'draft',
          },
        ],
      },
    }),
  );
  assert.match(ready, /Anna Kowalska/);
  assert.match(ready, /Kraków/);
  assert.match(ready, /Kwalifikuj/);
  assert.match(ready, /name="leadId"/);
  assert.match(ready, /Szanse/);
  assert.match(ready, /op8k2n4p6q8r0s2t/);
  assert.match(ready, /ld8k2n4p6q8r0s2t/);
  assert.match(ready, /Utwórz szansę/);
  assert.match(ready, /Oferty/);
  assert.match(ready, /of8k2n4p6q8r0s2t/);
  assert.match(ready, /Utwórz ofertę/);
  assert.match(ready, /Umowy/);
  assert.match(ready, /ct8k2n4p6q8r0s2t/);
  assert.match(ready, /Utwórz umowę/);
  assert.match(ready, /Projekty/);
  assert.match(ready, /pr8k2n4p6q8r0s2t/);
  assert.match(ready, /ct8k2n4p6q8r0s2t/);
  assert.match(ready, /Utwórz projekt/);
  assert.equal(ready.toLowerCase().includes('lead nr'), false);
  assert.equal(ready.toLowerCase().includes('oferta nr'), false);
  assert.equal(ready.toLowerCase().includes('umowa nr'), false);
  assert.equal(ready.toLowerCase().includes('price'), false);
  assert.equal(ready.toLowerCase().includes('płatność'), false);
  assert.equal(ready.toLowerCase().includes('podpis'), false);
});

test('mapContractPage and Core API contract fetch/create stay truthful', async () => {
  assert.deepEqual(mapContractPage({ items: [] }), { status: 'empty' });
  assert.deepEqual(mapContractPage({ items: [{ id: 1 }] }), { status: 'error' });
  assert.deepEqual(
    mapContractPage({
      items: [{ id: 'ct8k2n4p6q8r0s2t', offerId: 'of8k2n4p6q8r0s2t', status: 'draft' }],
    }),
    {
      status: 'ready',
      items: [{ id: 'ct8k2n4p6q8r0s2t', offerId: 'of8k2n4p6q8r0s2t', status: 'draft' }],
    },
  );

  const empty = await fetchAdminContracts({
    base: 'http://127.0.0.1:8787',
    fetchImpl: async () => new Response(JSON.stringify({ items: [], meta: {} }), { status: 200 }),
  });
  assert.deepEqual(empty, { status: 'empty' });

  const forbidden = await fetchAdminContracts({
    base: 'http://127.0.0.1:8787',
    fetchImpl: async () => new Response('', { status: 403 }),
  });
  assert.deepEqual(forbidden, { status: 'forbidden' });

  const created = await createAdminContract({
    base: 'http://127.0.0.1:8787',
    offerId: 'of8k2n4p6q8r0s2t',
    idempotencyKey: 'admin-contract-0001',
    async fetchImpl(url, init) {
      assert.match(String(url), /\/v1\/contracts$/);
      assert.equal(init?.method, 'POST');
      assert.equal(new Headers(init?.headers).get('idempotency-key'), 'admin-contract-0001');
      assert.equal(String(init?.body), JSON.stringify({ offerId: 'of8k2n4p6q8r0s2t' }));
      return new Response(JSON.stringify({ id: 'ct8k2n4p6q8r0s2t', status: 'draft' }), { status: 201 });
    },
  });
  assert.deepEqual(created, { ok: true });

  const denied = await createAdminContract({
    base: 'http://127.0.0.1:8787',
    offerId: 'of8k2n4p6q8r0s2t',
    idempotencyKey: 'admin-contract-0002',
    async fetchImpl() {
      return new Response('', { status: 403 });
    },
  });
  assert.deepEqual(denied, { ok: false, reason: 'forbidden' });
});

test('mapProjectPage and Core API project fetch/create stay truthful', async () => {
  assert.deepEqual(mapProjectPage({ items: [] }), { status: 'empty' });
  assert.deepEqual(mapProjectPage({ items: [{ id: 1 }] }), { status: 'error' });
  assert.deepEqual(
    mapProjectPage({
      items: [{ id: 'pr8k2n4p6q8r0s2t', contractId: 'ct8k2n4p6q8r0s2t', status: 'draft' }],
    }),
    {
      status: 'ready',
      items: [{ id: 'pr8k2n4p6q8r0s2t', contractId: 'ct8k2n4p6q8r0s2t', status: 'draft' }],
    },
  );

  const empty = await fetchAdminProjects({
    base: 'http://127.0.0.1:8787',
    fetchImpl: async () => new Response(JSON.stringify({ items: [], meta: {} }), { status: 200 }),
  });
  assert.deepEqual(empty, { status: 'empty' });

  const forbidden = await fetchAdminProjects({
    base: 'http://127.0.0.1:8787',
    fetchImpl: async () => new Response('', { status: 403 }),
  });
  assert.deepEqual(forbidden, { status: 'forbidden' });

  const created = await createAdminProject({
    base: 'http://127.0.0.1:8787',
    contractId: 'ct8k2n4p6q8r0s2t',
    idempotencyKey: 'admin-project-0001',
    async fetchImpl(url, init) {
      assert.match(String(url), /\/v1\/projects$/);
      assert.equal(init?.method, 'POST');
      assert.equal(new Headers(init?.headers).get('idempotency-key'), 'admin-project-0001');
      assert.equal(String(init?.body), JSON.stringify({ contractId: 'ct8k2n4p6q8r0s2t' }));
      return new Response(JSON.stringify({ id: 'pr8k2n4p6q8r0s2t', status: 'draft' }), { status: 201 });
    },
  });
  assert.deepEqual(created, { ok: true });

  const denied = await createAdminProject({
    base: 'http://127.0.0.1:8787',
    contractId: 'ct8k2n4p6q8r0s2t',
    idempotencyKey: 'admin-project-0002',
    async fetchImpl() {
      return new Response('', { status: 403 });
    },
  });
  assert.deepEqual(denied, { ok: false, reason: 'forbidden' });
});

test('mapOpportunityPage and Core API opportunity fetch/create stay truthful', async () => {
  assert.deepEqual(mapOpportunityPage({ items: [] }), { status: 'empty' });
  assert.deepEqual(mapOpportunityPage({ items: [{ id: 1 }] }), { status: 'error' });
  assert.deepEqual(
    mapOpportunityPage({
      items: [{ id: 'op8k2n4p6q8r0s2t', leadId: 'ld8k2n4p6q8r0s2t', status: 'open', stage: 'x' }],
    }),
    { status: 'error' },
  );
  assert.deepEqual(
    mapOpportunityPage({
      items: [{ id: 'op8k2n4p6q8r0s2t', leadId: 'ld8k2n4p6q8r0s2t', status: 'open' }],
    }),
    {
      status: 'ready',
      items: [{ id: 'op8k2n4p6q8r0s2t', leadId: 'ld8k2n4p6q8r0s2t', status: 'open' }],
    },
  );

  const empty = await fetchAdminOpportunities({
    base: 'http://127.0.0.1:8787',
    fetchImpl: async () => new Response(JSON.stringify({ items: [], meta: {} }), { status: 200 }),
  });
  assert.deepEqual(empty, { status: 'empty' });

  const forbidden = await fetchAdminOpportunities({
    base: 'http://127.0.0.1:8787',
    fetchImpl: async () => new Response('', { status: 403 }),
  });
  assert.deepEqual(forbidden, { status: 'forbidden' });

  const created = await createAdminOpportunity({
    base: 'http://127.0.0.1:8787',
    leadId: 'ld8k2n4p6q8r0s2t',
    idempotencyKey: 'admin-opportunity-0001',
    async fetchImpl(url, init) {
      assert.match(String(url), /\/v1\/opportunities$/);
      assert.equal(init?.method, 'POST');
      assert.equal(new Headers(init?.headers).get('idempotency-key'), 'admin-opportunity-0001');
      assert.equal(String(init?.body), JSON.stringify({ leadId: 'ld8k2n4p6q8r0s2t' }));
      return new Response(JSON.stringify({ id: 'op8k2n4p6q8r0s2t', status: 'open' }), { status: 201 });
    },
  });
  assert.deepEqual(created, { ok: true });

  const denied = await createAdminOpportunity({
    base: 'http://127.0.0.1:8787',
    leadId: 'ld8k2n4p6q8r0s2t',
    idempotencyKey: 'admin-opportunity-0002',
    async fetchImpl() {
      return new Response('', { status: 403 });
    },
  });
  assert.deepEqual(denied, { ok: false, reason: 'forbidden' });
});

test('mapOfferPage and Core API offer fetch/create stay truthful', async () => {
  assert.deepEqual(mapOfferPage({ items: [] }), { status: 'empty' });
  assert.deepEqual(mapOfferPage({ items: [{ id: 1 }] }), { status: 'error' });
  assert.deepEqual(
    mapOfferPage({
      items: [{ id: 'of8k2n4p6q8r0s2t', opportunityId: 'op8k2n4p6q8r0s2t', status: 'draft', price: 10 }],
    }),
    { status: 'error' },
  );
  assert.deepEqual(
    mapOfferPage({
      items: [{ id: 'of8k2n4p6q8r0s2t', opportunityId: 'op8k2n4p6q8r0s2t', status: 'draft' }],
    }),
    {
      status: 'ready',
      items: [{ id: 'of8k2n4p6q8r0s2t', opportunityId: 'op8k2n4p6q8r0s2t', status: 'draft' }],
    },
  );

  const empty = await fetchAdminOffers({
    base: 'http://127.0.0.1:8787',
    fetchImpl: async () => new Response(JSON.stringify({ items: [], meta: {} }), { status: 200 }),
  });
  assert.deepEqual(empty, { status: 'empty' });

  const forbidden = await fetchAdminOffers({
    base: 'http://127.0.0.1:8787',
    fetchImpl: async () => new Response('', { status: 403 }),
  });
  assert.deepEqual(forbidden, { status: 'forbidden' });

  const created = await createAdminOffer({
    base: 'http://127.0.0.1:8787',
    opportunityId: 'op8k2n4p6q8r0s2t',
    idempotencyKey: 'admin-offer-0001',
    async fetchImpl(url, init) {
      assert.match(String(url), /\/v1\/offers$/);
      assert.equal(init?.method, 'POST');
      assert.equal(new Headers(init?.headers).get('idempotency-key'), 'admin-offer-0001');
      assert.equal(String(init?.body), JSON.stringify({ opportunityId: 'op8k2n4p6q8r0s2t' }));
      return new Response(JSON.stringify({ id: 'of8k2n4p6q8r0s2t', status: 'draft' }), { status: 201 });
    },
  });
  assert.deepEqual(created, { ok: true });

  const denied = await createAdminOffer({
    base: 'http://127.0.0.1:8787',
    opportunityId: 'op8k2n4p6q8r0s2t',
    idempotencyKey: 'admin-offer-0002',
    async fetchImpl() {
      return new Response('', { status: 403 });
    },
  });
  assert.deepEqual(denied, { ok: false, reason: 'forbidden' });
});

test('mapLeadPage and Core API lead fetch stay truthful', async () => {
  assert.deepEqual(mapLeadPage({ items: [] }), { status: 'empty' });
  assert.deepEqual(mapLeadPage({ items: [{ id: 1 }] }), { status: 'error' });
  assert.deepEqual(
    mapLeadPage({
      items: [
        {
          id: 'ld8k2n4p6q8r0s2t',
          status: 'received',
          contact: { name: 'Anna Kowalska' },
          property: { locality: 'Kraków' },
          qualification: { result: 'pending' },
        },
      ],
    }),
    {
      status: 'ready',
      items: [
        {
          id: 'ld8k2n4p6q8r0s2t',
          status: 'received',
          contactName: 'Anna Kowalska',
          locality: 'Kraków',
          qualificationResult: 'pending',
        },
      ],
    },
  );

  const empty = await fetchAdminLeads({
    base: 'http://127.0.0.1:8787',
    fetchImpl: async () => new Response(JSON.stringify({ items: [], meta: {} }), { status: 200 }),
  });
  assert.deepEqual(empty, { status: 'empty' });

  const forbidden = await fetchAdminLeads({
    base: 'http://127.0.0.1:8787',
    fetchImpl: async () => new Response('', { status: 403 }),
  });
  assert.deepEqual(forbidden, { status: 'forbidden' });

  const errored = await fetchAdminLeads({
    base: 'http://127.0.0.1:8787',
    fetchImpl: async () => new Response('', { status: 500 }),
  });
  assert.deepEqual(errored, { status: 'error' });
});

test('API-backed qualify workflow posts capacityHold with idempotency and blocks forbidden clients', async () => {
  /** @type {{ method?: string, headers?: Headers, body?: string }[]} */
  const calls = [];
  const ok = await qualifyAdminLead({
    base: 'http://127.0.0.1:8787',
    leadId: 'ld8k2n4p6q8r0s2t',
    capacityHold: false,
    idempotencyKey: 'admin-qual-0001',
    async fetchImpl(url, init) {
      calls.push({ method: init?.method, headers: new Headers(init?.headers), body: String(init?.body ?? '') });
      assert.match(String(url), /\/v1\/leads\/ld8k2n4p6q8r0s2t\/qualify$/);
      return new Response(JSON.stringify({ id: 'ld8k2n4p6q8r0s2t', status: 'qualified' }), { status: 200 });
    },
  });
  assert.deepEqual(ok, { ok: true });
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].headers?.get('idempotency-key'), 'admin-qual-0001');
  assert.equal(calls[0].body, JSON.stringify({ capacityHold: false }));

  const denied = await qualifyAdminLead({
    base: 'http://127.0.0.1:8787',
    leadId: 'ld8k2n4p6q8r0s2t',
    capacityHold: true,
    idempotencyKey: 'admin-qual-0002',
    async fetchImpl() {
      return new Response('', { status: 403 });
    },
  });
  assert.deepEqual(denied, { ok: false, reason: 'forbidden' });
});

test('the route module keeps an error boundary and wires Core API CRM lead/opportunity/offer/contract/project flow', () => {
  const home = readFileSync(new URL('./routes/home.tsx', import.meta.url), 'utf8');
  const root = readFileSync(new URL('./root.tsx', import.meta.url), 'utf8');
  const shell = readFileSync(new URL('./shell.ts', import.meta.url), 'utf8');
  assert.match(home, /adminShell/);
  assert.match(home, /resolveAdminHome/);
  assert.match(home, /fetchAdminLeads/);
  assert.match(home, /fetchAdminOpportunities/);
  assert.match(home, /fetchAdminOffers/);
  assert.match(home, /fetchAdminContracts/);
  assert.match(home, /qualifyAdminLead/);
  assert.match(home, /createAdminOpportunity/);
  assert.match(home, /createAdminOffer/);
  assert.match(home, /createAdminContract/);
  assert.match(home, /fetchAdminProjects/);
  assert.match(home, /createAdminProject/);
  assert.match(home, /request\.headers\.get\('cookie'\)/);
  assert.match(home, /actionData/);
  assert.match(home, /role: 'alert'/);
  assert.match(root, /export function ErrorBoundary/);
  assert.match(root, /adminErrorMessage/);
  assert.match(root, /noindex/);
  assert.equal(home.includes('fonts.googleapis.com'), false);
  assert.equal(root.includes('fonts.googleapis.com'), false);
  assert.equal(shell.includes('leads:read'), false);
  assert.equal(shell.includes('opportunities:read'), false);
  assert.equal(shell.includes('opportunities:create'), false);
  assert.equal(shell.includes('offers:read'), false);
  assert.equal(shell.includes('offers:create'), false);
  assert.equal(shell.includes('contracts:read'), false);
  assert.equal(shell.includes('contracts:create'), false);
  assert.equal(shell.includes('projects:read'), false);
  assert.equal(shell.includes('projects:create'), false);
  assert.equal(shell.toLowerCase().includes('podpis'), false);
  assert.equal(shell.toLowerCase().includes('płatność'), false);
  for (const phrase of prohibited) {
    assert.equal(home.toLowerCase().includes(phrase), false, phrase);
    assert.equal(root.toLowerCase().includes(phrase), false, phrase);
  }
});
