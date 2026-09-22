import {
  RETENTION_NOTE,
  createSearchStore,
  rememberObservation,
} from './search-data.ts';
import type { SearchEntityName, SearchObservation } from './search-data.ts';

export type SearchRestoreBundle = {
  kind: 'fz-search-observation-restore';
  version: 1;
  rows: SearchObservation[];
};

export type UnresyncableRow = {
  idempotencyKey: string;
  entity: SearchEntityName;
  origin: string;
  observedAt: string;
  reason: 'UPSTREAM_RETENTION_UNKNOWN' | 'PAST_KNOWN_RETENTION_WINDOW';
};

export function snapshotSearchStore(
  store: ReturnType<typeof createSearchStore>,
): SearchRestoreBundle {
  return {
    kind: 'fz-search-observation-restore',
    version: 1,
    rows: store.rows.map((row) => ({
      entity: row.entity,
      idempotencyKey: row.idempotencyKey,
      provenance: { ...row.provenance },
      queryText: row.queryText,
      retention: row.retention,
    })),
  };
}

export function restoreSearchStore(bundle: SearchRestoreBundle): ReturnType<typeof createSearchStore> {
  if (bundle.kind !== 'fz-search-observation-restore' || bundle.version !== 1) {
    throw new Error('SEARCH_RESTORE_INVALID');
  }
  const store = createSearchStore();
  for (const row of bundle.rows) {
    rememberObservation(store, {
      entity: row.entity,
      idempotencyKey: row.idempotencyKey,
      origin: row.provenance.origin,
      sourceId: row.provenance.sourceId,
      observedAt: row.provenance.observedAt,
      queryText: row.queryText,
    });
  }
  return store;
}

/**
 * Rows that cannot be re-fetched after an upstream window closes.
 * While source retention is UNKNOWN, every historical row is listed —
 * do not invent a retention length (see RETENTION_NOTE).
 */
export function listUnresyncableAfterUpstreamRetention(
  store: ReturnType<typeof createSearchStore>,
  input?: { knownRetentionDays?: number; asOf?: string },
): { note: string; rows: UnresyncableRow[] } {
  const rows: UnresyncableRow[] = [];
  const knownDays = input?.knownRetentionDays;
  const asOfMs = input?.asOf ? Date.parse(input.asOf.slice(0, 10)) : null;

  for (const row of store.rows) {
    if (knownDays == null || Number.isNaN(knownDays) || knownDays <= 0) {
      rows.push({
        idempotencyKey: row.idempotencyKey,
        entity: row.entity,
        origin: row.provenance.origin,
        observedAt: row.provenance.observedAt,
        reason: 'UPSTREAM_RETENTION_UNKNOWN',
      });
      continue;
    }
    if (asOfMs == null) {
      rows.push({
        idempotencyKey: row.idempotencyKey,
        entity: row.entity,
        origin: row.provenance.origin,
        observedAt: row.provenance.observedAt,
        reason: 'UPSTREAM_RETENTION_UNKNOWN',
      });
      continue;
    }
    const observedMs = Date.parse(row.provenance.observedAt.slice(0, 10));
    const ageDays = (asOfMs - observedMs) / 86_400_000;
    if (ageDays > knownDays) {
      rows.push({
        idempotencyKey: row.idempotencyKey,
        entity: row.entity,
        origin: row.provenance.origin,
        observedAt: row.provenance.observedAt,
        reason: 'PAST_KNOWN_RETENTION_WINDOW',
      });
    }
  }

  return { note: RETENTION_NOTE, rows };
}
