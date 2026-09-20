-- Migracja 0009: pracownia i reszta listy v8 (18-SKETCHUP-CLAUDE.md, 16-CO-BYM-ZMIENIL.md B5, B7). Wymaga 0001–0008.

-- Obmiar z modelu SketchUp: podstawa kosztorysu realizacji (K2) i listy zakupów.
CREATE TABLE IF NOT EXISTS takeoffs (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  item        TEXT NOT NULL,               -- np. 'trawnik', 'nawierzchnia zwirowa', 'żywopłot'
  unit        TEXT NOT NULL CHECK (unit IN ('m2','mb','szt')),
  quantity    REAL NOT NULL CHECK (quantity > 0),
  unit_cost_pln REAL,
  source      TEXT NOT NULL DEFAULT 'sketchup' CHECK (source IN ('sketchup','autocad','reczny')),
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_takeoffs ON takeoffs (project_id, version);

-- B5: puls zadań cyklicznych. Brak sygnału = alert.
CREATE TABLE IF NOT EXISTS heartbeats (
  job         TEXT PRIMARY KEY,
  last_ok_at  TEXT NOT NULL,
  period_min  INTEGER NOT NULL CHECK (period_min > 0),
  note        TEXT
);

-- B7: samoobsługa RODO (eksport i usunięcie danych).
CREATE TABLE IF NOT EXISTS gdpr_requests (
  id           TEXT PRIMARY KEY,
  email        TEXT NOT NULL,
  kind         TEXT NOT NULL CHECK (kind IN ('export','delete')),
  token_hash   TEXT NOT NULL UNIQUE,
  confirmed_at TEXT,
  done_at      TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE VIEW IF NOT EXISTS v_takeoff_cost AS
SELECT project_id, version,
       ROUND(SUM(quantity * COALESCE(unit_cost_pln, 0))) AS cost_pln,
       SUM(unit_cost_pln IS NULL) AS positions_without_price
FROM takeoffs GROUP BY project_id, version;

CREATE VIEW IF NOT EXISTS v_heartbeat_alerts AS
SELECT job, last_ok_at, period_min,
       ROUND((julianday('now') - julianday(last_ok_at)) * 1440) AS minutes_since
FROM heartbeats
WHERE (julianday('now') - julianday(last_ok_at)) * 1440 > period_min * 2;

CREATE VIEW IF NOT EXISTS v_gdpr_open AS
SELECT kind, COUNT(*) AS open_requests, MIN(created_at) AS oldest
FROM gdpr_requests WHERE done_at IS NULL GROUP BY kind;
