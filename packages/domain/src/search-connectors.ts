/** Fixture-only Search Intelligence connectors. Live OAuth is DANGEROUS. */

export const CONNECTOR_IDS = [
  'google-search-console',
  'bing-webmaster',
  'cloudflare-crawler',
  'first-party-analytics',
] as const;

export type ConnectorId = (typeof CONNECTOR_IDS)[number];

export type ConnectorMode = 'fixture' | 'live';

export type ConnectorStatus = 'ok' | 'rate_limited' | 'outage' | 'auth_required';

export type NormalizedObservation = {
  entity:
    | 'SearchMetricObservation'
    | 'SearchQueryObservation'
    | 'SearchPageObservation'
    | 'IndexingObservation'
    | 'CrawlObservation'
    | 'AICitationObservation';
  idempotencyKey: string;
  origin: ConnectorId;
  sourceId: string;
  observedAt: string;
  queryText: string | null;
  evidenceClass: 'MEASURED' | 'ESTIMATED' | 'DERIVED' | 'HEURISTIC' | 'AI-SUGGESTED';
};

export type ConnectorFetchResult = {
  connectorId: ConnectorId;
  status: ConnectorStatus;
  rows: NormalizedObservation[];
  checkpoint: string | null;
  errorCode: string | null;
};

export type ConnectorSecret = {
  kind: 'access_token' | 'refresh_token' | 'api_key';
  value: string;
};

export type SearchConnector = {
  id: ConnectorId;
  mode: ConnectorMode;
  leastScope: string;
  fetch(input: {
    propertyId: string;
    cursor: string | null;
    secrets?: ConnectorSecret[];
  }): ConnectorFetchResult;
};

/** Quotas re-read on this calendar day (Europe/Warsaw intent: connector day). */
export const QUOTA_REREAD_DATE = '2026-09-22';

export type RecordedQuota = {
  connectorId: ConnectorId;
  reReadAt: typeof QUOTA_REREAD_DATE;
  sourceUrl: string;
  limits: ReadonlyArray<{ name: string; value: string }>;
};

/**
 * Quotas and method notes re-read 2026-09-22 from vendor docs.
 * Project Search Analytics QPM beyond the published limits page remains
 * console-specific; do not invent a Cloud Console number.
 */
export const RECORDED_QUOTAS: readonly RecordedQuota[] = [
  {
    connectorId: 'google-search-console',
    reReadAt: QUOTA_REREAD_DATE,
    sourceUrl: 'https://developers.google.com/webmaster-tools/limits',
    limits: [
      { name: 'searchAnalytics.maxRowsPerDayPerSearchType', value: '50000' },
      { name: 'searchAnalytics.pageSize', value: '25000' },
      { name: 'searchAnalytics.perSiteQpm', value: '1200' },
      { name: 'searchAnalytics.perUserQpm', value: '1200' },
      { name: 'searchAnalytics.perProjectQpm', value: '40000' },
      { name: 'searchAnalytics.perProjectQpd', value: '30000000' },
      { name: 'urlInspection.perSiteQpd', value: '2000' },
      { name: 'urlInspection.perSiteQpm', value: '600' },
      { name: 'urlInspection.perProjectQpd', value: '10000000' },
      { name: 'urlInspection.perProjectQpm', value: '15000' },
    ],
  },
  {
    connectorId: 'bing-webmaster',
    reReadAt: QUOTA_REREAD_DATE,
    sourceUrl: 'https://learn.microsoft.com/en-us/bingwebmaster/getting-access',
    limits: [
      { name: 'auth', value: 'oauth2_or_user_scoped_api_key' },
      { name: 'apiKeyScope', value: 'user_not_site' },
      { name: 'aiPerformanceApi', value: 'none_as_of_2026-02-19_staff_reply' },
    ],
  },
  {
    connectorId: 'cloudflare-crawler',
    reReadAt: QUOTA_REREAD_DATE,
    sourceUrl: 'https://developers.cloudflare.com/ai-crawl-control/',
    limits: [
      { name: 'metricsSurface', value: 'dashboard_and_graphql' },
      { name: 'referrals', value: 'paid_plans_only_absent_not_zero' },
      { name: 'retention', value: 'UNKNOWN' },
      { name: 'payPerCrawl', value: 'do_not_enable' },
    ],
  },
  {
    connectorId: 'first-party-analytics',
    reReadAt: QUOTA_REREAD_DATE,
    sourceUrl: 'internal:first-party',
    limits: [{ name: 'vendorSpend', value: 'none' }],
  },
];

/**
 * Bing Webmaster IWebmasterApi methods re-listed 2026-09-22 for the read
 * path FZ may use later. Mutation methods exist on the interface and stay
 * out of the autonomous fixture connector.
 */
export const BING_WEBMASTER_READ_METHODS = [
  'GetUserSites',
  'GetQueryStats',
  'GetPageStats',
  'GetPageQueryStats',
  'GetQueryPageStats',
  'GetQueryPageDetailStats',
  'GetQueryTrafficStats',
  'GetRankAndTrafficStats',
  'GetCrawlStats',
  'GetCrawlIssues',
  'GetCrawlSettings',
  'GetUrlInfo',
  'GetUrlTrafficInfo',
  'GetChildrenUrlInfo',
  'GetChildrenUrlTrafficInfo',
  'GetFeeds',
  'GetFeedDetails',
  'GetFetchedUrls',
  'GetFetchedUrlDetails',
  'GetUrlSubmissionQuota',
  'GetContentSubmissionQuota',
  'GetKeyword',
  'GetKeywordStats',
  'GetRelatedKeywords',
  'GetLinkCounts',
  'GetUrlLinks',
] as const;

