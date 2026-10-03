import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  classifyPortalSession,
  fetchPortalContracts,
  fetchPortalFileBytes,
  fetchPortalFiles,
  fetchPortalGardens,
  fetchPortalMilestones,
  fetchPortalOffers,
  fetchPortalProjects,
  fetchPortalSiteIntelligence,
  mapPortalContractPage,
  mapPortalFilePage,
  mapPortalGardenPage,
  mapPortalMilestonePage,
  mapPortalOfferPage,
  mapPortalProjectPage,
  mapPortalSitePage,
  nextOpenPortalMilestone,
  portalContractStatusLabel,
  comparePortalMilestones,
  formatByteCount,
  portalContractProjectLine,
  portalMilestoneDueLabel,
  portalOfferStatusLabel,
  portalProjectFiles,
  portalProjectGarden,
  portalProjectSite,
  portalProjectStatusLabel,
  portalErrorMessage,
  portalOriginAllowed,
  portalSessionCookiePresent,
  portalShell,
  resolvePortalHome,
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

const commercialLeak = [
  'cena',
  'price',
  'terms',
  'kwota',
  'blik',
  'stripe',
  'card',
  'płatność',
  'payment',
  'storagekey',
  'downloadurl',
];

const emptySignedIn = {
  state: 'signed-in',
  offers: { status: 'empty' },
  contracts: { status: 'empty' },
  projects: { status: 'empty' },
  files: { status: 'empty' },
  gardens: { status: 'empty' },
  siteIntelligence: { status: 'empty' },
  milestones: { status: 'empty' },
};

test('the portal shell is a signed-out gate without client project data', () => {
  const html = renderToStaticMarkup(portalShell({ state: 'signed-out' }));
  assert.match(html, /Forma Zieleni/);
  assert.match(html, /Portal klienta/);
  assert.match(html, /Zaloguj się, aby zobaczyć swoje projekty\./);
  for (const phrase of [...prohibited, ...commercialLeak]) {
    assert.equal(html.toLowerCase().includes(phrase), false, phrase);
  }
  assert.equal(portalErrorMessage(404), 'Nie ma takiej strony.');
  assert.match(portalErrorMessage(null), /Odśwież stronę/);
  assert.equal(portalErrorMessage(null).includes('stack'), false);
});

test('portal session classification enforces the portal trust zone', async () => {
  assert.deepEqual(classifyPortalSession(null), { state: 'signed-out' });
  assert.deepEqual(classifyPortalSession({ clientId: 'admin' }), { state: 'unauthorized' });
  assert.deepEqual(classifyPortalSession({ clientId: 'web' }), { state: 'unauthorized' });
  assert.deepEqual(classifyPortalSession({ clientId: 'portal' }), { state: 'signed-in' });
  assert.equal(portalOriginAllowed(null, ['http://127.0.0.1:5174']), false);
  assert.equal(portalOriginAllowed('http://evil.example', ['http://127.0.0.1:5174']), false);
  assert.equal(portalOriginAllowed('http://127.0.0.1:5174', ['http://127.0.0.1:5174']), true);
  assert.equal(portalSessionCookiePresent(null), false);
  assert.equal(portalSessionCookiePresent('better-auth.session_token=abc'), true);
  assert.deepEqual(await resolvePortalHome({}), { state: 'signed-out' });
  assert.deepEqual(
    await resolvePortalHome({ probe: async () => ({ clientId: 'portal' }) }),
    emptySignedIn,
  );
  const signedIn = renderToStaticMarkup(portalShell(emptySignedIn));
  assert.match(signedIn, /Jesteś zalogowany/);
  assert.match(signedIn, /Brak pozycji do pokazania/);
  assert.match(signedIn, /Brak umów do pokazania/);
  assert.match(signedIn, /Brak projektów do pokazania/);
  assert.match(signedIn, /Brak plików do pokazania/);
  assert.match(signedIn, /Brak ogrodów do pokazania/);
  assert.match(signedIn, /Brak ustaleń o terenie do pokazania/);
  assert.match(signedIn, /Brak kamieni milowych do pokazania/);
  for (const phrase of commercialLeak) {
    assert.equal(signedIn.toLowerCase().includes(phrase), false, phrase);
  }
  const unauthorized = renderToStaticMarkup(portalShell({ state: 'unauthorized' }));
  assert.match(unauthorized, /nie ma dostępu/);
});

test('signed-in portal renders client-safe offer projection without price or terms', async () => {
  assert.deepEqual(mapPortalOfferPage({ items: [] }), { status: 'empty' });
  assert.deepEqual(mapPortalOfferPage({ items: [{ id: 'x', price: 1 }] }), { status: 'error' });
  assert.deepEqual(mapPortalOfferPage({ items: [null] }), { status: 'error' });
  assert.deepEqual(mapPortalOfferPage({ items: [['nested']] }), { status: 'error' });
  const mapped = mapPortalOfferPage({
    items: [{
      id: 'of8k2n4p6q8r0s2t',
      opportunityId: 'op8k2n4p6q8r0s2t',
      status: 'draft',
      createdAt: '2026-09-24T12:00:00.000Z',
    }],
  });
  assert.equal(mapped.status, 'ready');
  const ready = renderToStaticMarkup(portalShell({
    state: 'signed-in',
    offers: mapped,
    contracts: { status: 'empty' },
    projects: { status: 'empty' },
    files: { status: 'empty' },
    gardens: { status: 'empty' },
    siteIntelligence: { status: 'empty' },
    milestones: { status: 'empty' },
  }));
  assert.match(ready, /of8k2n4p6q8r0s2t/);
  assert.match(ready, /Twoje pozycje/);
  assert.match(ready, /szkic/);
  assert.match(ready, /24 września 2026, 12:00 UTC/);
  assert.equal(ready.includes('2026-09-24T12:00:00.000Z'), false);
  assert.equal(ready.includes('draft'), false);
  assert.equal(mapPortalOfferPage({
    items: [{ id: 'of8k2n4p6q8r0s2t', opportunityId: 'op8k2n4p6q8r0s2t', status: 'draft', createdAt: 't' }],
  }).status, 'error');
  assert.equal(ready.toLowerCase().includes('price'), false);
  assert.equal(ready.toLowerCase().includes('terms'), false);
  assert.equal(ready.toLowerCase().includes('cena'), false);

  const fetched = await fetchPortalOffers({
    base: 'http://portal.test',
    cookie: 'better-auth.session_token=abc',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/portal\/offers\?limit=50$/);
      assert.equal(init?.credentials, 'include');
      assert.equal(init?.headers?.cookie, 'better-auth.session_token=abc');
      return new Response(JSON.stringify({
        items: [{
          id: 'of8k2n4p6q8r0s2u',
          opportunityId: 'op8k2n4p6q8r0s2u',
          status: 'draft',
          createdAt: '2026-09-24T13:00:00.000Z',
        }],
        nextCursor: null,
      }), { status: 200 });
    },
  });
  assert.equal(fetched.status, 'ready');
  if (fetched.status === 'ready') assert.equal(fetched.items[0].id, 'of8k2n4p6q8r0s2u');

  const denied = await fetchPortalOffers({
    base: 'http://portal.test',
    fetchImpl: async () => new Response('', { status: 403 }),
  });
  assert.deepEqual(denied, { status: 'forbidden' });
});

