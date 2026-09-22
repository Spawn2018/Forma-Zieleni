import assert from 'node:assert/strict';
import test from 'node:test';
import { applyAuditRecommendation, auditTechnicalPages } from './src/search-tech-audit.ts';

const origin = 'https://example.test';

test('technical audit reports noindex, canonical, alt, robots and sitemap issues without publishing', () => {
  const audit = auditTechnicalPages({
    env: 'production',
    origin,
    robotsTxt: 'User-agent: *\nDisallow: /\n',
    sitemapLocs: ['https://evil.example/galeria', 'https://example.test/cicha'],
    pages: [
      {
        path: '/cicha',
        indexableIntent: true,
        robots: 'noindex,nofollow',
        canonical: 'https://other.example/cicha',
        images: [{ alt: '' }],
      },
    ],
  });
  const codes = audit.issues.map((issue) => issue.code);
  assert.equal(codes.includes('NOINDEX'), true);
  assert.equal(codes.includes('BROKEN_CANONICAL'), true);
  assert.equal(codes.includes('MISSING_ALT'), true);
  assert.equal(codes.includes('ROBOTS_HEALTH'), true);
  assert.equal(codes.includes('SITEMAP_HEALTH'), true);
  assert.equal(audit.publishes, false);
  assert.equal('publish' in audit, false);
  assert.throws(() => applyAuditRecommendation(), /AUDIT_DOES_NOT_PUBLISH/);
  const namedOnly = auditTechnicalPages({
    env: 'production',
    origin,
    robotsTxt: 'User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /\n',
    sitemapLocs: [],
    pages: [],
  });
  assert.equal(namedOnly.issues.some((issue) => issue.code === 'ROBOTS_HEALTH'), false);
});

test('a healthy production page and a blocked non-production host stay quiet', () => {
  const healthy = auditTechnicalPages({
    env: 'production',
    origin,
    robotsTxt: 'User-agent: *\nAllow: /\n',
    sitemapLocs: ['https://example.test/galeria'],
    pages: [
      {
        path: '/galeria',
        indexableIntent: true,
        robots: 'index,follow',
        canonical: 'https://example.test/galeria',
        images: [{ alt: 'Cis' }],
      },
    ],
  });
  assert.deepEqual(healthy.issues, []);
  const staging = auditTechnicalPages({
    env: 'non-production',
    origin: 'https://staging.example.test',
    robotsTxt: 'User-agent: *\nDisallow: /\n',
    sitemapLocs: [],
    pages: [
      {
        path: '/',
        indexableIntent: false,
        robots: 'noindex,nofollow',
        canonical: null,
        images: [],
      },
    ],
  });
  assert.deepEqual(staging.issues, []);
  const openStaging = auditTechnicalPages({
    env: 'non-production',
    origin: 'https://staging.example.test',
    robotsTxt: 'User-agent: *\nAllow: /\n',
    sitemapLocs: [],
    pages: [],
  });
  assert.equal(openStaging.issues.some((issue) => issue.code === 'ROBOTS_HEALTH'), true);
});
