import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  adminErrorMessage,
  adminOriginAllowed,
  adminSessionCookiePresent,
  adminShell,
  advanceAdminContractLifecycle,
  capacityDecisionMessage,
  createAdminCapacityWindow,
  decideAdminCapacity,
  fetchAdminCapacityWindows,
  mapCapacityWindowPage,
  classifyAdminSession,
  createAdminContract,
  createAdminOffer,
  createAdminOpportunity,
  createAdminFile,
  createAdminMilestone,
  createAdminProject,
  fetchAdminContracts,
  fetchAdminFileBytes,
  fetchAdminFiles,
  fetchAdminLeads,
  fetchAdminMilestones,
  fetchAdminOffers,
  fetchAdminOpportunities,
  fetchAdminProjects,
  mapContractPage,
  mapFilePage,
  mapLeadPage,
  mapMilestonePage,
  mapOfferPage,
  mapOpportunityPage,
  mapProjectPage,
  nextAdminContractLifecycleStatus,
  putAdminFileBytes,
  qualifyAdminLead,
  fetchAdminSigningSandbox,
  openAdminSigningSandbox,
  resolveAdminHome,
} from './shell.ts';

const emptyCrm = {
  leads: { status: 'empty' },
  opportunities: { status: 'empty' },
  offers: { status: 'empty' },
  contracts: { status: 'empty' },
  projects: { status: 'empty' },
  files: { status: 'empty' },
  paymentSchedules: { status: 'empty' },
  capacityWindows: { status: 'empty' },
  signingSandbox: { status: 'empty' },
  milestones: { status: 'empty' },
  proposals: { status: 'empty' },
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
  assert.match(signedIn, /Brak plików do pokazania/);
  assert.match(signedIn, /Utwórz szansę/);
  assert.match(signedIn, /Utwórz ofertę/);
  assert.match(signedIn, /Utwórz umowę/);
  assert.match(signedIn, /Utwórz projekt/);
  assert.match(signedIn, /Brak kamieni milowych do pokazania/);
  assert.match(signedIn, /Zapisz kamień milowy/);
  assert.match(signedIn, /Utwórz plik/);
  for (const phrase of crmLeak) {
    assert.equal(signedIn.toLowerCase().includes(phrase), false, phrase);
  }
  const unauthorized = renderToStaticMarkup(adminShell({ state: 'unauthorized' }));
  assert.match(unauthorized, /nie ma dostępu/);
});