test('signed-in portal renders client-safe project and file projections without payment or bytes', async () => {
  assert.deepEqual(mapPortalProjectPage({ items: [] }), { status: 'empty' });
  assert.deepEqual(mapPortalProjectPage({
    items: [{
      id: 'pj8k2n4p6q8r0s2x',
      contractId: 'ct8k2n4p6q8r0s2x',
      status: 'planned',
      createdAt: '2026-09-24T12:00:00.000Z',
      payment: 1,
    }],
  }), { status: 'error' });
  assert.deepEqual(mapPortalProjectPage({
    items: [{
      id: 'pj8k2n4p6q8r0s2y',
      contractId: 'ct8k2n4p6q8r0s2y',
      status: 'planned',
      createdAt: '2026-09-24T12:00:00.000Z',
      provider: 'x',
    }],
  }), { status: 'error' });
  assert.deepEqual(mapPortalProjectPage({ items: [null] }), { status: 'error' });
  assert.deepEqual(mapPortalFilePage({ items: [] }), { status: 'empty' });
  assert.deepEqual(mapPortalFilePage({
    items: [{
      id: 'fl8k2n4p6q8r0s2x',
      projectId: 'pj8k2n4p6q8r0s2x',
      name: 'plan.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1,
      createdAt: '2026-09-24T12:00:00.000Z',
      storageKey: 'k',
    }],
  }), { status: 'error' });
  assert.deepEqual(mapPortalFilePage({
    items: [{
      id: 'fl8k2n4p6q8r0s2y',
      projectId: 'pj8k2n4p6q8r0s2y',
      name: 'plan.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1,
      createdAt: '2026-09-24T12:00:00.000Z',
      downloadUrl: 'https://evil.example/x',
    }],
  }), { status: 'error' });
  assert.deepEqual(mapPortalFilePage({
    items: [{
      id: 'fl8k2n4p6q8r0s2z',
      projectId: 'pj8k2n4p6q8r0s2z',
      name: 'plan.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1,
      createdAt: '2026-09-24T12:00:00.000Z',
      clientSubject: 'portal-other',
    }],
  }), { status: 'error' });

  const projects = mapPortalProjectPage({
    items: [{
      id: 'pj8k2n4p6q8r0s2t',
      contractId: 'ct8k2n4p6q8r0s2t',
      status: 'planned',
      createdAt: '2026-09-24T12:00:00.000Z',
    }],
  });
  const files = mapPortalFilePage({
    items: [{
      id: 'fl8k2n4p6q8r0s2t',
      projectId: 'pj8k2n4p6q8r0s2t',
      name: 'plan.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2048,
      createdAt: '2026-09-24T12:30:00.000Z',
    }],
  });
  assert.equal(projects.status, 'ready');
  assert.equal(files.status, 'ready');

  const html = renderToStaticMarkup(portalShell({
    state: 'signed-in',
    offers: { status: 'empty' },
    contracts: { status: 'empty' },
    projects,
    files,
    gardens: { status: 'empty' },
    siteIntelligence: { status: 'empty' },
    milestones: { status: 'empty' },
  }));
  assert.match(html, /Twoje projekty/);
  assert.match(html, /pj8k2n4p6q8r0s2t/);
  assert.match(html, /Otwarte kamienie milowe: brak/);
  assert.match(html, /Twoje pliki/);
  assert.match(html, /plan\.pdf/);
  assert.match(html, /Pobierz «plan\.pdf»/);
  assert.match(html, /portal-project-files/);
  assert.match(html, /href="\/files\/fl8k2n4p6q8r0s2t\/content"/);
  assert.equal(html.includes('Pliki: brak'), false);
  assert.match(html, /application\/pdf/);
  assert.match(html, /2 048 B/);
  assert.match(html, /24 września 2026, 12:30 UTC/);
  assert.equal(html.includes('2026-09-24T12:30:00.000Z'), false);
  assert.equal(html.includes('2048 B'), false);
  assert.equal(mapPortalFilePage({
    items: [{
      id: 'fl8k2n4p6q8r0s2t',
      projectId: 'pj8k2n4p6q8r0s2t',
      name: 'plan.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2048,
      createdAt: 't',
    }],
  }).status, 'error');
  assert.equal(mapPortalProjectPage({
    items: [{
      id: 'pj8k2n4p6q8r0s2t',
      contractId: 'ct8k2n4p6q8r0s2t',
      status: 'planned',
      createdAt: 't',
    }],
  }).status, 'error');
  assert.equal(html.includes('2 KB'), false);
  for (const phrase of commercialLeak) {
    assert.equal(html.toLowerCase().includes(phrase), false, phrase);
  }

  const fetchedProjects = await fetchPortalProjects({
    base: 'http://portal.test',
    cookie: 'better-auth.session_token=abc',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/portal\/projects\?limit=50$/);
      assert.equal(init?.credentials, 'include');
      assert.equal(init?.headers?.cookie, 'better-auth.session_token=abc');
      return new Response(JSON.stringify({
        items: [{
          id: 'pj8k2n4p6q8r0s2u',
          contractId: 'ct8k2n4p6q8r0s2u',
          status: 'delivered',
          createdAt: '2026-09-24T14:00:00.000Z',
        }],
        nextCursor: null,
      }), { status: 200 });
    },
  });
  assert.equal(fetchedProjects.status, 'ready');
  if (fetchedProjects.status === 'ready') assert.equal(fetchedProjects.items[0].id, 'pj8k2n4p6q8r0s2u');

  const fetchedFiles = await fetchPortalFiles({
    base: 'http://portal.test',
    cookie: 'better-auth.session_token=abc',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/portal\/files\?limit=50$/);
      assert.equal(init?.credentials, 'include');
      return new Response(JSON.stringify({
        items: [{
          id: 'fl8k2n4p6q8r0s2u',
          projectId: 'pj8k2n4p6q8r0s2u',
          name: 'notes.txt',
          mimeType: 'text/plain',
          sizeBytes: 12,
          createdAt: '2026-09-24T14:30:00.000Z',
        }],
        nextCursor: null,
      }), { status: 200 });
    },
  });
  assert.equal(fetchedFiles.status, 'ready');
  const downloaded = await fetchPortalFileBytes({
    base: 'http://portal.test',
    fileId: 'fl8k2n4p6q8r0s2t',
    cookie: 'better-auth.session_token=abc',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/portal\/files\/fl8k2n4p6q8r0s2t\/content$/);
      assert.equal(init?.credentials, 'include');
      assert.equal(init?.headers?.cookie, 'better-auth.session_token=abc');
      return new Response(Uint8Array.from([1, 2, 3]), {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': 'attachment; filename="plan.pdf"',
          'x-content-checksum-sha256': 'ab'.repeat(32),
        },
      });
    },
  });
  assert.equal(downloaded.ok, true);
  if (downloaded.ok) {
    assert.equal(downloaded.sizeBytes, 3);
    assert.equal(downloaded.fileName, 'plan.pdf');
    assert.equal(downloaded.mimeType, 'application/pdf');
  }
  assert.deepEqual(
    await fetchPortalFileBytes({
      base: 'http://portal.test',
      fileId: 'fl8k2n4p6q8r0s2t',
      fetchImpl: async () => new Response('', { status: 404 }),
    }),
    { ok: false, reason: 'not_found' },
  );
  assert.deepEqual(
    await fetchPortalFileBytes({
      base: 'http://portal.test',
      fileId: '../secret',
      fetchImpl: async () => new Response('no', { status: 200 }),
    }),
    { ok: false, reason: 'error' },
  );

  assert.deepEqual(
    await fetchPortalProjects({
      base: 'http://portal.test',
      fetchImpl: async () => new Response('', { status: 403 }),
    }),
    { status: 'forbidden' },
  );
  assert.deepEqual(
    await fetchPortalFiles({
      base: 'http://portal.test',
      fetchImpl: async () => new Response('', { status: 401 }),
    }),
    { status: 'forbidden' },
  );

  const resolved = await resolvePortalHome({
    probe: async () => ({ clientId: 'portal' }),
    loadOffers: async () => ({ status: 'empty' }),
    loadProjects: async () => projects,
    loadFiles: async () => files,
  });
  assert.equal(resolved.state, 'signed-in');
  if (resolved.state === 'signed-in') {
    assert.equal(resolved.projects.status, 'ready');
    assert.equal(resolved.files.status, 'ready');
  }
});

