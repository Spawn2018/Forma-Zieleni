import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  classifyPortalSession,
  fetchPortalFiles,
  fetchPortalOffers,
  fetchPortalProjects,
  mapPortalFilePage,
  mapPortalOfferPage,
  mapPortalProjectPage,
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
  projects: { status: 'empty' },
  files: { status: 'empty' },
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
  assert.match(signedIn, /Brak projektów do pokazania/);
  assert.match(signedIn, /Brak plików do pokazania/);
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
    projects: { status: 'empty' },
    files: { status: 'empty' },
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
    projects,
    files,
  }));
  assert.match(html, /Twoje projekty/);
  assert.match(html, /pj8k2n4p6q8r0s2t/);
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

test('the route module keeps an error boundary and does not invent CRM facts', () => {
  const home = readFileSync(new URL('./routes/home.tsx', import.meta.url), 'utf8');
  const root = readFileSync(new URL('./root.tsx', import.meta.url), 'utf8');
  const shell = readFileSync(new URL('./shell.ts', import.meta.url), 'utf8');
  assert.match(home, /portalShell/);
  assert.match(home, /resolvePortalHome/);
  assert.match(home, /fetchPortalOffers/);
  assert.match(home, /fetchPortalProjects/);
  assert.match(home, /fetchPortalFiles/);
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
