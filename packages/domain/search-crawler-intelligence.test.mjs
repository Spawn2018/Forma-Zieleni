import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CRAWLER_CLASSES,
  CRAWLER_TAXONOMY,
  assertNoLiveCloudflareMutation,
  assertReferralsAbsentOnFreePlan,
  classifyCrawlerToken,
  createFreePlanCloudflareFixture,
} from './src/search-crawler-intelligence.ts';

test('crawler taxonomy covers classes A through E', () => {
  assert.deepEqual([...CRAWLER_CLASSES], ['A', 'B', 'C', 'D', 'E']);
  for (const cls of CRAWLER_CLASSES) {
    assert.equal(CRAWLER_TAXONOMY.some((row) => row.class === cls), true, cls);
  }
  assert.equal(classifyCrawlerToken('Googlebot'), 'A');
  assert.equal(classifyCrawlerToken('OAI-SearchBot'), 'B');
  assert.equal(classifyCrawlerToken('ChatGPT-User'), 'C');
  assert.equal(classifyCrawlerToken('GPTBot'), 'D');
  assert.equal(classifyCrawlerToken('Unknown-Bot-XYZ'), 'E');
});

test('free-plan Cloudflare fixture keeps referrals absent, not zero', () => {
  const fixture = createFreePlanCloudflareFixture('2026-09-22T02:30:00.000Z');
  assertReferralsAbsentOnFreePlan(fixture);
  assert.equal(fixture.referrals, null);
  assert.equal(fixture.referralsAvailability, 'ABSENT_FREE_PLAN');
  assert.equal(fixture.payPerCrawl, 'disabled');
  assert.throws(
    () => assertNoLiveCloudflareMutation({ mutateZone: true }),
    /CLOUDFLARE_MUTATION_DANGEROUS/,
  );
  assert.throws(
    () => assertNoLiveCloudflareMutation({ payPerCrawl: true }),
    /CLOUDFLARE_MUTATION_DANGEROUS/,
  );
});
