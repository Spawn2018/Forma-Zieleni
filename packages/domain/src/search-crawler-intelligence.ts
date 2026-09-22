/** Crawler intelligence taxonomy and synthetic Cloudflare fixtures. No live zone mutation. */

export const CRAWLER_CLASSES = ['A', 'B', 'C', 'D', 'E'] as const;

export type CrawlerClass = (typeof CRAWLER_CLASSES)[number];

export type CrawlerTaxonomyEntry = {
  token: string;
  class: CrawlerClass;
  purpose: string;
  robotsStance: 'obeys' | 'token_only' | 'weak' | 'may_ignore';
};

/**
 * Binding taxonomy from FZ-SEARCH-1 section 8. Proposed production stances
 * are not applied here. Training tokens stay OPEN (FZ-SEARCH-CRAWL-1).
 */
export const CRAWLER_TAXONOMY: readonly CrawlerTaxonomyEntry[] = [
  { token: 'Googlebot', class: 'A', purpose: 'traditional indexing', robotsStance: 'obeys' },
  { token: 'Google-Extended', class: 'D', purpose: 'training and Gemini grounding token', robotsStance: 'token_only' },
  { token: 'Google-CloudVertexBot', class: 'B', purpose: 'Vertex AI agent crawls', robotsStance: 'token_only' },
  { token: 'GoogleOther', class: 'E', purpose: 'generic research fetch', robotsStance: 'token_only' },
  { token: 'OAI-SearchBot', class: 'B', purpose: 'ChatGPT search', robotsStance: 'obeys' },
  { token: 'GPTBot', class: 'D', purpose: 'model training', robotsStance: 'obeys' },
  { token: 'ChatGPT-User', class: 'C', purpose: 'user-triggered fetch', robotsStance: 'may_ignore' },
  { token: 'ClaudeBot', class: 'D', purpose: 'model training', robotsStance: 'obeys' },
  { token: 'Claude-SearchBot', class: 'B', purpose: 'Claude search index', robotsStance: 'obeys' },
  { token: 'Claude-User', class: 'C', purpose: 'user-triggered fetch', robotsStance: 'obeys' },
  { token: 'PerplexityBot', class: 'B', purpose: 'Perplexity search', robotsStance: 'obeys' },
  { token: 'Perplexity-User', class: 'C', purpose: 'user fetch', robotsStance: 'weak' },
];

export type CloudflarePlan = 'free' | 'paid';

export type CloudflareCrawlerFixture = {
  plan: CloudflarePlan;
  collectedAt: string;
  requests: number;
  paths: string[];
  referrals: number | null;
  referralsAvailability: 'ABSENT_FREE_PLAN' | 'MEASURED';
  payPerCrawl: 'disabled';
};

export function classifyCrawlerToken(token: string): CrawlerClass {
  const hit = CRAWLER_TAXONOMY.find((row) => row.token.toLowerCase() === token.toLowerCase());
  return hit?.class ?? 'E';
}

export function createFreePlanCloudflareFixture(collectedAt: string): CloudflareCrawlerFixture {
  return {
    plan: 'free',
    collectedAt,
    requests: 12,
    paths: ['/uslugi/projekt-ogrodu', '/'],
    referrals: null,
    referralsAvailability: 'ABSENT_FREE_PLAN',
    payPerCrawl: 'disabled',
  };
}

export function assertReferralsAbsentOnFreePlan(fixture: CloudflareCrawlerFixture): void {
  if (fixture.plan !== 'free') throw new Error('PLAN_NOT_FREE');
  if (fixture.referralsAvailability !== 'ABSENT_FREE_PLAN') throw new Error('REFERRALS_MUST_BE_ABSENT');
  if (fixture.referrals !== null) throw new Error('REFERRALS_NOT_ABSENT');
  if (fixture.payPerCrawl !== 'disabled') throw new Error('PAY_PER_CRAWL_FORBIDDEN');
}

export function assertNoLiveCloudflareMutation(intent: Readonly<Record<string, unknown>>): void {
  if (intent.mutateZone === true || intent.applyPolicy === true || intent.payPerCrawl === true) {
    throw new Error('CLOUDFLARE_MUTATION_DANGEROUS');
  }
}