test('signed-in portal renders client-safe contract status without price or signing', async () => {
  assert.deepEqual(mapPortalContractPage({ items: [] }), { status: 'empty' });
  assert.deepEqual(mapPortalContractPage({ items: [{ id: 'x', amount: 1 }] }), { status: 'error' });
  assert.deepEqual(mapPortalContractPage({ items: [{ id: 'x', offerId: 'y', status: 'draft', createdAt: 't', signing: true }] }), { status: 'error' });
  const mapped = mapPortalContractPage({
    items: [{
      id: 'ct8k2n4p6q8r0s2t',
      offerId: 'of8k2n4p6q8r0s2t',
      status: 'sent',
      createdAt: '2026-09-24T12:00:00.000Z',
    }],
  });
  assert.equal(mapped.status, 'ready');
  const ready = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    contracts: mapped,
  }));
  assert.match(ready, /Twoje umowy/);
  assert.match(ready, /ct8k2n4p6q8r0s2t/);
  assert.match(ready, /wysłana/);
  assert.match(ready, /24 września 2026, 12:00 UTC/);
  assert.equal(ready.includes('2026-09-24T12:00:00.000Z'), false);
  assert.equal(ready.includes('sent'), false);
  assert.equal(mapPortalContractPage({
    items: [{ id: 'ct8k2n4p6q8r0s2t', offerId: 'of8k2n4p6q8r0s2t', status: 'signed', createdAt: 't' }],
  }).status, 'error');
  for (const phrase of commercialLeak) {
    assert.equal(ready.toLowerCase().includes(phrase), false, phrase);
  }
  assert.equal(ready.toLowerCase().includes('qes'), false);
  assert.equal(ready.toLowerCase().includes('signing'), false);

  const fetched = await fetchPortalContracts({
    base: 'http://portal.test',
    cookie: 'better-auth.session_token=abc',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/portal\/contracts\?limit=50$/);
      assert.equal(init?.credentials, 'include');
      assert.equal(init?.headers?.cookie, 'better-auth.session_token=abc');
      return new Response(JSON.stringify({
        items: [{
          id: 'ct8k2n4p6q8r0s2u',
          offerId: 'of8k2n4p6q8r0s2u',
          status: 'draft',
          createdAt: '2026-09-24T13:00:00.000Z',
        }],
        nextCursor: null,
      }), { status: 200 });
    },
  });
  assert.equal(fetched.status, 'ready');
  if (fetched.status === 'ready') assert.equal(fetched.items[0].id, 'ct8k2n4p6q8r0s2u');

  const denied = await fetchPortalContracts({
    base: 'http://portal.test',
    fetchImpl: async () => new Response('', { status: 403 }),
  });
  assert.deepEqual(denied, { status: 'forbidden' });
});