const SECRET_KEYS = /^(access_token|refresh_token|api_key|authorization|token|secret|password)$/i;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;

export function redactForLog(value: unknown): unknown {
  if (typeof value === 'string') return value.replace(BEARER, 'Bearer [REDACTED]');
  if (Array.isArray(value)) return value.map(redactForLog);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SECRET_KEYS.test(key) ? '[REDACTED]' : redactForLog(nested);
    }
    return out;
  }
  return value;
}

export function assertFixtureOnly(connector: SearchConnector): void {
  if (connector.mode !== 'fixture') throw new Error('LIVE_CONNECTOR_DANGEROUS');
}

export function createFixtureConnectors(now = '2026-09-22T00:00:00.000Z'): SearchConnector[] {
  return [
    fixtureGsc(now),
    fixtureBing(now),
    fixtureCloudflare(now),
    fixtureAnalytics(now),
  ];
}

function fixtureGsc(now: string): SearchConnector {
  return {
    id: 'google-search-console',
    mode: 'fixture',
    leastScope: 'https://www.googleapis.com/auth/webmasters.readonly',
    fetch(input) {
      rejectLiveSecrets(input.secrets);
      if (input.propertyId === 'outage') {
        return { connectorId: 'google-search-console', status: 'outage', rows: [], checkpoint: input.cursor, errorCode: 'PROVIDER_OUTAGE' };
      }
      if (input.propertyId === 'rate-limited') {
        return { connectorId: 'google-search-console', status: 'rate_limited', rows: [], checkpoint: input.cursor, errorCode: 'QUOTA_EXCEEDED' };
      }
      const key = `gsc:query:${input.propertyId}:${input.cursor ?? 'start'}`;
      return {
        connectorId: 'google-search-console',
        status: 'ok',
        checkpoint: 'gsc-cursor-1',
        errorCode: null,
        rows: [
          {
            entity: 'SearchQueryObservation',
            idempotencyKey: key.slice(0, 120),
            origin: 'google-search-console',
            sourceId: input.propertyId,
            observedAt: now,
            queryText: 'ogrod prywatny',
            evidenceClass: 'MEASURED',
          },
        ],
      };
    },
  };
}

function fixtureBing(now: string): SearchConnector {
  return {
    id: 'bing-webmaster',
    mode: 'fixture',
    leastScope: 'webmaster.read',
    fetch(input) {
      rejectLiveSecrets(input.secrets);
      const key = `bing:page:${input.propertyId}:${input.cursor ?? 'start'}`;
      return {
        connectorId: 'bing-webmaster',
        status: 'ok',
        checkpoint: 'bing-cursor-1',
        errorCode: null,
        // No AICitationObservation: Bing AI Performance has no API as of the
        // 2026-02-19 staff reply re-confirmed 2026-09-22. Absent, not zero.
        rows: [
          {
            entity: 'SearchPageObservation',
            idempotencyKey: key.slice(0, 120),
            origin: 'bing-webmaster',
            sourceId: input.propertyId,
            observedAt: now,
            queryText: null,
            evidenceClass: 'MEASURED',
          },
        ],
      };
    },
  };
}

function fixtureCloudflare(now: string): SearchConnector {
  return {
    id: 'cloudflare-crawler',
    mode: 'fixture',
    leastScope: 'analytics:read',
    fetch(input) {
      rejectLiveSecrets(input.secrets);
      const key = `cf:crawl:${input.propertyId}:${input.cursor ?? 'start'}`;
      return {
        connectorId: 'cloudflare-crawler',
        status: 'ok',
        checkpoint: 'cf-cursor-1',
        errorCode: null,
        rows: [
          {
            entity: 'CrawlObservation',
            idempotencyKey: key.slice(0, 120),
            origin: 'cloudflare-crawler',
            sourceId: input.propertyId,
            observedAt: now,
            queryText: null,
            evidenceClass: 'MEASURED',
          },
        ],
      };
    },
  };
}

function fixtureAnalytics(now: string): SearchConnector {
  return {
    id: 'first-party-analytics',
    mode: 'fixture',
    leastScope: 'first-party',
    fetch(input) {
      rejectLiveSecrets(input.secrets);
      const key = `fp:metric:${input.propertyId}:${input.cursor ?? 'start'}`;
      return {
        connectorId: 'first-party-analytics',
        status: 'ok',
        checkpoint: 'fp-cursor-1',
        errorCode: null,
        rows: [
          {
            entity: 'SearchMetricObservation',
            idempotencyKey: key.slice(0, 120),
            origin: 'first-party-analytics',
            sourceId: input.propertyId,
            observedAt: now,
            queryText: null,
            evidenceClass: 'MEASURED',
          },
        ],
      };
    },
  };
}

function rejectLiveSecrets(secrets: ConnectorSecret[] | undefined): void {
  if (secrets == null || secrets.length === 0) return;
  throw new Error('LIVE_SECRET_REJECTED');
}
