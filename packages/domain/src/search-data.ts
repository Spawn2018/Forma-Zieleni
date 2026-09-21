export const SEARCH_ENTITIES = [
  'SearchProperty',
  'SearchSource',
  'SearchMetricObservation',
  'SearchQueryObservation',
  'SearchPageObservation',
  'IndexingObservation',
  'CrawlObservation',
  'AICitationObservation',
  'AIReferralObservation',
  'TechnicalSEOIssue',
  'ContentOpportunity',
  'SearchAlert',
  'SearchSnapshot',
  'AttributionTouch',
  'SearchContentLink',
] as const;

export type SearchEntityName = (typeof SEARCH_ENTITIES)[number];

export const RETENTION_NOTE =
  'Source retention is UNKNOWN until that source documents a window. Do not invent a history length.';

export type SearchObservation = {
  entity: SearchEntityName;
  idempotencyKey: string;
  provenance: { origin: string; sourceId: string; observedAt: string };
  queryText: string | null;
  retention: 'UNKNOWN';
};

export function createSearchStore() {
  return { rows: [] as SearchObservation[], byKey: new Map<string, SearchObservation>() };
}

export function rememberObservation(
  store: ReturnType<typeof createSearchStore>,
  input: {
    entity: SearchEntityName;
    idempotencyKey: string;
    origin: string;
    sourceId: string;
    observedAt: string;
    queryText?: string | null;
    formBody?: unknown;
  },
): SearchObservation {
  if (!SEARCH_ENTITIES.includes(input.entity)) throw new Error('ENTITY_UNKNOWN');
  if (!/^[a-z0-9:_-]{8,120}$/.test(input.idempotencyKey)) throw new Error('IDEMPOTENCY_KEY_INVALID');
  if (input.formBody != null) throw new Error('FORM_BODY_REJECTED');
  const existing = store.byKey.get(input.idempotencyKey);
  if (existing) return existing;
  const row: SearchObservation = {
    entity: input.entity,
    idempotencyKey: input.idempotencyKey,
    provenance: { origin: input.origin, sourceId: input.sourceId, observedAt: input.observedAt },
    queryText: input.entity === 'SearchQueryObservation' ? input.queryText ?? null : null,
    retention: 'UNKNOWN',
  };
  store.rows.push(row);
  store.byKey.set(row.idempotencyKey, row);
  return row;
}