test('portal status labels stay in Polish and refuse an unknown status', () => {
  assert.equal(portalOfferStatusLabel('draft'), 'szkic');
  assert.equal(portalContractStatusLabel('draft'), 'szkic');
  assert.equal(portalContractStatusLabel('internal_review'), 'w przeglądzie');
  assert.equal(portalContractStatusLabel('approved'), 'zatwierdzona');
  assert.equal(portalContractStatusLabel('sent'), 'wysłana');
  assert.equal(portalProjectStatusLabel('planned'), 'zaplanowany');
  assert.equal(portalProjectStatusLabel('delivered'), 'dostarczony');
  assert.equal(mapPortalOfferPage({
    items: [{ id: 'of8k2n4p6q8r0s2t', opportunityId: 'op8k2n4p6q8r0s2t', status: 'sent', createdAt: 't' }],
  }).status, 'error');
  assert.equal(mapPortalProjectPage({
    items: [{ id: 'pj8k2n4p6q8r0s2t', contractId: 'ct8k2n4p6q8r0s2t', status: 'active', createdAt: 't' }],
  }).status, 'error');
});

test('signed-in portal renders a client garden without a twin or live invent', async () => {
  assert.deepEqual(mapPortalGardenPage({ items: [] }), { status: 'empty' });
  assert.deepEqual(mapPortalGardenPage({ items: [{ id: 'x', liveGarden: true }] }), { status: 'error' });
  const mapped = mapPortalGardenPage({
    items: [{
      id: 'gd8k2n4p6q8r0s2t',
      projectId: 'pj8k2n4p6q8r0s2t',
      createdAt: '2026-09-24T15:00:00.000Z',
    }],
  });
  assert.equal(mapped.status, 'ready');
  const ready = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    gardens: mapped,
  }));
  assert.match(ready, /Twoje ogrody/);
  assert.match(ready, /gd8k2n4p6q8r0s2t/);
  assert.match(ready, /24 września 2026, 15:00 UTC/);
  assert.equal(ready.includes('2026-09-24T15:00:00.000Z'), false);
  assert.equal(mapPortalGardenPage({
    items: [{ id: 'gd8k2n4p6q8r0s2t', projectId: 'pj8k2n4p6q8r0s2t', createdAt: 't' }],
  }).status, 'error');
  assert.equal(ready.toLowerCase().includes('twin'), false);
  assert.equal(ready.toLowerCase().includes('sensor'), false);
  for (const phrase of commercialLeak) {
    assert.equal(ready.toLowerCase().includes(phrase), false, phrase);
  }

  const fetched = await fetchPortalGardens({
    base: 'http://portal.test',
    cookie: 'better-auth.session_token=abc',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/portal\/gardens\?limit=50$/);
      assert.equal(init?.credentials, 'include');
      assert.equal(init?.headers?.cookie, 'better-auth.session_token=abc');
      return new Response(JSON.stringify({
        items: [{
          id: 'gd8k2n4p6q8r0s2u',
          projectId: 'pj8k2n4p6q8r0s2u',
          createdAt: '2026-09-24T16:00:00.000Z',
        }],
        nextCursor: null,
      }), { status: 200 });
    },
  });
  assert.equal(fetched.status, 'ready');
  if (fetched.status === 'ready') assert.equal(fetched.items[0].id, 'gd8k2n4p6q8r0s2u');
  assert.deepEqual(
    await fetchPortalGardens({
      base: 'http://portal.test',
      fetchImpl: async () => new Response('', { status: 403 }),
    }),
    { status: 'forbidden' },
  );
});

test('signed-in portal renders site findings without credentials or invented conclusions', async () => {
  assert.deepEqual(mapPortalSitePage({ items: [] }), { status: 'empty' });
  assert.deepEqual(mapPortalSitePage({ items: [{ id: 'x', aiConclusion: 'sunny' }] }), { status: 'error' });
  assert.deepEqual(mapPortalSitePage({
    items: [{
      id: 'si8k2n4p6q8r0s2t',
      projectId: 'pj8k2n4p6q8r0s2t',
      observationIds: ['ob8k2n4p6q8r0s2t'],
      constraints: [{ id: 'sc8k2n4p6q8r0s2t', code: 'slope', note: 'secret' }],
      opportunities: [],
      createdAt: '2026-09-24T15:00:00.000Z',
    }],
  }), { status: 'error' });
  const mapped = mapPortalSitePage({
    items: [{
      id: 'si8k2n4p6q8r0s2t',
      projectId: 'pj8k2n4p6q8r0s2t',
      observationIds: ['ob8k2n4p6q8r0s2t'],
      constraints: [{ id: 'sc8k2n4p6q8r0s2t', code: 'slope' }],
      opportunities: [{ id: 'so8k2n4p6q8r0s2t', code: 'shade' }],
      createdAt: '2026-09-24T15:00:00.000Z',
    }],
  });
  assert.equal(mapped.status, 'ready');
  const ready = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    siteIntelligence: mapped,
  }));
  assert.match(ready, /Teren/);
  assert.match(ready, /si8k2n4p6q8r0s2t/);
  assert.match(ready, /24 września 2026, 15:00 UTC/);
  assert.equal(ready.includes('2026-09-24T15:00:00.000Z'), false);
  assert.match(ready, /Ograniczenia: slope/);
  assert.match(ready, /Możliwości: shade/);
  assert.equal(ready.toLowerCase().includes('credential'), false);
  assert.equal(ready.toLowerCase().includes('geoportal'), false);
  for (const phrase of commercialLeak) {
    assert.equal(ready.toLowerCase().includes(phrase), false, phrase);
  }

  const fetched = await fetchPortalSiteIntelligence({
    base: 'http://portal.test',
    cookie: 'better-auth.session_token=abc',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/portal\/site-intelligence\?limit=50$/);
      assert.equal(init?.credentials, 'include');
      assert.equal(init?.headers?.cookie, 'better-auth.session_token=abc');
      return new Response(JSON.stringify({
        items: [{
          id: 'si8k2n4p6q8r0s2u',
          projectId: 'pj8k2n4p6q8r0s2u',
          observationIds: [],
          constraints: [],
          opportunities: [],
          createdAt: '2026-09-24T16:00:00.000Z',
        }],
        nextCursor: null,
      }), { status: 200 });
    },
  });
  assert.equal(fetched.status, 'ready');
  if (fetched.status === 'ready') {
    assert.equal(fetched.items[0].id, 'si8k2n4p6q8r0s2u');
    const emptyCodes = renderToStaticMarkup(portalShell({
      ...emptySignedIn,
      siteIntelligence: fetched,
    }));
    assert.match(emptyCodes, /Ograniczenia: brak/);
    assert.match(emptyCodes, /Możliwości: brak/);
  }
  assert.deepEqual(
    await fetchPortalSiteIntelligence({
      base: 'http://portal.test',
      fetchImpl: async () => new Response('', { status: 401 }),
    }),
    { status: 'forbidden' },
  );
});

