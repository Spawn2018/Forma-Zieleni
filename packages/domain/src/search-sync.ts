import { rememberObservation, createSearchStore } from './search-data.ts';
import type { ConnectorId, ConnectorStatus, SearchConnector } from './search-connectors.ts';
import { CONNECTOR_IDS } from './search-connectors.ts';

export const SYNC_BACKOFF_BASE_MS = 60_000;
export const SYNC_BACKOFF_MAX_MS = 15 * 60_000;

export type ConnectorCheckpoint = {
  connectorId: ConnectorId;
  cursor: string | null;
  lastStatus: ConnectorStatus | 'skipped_backoff';
  errorCode: string | null;
  backoffUntilMs: number | null;
  consecutiveFailures: number;
};

export type SearchSyncJobState = {
  propertyId: string;
  checkpoints: Record<ConnectorId, ConnectorCheckpoint>;
  lastRunAt: string | null;
};

export type SearchSyncConnectorOutcome = {
  connectorId: ConnectorId;
  status: ConnectorStatus | 'skipped_backoff';
  persisted: number;
  errorCode: string | null;
};

export type SearchSyncRunResult = {
  job: SearchSyncJobState;
  outcomes: SearchSyncConnectorOutcome[];
  totalPersisted: number;
};

function emptyCheckpoint(connectorId: ConnectorId): ConnectorCheckpoint {
  return {
    connectorId,
    cursor: null,
    lastStatus: 'ok',
    errorCode: null,
    backoffUntilMs: null,
    consecutiveFailures: 0,
  };
}

export function createSearchSyncJob(propertyId: string): SearchSyncJobState {
  const checkpoints = Object.fromEntries(
    CONNECTOR_IDS.map((id) => [id, emptyCheckpoint(id)]),
  ) as Record<ConnectorId, ConnectorCheckpoint>;
  return { propertyId, checkpoints, lastRunAt: null };
}

export function backoffDelayMs(consecutiveFailures: number): number {
  if (consecutiveFailures <= 0) return 0;
  const scaled = SYNC_BACKOFF_BASE_MS * 2 ** (consecutiveFailures - 1);
  return Math.min(scaled, SYNC_BACKOFF_MAX_MS);
}

function isRetryable(status: ConnectorStatus): boolean {
  return status === 'rate_limited' || status === 'outage';
}

export function runSearchSyncJob(
  job: SearchSyncJobState,
  input: {
    connectors: SearchConnector[];
    store: ReturnType<typeof createSearchStore>;
    nowMs?: number;
    nowIso?: string;
  },
): SearchSyncRunResult {
  const nowMs = input.nowMs ?? Date.now();
  const nowIso = input.nowIso ?? new Date(nowMs).toISOString();
  const outcomes: SearchSyncConnectorOutcome[] = [];
  let totalPersisted = 0;

  for (const connector of input.connectors) {
    const checkpoint = job.checkpoints[connector.id] ?? emptyCheckpoint(connector.id);

    if (checkpoint.backoffUntilMs != null && nowMs < checkpoint.backoffUntilMs) {
      const skipped: ConnectorCheckpoint = {
        ...checkpoint,
        lastStatus: 'skipped_backoff',
      };
      job.checkpoints[connector.id] = skipped;
      outcomes.push({
        connectorId: connector.id,
        status: 'skipped_backoff',
        persisted: 0,
        errorCode: checkpoint.errorCode,
      });
      continue;
    }

    const fetchResult = connector.fetch({
      propertyId: job.propertyId,
      cursor: checkpoint.cursor,
    });

    let persisted = 0;
    if (fetchResult.status === 'ok') {
      for (const row of fetchResult.rows) {
        rememberObservation(input.store, {
          entity: row.entity,
          idempotencyKey: row.idempotencyKey,
          origin: row.origin,
          sourceId: row.sourceId,
          observedAt: row.observedAt,
          queryText: row.queryText,
        });
        persisted += 1;
      }
      job.checkpoints[connector.id] = {
        connectorId: connector.id,
        cursor: fetchResult.checkpoint,
        lastStatus: 'ok',
        errorCode: null,
        backoffUntilMs: null,
        consecutiveFailures: 0,
      };
    } else if (isRetryable(fetchResult.status)) {
      const failures = checkpoint.consecutiveFailures + 1;
      const delay = backoffDelayMs(failures);
      job.checkpoints[connector.id] = {
        connectorId: connector.id,
        cursor: checkpoint.cursor,
        lastStatus: fetchResult.status,
        errorCode: fetchResult.errorCode,
        backoffUntilMs: delay > 0 ? nowMs + delay : null,
        consecutiveFailures: failures,
      };
    } else {
      job.checkpoints[connector.id] = {
        connectorId: connector.id,
        cursor: checkpoint.cursor,
        lastStatus: fetchResult.status,
        errorCode: fetchResult.errorCode,
        backoffUntilMs: null,
        consecutiveFailures: checkpoint.consecutiveFailures,
      };
    }

    totalPersisted += persisted;
    outcomes.push({
      connectorId: connector.id,
      status: job.checkpoints[connector.id].lastStatus,
      persisted,
      errorCode: fetchResult.errorCode,
    });
  }

  job.lastRunAt = nowIso;
  return { job, outcomes, totalPersisted };
}
