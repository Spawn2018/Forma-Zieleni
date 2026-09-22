import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { homeShell } from './shell.ts';
import { publicHead, renderHead } from './technical-seo.ts';

const token = 'UNPUBLISHED_TOKEN_9f3a';

test('public html escapes a hostile title and omits an unpublished token', () => {
  const published = renderToStaticMarkup(homeShell({ state: 'published', title: 'Projekt ogrodu' }));
  assert.equal(published.includes(token), false);
  assert.equal(published.includes('Szkic'), false);
  const hostile = renderToStaticMarkup(homeShell({ state: 'published', title: '<img src=x onerror=alert(1)>' }));
  assert.equal(hostile.includes('<img'), false);
  assert.match(hostile, /&lt;img/);
  const head = renderHead(publicHead({
    title: '<script>alert(1)</script>',
    description: 'Projekt ogrodu',
    path: '/',
    indexable: false,
    env: 'non-production',
    origin: undefined,
  }));
  assert.equal(head.includes('<script>alert'), false);
  assert.equal(head.includes(token), false);
});
