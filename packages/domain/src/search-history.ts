/** In-memory search history windows from stored snapshots. PostgreSQL rollups stay later. */

export const HISTORY_WINDOW_DAYS = [7, 28, 90, 180, 365] as const;

export type HistoryWindowDays = (typeof HISTORY_WINDOW_DAYS)[number];

export type SearchSnapshotRecord = {
  snapshotId: string;
  propertyId: string;
  windowDays: HistoryWindowDays;
  periodStart: string;
  periodEnd: string;
  collectedAt: string;
  observationCount: number;
};

export type SearchSnapshotStore = {
  snapshots: SearchSnapshotRecord[];
};

export function createSnapshotStore(): SearchSnapshotStore {
  return { snapshots: [] };
}

export function rememberSnapshot(
  store: SearchSnapshotStore,
  input: SearchSnapshotRecord,
): SearchSnapshotRecord {
  const duplicate = store.snapshots.find((s) => s.snapshotId === input.snapshotId);
  if (duplicate) return duplicate;
  if (!HISTORY_WINDOW_DAYS.includes(input.windowDays)) throw new Error('WINDOW_INVALID');
  store.snapshots.push(input);
  return input;
}

function parseDay(iso: string): number {
  return Date.parse(iso.slice(0, 10));
}

function dayMs(days: number): number {
  return days * 86_400_000;
}

export type HistoryWindowView = {
  windowDays: HistoryWindowDays;
  propertyId: string;
  periodStart: string;
  periodEnd: string;
  snapshots: SearchSnapshotRecord[];
  observationTotal: number;
};

export function viewHistoryWindow(
  store: SearchSnapshotStore,
  input: { propertyId: string; windowDays: HistoryWindowDays; asOf: string },
): HistoryWindowView {
  if (!HISTORY_WINDOW_DAYS.includes(input.windowDays)) throw new Error('WINDOW_INVALID');
  const endMs = parseDay(input.asOf);
  const startMs = endMs - dayMs(input.windowDays) + dayMs(1);
  const periodStart = new Date(startMs).toISOString().slice(0, 10);
  const periodEnd = input.asOf.slice(0, 10);
  const snapshots = store.snapshots.filter((row) => {
    if (row.propertyId !== input.propertyId) return false;
    if (row.windowDays !== input.windowDays) return false;
    const rowStart = parseDay(row.periodStart);
    const rowEnd = parseDay(row.periodEnd);
    return rowStart >= startMs && rowEnd <= endMs;
  });
  const observationTotal = snapshots.reduce((sum, row) => sum + row.observationCount, 0);
  return {
    windowDays: input.windowDays,
    propertyId: input.propertyId,
    periodStart,
    periodEnd,
    snapshots,
    observationTotal,
  };
}

export type YearOverYearComparison = {
  windowDays: HistoryWindowDays;
  propertyId: string;
  current: HistoryWindowView | null;
  prior: HistoryWindowView | null;
  comparable: boolean;
};

export function compareYearOverYear(
  store: SearchSnapshotStore,
  input: { propertyId: string; windowDays: HistoryWindowDays; asOf: string },
): YearOverYearComparison {
  const current = viewHistoryWindow(store, input);
  const priorEndMs = parseDay(input.asOf) - dayMs(365);
  const priorAsOf = new Date(priorEndMs).toISOString().slice(0, 10);
  const prior = viewHistoryWindow(store, { ...input, asOf: priorAsOf });
  const currentHas = current.snapshots.length > 0;
  const priorHas = prior.snapshots.length > 0;
  return {
    windowDays: input.windowDays,
    propertyId: input.propertyId,
    current: currentHas ? current : null,
    prior: priorHas ? prior : null,
    comparable: currentHas && priorHas,
  };
}