test('signed-in lead list renders empty, error, forbidden, and real rows without inventing customers', () => {
  assert.match(
    renderToStaticMarkup(adminShell({ state: 'signed-in', leads: { status: 'error' }, opportunities: { status: 'empty' }, offers: { status: 'empty' }, contracts: { status: 'empty' }, projects: { status: 'empty' }, files: { status: 'empty' }, paymentSchedules: { status: 'empty' }, capacityWindows: { status: 'empty' }, signingSandbox: { status: 'empty' }, milestones: { status: 'empty' }, proposals: { status: 'empty' } })),
    /Listy leadów nie udało się pobrać/,
  );
  assert.match(
    renderToStaticMarkup(adminShell({ state: 'signed-in', leads: { status: 'forbidden' }, opportunities: { status: 'empty' }, offers: { status: 'empty' }, contracts: { status: 'empty' }, projects: { status: 'empty' }, files: { status: 'empty' }, paymentSchedules: { status: 'empty' }, capacityWindows: { status: 'empty' }, signingSandbox: { status: 'empty' }, milestones: { status: 'empty' }, proposals: { status: 'empty' } })),
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
      files: { status: 'empty' },
      paymentSchedules: {
        status: 'ready',
        items: [
          {
            id: 'ps8k2n4p6q8r0s2t',
            contractId: 'ct8k2n4p6q8r0s2t',
            currency: 'PLN',
            installments: [
              { id: 'pi8k2n4p6q8r0s2a', sequence: 1, amountMinor: 40000, status: 'scheduled' },
            ],
          },
        ],
      },
      capacityWindows: { status: 'empty' },
      signingSandbox: { status: 'ready', contractId: 'ct8k2n4p6q8r0s2t', envelopeStatus: 'pending' },
      milestones: { status: 'empty' },
      proposals: { status: 'empty' },
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
  assert.match(ready, /Do przeglądu/);
  assert.match(ready, /advance-contract-lifecycle/);
  assert.match(ready, /Harmonogramy płatności/);
  assert.match(ready, /Koperta sandbox oczekuje/);
  assert.match(ready, /Otwórz kopertę sandbox/);
  assert.equal(ready.includes('QES'), false);
  assert.match(ready, /ps8k2n4p6q8r0s2t/);
  assert.match(ready, /create-payment-schedule/);
  assert.match(ready, /transition-payment-installment/);
  assert.match(ready, /Oznacz jako należną/);
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

  assert.equal(nextAdminContractLifecycleStatus('draft'), 'internal_review');
  assert.equal(nextAdminContractLifecycleStatus('internal_review'), 'approved');
  assert.equal(nextAdminContractLifecycleStatus('approved'), 'sent');
  assert.equal(nextAdminContractLifecycleStatus('sent'), null);

  const advanced = await advanceAdminContractLifecycle({
    base: 'http://127.0.0.1:8787',
    contractId: 'ct8k2n4p6q8r0s2t',
    status: 'internal_review',
    idempotencyKey: 'admin-life-0001',
    async fetchImpl(url, init) {
      assert.match(String(url), /\/v1\/contracts\/ct8k2n4p6q8r0s2t\/lifecycle$/);
      assert.equal(init?.method, 'POST');
      assert.equal(new Headers(init?.headers).get('idempotency-key'), 'admin-life-0001');
      assert.equal(String(init?.body), JSON.stringify({ status: 'internal_review' }));
      return new Response(JSON.stringify({ id: 'ct8k2n4p6q8r0s2t', status: 'internal_review' }), { status: 200 });
    },
  });
  assert.deepEqual(advanced, { ok: true });

  const lifecycleDenied = await advanceAdminContractLifecycle({
    base: 'http://127.0.0.1:8787',
    contractId: 'ct8k2n4p6q8r0s2t',
    status: 'internal_review',
    idempotencyKey: 'admin-life-0002',
    async fetchImpl() {
      return new Response('', { status: 403 });
    },
  });
  assert.deepEqual(lifecycleDenied, { ok: false, reason: 'forbidden' });
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

test('mapFilePage and Core API file fetch/create stay truthful', async () => {
  assert.deepEqual(mapFilePage({ items: [] }), { status: 'empty' });
  assert.deepEqual(mapFilePage({ items: [{ id: 1 }] }), { status: 'error' });
  assert.deepEqual(
    mapFilePage({
      items: [{
        id: 'fl8k2n4p6q8r0s2t',
        projectId: 'pr8k2n4p6q8r0s2t',
        name: 'plan.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
        storageKey: 'secret',
      }],
    }),
    { status: 'error' },
  );
  assert.deepEqual(
    mapFilePage({
      items: [{
        id: 'fl8k2n4p6q8r0s2t',
        projectId: 'pr8k2n4p6q8r0s2t',
        name: 'plan.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
      }],
    }),
    {
      status: 'ready',
      items: [{
        id: 'fl8k2n4p6q8r0s2t',
        projectId: 'pr8k2n4p6q8r0s2t',
        name: 'plan.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
      }],
    },
  );

  const empty = await fetchAdminFiles({
    base: 'http://127.0.0.1:8787',
    fetchImpl: async () => new Response(JSON.stringify({ items: [], meta: {} }), { status: 200 }),
  });
  assert.deepEqual(empty, { status: 'empty' });

  const forbidden = await fetchAdminFiles({
    base: 'http://127.0.0.1:8787',
    fetchImpl: async () => new Response('', { status: 403 }),
  });
  assert.deepEqual(forbidden, { status: 'forbidden' });

  const created = await createAdminFile({
    base: 'http://127.0.0.1:8787',
    projectId: 'pr8k2n4p6q8r0s2t',
    name: 'plan.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 2048,
    idempotencyKey: 'admin-file-0001',
    async fetchImpl(url, init) {
      assert.match(String(url), /\/v1\/files$/);
      assert.equal(init?.method, 'POST');
      assert.equal(new Headers(init?.headers).get('idempotency-key'), 'admin-file-0001');
      assert.equal(
        String(init?.body),
        JSON.stringify({
          projectId: 'pr8k2n4p6q8r0s2t',
          name: 'plan.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 2048,
        }),
      );
      return new Response(JSON.stringify({ id: 'fl8k2n4p6q8r0s2t' }), { status: 201 });
    },
  });
  assert.deepEqual(created, { ok: true });

  const denied = await createAdminFile({
    base: 'http://127.0.0.1:8787',
    projectId: 'pr8k2n4p6q8r0s2t',
    name: 'plan.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 2048,
    idempotencyKey: 'admin-file-0002',
    async fetchImpl() {
      return new Response('', { status: 403 });
    },
  });
  assert.deepEqual(denied, { ok: false, reason: 'forbidden' });

  assert.deepEqual(
    await createAdminFile({
      base: 'http://127.0.0.1:8787',
      projectId: 'pr8k2n4p6q8r0s2t',
      name: 'empty.bin',
      mimeType: 'application/octet-stream',
      sizeBytes: 0,
      idempotencyKey: 'admin-file-0003',
      async fetchImpl() {
        assert.fail('zero sizeBytes must not call Core API');
      },
    }),
    { ok: false, reason: 'error' },
  );
});

test('putAdminFileBytes and fetchAdminFileBytes stay on Core API with real empty/forbidden states', async () => {
  const bytes = new TextEncoder().encode('synthetic-private-bytes');
  const checksum = 'a'.repeat(64);

  const putOk = await putAdminFileBytes({
    base: 'http://127.0.0.1:8787',
    fileId: 'fl8k2n4p6q8r0s2t',
    bytes,
    async fetchImpl(url, init) {
      assert.match(String(url), /\/v1\/files\/fl8k2n4p6q8r0s2t\/content$/);
      assert.equal(init?.method, 'PUT');
      assert.equal(new Headers(init?.headers).get('content-length'), String(bytes.byteLength));
      assert.equal(Object.hasOwn(Object(init), 'storageKey'), false);
      return new Response(JSON.stringify({
        id: 'fl8k2n4p6q8r0s2t',
        checksum,
        sizeBytes: bytes.byteLength,
        publicUrl: null,
      }), { status: 201 });
    },
  });
  assert.deepEqual(putOk, { ok: true, checksum, sizeBytes: bytes.byteLength });

  assert.deepEqual(
    await putAdminFileBytes({
      base: 'http://127.0.0.1:8787',
      fileId: 'fl8k2n4p6q8r0s2t',
      bytes,
      async fetchImpl() {
        return new Response('', { status: 403 });
      },
    }),
    { ok: false, reason: 'forbidden' },
  );
  assert.deepEqual(
    await putAdminFileBytes({
      base: 'http://127.0.0.1:8787',
      fileId: 'fl8k2n4p6q8r0s2t',
      bytes,
      async fetchImpl() {
        return new Response('', { status: 404 });
      },
    }),
    { ok: false, reason: 'not_found' },
  );
  assert.deepEqual(
    await putAdminFileBytes({
      base: 'http://127.0.0.1:8787',
      fileId: 'fl8k2n4p6q8r0s2t',
      bytes,
      async fetchImpl() {
        return new Response('', { status: 409 });
      },
    }),
    { ok: false, reason: 'conflict' },
  );
  assert.deepEqual(
    await putAdminFileBytes({
      base: 'http://127.0.0.1:8787',
      fileId: '../escape',
      bytes,
      async fetchImpl() {
        assert.fail('invalid file id must not call Core API');
      },
    }),
    { ok: false, reason: 'error' },
  );
  assert.deepEqual(
    await putAdminFileBytes({
      base: 'http://127.0.0.1:8787',
      fileId: 'fl8k2n4p6q8r0s2t',
      bytes,
      async fetchImpl() {
        return new Response(JSON.stringify({
          id: 'fl8k2n4p6q8r0s2t',
          checksum,
          sizeBytes: bytes.byteLength,
          publicUrl: null,
          storageKey: 'secret',
        }), { status: 201 });
      },
    }),
    { ok: false, reason: 'error' },
  );

  const getOk = await fetchAdminFileBytes({
    base: 'http://127.0.0.1:8787',
    fileId: 'fl8k2n4p6q8r0s2t',
    async fetchImpl(url, init) {
      assert.match(String(url), /\/v1\/files\/fl8k2n4p6q8r0s2t\/content$/);
      assert.equal(init?.method, undefined);
      return new Response(bytes, {
        status: 200,
        headers: {
          'content-type': 'application/octet-stream',
          'content-disposition': 'attachment; filename="notes.bin"',
          'x-content-checksum-sha256': checksum,
        },
      });
    },
  });
  assert.equal(getOk.ok, true);
  if (getOk.ok) {
    assert.equal(getOk.fileName, 'notes.bin');
    assert.equal(getOk.mimeType, 'application/octet-stream');
    assert.equal(getOk.checksum, checksum);
    assert.equal(getOk.sizeBytes, bytes.byteLength);
    assert.equal(Buffer.from(getOk.bytes).equals(Buffer.from(bytes)), true);
  }

  assert.deepEqual(
    await fetchAdminFileBytes({
      base: 'http://127.0.0.1:8787',
      fileId: 'fl8k2n4p6q8r0s2t',
      async fetchImpl() {
        return new Response('', { status: 404 });
      },
    }),
    { ok: false, reason: 'not_found' },
  );
  assert.deepEqual(
    await fetchAdminFileBytes({
      base: 'http://127.0.0.1:8787',
      fileId: 'fl8k2n4p6q8r0s2t',
      async fetchImpl() {
        return new Response('', { status: 403 });
      },
    }),
    { ok: false, reason: 'forbidden' },
  );

  const markup = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    files: {
      status: 'ready',
      items: [{
        id: 'fl8k2n4p6q8r0s2t',
        projectId: 'pr8k2n4p6q8r0s2t',
        name: 'notes.bin',
        mimeType: 'application/octet-stream',
        sizeBytes: bytes.byteLength,
      }],
    },
  }));
  assert.match(markup, /Pobierz «notes\.bin»/);
  assert.match(markup, /\/files\/fl8k2n4p6q8r0s2t\/content/);
  assert.match(markup, /upload-file-bytes/);
  assert.match(markup, /Wgraj bajty «notes\.bin»/);
  assert.match(markup, /dokładnie 23 B/);
  assert.match(markup, /aria-describedby="admin-file-bytes-hint-fl8k2n4p6q8r0s2t"/);
  assert.equal(markup.toLowerCase().includes('storagekey'), false);
  assert.equal(markup.toLowerCase().includes('garage'), false);
  const tokens = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
  assert.match(tokens, /\.admin-upload-file-bytes-hint\s*\{[^}]*color:\s*var\(--mech\)/s);
  assert.equal(/\.admin-upload-file-bytes-hint\s*\{[^}]*color:\s*var\(--kreska\)/s.test(tokens), false);
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

test('the route module keeps an error boundary and wires Core API CRM lead/opportunity/offer/contract/project/file flow', () => {
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
  assert.match(home, /advanceAdminContractLifecycle/);
  assert.match(home, /fetchAdminProjects/);
  assert.match(home, /fetchAdminMilestones/);
  assert.match(home, /createAdminMilestone/);
  assert.match(home, /createAdminProject/);
  assert.match(home, /fetchAdminFiles/);
  assert.match(home, /createAdminFile/);
  assert.match(home, /putAdminFileBytes/);
  assert.match(home, /upload-file-bytes/);
  assert.match(home, /ADMIN_FILE_BYTES_MAX/);
  assert.match(home, /fetchAdminPaymentSchedules/);
  assert.match(home, /open-signing-sandbox/);
  assert.match(home, /fetchAdminSigningSandbox/);
  assert.match(home, /openAdminSigningSandbox/);
  assert.match(home, /createAdminPaymentSchedule/);
  assert.match(home, /transitionAdminPaymentInstallment/);
  assert.match(home, /fetchAdminProposals/);
  assert.match(home, /reviewAdminProposal/);
  assert.match(home, /edit-proposal/);
  assert.match(home, /approve-proposal/);
  assert.match(home, /request\.headers\.get\('cookie'\)/);
  assert.match(home, /actionData/);
  assert.match(home, /role: 'alert'/);
  const routes = readFileSync(new URL('./routes.ts', import.meta.url), 'utf8');
  const download = readFileSync(new URL('./routes/file-content.ts', import.meta.url), 'utf8');
  assert.match(routes, /files\/:fileId\/content/);
  assert.match(download, /fetchAdminFileBytes/);
  assert.match(download, /Bajtów pliku nie znaleziono/);
  assert.match(download, /To konto nie może pobrać bajtów/);
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
  assert.equal(shell.includes('contracts:lifecycle'), false);
  assert.equal(shell.includes('projects:read'), false);
  assert.equal(shell.includes('projects:create'), false);
  assert.equal(shell.includes('files:read'), false);
  assert.equal(shell.includes('files:create'), false);
  assert.equal(shell.includes('@forma-zieleni/domain'), false);
  assert.equal(download.includes('@forma-zieleni/domain'), false);
  assert.equal(home.includes('@forma-zieleni/domain'), false);
  assert.equal(shell.includes('payments:read'), false);
  assert.equal(shell.includes('payments:write'), false);
  assert.equal(shell.toLowerCase().includes('podpis'), false);
  assert.equal(shell.toLowerCase().includes('stripe'), false);
  assert.equal(shell.toLowerCase().includes('blik'), false);
  assert.equal(shell.toLowerCase().includes('card'), false);
  for (const phrase of prohibited) {
    assert.equal(home.toLowerCase().includes(phrase), false, phrase);
    assert.equal(root.toLowerCase().includes(phrase), false, phrase);
  }
});

test('staff milestone UI lists a title and refuses a payment field', async () => {
  assert.deepEqual(mapMilestonePage({ items: [] }), { status: 'empty' });
  assert.deepEqual(mapMilestonePage({
    items: [{ id: 'x', projectId: 'y', title: 'Sadzenie', status: 'planned', dueAt: null, payment: 1 }],
  }), { status: 'error' });
  const mapped = mapMilestonePage({
    items: [{
      id: 'ms8k2n4p6q8r0s2t',
      projectId: 'pr8k2n4p6q8r0s2t',
      title: 'Sadzenie',
      status: 'planned',
      dueAt: null,
      createdAt: '2026-09-24T12:00:00.000Z',
      updatedAt: '2026-09-24T12:00:00.000Z',
    }],
  });
  assert.equal(mapped.status, 'ready');
  const html = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    milestones: mapped,
  }));
  assert.match(html, /Kamienie milowe/);
  assert.match(html, /Sadzenie/);
  assert.match(html, /bez terminu/);
  assert.match(html, /Zapisz kamień milowy/);
  const fetched = await fetchAdminMilestones({
    base: 'http://admin.test',
    cookie: 'better-auth.session_token=abc',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/milestones\?limit=50$/);
      assert.equal(init?.credentials, 'include');
      return new Response(JSON.stringify({ items: [], nextCursor: null }), { status: 200 });
    },
  });
  assert.deepEqual(fetched, { status: 'empty' });
  const created = await createAdminMilestone({
    base: 'http://admin.test',
    projectId: 'pr8k2n4p6q8r0s2t',
    title: 'Sadzenie',
    idempotencyKey: 'ms-1',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/milestones$/);
      assert.equal(init?.method, 'POST');
      assert.equal(init?.headers?.['idempotency-key'], 'ms-1');
      const body = JSON.parse(String(init?.body));
      assert.deepEqual(body, { projectId: 'pr8k2n4p6q8r0s2t', title: 'Sadzenie' });
      return new Response('{}', { status: 201 });
    },
  });
  assert.deepEqual(created, { ok: true });
});

