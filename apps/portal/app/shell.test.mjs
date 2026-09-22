import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { portalErrorMessage, portalShell } from './shell.ts';

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

test('the route module keeps an error boundary and does not invent CRM facts', () => {
  const home = readFileSync(new URL('./routes/home.tsx', import.meta.url), 'utf8');
  const root = readFileSync(new URL('./root.tsx', import.meta.url), 'utf8');
  const shell = readFileSync(new URL('./shell.ts', import.meta.url), 'utf8');
  assert.match(home, /portalShell/);
  assert.match(home, /signed-out/);
  assert.match(root, /export function ErrorBoundary/);
  assert.match(root, /portalErrorMessage/);
  assert.match(root, /noindex/);
  assert.equal(home.includes('fonts.googleapis.com'), false);
  assert.equal(root.includes('fonts.googleapis.com'), false);
  assert.equal(shell.includes('leads:'), false);
  assert.equal(shell.includes('fetch('), false);
  for (const phrase of prohibited) {
    assert.equal(home.toLowerCase().includes(phrase), false, phrase);
    assert.equal(root.toLowerCase().includes(phrase), false, phrase);
  }
});
