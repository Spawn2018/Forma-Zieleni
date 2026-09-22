import assert from 'node:assert/strict';
import test from 'node:test';
import {
  insertKeywordLink,
  publishContentRecommendation,
  recommendFromPublishedGraph,
  recommendTitleAlignment,
  suggestAiDraft,
} from './src/search-content-intelligence.ts';

test('published graph reports orphans and broken links without inserting or publishing', () => {
  const links = ['/brak', 'https://example.test/zewnatrz'];
  const report = recommendFromPublishedGraph([
    { id: 'svc-usluga', kind: 'Service', path: '/usluga', links },
    { id: 'art-wpis', kind: 'Article', path: '/wpis', links: [] },
  ]);
  const codes = report.recommendations.map((item) => item.code);
  assert.deepEqual(codes, ['BROKEN_LINK', 'ORPHAN', 'ORPHAN']);
  assert.equal(report.recommendations[0].evidence, 'published-graph:svc-usluga->/brak');
  assert.equal(report.recommendations[1].documentId, 'svc-usluga');
  assert.equal(report.recommendations[2].documentId, 'art-wpis');
  assert.equal(report.publishes, false);
  assert.equal(report.recommendations.every((item) => item.status === 'EVIDENCE' && item.paidService === false), true);
  assert.deepEqual(links, ['/brak', 'https://example.test/zewnatrz']);
  assert.throws(() => publishContentRecommendation(), /CONTENT_INTELLIGENCE_DOES_NOT_PUBLISH/);
  assert.throws(() => insertKeywordLink(), /CONTENT_INTELLIGENCE_DOES_NOT_INSERT_LINKS/);
});

test('a page with one inbound link and no outbound link is a weak connection', () => {
  const report = recommendFromPublishedGraph([
    { id: 'svc-usluga', kind: 'Service', path: '/usluga', links: ['/wpis', '/realizacja'] },
    { id: 'art-wpis', kind: 'Article', path: '/wpis', links: ['/usluga'] },
    { id: 'case-realizacja', kind: 'ProjectCaseStudy', path: '/realizacja', links: [] },
  ]);
  assert.deepEqual(report.recommendations.map((item) => item.code), ['WEAK_CONNECTION']);
  assert.equal(report.recommendations[0].documentId, 'case-realizacja');
});

test('a fully linked published graph stays quiet', () => {
  const report = recommendFromPublishedGraph([
    { id: 'svc-usluga', kind: 'Service', path: '/usluga', links: ['/wpis'] },
    { id: 'art-wpis', kind: 'Article', path: '/wpis', links: ['/usluga'] },
  ]);
  assert.deepEqual(report.recommendations, []);
});

test('title alignment quotes the measured query and does not carry a rewrite', () => {
  const recommendation = recommendTitleAlignment({
    documentId: 'svc-usluga',
    query: 'projekt ogrodu',
    impressions: 120,
    ctr: 0.04,
  });
  assert.equal(recommendation.code, 'TITLE_ALIGNMENT');
  assert.equal(recommendation.detail, 'Query "projekt ogrodu" has 120 impressions and CTR 0.04. Review title alignment.');
  assert.equal(recommendation.publishes, false);
  assert.equal('rewrite' in recommendation, false);
  assert.equal('title' in recommendation, false);
  assert.throws(() => recommendTitleAlignment({ documentId: 'svc-usluga', query: 'projekt ogrodu', impressions: 0, ctr: 0.04 }), /IMPRESSIONS_REQUIRED/);
  assert.throws(() => recommendTitleAlignment({ documentId: 'svc-usluga', query: 'projekt ogrodu', impressions: 10, ctr: 2 }), /CTR_RANGE/);
});

test('AI drafts stay suggested and alt text cannot invent image contents', () => {
  const draft = suggestAiDraft({
    documentId: 'svc-usluga',
    field: 'alt',
    text: 'cis przed',
    evidence: 'cis przed domem',
  });
  assert.equal(draft.status, 'AI-SUGGESTED');
  assert.equal(draft.paidService, false);
  assert.equal(draft.publishes, false);
  assert.throws(
    () => suggestAiDraft({ documentId: 'svc-usluga', field: 'alt', text: 'złoty zachód słońca', evidence: 'cis przed domem' }),
    /ALT_INVENTED/,
  );
  assert.throws(() => suggestAiDraft({ documentId: 'svc-usluga', field: 'title', text: 'Nowa nazwa', evidence: '   ' }), /EVIDENCE_REQUIRED/);
});
