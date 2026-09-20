-- Migracja 0011: aplikacja mobilna i GARDEN OS (20-APLIKACJA-GARDEN-OS.md). Wymaga 0001–0010.

CREATE TABLE IF NOT EXISTS devices (
  id           TEXT PRIMARY KEY,
  account_id   TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  platform     TEXT NOT NULL CHECK (platform IN ('ios','android')),
  push_token   TEXT NOT NULL UNIQUE,
  app_version  TEXT,
  last_seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  push_enabled INTEGER NOT NULL DEFAULT 1 CHECK (push_enabled IN (0,1))
);

-- Zadania pielęgnacyjne generowane z projektu: roślina, miesiąc, reguła.
CREATE TABLE IF NOT EXISTS garden_tasks (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  plant_latin  TEXT,
  title        TEXT NOT NULL,
  detail       TEXT,
  month        INTEGER CHECK (month IS NULL OR month BETWEEN 1 AND 12),
  trigger      TEXT NOT NULL DEFAULT 'calendar' CHECK (trigger IN ('calendar','frost','drought','rain','manual')),
  priority     TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','wazne','pilne')),
  active       INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1))
);
CREATE INDEX IF NOT EXISTS idx_garden_tasks ON garden_tasks (project_id, month, active);

-- Wykonanie zadań i dziennik ogrodu.
CREATE TABLE IF NOT EXISTS care_log (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  task_id     TEXT REFERENCES garden_tasks (id) ON DELETE SET NULL,
  account_id  TEXT REFERENCES accounts (id) ON DELETE SET NULL,
  done_on     TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('podlewanie','ciecie','nawozenie','sciolkowanie','ochrona','inne')),
  note        TEXT,
  photo_key   TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_care_log ON care_log (project_id, done_on);

-- Gwarancje na rośliny i materiały (przypomnienie przed końcem).
CREATE TABLE IF NOT EXISTS warranties (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  item        TEXT NOT NULL,
  supplier    TEXT,
  valid_until TEXT NOT NULL,
  note        TEXT
);

-- Alerty pogodowe wysłane do ogrodu (bez duplikatów w tym samym dniu).
CREATE TABLE IF NOT EXISTS weather_alerts (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('przymrozek','susza','wichura','upal')),
  for_date    TEXT NOT NULL,
  sent_at     TEXT,
  UNIQUE (project_id, kind, for_date)
);

CREATE TABLE IF NOT EXISTS app_feedback (
  id          TEXT PRIMARY KEY,
  account_id  TEXT REFERENCES accounts (id) ON DELETE SET NULL,
  platform    TEXT CHECK (platform IS NULL OR platform IN ('ios','android')),
  rating      INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  message     TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE VIEW IF NOT EXISTS v_garden_month AS
SELECT t.project_id, t.month, COUNT(*) AS tasks,
       SUM(l.id IS NOT NULL) AS done
FROM garden_tasks t
LEFT JOIN care_log l ON l.task_id = t.id AND CAST(strftime('%m', l.done_on) AS INTEGER) = t.month
WHERE t.active = 1
GROUP BY t.project_id, t.month;

CREATE VIEW IF NOT EXISTS v_app_engagement AS
SELECT substr(last_seen_at, 1, 7) AS month, platform,
       COUNT(*) AS devices, SUM(push_enabled) AS with_push
FROM devices GROUP BY month, platform;

CREATE VIEW IF NOT EXISTS v_warranties_due AS
SELECT project_id, item, supplier, valid_until
FROM warranties
WHERE julianday(valid_until) - julianday('now') BETWEEN 0 AND 30
ORDER BY valid_until;
