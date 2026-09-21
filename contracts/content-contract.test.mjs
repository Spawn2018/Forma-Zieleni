import test from 'node:test';
import assert from 'node:assert/strict';
import { contentContract, reviewSeo, seoDefaults } from './content-contract.mjs';

const page = {
  type: 'Page',
  title: 'Projektowanie ogrodów',
  summary: 'Jak Forma Zieleni prowadzi projekt ogrodu od rozmowy do realizacji.',
  publicUrl: 'https://formazieleni.example/projektowanie-ogrodow',
  heroAssetId: 'asset_hero_01',
};

test('content contract covers the CMS types and hides sitemap trivia from editors', () => {
  const contract = contentContract();
  assert.deepEqual(contract.types, [
    'Page',
    'Article',
    'Service',
    'ProjectCaseStudy',
    'MediaAsset',
    'MediaCollection',
    'SiteSettings',
  ]);
  assert.equal(contract.seoEditorFields.includes('priority'), false);
  assert.equal(contract.seoEditorFields.includes('changeFrequency'), false);
  assert.equal(contract.notBusinessApi, true);
});

test('SEO defaults come from the page and stay overridable', () => {
  const defaults = seoDefaults(page);
  assert.equal(defaults.title, page.title);
  assert.equal(defaults.description, page.summary);
  assert.equal(defaults.canonical, page.publicUrl);
  assert.deepEqual(defaults.robots, { index: true, follow: true });
  const reviewed = reviewSeo({ ...page, seo: { title: 'Projekt ogrodu' } });
  assert.equal(reviewed.seo.title, 'Projekt ogrodu');
  assert.equal(reviewed.seo.description, page.summary);
  assert.equal(reviewed.publishBlocked, false);
});

test('a malformed canonical blocks publish and a thin description does not', () => {
  const broken = reviewSeo({ ...page, seo: { canonical: 'http://insecure.example/a?x=1' } });
  assert.equal(broken.errors.some((issue) => issue.code === 'canonical-malformed'), true);
  assert.equal(broken.publishBlocked, true);
  const thin = reviewSeo({ ...page, summary: 'Krótko', seo: { description: 'Krótko' } });
  assert.equal(thin.errors.length, 0);
  assert.equal(thin.recommendations.some((issue) => issue.code === 'description-thin'), true);
  assert.equal(thin.publishBlocked, false);
});

test('noindex is a warning and private case-study fields are rejected', () => {
  const hidden = reviewSeo({ ...page, seo: { robots: { index: false, follow: true } } });
  assert.equal(hidden.warnings.some((issue) => issue.code === 'public-noindex'), true);
  assert.equal(hidden.publishBlocked, false);
  const leaked = reviewSeo({
    type: 'ProjectCaseStudy',
    title: 'Ogród przy domu',
    summary: 'Opis realizacji bez danych klienta i bez dokładnego adresu.',
    publicUrl: 'https://formazieleni.example/realizacje/ogrod',
    customerName: 'Jan',
    businessProjectRef: 'prj_12345678',
  });
  assert.equal(leaked.errors.some((issue) => issue.code === 'forbidden-public-field'), true);
  assert.equal(leaked.publishBlocked, true);
});

test('businessProjectRef stays optional and opaque', () => {
  const absent = reviewSeo(page);
  assert.equal(absent.errors.some((issue) => issue.code === 'business-project-ref-not-opaque'), false);
  const bad = reviewSeo({ ...page, businessProjectRef: 'https://crm.example/projects/1' });
  assert.equal(bad.errors.some((issue) => issue.code === 'business-project-ref-not-opaque'), true);
});
