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
  fetchAdminLeads,
  mapLeadPage,
  qualifyAdminLead,
  resolveAdminHome,
} from './shell.ts';

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
    { state: 'signed-in', leads: { status: 'empty' } },
  );
  const signedIn = renderToStaticMarkup(adminShell({ state: 'signed-in', leads: { status: 'empty' } }));
  assert.match(signedIn, /Jesteś zalogowany/);
  assert.match(signedIn, /Brak leadów do pokazania/);
  for (const phrase of crmLeak) {
    assert.equal(signedIn.toLowerCase().includes(phrase), false, phrase);
  }
  const unauthorized = renderToStaticMarkup(adminShell({ state: 'unauthorized' }));
  assert.match(unauthorized, /nie ma dostępu/);
});

test('signed-in lead list renders empty, error, forbidden, and real rows without inventing customers', () => {
  assert.match(
    renderToStaticMarkup(adminShell({ state: 'signed-in', leads: { status: 'error' } })),
    /Listy leadów nie udało się pobrać/,
  );
  assert.match(
    renderToStaticMarkup(adminShell({ state: 'signed-in', leads: { status: 'forbidden' } })),
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
    }),
  );
  assert.match(ready, /Anna Kowalska/);
  assert.match(ready, /Kraków/);
  assert.match(ready, /Kwalifikuj/);
  assert.match(ready, /name="leadId"/);
  assert.equal(ready.toLowerCase().includes('lead nr'), false);
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

test('the route module keeps an error boundary and wires Core API lead flow', () => {
  const home = readFileSync(new URL('./routes/home.tsx', import.meta.url), 'utf8');
  const root = readFileSync(new URL('./root.tsx', import.meta.url), 'utf8');
  const shell = readFileSync(new URL('./shell.ts', import.meta.url), 'utf8');
  assert.match(home, /adminShell/);
  assert.match(home, /resolveAdminHome/);
  assert.match(home, /fetchAdminLeads/);
  assert.match(home, /qualifyAdminLead/);
  assert.match(home, /export async function action/);
  assert.match(root, /export function ErrorBoundary/);
  assert.match(root, /adminErrorMessage/);
  assert.match(root, /noindex/);
  assert.equal(home.includes('fonts.googleapis.com'), false);
  assert.equal(root.includes('fonts.googleapis.com'), false);
  assert.equal(shell.includes('leads:read'), false);
  assert.equal(shell.includes('offers:'), false);
  assert.equal(shell.includes('projects:'), false);
  for (const phrase of prohibited) {
    assert.equal(home.toLowerCase().includes(phrase), false, phrase);
    assert.equal(root.toLowerCase().includes(phrase), false, phrase);
  }
});
