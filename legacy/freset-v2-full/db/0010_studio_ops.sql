-- Migracja 0010: praca pracowni i jakość wdrożeń (19-PRACOWNIA-IT.md). Wymaga 0001–0009.

-- Czas pracy na etapach: bez tego nie znamy prawdziwej marży projektu.
CREATE TABLE IF NOT EXISTS time_entries (
  id          TEXT PRIMARY KEY,
  project_id  TEXT REFERENCES projects (id) ON DELETE CASCADE,
  lead_id     TEXT REFERENCES leads (id) ON DELETE SET NULL,
  stage       TEXT NOT NULL CHECK (stage IN ('sprzedaz','wizyta','koncepcja','projekt','nadzor','poprawki','admin')),
  minutes     INTEGER NOT NULL CHECK (minutes > 0),
  worked_on   TEXT NOT NULL,
  note        TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_time_entries ON time_entries (project_id, worked_on);

-- Stawka godzinowa pracowni do liczenia marży (jedna wartość, aktualizowana rocznie).
CREATE TABLE IF NOT EXISTS studio_rates (
  valid_from     TEXT PRIMARY KEY,
  hourly_cost_pln REAL NOT NULL CHECK (hourly_cost_pln > 0)
);

-- Cztery metryki wdrożeń (DORA): wdrożenia i awarie.
CREATE TABLE IF NOT EXISTS deploys (
  id           TEXT PRIMARY KEY,
  deployed_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  commit_sha   TEXT,
  lead_time_min INTEGER CHECK (lead_time_min IS NULL OR lead_time_min >= 0),
  ai_assisted  INTEGER NOT NULL DEFAULT 1 CHECK (ai_assisted IN (0,1)),
  note         TEXT
);
CREATE TABLE IF NOT EXISTS incidents (
  id            TEXT PRIMARY KEY,
  deploy_id     TEXT REFERENCES deploys (id) ON DELETE SET NULL,
  started_at    TEXT NOT NULL,
  resolved_at   TEXT,
  severity      TEXT NOT NULL CHECK (severity IN ('blad','awaria','krytyczna')),
  cause         TEXT CHECK (cause IS NULL OR cause IN ('kod','konfiguracja','dostawca','dane','inne')),
  summary       TEXT
);

-- Dostępność i ceny roślin (odpowiedź na bazy roślin konkurencji; nasza przewaga to lokalność).
CREATE TABLE IF NOT EXISTS plant_supply (
  id            TEXT PRIMARY KEY,
  plant_latin   TEXT NOT NULL,
  supplier      TEXT NOT NULL,
  size          TEXT,
  price_pln     REAL CHECK (price_pln IS NULL OR price_pln >= 0),
  available     INTEGER NOT NULL DEFAULT 1 CHECK (available IN (0,1)),
  checked_on    TEXT NOT NULL,
  UNIQUE (plant_latin, supplier, size)
);

CREATE VIEW IF NOT EXISTS v_project_margin AS
SELECT p.id AS project_id, p.value_pln,
       ROUND(SUM(t.minutes) / 60.0, 1) AS hours,
       ROUND(SUM(t.minutes) / 60.0 * (SELECT hourly_cost_pln FROM studio_rates ORDER BY valid_from DESC LIMIT 1)) AS cost_pln,
       ROUND(100.0 * (p.value_pln - SUM(t.minutes) / 60.0 * (SELECT hourly_cost_pln FROM studio_rates ORDER BY valid_from DESC LIMIT 1)) / p.value_pln, 1) AS margin_pct
FROM projects p JOIN time_entries t ON t.project_id = p.id
GROUP BY p.id, p.value_pln;

CREATE VIEW IF NOT EXISTS v_delivery_metrics AS
SELECT substr(d.deployed_at, 1, 7) AS month,
       COUNT(*) AS deploys,
       ROUND(AVG(d.lead_time_min)) AS avg_lead_time_min,
       SUM(i.id IS NOT NULL) AS failed_deploys,
       ROUND(100.0 * SUM(i.id IS NOT NULL) / COUNT(*), 1) AS change_failure_rate_pct,
       ROUND(AVG(CASE WHEN i.resolved_at IS NOT NULL
                 THEN (julianday(i.resolved_at) - julianday(i.started_at)) * 1440 END)) AS mttr_min
FROM deploys d LEFT JOIN incidents i ON i.deploy_id = d.id
GROUP BY month;

CREATE VIEW IF NOT EXISTS v_wip AS
SELECT stage, COUNT(*) AS projects
FROM projects WHERE stage <> 'done' GROUP BY stage;
