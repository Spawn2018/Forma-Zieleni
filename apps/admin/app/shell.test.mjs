import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  adminContractStatusLabel,
  adminErrorMessage,
  compareAdminMilestones,
  formatByteCount,
  adminDecisionMilestoneLine,
  adminMilestoneDueLabel,
  adminOfferStatusLabel,
  adminSiteObservationKindLabel,
  adminSiteSourceStageLabel,
  adminProjectStatusLabel,
  adminOriginAllowed,
  adminSessionCookiePresent,
  adminShell,
  advanceAdminContractLifecycle,
  advanceAdminMilestoneStatus,
  capacityDecisionMessage,
  closeAdminCapacityWindow,
  createAdminCapacityWindow,
  decideAdminCapacity,
  fetchAdminCapacityWindows,
  mapCapacityWindowPage,
  classifyAdminSession,
  createAdminContract,
  createAdminOffer,
  createAdminOpportunity,
  createAdminFile,
  reviseAdminFileName,
  reviseAdminFileVisibility,
  createAdminGarden,
  createAdminDecisionLogEntry,
  reviseAdminDecisionLogSummary,
  createAdminSiteObservation,
  createAdminMilestone,
  parseAdminMilestoneDueAt,
  parseAdminMilestoneDueRevision,
  reviseAdminMilestoneDue,
  reviseAdminMilestoneTitle,
  createAdminProject,
  deliverAdminProject,
  fetchAdminContracts,
  fetchAdminFileBytes,
  fetchAdminFiles,
  fetchAdminLeads,
  fetchAdminGardens,
  fetchAdminDecisionLog,
  fetchAdminSiteIntelligence,
  adminDecisionLogProjectFilter,
  adminFileProjectFilter,
  adminMilestoneProjectFilter,
  fetchAdminMilestones,
  fetchAdminOffers,
  fetchAdminOpportunities,
  fetchAdminProjects,
  mapContractPage,
  mapFilePage,
  mapLeadPage,
  mapDecisionLogPage,
  mapAdminSitePage,
  mapGardenPage,
  mapMilestonePage,
  mapOfferPage,
  mapOpportunityPage,
  mapProjectPage,
  nextAdminContractLifecycleStatus,
  nextAdminMilestoneStatus,
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
  gardens: { status: 'empty' },
  siteIntelligence: { status: 'empty' },
  decisionLog: { status: 'empty' },
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
  assert.match(signedIn, /Brak ogrodów do pokazania/);
  assert.match(signedIn, /Utwórz ogród/);
  assert.match(signedIn, /Brak ustaleń o terenie do pokazania/);
  assert.match(signedIn, /Zapisz obserwację/);
  assert.match(signedIn, /Brak wpisów w dzienniku decyzji/);
  assert.match(signedIn, /Zapisz wpis/);
  assert.match(signedIn, /Utwórz plik/);
  for (const phrase of crmLeak) {
    assert.equal(signedIn.toLowerCase().includes(phrase), false, phrase);
  }
  const unauthorized = renderToStaticMarkup(adminShell({ state: 'unauthorized' }));
  assert.match(unauthorized, /nie ma dostępu/);
});