test('signed-in portal renders client milestones without payment or signing', async () => {
  assert.deepEqual(mapPortalMilestonePage({ items: [] }), { status: 'empty' });
  assert.deepEqual(mapPortalMilestonePage({ items: [{ id: 'x', payment: true }] }), { status: 'error' });
  assert.deepEqual(mapPortalMilestonePage({
    items: [{
      id: 'ms8k2n4p6q8r0s2t',
      projectId: 'pj8k2n4p6q8r0s2t',
      title: 'Sadzenie',
      status: 'planned',
      dueAt: null,
      createdAt: '2026-09-24T18:00:00.000Z',
      clientSubject: 'portal-ola',
    }],
  }), { status: 'error' });
  const mapped = mapPortalMilestonePage({
    items: [{
      id: 'ms8k2n4p6q8r0s2t',
      projectId: 'pj8k2n4p6q8r0s2t',
      title: 'Sadzenie',
      status: 'planned',
      dueAt: null,
      createdAt: '2026-09-24T18:00:00.000Z',
    }],
  });
  assert.equal(mapped.status, 'ready');
  const ready = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    milestones: mapped,
  }));
  assert.match(ready, /Kamienie milowe/);
  assert.match(ready, /Sadzenie/);
  assert.match(ready, /zaplanowany/);
  assert.match(ready, /bez terminu/);
  assert.equal(ready.toLowerCase().includes('payment'), false);
  assert.equal(ready.toLowerCase().includes('signing'), false);
  for (const phrase of commercialLeak) {
    assert.equal(ready.toLowerCase().includes(phrase), false, phrase);
  }

  const fetched = await fetchPortalMilestones({
    base: 'http://portal.test',
    cookie: 'better-auth.session_token=abc',
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/v1\/portal\/milestones\?limit=50$/);
      assert.equal(init?.credentials, 'include');
      assert.equal(init?.headers?.cookie, 'better-auth.session_token=abc');
      return new Response(JSON.stringify({
        items: [{
          id: 'ms8k2n4p6q8r0s2u',
          projectId: 'pj8k2n4p6q8r0s2u',
          title: 'Koncepcja',
          status: 'active',
          dueAt: '2026-11-01T10:00:00.000Z',
          createdAt: '2026-09-24T19:00:00.000Z',
        }],
        nextCursor: null,
      }), { status: 200 });
    },
  });
  assert.equal(fetched.status, 'ready');
  if (fetched.status === 'ready') {
    assert.equal(fetched.items[0].title, 'Koncepcja');
    const html = renderToStaticMarkup(portalShell({
      ...emptySignedIn,
      milestones: fetched,
    }));
    assert.match(html, /w toku/);
    assert.match(html, /1 listopada 2026, 10:00 UTC/);
    assert.equal(html.includes('2026-11-01T10:00:00.000Z'), false);
    assert.equal(fetched.items[0].dueAt, '2026-11-01T10:00:00.000Z');
  }
  assert.deepEqual(
    await fetchPortalMilestones({
      base: 'http://portal.test',
      fetchImpl: async () => new Response('', { status: 403 }),
    }),
    { status: 'forbidden' },
  );
});

test('a contract names only the projects already loaded for it', () => {
  const projects = {
    status: 'ready',
    items: [
      {
        id: 'pj8k2n4p6q8r0s2u',
        contractId: 'ct8k2n4p6q8r0s2t',
        status: 'delivered',
        createdAt: '2026-09-24T13:00:00.000Z',
      },
      {
        id: 'pj8k2n4p6q8r0s2t',
        contractId: 'ct8k2n4p6q8r0s2t',
        status: 'planned',
        createdAt: '2026-09-24T12:00:00.000Z',
      },
      {
        id: 'pj8k2n4p6q8r0s2v',
        contractId: 'ct8k2n4p6q8r0s2u',
        status: 'planned',
        createdAt: '2026-09-24T14:00:00.000Z',
      },
    ],
  };
  assert.equal(
    portalContractProjectLine('ct8k2n4p6q8r0s2t', projects),
    'Projekty: pj8k2n4p6q8r0s2t, pj8k2n4p6q8r0s2u',
  );
  assert.equal(portalContractProjectLine('ct8k2n4p6q8r0s2v', projects), 'Projekt: brak');
  assert.equal(portalContractProjectLine('ct8k2n4p6q8r0s2t', { status: 'error' }), 'Projektu nie udało się odczytać.');
  assert.equal(
    portalContractProjectLine('ct8k2n4p6q8r0s2t', { status: 'forbidden' }),
    'To konto nie może odczytać listy projektów.',
  );
  const html = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    contracts: {
      status: 'ready',
      items: [
        {
          id: 'ct8k2n4p6q8r0s2t',
          offerId: 'of8k2n4p6q8r0s2t',
          status: 'sent',
          createdAt: '2026-09-24T12:00:00.000Z',
        },
        {
          id: 'ct8k2n4p6q8r0s2u',
          offerId: 'of8k2n4p6q8r0s2u',
          status: 'draft',
          createdAt: '2026-09-24T13:00:00.000Z',
        },
      ],
    },
    projects,
  }));
  const first = html.slice(html.indexOf('ct8k2n4p6q8r0s2t'), html.indexOf('ct8k2n4p6q8r0s2u'));
  const second = html.slice(html.indexOf('ct8k2n4p6q8r0s2u'));
  assert.equal(
    first.match(/portal-contract-project">([^<]+)/)?.[1],
    'Projekty: pj8k2n4p6q8r0s2t, pj8k2n4p6q8r0s2u',
  );
  assert.equal(first.includes('pj8k2n4p6q8r0s2v'), false);
  assert.equal(second.match(/portal-contract-project">([^<]+)/)?.[1], 'Projekt: pj8k2n4p6q8r0s2v');
  const failed = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    contracts: {
      status: 'ready',
      items: [{
        id: 'ct8k2n4p6q8r0s2t',
        offerId: 'of8k2n4p6q8r0s2t',
        status: 'sent',
        createdAt: '2026-09-24T12:00:00.000Z',
      }],
    },
    projects: { status: 'error' },
  }));
  assert.match(failed, /Projektu nie udało się odczytać\./);
  assert.equal(failed.includes('Projekt: brak'), false);
});

