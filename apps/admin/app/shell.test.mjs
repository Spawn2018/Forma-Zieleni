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
  assert.deepEqual(await resolveAdminHome({ probe: async () => ({ clientId: 'admin' }) }), { state: 'signed-in' });
  const signedIn = renderToStaticMarkup(adminShell({ state: 'signed-in' }));
  assert.match(signedIn, /Jesteś zalogowany/);
  for (const phrase of crmLeak) {
    assert.equal(signedIn.toLowerCase().includes(phrase), false, phrase);
  }
  const unauthorized = renderToStaticMarkup(adminShell({ state: 'unauthorized' }));
  assert.match(unauthorized, /nie ma dostępu/);
});

test('the route module keeps an error boundary and does not invent CRM facts', () => {
  const home = readFileSync(new URL('./routes/home.tsx', import.meta.url), 'utf8');
  const root = readFileSync(new URL('./root.tsx', import.meta.url), 'utf8');
  const shell = readFileSync(new URL('./shell.ts', import.meta.url), 'utf8');
  assert.match(home, /adminShell/);
  assert.match(home, /resolveAdminHome/);
  assert.match(root, /export function ErrorBoundary/);
  assert.match(root, /adminErrorMessage/);
  assert.match(root, /noindex/);
  assert.equal(home.includes('fonts.googleapis.com'), false);
  assert.equal(root.includes('fonts.googleapis.com'), false);
  assert.equal(shell.includes('leads:'), false);
  assert.equal(shell.includes('offers:'), false);
  assert.equal(shell.includes('projects:'), false);
  for (const phrase of prohibited) {
    assert.equal(home.toLowerCase().includes(phrase), false, phrase);
    assert.equal(root.toLowerCase().includes(phrase), false, phrase);
  }
});