test('signed-in lead list renders empty, error, forbidden, and real rows without inventing customers', () => {
  assert.match(
    renderToStaticMarkup(adminShell({ state: 'signed-in', leads: { status: 'error' }, opportunities: { status: 'empty' }, offers: { status: 'empty' }, contracts: { status: 'empty' }, projects: { status: 'empty' }, files: { status: 'empty' }, paymentSchedules: { status: 'empty' }, capacityWindows: { status: 'empty' }, signingSandbox: { status: 'empty' }, milestones: { status: 'empty' }, gardens: { status: 'empty' }, siteIntelligence: { status: 'empty' }, decisionLog: { status: 'empty' }, proposals: { status: 'empty' } })),
    /Listy leadów nie udało się pobrać/,
  );
  assert.match(
    renderToStaticMarkup(adminShell({ state: 'signed-in', leads: { status: 'forbidden' }, opportunities: { status: 'empty' }, offers: { status: 'empty' }, contracts: { status: 'empty' }, projects: { status: 'empty' }, files: { status: 'empty' }, paymentSchedules: { status: 'empty' }, capacityWindows: { status: 'empty' }, signingSandbox: { status: 'empty' }, milestones: { status: 'empty' }, gardens: { status: 'empty' }, siteIntelligence: { status: 'empty' }, decisionLog: { status: 'empty' }, proposals: { status: 'empty' } })),
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
            createdAt: '2026-09-24T12:00:00.000Z',
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
            createdAt: '2026-09-24T13:30:00.000Z',
          },
        ],
      },
      projects: {
        status: 'ready',
        items: [
          {
            id: 'pr8k2n4p6q8r0s2t',
            contractId: 'ct8k2n4p6q8r0s2t',
            status: 'planned',
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
      gardens: { status: 'empty' },
      siteIntelligence: { status: 'empty' },
      decisionLog: { status: 'empty' },
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
  assert.match(ready, /· szkic/);
  assert.equal(ready.includes('· draft'), false);
  assert.match(ready, /Projekty/);
  assert.match(ready, /· zaplanowany/);
  assert.equal(ready.includes('· planned'), false);
  assert.match(ready, /pr8k2n4p6q8r0s2t/);
  assert.match(ready, /ct8k2n4p6q8r0s2t/);
  assert.match(ready, /Utwórz projekt/);
  assert.equal(ready.toLowerCase().includes('lead nr'), false);
  assert.equal(ready.toLowerCase().includes('oferta nr'), false);
  assert.equal(ready.toLowerCase().includes('umowa nr'), false);
  assert.equal(ready.toLowerCase().includes('price'), false);
  assert.equal(ready.toLowerCase().includes('płatność'), false);
  assert.equal(ready.toLowerCase().includes('podpis'), false);
  assert.match(ready, /24 września 2026, 12:00 UTC/);
  assert.match(ready, /24 września 2026, 13:30 UTC/);
  assert.equal(ready.includes('2026-09-24T12:00:00.000Z'), false);
  assert.equal(ready.includes('2026-09-24T13:30:00.000Z'), false);
});

test('mapContractPage and Core API contract fetch/create stay truthful', async () => {
  assert.deepEqual(mapContractPage({ items: [] }), { status: 'empty' });
  assert.deepEqual(mapContractPage({ items: [{ id: 1 }] }), { status: 'error' });
  assert.deepEqual(
    mapContractPage({
      items: [{ id: 'ct8k2n4p6q8r0s2t', offerId: 'of8k2n4p6q8r0s2t', status: 'draft' }],
    }),
    { status: 'error' },
  );
  assert.deepEqual(
    mapContractPage({
      items: [{
        id: 'ct8k2n4p6q8r0s2t',
        offerId: 'of8k2n4p6q8r0s2t',
        status: 'draft',
        createdAt: 'wczoraj',
        updatedAt: '2026-09-24T13:30:00.000Z',
      }],
    }),
    { status: 'error' },
  );
  assert.deepEqual(
    mapContractPage({
      items: [{
        id: 'ct8k2n4p6q8r0s2t',
        offerId: 'of8k2n4p6q8r0s2t',
        status: 'draft',
        createdAt: '2026-09-24T13:30:00.000Z',
        updatedAt: '2026-09-24T14:00:00.000Z',
      }],
    }),
    {
      status: 'ready',
      items: [{
        id: 'ct8k2n4p6q8r0s2t',
        offerId: 'of8k2n4p6q8r0s2t',
        status: 'draft',
        createdAt: '2026-09-24T13:30:00.000Z',
      }],
    },
  );
  assert.deepEqual(
    mapContractPage({
      items: [{ id: 'ct8k2n4p6q8r0s2t', offerId: 'of8k2n4p6q8r0s2t', status: 'paid' }],
    }),
    { status: 'error' },
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
  assert.equal(adminOfferStatusLabel('draft'), 'szkic');
  assert.equal(adminContractStatusLabel('draft'), 'szkic');
  assert.equal(adminContractStatusLabel('internal_review'), 'w przeglądzie');
  assert.equal(adminContractStatusLabel('approved'), 'zatwierdzona');
  assert.equal(adminContractStatusLabel('sent'), 'wysłana');
  assert.equal(adminProjectStatusLabel('planned'), 'zaplanowany');
  assert.equal(adminProjectStatusLabel('delivered'), 'dostarczony');

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
    { status: 'error' },
  );
  assert.deepEqual(
    mapProjectPage({
      items: [{ id: 'pr8k2n4p6q8r0s2t', contractId: 'ct8k2n4p6q8r0s2t', status: 'planned' }],
    }),
    {
      status: 'ready',
      items: [{ id: 'pr8k2n4p6q8r0s2t', contractId: 'ct8k2n4p6q8r0s2t', status: 'planned' }],
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
        clientSubject: 'client-a',
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
        visibleToClient: true,
      }],
    },
  );
  assert.deepEqual(
    mapFilePage({
      items: [{
        id: 'fl8k2n4p6q8r0s2t',
        projectId: 'pr8k2n4p6q8r0s2t',
        name: 'plan.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
        clientSubject: null,
      }],
    }).items?.[0]?.visibleToClient,
    false,
  );
  assert.equal(
    mapFilePage({
      items: [{
        id: 'fl8k2n4p6q8r0s2t',
        projectId: 'pr8k2n4p6q8r0s2t',
        name: 'plan.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
      }],
    }).status,
    'error',
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

  const filteredFiles = await fetchAdminFiles({
    base: 'http://127.0.0.1:8787',
    projectId: 'pr8k2n4p6q8r0s2t',
    fetchImpl: async (url) => {
      assert.match(String(url), /\/v1\/files\?limit=50&projectId=pr8k2n4p6q8r0s2t$/);
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    },
  });
  assert.deepEqual(filteredFiles, { status: 'empty' });
  const refusedFiles = await fetchAdminFiles({
    base: 'http://127.0.0.1:8787',
    projectId: 'project1',
    fetchImpl: async () => {
      assert.fail('an invalid project id must not call Core API');
      return new Response('', { status: 500 });
    },
  });
  assert.deepEqual(refusedFiles, { status: 'error' });
  assert.deepEqual(adminFileProjectFilter('pr8k2n4p6q8r0s2t'), {
    state: 'project',
    projectId: 'pr8k2n4p6q8r0s2t',
  });
  const filteredFileHtml = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    files: {
      status: 'ready',
      items: [{
        id: 'fl8k2n4p6q8r0s2t',
        projectId: 'pr8k2n4p6q8r0s2t',
        name: 'plan.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
        visibleToClient: true,
      }],
    },
    fileProjectQuery: 'pr8k2n4p6q8r0s2t',
    fileProjectId: 'pr8k2n4p6q8r0s2t',
  }));
  assert.match(filteredFileHtml, /Pokaż pliki projektu/);
  assert.match(filteredFileHtml, /Filtr projektu: pr8k2n4p6q8r0s2t/);
  assert.match(filteredFileHtml, /plan\.pdf · projekt pr8k2n4p6q8r0s2t · application\/pdf · 2 048 B · widoczny dla klienta/);
  assert.equal(filteredFileHtml.includes('2048 B'), false);
  assert.equal(filteredFileHtml.includes('2 KB'), false);
  assert.equal(formatByteCount(1048576), '1 048 576 B');
  assert.equal(formatByteCount(-1), null);
  const invalidFileHtml = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    files: { status: 'empty' },
    fileProjectQuery: 'project1',
    fileFilterInvalid: true,
  }));
  assert.match(invalidFileHtml, /Id projektu jest niepoprawne\. Lista plików nie została pobrana\./);
  assert.equal(invalidFileHtml.includes('plan.pdf'), false);

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

  const renamed = await reviseAdminFileName({
    base: 'http://127.0.0.1:8787',
    fileId: 'fl8k2n4p6q8r0s2t',
    name: '  plan-v2.pdf  ',
    idempotencyKey: 'admin-file-name',
    async fetchImpl(url, init) {
      assert.match(String(url), /\/v1\/files\/fl8k2n4p6q8r0s2t\/name$/);
      assert.equal(init?.method, 'POST');
      assert.deepEqual(JSON.parse(String(init?.body)), { name: 'plan-v2.pdf' });
      return new Response('{}', { status: 200 });
    },
  });
  assert.deepEqual(renamed, { ok: true });
  const blankName = await reviseAdminFileName({
    base: 'http://127.0.0.1:8787',
    fileId: 'fl8k2n4p6q8r0s2t',
    name: '   ',
    idempotencyKey: 'admin-file-blank',
    async fetchImpl() {
      assert.fail('blank name must not call Core API');
      return new Response('{}', { status: 500 });
    },
  });
  assert.deepEqual(blankName, { ok: false, reason: 'error' });

  const hidden = await reviseAdminFileVisibility({
    base: 'http://127.0.0.1:8787',
    fileId: 'fl8k2n4p6q8r0s2t',
    visible: false,
    idempotencyKey: 'admin-file-hide',
    async fetchImpl(url, init) {
      assert.match(String(url), /\/v1\/files\/fl8k2n4p6q8r0s2t\/visibility$/);
      assert.equal(init?.method, 'POST');
      assert.deepEqual(JSON.parse(String(init?.body)), { visible: false });
      return new Response('{}', { status: 200 });
    },
  });
  assert.deepEqual(hidden, { ok: true });

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
        visibleToClient: true,
      }],
    },
  }));
  assert.match(markup, /Popraw nazwę/);
  assert.match(markup, /widoczny dla klienta/);
  assert.match(markup, /Ukryj przed klientem/);
  assert.match(markup, /name="visible" value="false"/);
  assert.equal(markup.includes('clientSubject'), false);
  assert.match(markup, /name="fileId" value="fl8k2n4p6q8r0s2t"/);
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
    { status: 'error' },
  );
  assert.deepEqual(
    mapOfferPage({
      items: [{
        id: 'of8k2n4p6q8r0s2t',
        opportunityId: 'op8k2n4p6q8r0s2t',
        status: 'draft',
        createdAt: '2026-09-24T12:00:00.000Z',
        updatedAt: '2026-09-24T12:05:00.000Z',
        clientSubject: 'client-1',
      }],
    }),
    {
      status: 'ready',
      items: [{
        id: 'of8k2n4p6q8r0s2t',
        opportunityId: 'op8k2n4p6q8r0s2t',
        status: 'draft',
        createdAt: '2026-09-24T12:00:00.000Z',
      }],
    },
  );
  assert.deepEqual(
    mapOfferPage({
      items: [{ id: 'of8k2n4p6q8r0s2t', opportunityId: 'op8k2n4p6q8r0s2t', status: 'sent' }],
    }),
    { status: 'error' },
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
  assert.match(home, /advanceAdminMilestoneStatus/);
  assert.match(home, /advance-milestone-status/);
  assert.match(home, /fetchAdminGardens/);
  assert.match(home, /createAdminGarden/);
  assert.match(home, /fetchAdminSiteIntelligence/);
  assert.match(home, /createAdminSiteObservation/);
  assert.match(home, /fetchAdminDecisionLog/);
  assert.match(home, /createAdminDecisionLogEntry/);
  assert.match(home, /createAdminProject/);
  assert.match(home, /deliverAdminProject/);
  assert.match(home, /deliver-project/);
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

test('staff can mark a planned project delivered and leave a delivered project unchanged', async () => {
  const planned = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    projects: {
      status: 'ready',
      items: [{ id: 'pr8k2n4p6q8r0s2t', contractId: 'ct8k2n4p6q8r0s2t', status: 'planned' }],
    },
  }));
  assert.match(planned, /Oznacz jako dostarczony/);
  assert.match(planned, /name="projectId" value="pr8k2n4p6q8r0s2t"/);
  const delivered = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    projects: {
      status: 'ready',
      items: [{ id: 'pr8k2n4p6q8r0s2u', contractId: 'ct8k2n4p6q8r0s2t', status: 'delivered' }],
    },
  }));
  assert.equal(delivered.includes('Oznacz jako dostarczony'), false);
  const result = await deliverAdminProject({
    base: 'http://admin.test',
    projectId: 'pr8k2n4p6q8r0s2t',
    idempotencyKey: 'deliver-1',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/projects\/pr8k2n4p6q8r0s2t\/deliver$/);
      assert.equal(init?.method, 'POST');
      assert.equal(init?.headers?.['idempotency-key'], 'deliver-1');
      assert.equal(init?.body, '{}');
      return new Response('{}', { status: 200 });
    },
  });
  assert.deepEqual(result, { ok: true });
});

