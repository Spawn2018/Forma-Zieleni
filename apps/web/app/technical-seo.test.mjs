import assert from 'node:assert/strict';
import test from 'node:test';
import { publicHead, renderHead, resolvePublicRequest, robotsTxt, seoEnv, sitemapXml } from './technical-seo.ts';

test('the rendered head has title, description, canonical and robots', () => {
  const html = renderHead(publicHead({
    title: 'Rabata cienista',
    description: 'Rabata cienista',
    path: '/galeria/',
    indexable: true,
    env: 'production',
    origin: 'https://example.test',
  }));
  assert.match(html, /<title>Rabata cienista<\/title>/);
  assert.match(html, /name="description"/);
  assert.match(html, /name="robots" content="index,follow"/);
  assert.match(html, /rel="canonical" href="https:\/\/example\.test\/galeria"/);
  assert.equal(html.includes('master'), false);
});

test('a non-production host cannot be indexed and production is not Disallow all', () => {
  assert.equal(seoEnv(undefined), 'non-production');
  assert.equal(seoEnv('production'), 'production');
  const staging = renderHead(publicHead({
    title: 'Forma Zieleni',
    description: 'Opublikowana strona nie jest podłączona.',
    path: '/',
    indexable: true,
    env: 'non-production',
    origin: 'https://staging.example.test',
  }));
  assert.match(staging, /content="noindex,nofollow"/);
  assert.equal(staging.includes('canonical'), false);
  const blocked = robotsTxt('non-production');
  assert.match(blocked, /Disallow: \//);
  const production = robotsTxt('production');
  assert.equal(/^Disallow: \/$/m.test(production), false);
  assert.match(production, /Allow: \//);
  assert.equal(blocked.includes('GPTBot'), false);
  assert.equal(production.includes('GPTBot'), false);
  assert.equal(blocked.includes('Sitemap:'), false);
  assert.equal(blocked.includes('ClaudeBot'), false);
  const named = robotsTxt('production', 'https://example.test');
  assert.match(named, /Sitemap: https:\/\/example\.test\/sitemap\.xml/);
  assert.equal(/^Disallow: \/$/m.test(named), false);
  const hidden = sitemapXml('non-production', 'https://staging.example.test', ['/galeria']);
  assert.equal(hidden.includes('<loc>'), false);
  const listed = sitemapXml('production', 'https://example.test', ['/galeria', 'https://evil.example/x']);
  assert.match(listed, /<loc>https:\/\/example\.test\/galeria<\/loc>/);
  assert.equal(listed.includes('evil.example'), false);
});

test('trailing slashes and tracking queries redirect, and an old slug is preserved', () => {
  const slash = resolvePublicRequest(new URL('http://127.0.0.1/galeria/?utm_source=test&ok=1'));
  assert.deepEqual(slash, { status: 301, location: '/galeria?ok=1' });
  const legacy = resolvePublicRequest(new URL('http://127.0.0.1/stary-slug'), { '/stary-slug': '/galeria' });
  assert.deepEqual(legacy, { status: 301, location: '/galeria' });
  assert.deepEqual(resolvePublicRequest(new URL('http://127.0.0.1/brak')), { status: 404 });
  assert.deepEqual(resolvePublicRequest(new URL('http://127.0.0.1/')), { status: 200, path: '/' });
  assert.throws(() => resolvePublicRequest(new URL('http://127.0.0.1/stary'), { '/stary': 'https://evil.example' }), /PATH_INVALID|REDIRECT_TARGET_INVALID/);
});