test('a milestone row names its own project', () => {
  assert.deepEqual(mapPortalMilestonePage({
    items: [{
      id: 'ms8k2n4p6q8r0s2t',
      projectId: '   ',
      title: 'Koncepcja',
      status: 'planned',
      dueAt: null,
      createdAt: '2026-09-24T18:00:00.000Z',
    }],
  }), { status: 'error' });
  const html = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    milestones: {
      status: 'ready',
      items: [
        {
          id: 'ms8k2n4p6q8r0s2t',
          projectId: 'pj8k2n4p6q8r0s2t',
          title: 'Koncepcja',
          status: 'planned',
          dueAt: null,
          createdAt: '2026-09-24T18:00:00.000Z',
        },
        {
          id: 'ms8k2n4p6q8r0s2u',
          projectId: 'pj8k2n4p6q8r0s2u',
          title: 'Sadzenie',
          status: 'active',
          dueAt: '2026-11-01T10:00:00.000Z',
          createdAt: '2026-09-24T19:00:00.000Z',
        },
      ],
    },
  }));
  const lines = [...html.matchAll(/portal-milestone-meta">([^<]+)/g)].map((match) => match[1]);
  assert.deepEqual(lines, [
    'Sadzenie · w toku · 1 listopada 2026, 10:00 UTC · projekt pj8k2n4p6q8r0s2u',
    'Koncepcja · zaplanowany · bez terminu · projekt pj8k2n4p6q8r0s2t',
  ]);
});

test('a file row names its own project', () => {
  assert.equal(mapPortalFilePage({
    items: [{
      id: 'fl8k2n4p6q8r0s2t',
      projectId: '   ',
      name: 'plan.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 12,
      createdAt: '2026-09-24T12:30:00.000Z',
    }],
  }).status, 'error');
  const html = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    files: {
      status: 'ready',
      items: [
        {
          id: 'fl8k2n4p6q8r0s2t',
          projectId: 'pj8k2n4p6q8r0s2t',
          name: 'plan.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 2048,
          createdAt: '2026-09-24T12:30:00.000Z',
        },
        {
          id: 'fl8k2n4p6q8r0s2u',
          projectId: 'pj8k2n4p6q8r0s2u',
          name: 'rzut.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 12,
          createdAt: '2026-09-24T13:00:00.000Z',
        },
      ],
    },
  }));
  const lines = [...html.matchAll(/portal-file-meta">([^<]+)/g)].map((match) => match[1]);
  assert.equal(lines[0].endsWith('· projekt pj8k2n4p6q8r0s2t'), true);
  assert.equal(lines[0].includes('pj8k2n4p6q8r0s2u'), false);
  assert.equal(lines[1].endsWith('· projekt pj8k2n4p6q8r0s2u'), true);
  assert.equal(lines[1].includes('pj8k2n4p6q8r0s2t'), false);
});

test('a file size stays an exact grouped byte count', () => {
  assert.equal(formatByteCount(0), '0 B');
  assert.equal(formatByteCount(999), '999 B');
  assert.equal(formatByteCount(2048), '2 048 B');
  assert.equal(formatByteCount(1048576), '1 048 576 B');
  assert.equal(formatByteCount(1.5), null);
  assert.equal(formatByteCount(-1), null);
  const html = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    files: {
      status: 'ready',
      items: [{
        id: 'fl8k2n4p6q8r0s2t',
        projectId: 'pj8k2n4p6q8r0s2t',
        name: 'plan.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1.5,
        createdAt: '2026-09-24T12:30:00.000Z',
      }],
    },
  }));
  assert.match(html, /plan\.pdf · application\/pdf · rozmiar nieczytelny ·/);
  assert.equal(html.includes('1.5'), false);
});

test('portal milestones sort by due and keep a done row', () => {
  const rows = [
    { id: 'ms8k2n4p6q8r0s2u', dueAt: '2026-11-01T10:00:00.000Z' },
    { id: 'ms8k2n4p6q8r0s2t', dueAt: '2026-11-01T10:00:00.000Z' },
    { id: 'ms8k2n4p6q8r0s2v', dueAt: null },
    { id: 'ms8k2n4p6q8r0s2w', dueAt: '2026-10-01T10:00:00.000Z' },
  ];
  assert.deepEqual([...rows].sort(comparePortalMilestones).map((row) => row.id), [
    'ms8k2n4p6q8r0s2w',
    'ms8k2n4p6q8r0s2t',
    'ms8k2n4p6q8r0s2u',
    'ms8k2n4p6q8r0s2v',
  ]);
  const html = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    milestones: {
      status: 'ready',
      items: [
        {
          id: 'ms8k2n4p6q8r0s2u',
          projectId: 'pj8k2n4p6q8r0s2t',
          title: 'Później',
          status: 'done',
          dueAt: '2026-12-01T10:00:00.000Z',
          createdAt: '2026-09-24T18:00:00.000Z',
        },
        {
          id: 'ms8k2n4p6q8r0s2t',
          projectId: 'pj8k2n4p6q8r0s2t',
          title: 'Wcześniej',
          status: 'planned',
          dueAt: '2026-10-01T10:00:00.000Z',
          createdAt: '2026-09-24T18:00:00.000Z',
        },
      ],
    },
  }));
  const titles = [...html.matchAll(/portal-milestone-meta">([^<]+)/g)].map((match) => match[1]);
  assert.equal(titles[0].startsWith('Wcześniej · zaplanowany'), true);
  assert.equal(titles[1].startsWith('Później · zrobiony'), true);
});

