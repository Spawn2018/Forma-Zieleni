import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BeforeAfter, beforeAfterLibrary } from './src/before-after.mjs';
import { Gallery, Lightbox, lightboxBehavior } from './src/gallery.mjs';
import { loadBeforeAfterModule, loadLightboxModule } from './src/libraries.mjs';

const items = [
  { id: 'a', thumb: '/media/a/w400.webp', large: '/media/a/w1600.webp', alt: 'Rabata', width: 400, height: 225, largeWidth: 1600, largeHeight: 900, caption: 'Rabata laboratoryjna' },
  { id: 'b', thumb: '/media/b/w400.webp', large: '/media/b/w1600.webp', alt: 'Taras', width: 400, height: 225, largeWidth: 1600, largeHeight: 900 },
];

test('gallery and lightbox markup stay keyboard-first and use derivatives', () => {
  const gallery = renderToStaticMarkup(h(Gallery, { items, onOpen() {} }));
  assert.match(gallery, /aria-roledescription="carousel"/);
  assert.match(gallery, /loading="lazy"/);
  assert.match(gallery, /w400\.webp/);
  const lightbox = renderToStaticMarkup(h(Lightbox, {
    open: true,
    items,
    index: 0,
    onClose() {},
    onPrev() {},
    onNext() {},
  }));
  assert.match(lightbox, /aria-modal="true"/);
  assert.match(lightbox, /aria-label="Zamknij"/);
  assert.match(lightbox, /w1600\.webp/);
  assert.doesNotMatch(lightbox, /master/);
  assert.equal(lightboxBehavior().imageClickDoesNotClose, true);
  assert.equal(lightboxBehavior().usesDerivativeNotMaster, true);
});

test('before/after exposes a labelled range control', () => {
  const html = renderToStaticMarkup(h(BeforeAfter, {
    before: { src: '/media/before/w800.webp', alt: 'Przed', width: 800, height: 450 },
    after: { src: '/media/after/w800.webp', alt: 'Po', width: 800, height: 450 },
    position: 40,
    onPosition() {},
  }));
  assert.match(html, /aria-label="Porównanie przed i po"/);
  assert.match(html, /type="range"/);
  assert.match(html, /aria-valuenow="40"/);
  assert.equal(beforeAfterLibrary().keyboard, true);
});

test('maintained OSS libraries resolve in the isolated proto', async () => {
  const lightbox = await loadLightboxModule();
  const compare = await loadBeforeAfterModule();
  assert.equal(lightbox.hasDefault, true);
  assert.equal(compare.hasCompare, true);
});