test('staff approval UI reviews synthetic proposals without Owner or spend gates', async () => {
  const {
    BLOCKED_APPROVAL_INTENTS,
    fetchAdminProposals,
    mapAdminProposalPage,
    reviewAdminProposal,
  } = await import('./approvals.ts');

  const sample = {
    items: [{
      id: 'setadminapprove001',
      status: 'PROPOSED',
      reason: 'Syntetyczna propozycja do przeglądu.',
      trigger: 'suggestion',
      synthetic: true,
      changes: [{
        id: 'chgadminplant0001',
        entityId: 'plantrecord000001',
        field: 'scientificName',
        before: 'Taxus baccata',
        after: 'Taxus baccata L.',
      }],
    }],
    nextCursor: null,
  };
  const mapped = mapAdminProposalPage(sample);
  assert.equal(mapped.status, 'ready');
  const html = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    proposals: mapped,
  }));
  assert.match(html, /Propozycje do przeglądu/);
  assert.match(html, /Zatwierdź/);
  assert.match(html, /Odrzuć/);
  assert.match(html, /Odłóż/);
  assert.match(html, /Edytuj/);
  assert.match(html, /Zatwierdź wybrane/);
  for (const blocked of BLOCKED_APPROVAL_INTENTS) {
    assert.equal(html.toLowerCase().includes(blocked), false, blocked);
  }
  assert.equal(html.toLowerCase().includes('spend'), false);
  assert.equal(html.toLowerCase().includes('publish-live'), false);
  assert.equal(html.toLowerCase().includes('price-change'), false);

  const listed = await fetchAdminProposals({
    base: 'http://admin.test',
    cookie: 'better-auth.session_token=abc',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/approvals\/proposals$/);
      assert.equal(init?.credentials, 'include');
      return new Response(JSON.stringify(sample), { status: 200 });
    },
  });
  assert.equal(listed.status, 'ready');

  const reviewed = await reviewAdminProposal({
    base: 'http://admin.test',
    changeSetId: 'setadminapprove001',
    action: 'REJECT',
    cookie: 'better-auth.session_token=abc',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/approvals\/proposals\/setadminapprove001\/review$/);
      assert.equal(init?.method, 'POST');
      return new Response(JSON.stringify({ id: 'setadminapprove001', status: 'REJECTED' }), { status: 200 });
    },
  });
  assert.deepEqual(reviewed, { ok: true });

  const denied = await reviewAdminProposal({
    base: 'http://admin.test',
    changeSetId: 'setadminapprove001',
    action: 'APPROVE_ALL',
    fetchImpl: async () => new Response('', { status: 403 }),
  });
  assert.deepEqual(denied, { ok: false, reason: 'forbidden' });
});

