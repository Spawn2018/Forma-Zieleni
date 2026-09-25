import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  classifyPortalSession,
  fetchPortalOffers,
  mapPortalOfferPage,
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

const commercialLeak = ['cena', 'price', 'terms', 'kwota', 'blik', 'stripe', 'card', 'płatność'];

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
    { state: 'signed-in', offers: { status: 'empty' } },
  );
  const signedIn = renderToStaticMarkup(portalShell({ state: 'signed-in', offers: { status: 'empty' } }));
  assert.match(signedIn, /Jesteś zalogowany/);
  assert.match(signedIn, /Brak pozycji do pokazania/);
  for (const phrase of commercialLeak) {
    assert.equal(signedIn.toLowerCase().includes(phrase), false, phrase);
  }
  const unauthorized = renderToStaticMarkup(portalShell({ state: 'unauthorized' }));
  assert.match(unauthorized, /nie ma dostępu/);
});

test('signed-in portal renders client-safe offer projection without price or terms', async () => {
  assert.deepEqual(mapPortalOfferPage({ items: [] }), { status: 'empty' });
  assert.deepEqual(mapPortalOfferPage({ items: [{ id: 'x', price: 1 }] }), { status: 'error' });
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

test('the route module keeps an error boundary and does not invent CRM facts', () => {
  const home = readFileSync(new URL('./routes/home.tsx', import.meta.url), 'utf8');
  const root = readFileSync(new URL('./root.tsx', import.meta.url), 'utf8');
  const shell = readFileSync(new URL('./shell.ts', import.meta.url), 'utf8');
  assert.match(home, /portalShell/);
  assert.match(home, /resolvePortalHome/);
  assert.match(home, /fetchPortalOffers/);
  assert.match(home, /request\.headers\.get\('cookie'\)/);
  assert.match(root, /export function ErrorBoundary/);
  assert.match(root, /portalErrorMessage/);
  assert.match(root, /noindex/);
  assert.equal(home.includes('fonts.googleapis.com'), false);
  assert.equal(root.includes('fonts.googleapis.com'), false);
  assert.equal(shell.includes('leads:'), false);
  assert.equal(shell.includes('offers:create'), false);
  assert.equal(shell.includes('offers:read'), false);
  for (const phrase of prohibited) {
    assert.equal(home.toLowerCase().includes(phrase), false, phrase);
    assert.equal(root.toLowerCase().includes(phrase), false, phrase);
  }
});