test('staff decision log lists a change and refuses a payment field', async () => {
  assert.deepEqual(mapDecisionLogPage({ items: [] }), { status: 'empty' });
  assert.deepEqual(mapDecisionLogPage({
    items: [{
      id: 'dl8k2n4p6q8r0s2t',
      projectId: 'pr8k2n4p6q8r0s2t',
      kind: 'decision',
      summary: 'Sadzimy żywopłot wzdłuż granicy.',
      recordedByActorId: 'ac8k2n4p6q8r0s2t',
      relatedMilestoneId: null,
      createdAt: '2026-09-24T12:00:00.000Z',
      payment: 1,
    }],
  }), { status: 'error' });
  const mapped = mapDecisionLogPage({
    items: [{
      id: 'dl8k2n4p6q8r0s2t',
      projectId: 'pr8k2n4p6q8r0s2t',
      kind: 'change_order',
      summary: 'Sadzimy żywopłot wzdłuż granicy.',
      recordedByActorId: 'ac8k2n4p6q8r0s2t',
      relatedMilestoneId: null,
      createdAt: '2026-09-24T12:00:00.000Z',
    }],
  });
  assert.equal(mapped.status, 'ready');
  const html = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    decisionLog: mapped,
  }));
  assert.match(html, /Dziennik decyzji/);
  assert.match(html, /Sadzimy żywopłot wzdłuż granicy/);
  assert.match(html, /zmiana zakresu/);
  assert.match(html, /bez kamienia milowego/);
  const milestones = {
    status: 'ready',
    items: [
      {
        id: 'ms8k2n4p6q8r0s2t',
        projectId: 'pr8k2n4p6q8r0s2t',
        title: 'Sadzenie',
        status: 'planned',
        dueAt: null,
      },
      {
        id: 'ms8k2n4p6q8r0s2u',
        projectId: 'pr8k2n4p6q8r0s2u',
        title: 'Inny kamień',
        status: 'done',
        dueAt: null,
      },
    ],
  };
  assert.equal(adminDecisionMilestoneLine(null, milestones), 'bez kamienia milowego');
  assert.equal(adminDecisionMilestoneLine('ms8k2n4p6q8r0s2t', milestones), 'kamień «Sadzenie»');
  assert.equal(adminDecisionMilestoneLine('ms8k2n4p6q8r0s2v', milestones), 'kamień poza wczytaną listą: ms8k2n4p6q8r0s2v');
  assert.equal(adminDecisionMilestoneLine('ms8k2n4p6q8r0s2t', { status: 'error' }), 'kamienia milowego nie udało się odczytać');
  assert.equal(
    adminDecisionMilestoneLine('ms8k2n4p6q8r0s2t', { status: 'forbidden' }),
    'to konto nie może odczytać kamieni milowych',
  );
  const linked = mapDecisionLogPage({
    items: [{
      id: 'dl8k2n4p6q8r0s2u',
      projectId: 'pr8k2n4p6q8r0s2t',
      kind: 'decision',
      summary: 'Termin sadzenia zostaje.',
      recordedByActorId: 'ac8k2n4p6q8r0s2t',
      relatedMilestoneId: 'ms8k2n4p6q8r0s2t',
      createdAt: '2026-09-24T12:00:00.000Z',
    }],
  });
  const linkedHtml = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    decisionLog: linked,
    milestones,
  }));
  const entry = linkedHtml.slice(linkedHtml.indexOf('admin-decision-log-entry'), linkedHtml.indexOf('admin-create-decision'));
  assert.match(entry, /kamień «Sadzenie»/);
  assert.equal(entry.includes('Inny kamień'), false);
  const failedMilestones = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    decisionLog: linked,
    milestones: { status: 'error' },
  }));
  assert.match(failedMilestones, /kamienia milowego nie udało się odczytać/);
  assert.equal(failedMilestones.includes('bez kamienia milowego'), false);
  assert.match(html, /Pokaż wpisy projektu/);
  assert.match(html, /Zapisz wpis/);
  assert.match(html, /Popraw treść/);
  assert.match(html, /name="entryId" value="dl8k2n4p6q8r0s2t"/);
  assert.equal(html.includes('ac8k2n4p6q8r0s2t'), false);
  const fetched = await fetchAdminDecisionLog({
    base: 'http://admin.test',
    cookie: 'better-auth.session_token=abc',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/decision-log\?limit=50$/);
      assert.equal(init?.credentials, 'include');
      return new Response(JSON.stringify({ items: [], nextCursor: null }), { status: 200 });
    },
  });
  assert.deepEqual(fetched, { status: 'empty' });
  const filtered = await fetchAdminDecisionLog({
    base: 'http://admin.test',
    projectId: 'pr8k2n4p6q8r0s2t',
    fetchImpl: async (url) => {
      assert.match(String(url), /\/v1\/decision-log\?limit=50&projectId=pr8k2n4p6q8r0s2t$/);
      return new Response(JSON.stringify({ items: [], nextCursor: null }), { status: 200 });
    },
  });
  assert.deepEqual(filtered, { status: 'empty' });
  const refused = await fetchAdminDecisionLog({
    base: 'http://admin.test',
    projectId: 'project1',
    fetchImpl: async () => {
      assert.fail('an invalid project id must not call Core API');
      return new Response('', { status: 500 });
    },
  });
  assert.deepEqual(refused, { status: 'error' });
  assert.deepEqual(adminDecisionLogProjectFilter('pr8k2n4p6q8r0s2t'), {
    state: 'project',
    projectId: 'pr8k2n4p6q8r0s2t',
  });
  const filteredHtml = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    decisionLog: mapped,
    decisionProjectQuery: 'pr8k2n4p6q8r0s2t',
    decisionProjectId: 'pr8k2n4p6q8r0s2t',
  }));
  assert.match(filteredHtml, /Filtr projektu: pr8k2n4p6q8r0s2t/);
  assert.match(filteredHtml, /Pokaż wszystkie/);
  const invalidHtml = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    decisionLog: { status: 'empty' },
    decisionProjectQuery: 'project1',
    decisionFilterInvalid: true,
  }));
  assert.match(invalidHtml, /Id projektu jest niepoprawne\. Dziennik decyzji nie został pobrany\./);
  assert.equal(invalidHtml.includes('Sadzimy żywopłot'), false);
  const created = await createAdminDecisionLogEntry({
    base: 'http://admin.test',
    projectId: 'pr8k2n4p6q8r0s2t',
    kind: 'decision',
    summary: 'Sadzimy żywopłot wzdłuż granicy.',
    idempotencyKey: 'dl-1',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/decision-log$/);
      assert.equal(init?.method, 'POST');
      const body = JSON.parse(String(init?.body));
      assert.deepEqual(body, {
        projectId: 'pr8k2n4p6q8r0s2t',
        kind: 'decision',
        summary: 'Sadzimy żywopłot wzdłuż granicy.',
      });
      return new Response('{}', { status: 201 });
    },
  });
  assert.deepEqual(created, { ok: true });
  const rejected = await createAdminDecisionLogEntry({
    base: 'http://admin.test',
    projectId: 'pr8k2n4p6q8r0s2t',
    kind: 'payment',
    summary: 'nie',
    idempotencyKey: 'dl-2',
    fetchImpl: async () => {
      assert.fail('unknown kind must not call Core API');
      return new Response('{}', { status: 500 });
    },
  });
  assert.deepEqual(rejected, { ok: false, reason: 'error' });
  const revised = await reviseAdminDecisionLogSummary({
    base: 'http://admin.test',
    entryId: 'dl8k2n4p6q8r0s2t',
    summary: '  Sadzimy żywopłot i bramę.  ',
    idempotencyKey: 'dl-revise',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/decision-log\/dl8k2n4p6q8r0s2t\/summary$/);
      assert.equal(init?.method, 'POST');
      assert.deepEqual(JSON.parse(String(init?.body)), { summary: 'Sadzimy żywopłot i bramę.' });
      return new Response('{}', { status: 200 });
    },
  });
  assert.deepEqual(revised, { ok: true });
  const blank = await reviseAdminDecisionLogSummary({
    base: 'http://admin.test',
    entryId: 'dl8k2n4p6q8r0s2t',
    summary: '   ',
    idempotencyKey: 'dl-blank',
    fetchImpl: async () => {
      assert.fail('blank summary must not call Core API');
      return new Response('{}', { status: 500 });
    },
  });
  assert.deepEqual(blank, { ok: false, reason: 'error' });
});

