import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { compareControl, comparePair, comparePosition } from './before-after.ts';

const before = { assetId: 'ma8k2n4p6q8r0001', alt: 'Cis przed', width: 800, height: 450, mode: 'CONTAIN' };
const after = { assetId: 'ma8k2n4p6q8r0002', alt: 'Cis po', width: 800, height: 450, mode: 'CONTAIN' };

test('a pair keeps one crop mode and derivative frames', () => {
  const pair = comparePair(before, after);
  assert.equal(pair.mode, 'CONTAIN');
  assert.equal(pair.before.src, '/media/ma8k2n4p6q8r0001/w800.webp');
  assert.equal(pair.after.src, '/media/ma8k2n4p6q8r0002/w800.webp');
  assert.equal(pair.before.width, pair.after.width);
  assert.equal(pair.before.height, pair.after.height);
  assert.equal(pair.before.src.includes('master'), false);
  assert.equal(pair.before.alt, 'Przed. Cis przed');
  assert.throws(() => comparePair(before, { ...after, mode: 'SMART_FILL' }), /CROP_MODE_MISMATCH/);
  assert.throws(() => comparePair(before, { ...after, height: 400 }), /FRAME_MISMATCH/);
  assert.throws(() => comparePair(before, { ...before }), /PAIR_IDENTICAL/);
});

test('the comparison has a keyboard range, not a pointer-only control', () => {
  const html = renderToStaticMarkup(compareControl(40));
  assert.match(html, /type="range"/);
  assert.match(html, /aria-label="Porównanie przed i po"/);
  assert.match(html, /aria-valuenow="40"/);
  assert.match(html, />Przed</);
  assert.match(html, />Po</);
  assert.equal(comparePosition(140), 100);
  assert.equal(comparePosition(-4), 0);
  const route = readFileSync(new URL('./routes/compare.tsx', import.meta.url), 'utf8');
  const view = readFileSync(new URL('./before-after-view.tsx', import.meta.url), 'utf8');
  assert.match(route, /Nie ma opublikowanego porównania/);
  assert.match(view, /react-compare-slider/);
  assert.match(view, /keyboardIncrement/);
  assert.equal(route.includes('master'), false);
  assert.equal(view.includes('/masters/'), false);
});
