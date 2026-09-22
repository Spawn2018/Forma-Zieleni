import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { homeShell, publicErrorMessage } from './shell.ts';

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

function rendered(home) {
  return renderToStaticMarkup(homeShell(home));
}

test('the shell renders a published title and no marketing claims', () => {
  const published = rendered({ state: 'published', title: 'Rabata cienista' });
  assert.match(published, /<h1>Rabata cienista<\/h1>/);
  assert.equal(published.includes('Forma Zieleni'), false);
  const empty = rendered({ state: 'absent' });
  const unconfigured = rendered({ state: 'unconfigured' });
  const hostile = rendered({ state: 'published', title: '<script>alert(1)</script>' });
  assert.match(empty, /Nie ma opublikowanej strony\./);
  assert.match(unconfigured, /Opublikowana strona nie jest podłączona\./);
  assert.equal(hostile.includes('<script>'), false);
  assert.match(hostile, /&lt;script&gt;/);
  const all = [published, empty, unconfigured, hostile, publicErrorMessage(404), publicErrorMessage(500)].join('\n');
  for (const phrase of prohibited) {
    assert.equal(all.toLowerCase().includes(phrase), false, phrase);
  }
  assert.equal(publicErrorMessage(404), 'Nie ma takiej strony.');
  assert.match(publicErrorMessage(null), /Odśwież stronę/);
  assert.equal(publicErrorMessage(null).includes('stack'), false);
});

test('the route module renders the shell and keeps an error boundary', () => {
  const home = readFileSync(new URL('./routes/home.tsx', import.meta.url), 'utf8');
  const root = readFileSync(new URL('./root.tsx', import.meta.url), 'utf8');
  assert.match(home, /readPublishedHome/);
  assert.match(home, /homeShell/);
  assert.match(root, /export function ErrorBoundary/);
  assert.match(root, /publicErrorMessage/);
  assert.equal(home.includes('fonts.googleapis.com'), false);
  assert.equal(root.includes('fonts.googleapis.com'), false);
  for (const phrase of prohibited) {
    assert.equal(home.toLowerCase().includes(phrase), false, phrase);
    assert.equal(root.toLowerCase().includes(phrase), false, phrase);
  }
});