test('staff site UI lists rules codes and records one synthetic observation', async () => {
  assert.deepEqual(mapAdminSitePage({ items: [] }), { status: 'empty' });
  assert.deepEqual(mapAdminSitePage({
    items: [{
      id: 'si8k2n4p6q8r0s2t',
      projectId: 'pr8k2n4p6q8r0s2t',
      clientSubject: null,
      observationIds: ['obs-slope-01'],
      constraints: [],
      opportunities: [],
      sourceStage: 'RULES',
      createdAt: '2026-09-24T12:00:00.000Z',
      updatedAt: '2026-09-24T12:00:00.000Z',
      aiConclusion: 'invented',
    }],
  }), { status: 'error' });
  const mapped = mapAdminSitePage({
    items: [{
      id: 'si8k2n4p6q8r0s2t',
      projectId: 'pr8k2n4p6q8r0s2t',
      clientSubject: 'client-subject-opaque',
      observationIds: ['obs-slope-01'],
      constraints: [{
        id: 'sc8k2n4p6q8r0s2t',
        projectId: 'pr8k2n4p6q8r0s2t',
        clientSubject: 'client-subject-opaque',
        code: 'slope-steep',
        observationIds: ['obs-slope-01'],
        sourceStage: 'RULES',
        createdAt: '2026-09-24T12:00:00.000Z',
      }],
      opportunities: [],
      sourceStage: 'RULES',
      createdAt: '2026-09-24T12:00:00.000Z',
      updatedAt: '2026-09-24T12:00:00.000Z',
    }],
  });
  assert.equal(mapped.status, 'ready');
  const html = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    siteIntelligence: mapped,
  }));
  assert.match(html, /Ustalenia o terenie/);
  assert.match(html, /slope-steep/);
  assert.match(html, /si8k2n4p6q8r0s2t · projekt pr8k2n4p6q8r0s2t · reguły/);
  assert.equal(html.includes('RULES'), false);
  assert.match(html, /Możliwości: brak/);
  assert.match(html, /Zapisz obserwację/);
  assert.match(html, /<option value="slope"[^>]*>spadek<\/option>/);
  assert.match(html, /<option value="topography"[^>]*>ukształtowanie<\/option>/);
  assert.match(html, /<option value="soil"[^>]*>gleba<\/option>/);
  assert.match(html, /<option value="sun"[^>]*>nasłonecznienie<\/option>/);
  assert.match(html, /<option value="aspect"[^>]*>wystawa<\/option>/);
  assert.match(html, /<option value="surroundings"[^>]*>otoczenie<\/option>/);
  assert.match(html, /<option value="climate"[^>]*>klimat<\/option>/);
  assert.equal(adminSiteObservationKindLabel('slope'), 'spadek');
  assert.equal(adminSiteSourceStageLabel('RULES'), 'reguły');
  assert.equal(html.includes('client-subject-opaque'), false);
  const fetched = await fetchAdminSiteIntelligence({
    base: 'http://admin.test',
    cookie: 'better-auth.session_token=abc',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/site-intelligence\?limit=50$/);
      assert.equal(init?.credentials, 'include');
      return new Response(JSON.stringify({ items: [], nextCursor: null }), { status: 200 });
    },
  });
  assert.deepEqual(fetched, { status: 'empty' });
  const filteredSites = await fetchAdminSiteIntelligence({
    base: 'http://admin.test',
    projectId: 'pr8k2n4p6q8r0s2t',
    fetchImpl: async (url) => {
      assert.match(String(url), /\/v1\/site-intelligence\?limit=50&projectId=pr8k2n4p6q8r0s2t$/);
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    },
  });
  assert.deepEqual(filteredSites, { status: 'empty' });
  const refusedSites = await fetchAdminSiteIntelligence({
    base: 'http://admin.test',
    projectId: 'project1',
    fetchImpl: async () => {
      assert.fail('an invalid project id must not call Core API');
      return new Response('', { status: 500 });
    },
  });
  assert.deepEqual(refusedSites, { status: 'error' });
  const filteredSiteHtml = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    siteIntelligence: mapped,
    siteProjectQuery: 'pr8k2n4p6q8r0s2t',
    siteProjectId: 'pr8k2n4p6q8r0s2t',
  }));
  assert.match(filteredSiteHtml, /Pokaż teren projektu/);
  assert.match(filteredSiteHtml, /Filtr projektu: pr8k2n4p6q8r0s2t/);
  assert.match(filteredSiteHtml, /si8k2n4p6q8r0s2t/);
  const invalidSiteHtml = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    siteIntelligence: { status: 'empty' },
    siteProjectQuery: 'project1',
    siteFilterInvalid: true,
  }));
  assert.match(invalidSiteHtml, /Id projektu jest niepoprawne\. Lista ustaleń o terenie nie została pobrana\./);
  assert.equal(invalidSiteHtml.includes('si8k2n4p6q8r0s2t'), false);
  const created = await createAdminSiteObservation({
    base: 'http://admin.test',
    projectId: 'pr8k2n4p6q8r0s2t',
    observationId: 'obs-slope-01',
    kind: 'slope',
    idempotencyKey: 'si-1',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/site-intelligence$/);
      assert.equal(init?.method, 'POST');
      const body = JSON.parse(String(init?.body));
      assert.deepEqual(body, {
        projectId: 'pr8k2n4p6q8r0s2t',
        observations: [{
          observationId: 'obs-slope-01',
          kind: 'slope',
          normalized: true,
          source: 'normalized',
          synthetic: true,
        }],
      });
      return new Response('{}', { status: 201 });
    },
  });
  assert.deepEqual(created, { ok: true });
  const rejected = await createAdminSiteObservation({
    base: 'http://admin.test',
    projectId: 'pr8k2n4p6q8r0s2t',
    observationId: 'obs-slope-01',
    kind: 'geoportal',
    idempotencyKey: 'si-2',
    fetchImpl: async () => {
      assert.fail('unknown kind must not call Core API');
      return new Response('{}', { status: 500 });
    },
  });
  assert.deepEqual(rejected, { ok: false, reason: 'error' });
});