test('a project card names the earliest open milestone and skips done work', () => {
  const milestones = [
    {
      id: 'ms8k2n4p6q8r0s2v',
      projectId: 'pj8k2n4p6q8r0s2t',
      title: 'Odbiór',
      status: 'done',
      dueAt: '2026-10-01T10:00:00.000Z',
      createdAt: '2026-09-24T18:00:00.000Z',
    },
    {
      id: 'ms8k2n4p6q8r0s2w',
      projectId: 'pj8k2n4p6q8r0s2t',
      title: 'Sadzenie',
      status: 'planned',
      dueAt: '2026-11-02T10:00:00.000Z',
      createdAt: '2026-09-24T18:00:00.000Z',
    },
    {
      id: 'ms8k2n4p6q8r0s2x',
      projectId: 'pj8k2n4p6q8r0s2t',
      title: 'Koncepcja',
      status: 'planned',
      dueAt: '2026-10-15T10:00:00.000Z',
      createdAt: '2026-09-24T18:00:00.000Z',
    },
    {
      id: 'ms8k2n4p6q8r0s2y',
      projectId: 'pj8k2n4p6q8r0s2u',
      title: 'Inny projekt',
      status: 'planned',
      dueAt: '2026-10-02T10:00:00.000Z',
      createdAt: '2026-09-24T18:00:00.000Z',
    },
  ];
  assert.equal(nextOpenPortalMilestone('pj8k2n4p6q8r0s2t', milestones)?.title, 'Koncepcja');
  assert.equal(nextOpenPortalMilestone('pj8k2n4p6q8r0s2v', milestones), null);
  const html = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    projects: {
      status: 'ready',
      items: [{
        id: 'pj8k2n4p6q8r0s2t',
        contractId: 'ct8k2n4p6q8r0s2t',
        status: 'planned',
        createdAt: '2026-09-24T12:00:00.000Z',
      }],
    },
    milestones: { status: 'ready', items: milestones },
  }));
  assert.match(html, /portal-project-next">Następny: Koncepcja · zaplanowany · 15 października 2026, 10:00 UTC/);
  assert.equal(html.includes('2026-10-15T10:00:00.000Z'), false);
  assert.equal(portalMilestoneDueLabel(null), 'bez terminu');
  assert.equal(portalMilestoneDueLabel('2024-02-29T00:00:00.000Z'), '29 lutego 2024, 00:00 UTC');
  assert.equal(portalMilestoneDueLabel('jutro'), null);
  assert.equal(portalMilestoneDueLabel('2026-02-31T00:00:00.000Z'), null);
  assert.deepEqual(mapPortalMilestonePage({
    items: [{
      id: 'ms8k2n4p6q8r0s2t',
      projectId: 'pj8k2n4p6q8r0s2t',
      title: 'Koncepcja',
      status: 'planned',
      dueAt: 'jutro',
      createdAt: '2026-09-24T18:00:00.000Z',
    }],
  }), { status: 'error' });
  assert.equal(/portal-project-next">[^<]*Odbiór/.test(html), false);
  assert.equal(/portal-project-next">[^<]*Inny projekt/.test(html), false);
  const failed = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    projects: {
      status: 'ready',
      items: [{
        id: 'pj8k2n4p6q8r0s2t',
        contractId: 'ct8k2n4p6q8r0s2t',
        status: 'planned',
        createdAt: '2026-09-24T12:00:00.000Z',
      }],
    },
    milestones: { status: 'error' },
  }));
  assert.match(failed, /Kamieni milowych nie udało się odczytać\./);
});

test('a project card lists only that project’s files', () => {
  const files = [
    {
      id: 'fl8k2n4p6q8r0s2t',
      projectId: 'pj8k2n4p6q8r0s2t',
      name: 'plan.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2048,
      createdAt: '2026-09-24T12:30:00.000Z',
    },
    {
      id: 'fl8k2n4p6q8r0s2u',
      projectId: 'pj8k2n4p6q8r0s2u',
      name: 'inny.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 12,
      createdAt: '2026-09-24T12:40:00.000Z',
    },
  ];
  assert.deepEqual(portalProjectFiles('pj8k2n4p6q8r0s2t', files).map((file) => file.name), ['plan.pdf']);
  const html = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    projects: {
      status: 'ready',
      items: [{
        id: 'pj8k2n4p6q8r0s2t',
        contractId: 'ct8k2n4p6q8r0s2t',
        status: 'planned',
        createdAt: '2026-09-24T12:00:00.000Z',
      }],
    },
    files: { status: 'ready', items: files },
  }));
  const projectCard = html.slice(html.indexOf('portal-project"'), html.indexOf('portal-files'));
  assert.match(projectCard, /Pobierz «plan\.pdf»/);
  assert.equal(projectCard.includes('inny.pdf'), false);
  const failed = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    projects: {
      status: 'ready',
      items: [{
        id: 'pj8k2n4p6q8r0s2t',
        contractId: 'ct8k2n4p6q8r0s2t',
        status: 'planned',
        createdAt: '2026-09-24T12:00:00.000Z',
      }],
    },
    files: { status: 'error' },
  }));
  assert.match(failed, /Listy plików nie udało się pobrać\./);
  assert.equal(failed.includes('Pliki: brak'), false);
});