test('staff open a documenso sandbox envelope without sending a secret', async () => {
  let sentSecret = false;
  const opened = await openAdminSigningSandbox({
    base: 'http://admin.test',
    contractId: 'ct8k2n4p6q8r0s2t',
    idempotencyKey: 'admin-sign-0001',
    cookie: 'better-auth.session_token=abc',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/contracts\/ct8k2n4p6q8r0s2t\/signing-sandbox-envelope$/);
      assert.equal(init?.method, 'POST');
      sentSecret = JSON.stringify(init?.headers).toLowerCase().includes('secret');
      return new Response(JSON.stringify({
        provider: 'documenso-sandbox',
        status: 'pending',
        qesClaimed: false,
      }), { status: 201 });
    },
  });
  assert.equal(sentSecret, false);
  assert.deepEqual(opened, { ok: true, envelopeStatus: 'pending' });
  const read = await fetchAdminSigningSandbox({
    base: 'http://admin.test',
    contractId: 'ct8k2n4p6q8r0s2t',
    fetchImpl: async () => new Response(JSON.stringify({
      contractId: 'ct8k2n4p6q8r0s2t',
      status: 'completed',
      qesClaimed: false,
    }), { status: 200 }),
  });
  assert.deepEqual(read, { status: 'ready', contractId: 'ct8k2n4p6q8r0s2t', envelopeStatus: 'completed' });
});

