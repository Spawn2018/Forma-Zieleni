-- Migracja 0012: ochrona zakresu i marży (21-UPROSZCZENIE.md). Wymaga 0001–0011.

-- Zmiany poza zakresem: albo płatne, albo świadomie darowane, ale zawsze policzone.
CREATE TABLE IF NOT EXISTS change_orders (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  requested_on  TEXT NOT NULL,
  description   TEXT NOT NULL,
  hours_est     REAL NOT NULL CHECK (hours_est > 0),
  price_pln     INTEGER,
  decision      TEXT NOT NULL DEFAULT 'zgloszona' CHECK (decision IN ('zgloszona','wyceniona','zaakceptowana','odrzucona','gratis')),
  decided_on    TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_change_orders ON change_orders (project_id, decision);

-- Dziennik decyzji: kto, kiedy i co zatwierdził. Koniec z „przecież mówiliśmy inaczej”.
CREATE TABLE IF NOT EXISTS decisions (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  topic        TEXT NOT NULL,
  decision     TEXT NOT NULL,
  decided_by   TEXT NOT NULL CHECK (decided_by IN ('klient','pracownia','wspolnie')),
  source       TEXT CHECK (source IS NULL OR source IN ('portal','telefon','wizyta','email','spotkanie')),
  decided_on   TEXT NOT NULL,
  file_id      TEXT REFERENCES project_files (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_decisions ON decisions (project_id, decided_on);

-- Materiały marketingowe powstałe z projektu (jeden projekt = pięć materiałów).
CREATE TABLE IF NOT EXISTS content_assets (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  kind         TEXT NOT NULL CHECK (kind IN ('case_study','post_social','artykul','newsletter','wideo')),
  status       TEXT NOT NULL DEFAULT 'planowany' CHECK (status IN ('planowany','szkic','opublikowany','odrzucony')),
  url          TEXT,
  published_on TEXT,
  UNIQUE (project_id, kind, id)
);

CREATE VIEW IF NOT EXISTS v_scope_creep AS
SELECT c.project_id,
       COUNT(*) AS zmiany,
       ROUND(SUM(c.hours_est), 1) AS godziny_zmian,
       ROUND(SUM(CASE WHEN c.decision = 'gratis' THEN c.hours_est ELSE 0 END), 1) AS godziny_gratis,
       COALESCE(SUM(CASE WHEN c.decision = 'zaakceptowana' THEN c.price_pln END), 0) AS doplaty_pln
FROM change_orders c GROUP BY c.project_id;

CREATE VIEW IF NOT EXISTS v_content_coverage AS
SELECT p.id AS project_id,
       SUM(a.kind = 'case_study' AND a.status = 'opublikowany') AS case_study,
       SUM(a.kind = 'post_social' AND a.status = 'opublikowany') AS posty,
       SUM(a.kind = 'artykul' AND a.status = 'opublikowany') AS artykuly,
       COUNT(a.id) AS materialy
FROM projects p LEFT JOIN content_assets a ON a.project_id = p.id
WHERE p.stage = 'done' GROUP BY p.id;