test('staff garden UI lists a delivered project garden and refuses a twin field', async () => {
  assert.deepEqual(mapGardenPage({ items: [] }), { status: 'empty' });
  assert.deepEqual(mapGardenPage({
    items: [{
      id: 'gd8k2n4p6q8r0s2t',
      projectId: 'pr8k2n4p6q8r0s2t',
      clientSubject: null,
      createdAt: '2026-09-24T12:00:00.000Z',
      twinDatabase: true,
    }],
  }), { status: 'error' });
  const mapped = mapGardenPage({
    items: [{
      id: 'gd8k2n4p6q8r0s2t',
      projectId: 'pr8k2n4p6q8r0s2t',
      clientSubject: 'client-subject-opaque',
      createdAt: '2026-09-24T12:00:00.000Z',
      updatedAt: '2026-09-24T12:00:00.000Z',
    }],
  });
  assert.equal(mapped.status, 'ready');
  const html = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    gardens: mapped,
  }));
  assert.match(html, /Ogrody/);
  assert.match(html, /gd8k2n4p6q8r0s2t/);
  assert.match(html, /24 września 2026, 12:00 UTC/);
  assert.equal(html.includes('2026-09-24T12:00:00.000Z'), false);
  assert.equal(mapGardenPage({
    items: [{ id: 'gd8k2n4p6q8r0s2t', projectId: 'pr8k2n4p6q8r0s2t', clientSubject: null, createdAt: 't' }],
  }).status, 'error');
  assert.match(html, /Utwórz ogród/);
  assert.equal(html.includes('client-subject-opaque'), false);
  assert.equal(html.toLowerCase().includes('twin'), false);
  const fetched = await fetchAdminGardens({
    base: 'http://admin.test',
    cookie: 'better-auth.session_token=abc',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/gardens\?limit=50$/);
      assert.equal(init?.credentials, 'include');
      return new Response(JSON.stringify({ items: [], nextCursor: null }), { status: 200 });
    },
  });
  assert.deepEqual(fetched, { status: 'empty' });
  const filteredGardens = await fetchAdminGardens({
    base: 'http://admin.test',
    projectId: 'pr8k2n4p6q8r0s2t',
    fetchImpl: async (url) => {
      assert.match(String(url), /\/v1\/gardens\?limit=50&projectId=pr8k2n4p6q8r0s2t$/);
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    },
  });
  assert.deepEqual(filteredGardens, { status: 'empty' });
  const refusedGardens = await fetchAdminGardens({
    base: 'http://admin.test',
    projectId: 'project1',
    fetchImpl: async () => {
      assert.fail('an invalid project id must not call Core API');
      return new Response('', { status: 500 });
    },
  });
  assert.deepEqual(refusedGardens, { status: 'error' });
  const filteredGardenHtml = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    gardens: mapped,
    gardenProjectQuery: 'pr8k2n4p6q8r0s2t',
    gardenProjectId: 'pr8k2n4p6q8r0s2t',
  }));
  assert.match(filteredGardenHtml, /Pokaż ogród projektu/);
  assert.match(filteredGardenHtml, /Filtr projektu: pr8k2n4p6q8r0s2t/);
  assert.match(filteredGardenHtml, /gd8k2n4p6q8r0s2t/);
  const invalidGardenHtml = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    gardens: { status: 'empty' },
    gardenProjectQuery: 'project1',
    gardenFilterInvalid: true,
  }));
  assert.match(invalidGardenHtml, /Id projektu jest niepoprawne\. Lista ogrodów nie została pobrana\./);
  assert.equal(invalidGardenHtml.includes('gd8k2n4p6q8r0s2t'), false);
  const created = await createAdminGarden({
    base: 'http://admin.test',
    projectId: 'pr8k2n4p6q8r0s2t',
    idempotencyKey: 'gd-1',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/gardens$/);
      assert.equal(init?.method, 'POST');
      assert.equal(init?.headers?.['idempotency-key'], 'gd-1');
      const body = JSON.parse(String(init?.body));
      assert.deepEqual(body, { projectId: 'pr8k2n4p6q8r0s2t' });
      return new Response('{}', { status: 201 });
    },
  });
  assert.deepEqual(created, { ok: true });
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
  assert.match(html, /zaplanowany/);
  assert.match(html, /bez terminu/);
  assert.match(html, /Rozpocznij/);
  assert.match(html, /name="milestoneId" value="ms8k2n4p6q8r0s2t"/);
  assert.match(html, /name="status" value="active"/);
  assert.match(html, /Zapisz kamień milowy/);
  assert.match(html, /Termin \(UTC\)/);
  assert.match(html, /name="dueAt"/);
  assert.match(html, /Puste pole zostawia kamień bez terminu/);
  assert.match(html, /Zapisz termin/);
  assert.match(html, /Popraw tytuł/);
  assert.match(html, /Nowy tytuł/);
  assert.match(html, /Nowy termin \(UTC\)/);
  assert.equal(html.includes('Usuń termin'), false);
  assert.equal(nextAdminMilestoneStatus('planned'), 'active');
  assert.equal(nextAdminMilestoneStatus('active'), 'done');
  assert.equal(nextAdminMilestoneStatus('done'), null);
  const doneHtml = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    milestones: {
      status: 'ready',
      items: [{
        id: 'ms8k2n4p6q8r0s2u',
        projectId: 'pr8k2n4p6q8r0s2t',
        title: 'Sadzenie',
        status: 'done',
        dueAt: null,
      }],
    },
  }));
  assert.match(doneHtml, /zrobiony/);
  assert.equal(doneHtml.includes('Rozpocznij'), false);
  assert.equal(doneHtml.includes('Oznacz jako zrobiony'), false);
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
  assert.deepEqual(adminMilestoneProjectFilter(''), { state: 'all' });
  assert.deepEqual(adminMilestoneProjectFilter('  pr8k2n4p6q8r0s2t  '), {
    state: 'project',
    projectId: 'pr8k2n4p6q8r0s2t',
  });
  assert.deepEqual(adminMilestoneProjectFilter('project1'), { state: 'invalid' });
  const filtered = await fetchAdminMilestones({
    base: 'http://admin.test',
    projectId: 'pr8k2n4p6q8r0s2t',
    fetchImpl: async (url) => {
      assert.equal(new URL(String(url)).searchParams.get('projectId'), 'pr8k2n4p6q8r0s2t');
      return new Response(JSON.stringify({ items: [], nextCursor: null }), { status: 200 });
    },
  });
  assert.deepEqual(filtered, { status: 'empty' });
  const refused = await fetchAdminMilestones({
    base: 'http://admin.test',
    projectId: 'project1',
    fetchImpl: async () => {
      assert.fail('an invalid project id must not call Core API');
      return new Response('', { status: 500 });
    },
  });
  assert.deepEqual(refused, { status: 'error' });
  const filteredHtml = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    milestones: { status: 'empty' },
    milestoneProjectQuery: 'pr8k2n4p6q8r0s2t',
    milestoneProjectId: 'pr8k2n4p6q8r0s2t',
  }));
  assert.match(filteredHtml, /Pokaż kamienie projektu/);
  assert.match(filteredHtml, /Filtr projektu: pr8k2n4p6q8r0s2t/);
  assert.match(filteredHtml, /Pokaż wszystkie/);
  assert.match(filteredHtml, /value="pr8k2n4p6q8r0s2t"/);
  const invalidHtml = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    milestones: { status: 'empty' },
    milestoneProjectQuery: 'project1',
    milestoneFilterInvalid: true,
  }));
  assert.match(invalidHtml, /Id projektu jest niepoprawne\. Kamienie milowe nie zostały pobrane\./);
  assert.equal(invalidHtml.includes('Brak kamieni milowych do pokazania.'), false);
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
  assert.deepEqual(parseAdminMilestoneDueAt('  '), { ok: true });
  assert.deepEqual(parseAdminMilestoneDueAt('jutro'), { ok: false });
  assert.deepEqual(parseAdminMilestoneDueAt('2026-10-03T08:00:00.000Z'), {
    ok: true,
    dueAt: '2026-10-03T08:00:00.000Z',
  });
  const dated = await createAdminMilestone({
    base: 'http://admin.test',
    projectId: 'pr8k2n4p6q8r0s2t',
    title: 'Sadzenie',
    dueAt: '2026-10-03T08:00:00.000Z',
    idempotencyKey: 'ms-due-1',
    fetchImpl: async (_url, init) => {
      assert.deepEqual(JSON.parse(String(init?.body)), {
        projectId: 'pr8k2n4p6q8r0s2t',
        title: 'Sadzenie',
        dueAt: '2026-10-03T08:00:00.000Z',
      });
      return new Response('{}', { status: 201 });
    },
  });
  assert.deepEqual(dated, { ok: true });
  assert.deepEqual(parseAdminMilestoneDueRevision(''), { ok: false });
  assert.deepEqual(parseAdminMilestoneDueRevision('2026-10-04T08:00:00.000Z'), {
    ok: true,
    dueAt: '2026-10-04T08:00:00.000Z',
  });
  const revised = await reviseAdminMilestoneDue({
    base: 'http://admin.test',
    milestoneId: 'ms8k2n4p6q8r0s2t',
    dueAt: '2026-10-04T08:00:00.000Z',
    idempotencyKey: 'ms-due-revise',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/milestones\/ms8k2n4p6q8r0s2t\/due$/);
      assert.equal(init?.method, 'POST');
      assert.deepEqual(JSON.parse(String(init?.body)), { dueAt: '2026-10-04T08:00:00.000Z' });
      return new Response('{}', { status: 200 });
    },
  });
  assert.deepEqual(revised, { ok: true });
  const clearedDue = await reviseAdminMilestoneDue({
    base: 'http://admin.test',
    milestoneId: 'ms8k2n4p6q8r0s2t',
    dueAt: null,
    idempotencyKey: 'ms-due-clear',
    fetchImpl: async (_url, init) => {
      assert.deepEqual(JSON.parse(String(init?.body)), { dueAt: null });
      return new Response('{}', { status: 200 });
    },
  });
  assert.deepEqual(clearedDue, { ok: true });
  const retitled = await reviseAdminMilestoneTitle({
    base: 'http://admin.test',
    milestoneId: 'ms8k2n4p6q8r0s2t',
    title: '  Koncepcja ogrodu  ',
    idempotencyKey: 'ms-title',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/milestones\/ms8k2n4p6q8r0s2t\/title$/);
      assert.deepEqual(JSON.parse(String(init?.body)), { title: 'Koncepcja ogrodu' });
      return new Response('{}', { status: 200 });
    },
  });
  assert.deepEqual(retitled, { ok: true });
  const blankTitle = await reviseAdminMilestoneTitle({
    base: 'http://admin.test',
    milestoneId: 'ms8k2n4p6q8r0s2t',
    title: '   ',
    idempotencyKey: 'ms-title-blank',
    fetchImpl: async () => {
      assert.fail('a blank title must not call Core API');
      return new Response('{}', { status: 500 });
    },
  });
  assert.deepEqual(blankTitle, { ok: false, reason: 'error' });
  const datedHtml = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    milestones: {
      status: 'ready',
      items: [{
        id: 'ms8k2n4p6q8r0s2u',
        projectId: 'pr8k2n4p6q8r0s2t',
        title: 'Sadzenie',
        status: 'planned',
        dueAt: '2026-10-03T08:00:00.000Z',
      }],
    },
  }));
  assert.match(datedHtml, /Usuń termin/);
  assert.match(datedHtml, /Sadzenie · zaplanowany · 3 października 2026, 08:00 UTC/);
  const orderedHtml = renderToStaticMarkup(adminShell({
    state: 'signed-in',
    ...emptyCrm,
    milestones: {
      status: 'ready',
      items: [
        {
          id: 'ms8k2n4p6q8r0s2u',
          projectId: 'pr8k2n4p6q8r0s2t',
          title: 'Później',
          status: 'done',
          dueAt: '2026-12-01T08:00:00.000Z',
        },
        {
          id: 'ms8k2n4p6q8r0s2w',
          projectId: 'pr8k2n4p6q8r0s2t',
          title: 'Bez terminu',
          status: 'planned',
          dueAt: null,
        },
        {
          id: 'ms8k2n4p6q8r0s2t',
          projectId: 'pr8k2n4p6q8r0s2t',
          title: 'Wcześniej',
          status: 'planned',
          dueAt: '2026-10-03T08:00:00.000Z',
        },
      ],
    },
  }));
  const orderedTitles = [...orderedHtml.matchAll(/admin-milestone-meta">([^<]+)/g)].map((match) => match[1]);
  assert.equal(orderedTitles[0].startsWith('Wcześniej · zaplanowany'), true);
  assert.equal(orderedTitles[1].startsWith('Później · zrobiony'), true);
  assert.equal(orderedTitles[2].startsWith('Bez terminu · zaplanowany'), true);
  assert.deepEqual(
    compareAdminMilestones(
      { id: 'ms8k2n4p6q8r0s2u', dueAt: '2026-10-03T08:00:00.000Z' },
      { id: 'ms8k2n4p6q8r0s2t', dueAt: '2026-10-03T08:00:00.000Z' },
    ),
    1,
  );
  assert.equal(datedHtml.includes('Sadzenie · zaplanowany · 2026-10-03T08:00:00.000Z'), false);
  assert.equal(adminMilestoneDueLabel(null), 'bez terminu');
  assert.equal(adminMilestoneDueLabel('2026-02-31T00:00:00.000Z'), null);
  assert.deepEqual(mapMilestonePage({
    items: [{
      id: 'ms8k2n4p6q8r0s2u',
      projectId: 'pr8k2n4p6q8r0s2t',
      title: 'Sadzenie',
      status: 'planned',
      dueAt: 'jutro',
    }],
  }), { status: 'error' });
  const advanced = await advanceAdminMilestoneStatus({
    base: 'http://admin.test',
    milestoneId: 'ms8k2n4p6q8r0s2t',
    status: 'active',
    idempotencyKey: 'ms-status-1',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/milestones\/ms8k2n4p6q8r0s2t\/status$/);
      assert.equal(init?.method, 'POST');
      assert.equal(init?.headers?.['idempotency-key'], 'ms-status-1');
      assert.deepEqual(JSON.parse(String(init?.body)), { status: 'active' });
      return new Response('{}', { status: 200 });
    },
  });
  assert.deepEqual(advanced, { ok: true });
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
        closedAt: null,
      }],
    },
  }));
  assert.match(html, /Dyspozycyjność/);
  assert.match(html, /konsultacja/);
  assert.match(html, /staffdesignerana1/);
  assert.match(html, /Zapisz okno/);
  assert.match(html, /Zamknij okno/);
  assert.match(html, /1 czerwca 2026, 08:00 UTC – 1 czerwca 2026, 12:00 UTC/);
  assert.equal(html.includes('2026-06-01T08:00:00.000Z'), false);
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
    await closeAdminCapacityWindow({
      base: 'http://admin.test',
      windowId: 'wcapacitywindow01',
      idempotencyKey: 'cap-close-ui-1',
      fetchImpl: async (url, init) => {
        assert.match(String(url), /\/v1\/capacity-windows\/wcapacitywindow01\/close$/);
        assert.equal(init?.method, 'POST');
        assert.equal(init?.body, '{}');
        return new Response('{}', { status: 200 });
      },
    }),
    { ok: true },
  );
  const closedHtml = renderToStaticMarkup(adminShell({
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
        closedAt: '2026-06-02T08:00:00.000Z',
      }],
    },
  }));
  assert.match(closedHtml, /zamknięte 2 czerwca 2026, 08:00 UTC/);
  assert.equal(closedHtml.includes('2026-06-02T08:00:00.000Z'), false);
  assert.equal(closedHtml.includes('Zamknij okno'), false);
  assert.deepEqual(mapCapacityWindowPage({
    items: [{
      id: 'wcapacitywindow01',
      actorId: 'staffdesignerana1',
      kind: 'consultation',
      startsAt: 'jutro',
      endsAt: '2026-06-01T12:00:00.000Z',
      closedAt: null,
    }],
  }), { status: 'error' });
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
