import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  classifyPortalSession,
  fetchPortalContracts,
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
  assert.match(html, /application\/pdf/);
  assert.match(html, /2048/);
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
  assert.match(ready, /sent/);
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
    assert.match(html, /2026-11-01T10:00:00.000Z/);
  }
  assert.deepEqual(
    await fetchPortalMilestones({
      base: 'http://portal.test',
      fetchImpl: async () => new Response('', { status: 403 }),
    }),
    { status: 'forbidden' },
  );
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
      status: 'active',
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
        status: 'active',
        createdAt: '2026-09-24T12:00:00.000Z',
      }],
    },
    milestones: { status: 'ready', items: milestones },
  }));
  assert.match(html, /portal-project-next">Następny: Koncepcja · zaplanowany · 2026-10-15T10:00:00.000Z/);
  assert.equal(/portal-project-next">[^<]*Odbiór/.test(html), false);
  assert.equal(/portal-project-next">[^<]*Inny projekt/.test(html), false);
  const failed = renderToStaticMarkup(portalShell({
    ...emptySignedIn,
    projects: {
      status: 'ready',
      items: [{
        id: 'pj8k2n4p6q8r0s2t',
        contractId: 'ct8k2n4p6q8r0s2t',
        status: 'active',
        createdAt: '2026-09-24T12:00:00.000Z',
      }],
    },
    milestones: { status: 'error' },
  }));
  assert.match(failed, /Kamieni milowych nie udało się odczytać\./);
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