test('capacity staff UI lists windows and explains a refusal without a calendar', async () => {
  const html = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    capacityWindows: {
      status: 'ready',
      items: [{
        id: 'wcapacitywindow01',
        actorId: 'staffdesignerana1',
        kind: 'consultation',
        startsAt: '2026-06-01T08:00:00.000Z',
        endsAt: '2026-06-01T12:00:00.000Z',
      }],
    },
  }));
  assert.match(html, /Dyspozycyjność/);
  assert.match(html, /konsultacja/);
  assert.match(html, /staffdesignerana1/);
  assert.match(html, /Zapisz okno/);
  assert.match(html, /Sprawdź obiecany termin/);
  assert.equal(html.toLowerCase().includes('google'), false);
  assert.equal(html.toLowerCase().includes('calendar'), false);
  assert.equal(capacityDecisionMessage({ ok: false, reason: 'CAPACITY_OUTSIDE' }), 'Termin wypada poza dyspozycyjnością.');
  assert.equal(capacityDecisionMessage({ ok: true, windowId: 'wcapacitywindow01' }), 'Termin mieści się w oknie dyspozycyjności.');
  assert.deepEqual(mapCapacityWindowPage({ items: [] }), { status: 'empty' });
  assert.deepEqual(
    await fetchAdminCapacityWindows({
      base: 'http://admin.test',
      fetchImpl: async () => new Response('', { status: 403 }),
    }),
    { status: 'forbidden' },
  );
  assert.deepEqual(
    await createAdminCapacityWindow({
      base: 'http://admin.test',
      actorId: 'staffdesignerana1',
      kind: 'consultation',
      startsAt: '2026-06-01T08:00:00.000Z',
      endsAt: '2026-06-01T12:00:00.000Z',
      idempotencyKey: 'cap-ui-1',
      fetchImpl: async () => new Response('{}', { status: 201 }),
    }),
    { ok: true },
  );
  assert.deepEqual(
    await decideAdminCapacity({
      base: 'http://admin.test',
      kind: 'consultation',
      promisedAt: '2026-06-01T13:00:00.000Z',
      actorId: 'staffdesignerana1',
      fetchImpl: async () => new Response(JSON.stringify({ ok: false, reason: 'CAPACITY_OUTSIDE' }), { status: 200 }),
    }),
    { ok: true, decision: { ok: false, reason: 'CAPACITY_OUTSIDE' } },
  );
});
