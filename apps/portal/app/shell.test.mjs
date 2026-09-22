import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  classifyPortalSession,
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

const projectLeak = ['projekt nr', 'oferta', 'umowa', 'faktura', 'płatność', 'pliki klienta'];

test('the portal shell is a signed-out gate without client project data', () => {
  const html = renderToStaticMarkup(portalShell({ state: 'signed-out' }));
  assert.match(html, /Forma Zieleni/);
  assert.match(html, /Portal klienta/);
  assert.match(html, /Zaloguj się, aby zobaczyć swoje projekty\./);
  for (const phrase of [...prohibited, ...projectLeak]) {
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
  assert.deepEqual(await resolvePortalHome({ probe: async () => ({ clientId: 'portal' }) }), { state: 'signed-in' });
  const signedIn = renderToStaticMarkup(portalShell({ state: 'signed-in' }));
  assert.match(signedIn, /Jesteś zalogowany/);
  for (const phrase of projectLeak) {
    assert.equal(signedIn.toLowerCase().includes(phrase), false, phrase);
  }
  const unauthorized = renderToStaticMarkup(portalShell({ state: 'unauthorized' }));
  assert.match(unauthorized, /nie ma dostępu/);
});

test('the route module keeps an error boundary and does not invent CRM facts', () => {
  const home = readFileSync(new URL('./routes/home.tsx', import.meta.url), 'utf8');
  const root = readFileSync(new URL('./root.tsx', import.meta.url), 'utf8');
  const shell = readFileSync(new URL('./shell.ts', import.meta.url), 'utf8');
  assert.match(home, /portalShell/);
  assert.match(home, /resolvePortalHome/);
  assert.match(root, /export function ErrorBoundary/);
  assert.match(root, /portalErrorMessage/);
  assert.match(root, /noindex/);
  assert.equal(home.includes('fonts.googleapis.com'), false);
  assert.equal(root.includes('fonts.googleapis.com'), false);
  assert.equal(shell.includes('leads:'), false);
  assert.equal(shell.includes('offers:'), false);
  for (const phrase of prohibited) {
    assert.equal(home.toLowerCase().includes(phrase), false, phrase);
    assert.equal(root.toLowerCase().includes(phrase), false, phrase);
  }
});