test('a project card names its own contract', () => {
  assert.deepEqual(mapPortalProjectPage({
    items: [{
      id: 'pj8k2n4p6q8r0s2t',
      contractId: '   ',
      status: 'planned',
      createdAt: '2026-09-24T12:00:00.000Z',
    }],
  }), { status: 'error' });
  const html = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    projects: {
      status: 'ready',
      items: [
        {
          id: 'pj8k2n4p6q8r0s2t',
          contractId: 'ct8k2n4p6q8r0s2t',
          status: 'planned',
          createdAt: '2026-09-24T12:00:00.000Z',
        },
        {
          id: 'pj8k2n4p6q8r0s2u',
          contractId: 'ct8k2n4p6q8r0s2u',
          status: 'delivered',
          createdAt: '2026-09-24T13:00:00.000Z',
        },
      ],
    },
  }));
  const first = html.slice(html.indexOf('pj8k2n4p6q8r0s2t'), html.indexOf('pj8k2n4p6q8r0s2u'));
  const second = html.slice(html.indexOf('pj8k2n4p6q8r0s2u'));
  assert.equal(first.match(/portal-project-contract">([^<]+)/)?.[1], 'Umowa: ct8k2n4p6q8r0s2t');
  assert.equal(second.match(/portal-project-contract">([^<]+)/)?.[1], 'Umowa: ct8k2n4p6q8r0s2u');
  assert.equal(first.includes('ct8k2n4p6q8r0s2u'), false);
});

test('a project card names only that project’s garden', () => {
  const gardens = [
    {
      id: 'gd8k2n4p6q8r0s2t',
      projectId: 'pj8k2n4p6q8r0s2t',
      createdAt: '2026-09-24T13:00:00.000Z',
    },
    {
      id: 'gd8k2n4p6q8r0s2u',
      projectId: 'pj8k2n4p6q8r0s2u',
      createdAt: '2026-09-24T13:10:00.000Z',
    },
  ];
  assert.equal(portalProjectGarden('pj8k2n4p6q8r0s2t', gardens)?.id, 'gd8k2n4p6q8r0s2t');
  assert.equal(portalProjectGarden('pj8k2n4p6q8r0s2v', gardens), null);
  const project = {
    id: 'pj8k2n4p6q8r0s2t',
    contractId: 'ct8k2n4p6q8r0s2t',
    status: 'delivered',
    createdAt: '2026-09-24T12:00:00.000Z',
  };
  const html = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    projects: { status: 'ready', items: [project] },
    gardens: { status: 'ready', items: gardens },
  }));
  const gardenLine = html.match(/portal-project-garden">([^<]+)/)?.[1] ?? '';
  assert.equal(gardenLine, 'Ogród: gd8k2n4p6q8r0s2t');
  assert.equal(gardenLine.includes('gd8k2n4p6q8r0s2u'), false);
  const missing = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    projects: { status: 'ready', items: [project] },
    gardens: { status: 'empty' },
  }));
  assert.match(missing, /Ogród: brak/);
  const failed = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    projects: { status: 'ready', items: [project] },
    gardens: { status: 'error' },
  }));
  assert.match(failed, /Ogrodu nie udało się odczytać\./);
  assert.equal(failed.includes('Ogród: brak'), false);
});

test('a project card counts only that project’s site findings', () => {
  const sites = [
    {
      id: 'si8k2n4p6q8r0s2t',
      projectId: 'pj8k2n4p6q8r0s2t',
      observationIds: [],
      constraints: [{ id: 'sc8k2n4p6q8r0s2t', code: 'slope' }],
      opportunities: [
        { id: 'so8k2n4p6q8r0s2t', code: 'sun' },
        { id: 'so8k2n4p6q8r0s2u', code: 'shelter' },
      ],
      createdAt: '2026-09-24T13:00:00.000Z',
    },
    {
      id: 'si8k2n4p6q8r0s2u',
      projectId: 'pj8k2n4p6q8r0s2u',
      observationIds: [],
      constraints: [{ id: 'sc8k2n4p6q8r0s2u', code: 'water' }],
      opportunities: [],
      createdAt: '2026-09-24T13:10:00.000Z',
    },
  ];
  assert.equal(portalProjectSite('pj8k2n4p6q8r0s2t', sites)?.id, 'si8k2n4p6q8r0s2t');
  assert.equal(portalProjectSite('pj8k2n4p6q8r0s2v', sites), null);
  const project = {
    id: 'pj8k2n4p6q8r0s2t',
    contractId: 'ct8k2n4p6q8r0s2t',
    status: 'delivered',
    createdAt: '2026-09-24T12:00:00.000Z',
  };
  const html = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    projects: { status: 'ready', items: [project] },
    siteIntelligence: { status: 'ready', items: sites },
  }));
  const siteLine = html.match(/portal-project-site">([^<]+)/)?.[1] ?? '';
  assert.equal(siteLine, 'Teren: 1 ograniczenie · 2 możliwości');
  assert.equal(siteLine.includes('water'), false);
  assert.equal(siteLine.includes('si8k2n4p6q8r0s2u'), false);
  const missing = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    projects: { status: 'ready', items: [project] },
    siteIntelligence: { status: 'empty' },
  }));
  assert.match(missing, /Teren: brak/);
  const failed = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    projects: { status: 'ready', items: [project] },
    siteIntelligence: { status: 'error' },
  }));
  assert.match(failed, /Ustaleń o terenie nie udało się odczytać\./);
  assert.equal(failed.includes('Teren: brak'), false);
});

test('the route module keeps an error boundary and does not invent CRM facts', () => {
  const home = readFileSync(new URL('./routes/home.tsx', import.meta.url), 'utf8');
  const root = readFileSync(new URL('./root.tsx', import.meta.url), 'utf8');
  const shell = readFileSync(new URL('./shell.ts', import.meta.url), 'utf8');
  assert.match(home, /portalShell/);
  assert.match(home, /resolvePortalHome/);
  assert.match(home, /fetchPortalOffers/);
  assert.match(home, /fetchPortalContracts/);
  assert.match(home, /fetchPortalProjects/);
  assert.match(home, /fetchPortalFiles/);
  assert.match(readFileSync(new URL('./routes.ts', import.meta.url), 'utf8'), /files\/:fileId\/content/);
  assert.match(readFileSync(new URL('./routes/file-content.ts', import.meta.url), 'utf8'), /fetchPortalFileBytes/);
  assert.match(home, /fetchPortalGardens/);
  assert.match(home, /fetchPortalSiteIntelligence/);
  assert.match(home, /fetchPortalMilestones/);
  assert.match(home, /request\.headers\.get\('cookie'\)/);
  assert.match(root, /export function ErrorBoundary/);
  assert.match(root, /portalErrorMessage/);
  assert.match(root, /noindex/);
  assert.equal(home.includes('fonts.googleapis.com'), false);
  assert.equal(root.includes('fonts.googleapis.com'), false);
  assert.equal(shell.includes('leads:'), false);
  assert.equal(shell.includes('offers:create'), false);
  assert.equal(shell.includes('offers:read'), false);
  assert.equal(shell.includes('projects:write'), false);
  assert.equal(shell.includes('upload'), false);
  for (const phrase of prohibited) {
    assert.equal(home.toLowerCase().includes(phrase), false, phrase);
    assert.equal(root.toLowerCase().includes(phrase), false, phrase);
  }
});
