import assert from 'node:assert/strict';
import test from 'node:test';
import { jsonLdScript, webPageJsonLd } from './structured-data.ts';
import { publicHead, renderHead } from './technical-seo.ts';

test('JSON-LD maps the visible title and description and parses', () => {
  const document = webPageJsonLd({
    name: 'Rabata cienista',
    description: 'Rabata cienista',
    url: 'https://example.test/galeria',
  });
  const parsed = JSON.parse(JSON.stringify(document));
  assert.equal(parsed['@context'], 'https://schema.org');
  assert.equal(parsed['@type'], 'WebPage');
  assert.equal(parsed.name, 'Rabata cienista');
  assert.equal(parsed.description, 'Rabata cienista');
  assert.equal(parsed.url, 'https://example.test/galeria');
  const html = renderHead(publicHead({
    title: 'Rabata cienista',
    description: 'Rabata cienista',
    path: '/galeria',
    indexable: true,
    env: 'production',
    origin: 'https://example.test',
  }));
  assert.match(html, /type="application\/ld\+json"/);
  assert.match(html, /"@type":"WebPage"/);
});

test('unverified ratings, prices, awards and addresses are omitted', () => {
  const document = webPageJsonLd({
    name: 'Forma Zieleni',
    description: 'Opublikowana strona nie jest podłączona.',
    price: '1200 PLN',
    priceCurrency: 'PLN',
    aggregateRating: { ratingValue: '5' },
    award: 'Najlepsza pracownia',
    address: { streetAddress: 'ul. Ogrodowa 1' },
    telephone: '+48111222333',
  });
  const json = JSON.stringify(document);
  assert.equal(json.includes('price'), false);
  assert.equal(json.includes('ratingValue'), false);
  assert.equal(json.includes('award'), false);
  assert.equal(json.includes('streetAddress'), false);
  assert.equal(json.includes('telephone'), false);
  assert.equal(json.includes('LocalBusiness'), false);
  const script = jsonLdScript(document);
  assert.equal(script.includes('<script'), true);
  assert.equal(script.includes('1200'), false);
});
