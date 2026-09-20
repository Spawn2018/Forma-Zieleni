-- Migracja 0008: fundament niezawodności i dostarczanie projektów (16-CO-BYM-ZMIENIL.md §5–§6, 17-CAD-3D.md). Wymaga 0001–0007.

-- B1: outbox. Nic nie wychodzi bez wcześniejszego zapisu.
CREATE TABLE IF NOT EXISTS outbox (
  id           TEXT PRIMARY KEY,
  kind         TEXT NOT NULL CHECK (kind IN ('email','push','sms','task','webhook')),
  dedupe_key   TEXT UNIQUE,
  payload      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','dead')),
  attempts     INTEGER NOT NULL DEFAULT 0,
  next_try_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_error   TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  sent_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_outbox_due ON outbox (status, next_try_at);

-- B2: idempotencja publicznych POST-ów.
CREATE TABLE IF NOT EXISTS request_keys (
  key          TEXT PRIMARY KEY,
  endpoint     TEXT NOT NULL,
  response     TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  expires_at   TEXT NOT NULL
);

-- B3: duplikaty leadów i telefon w formacie E.164.
ALTER TABLE leads ADD COLUMN phone_e164 TEXT;
ALTER TABLE leads ADD COLUMN duplicate_of TEXT REFERENCES leads (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads (phone_e164, created_at);

-- B9: flagi funkcji (moduły włączane bez wdrożenia).
CREATE TABLE IF NOT EXISTS feature_flags (
  name        TEXT PRIMARY KEY,
  enabled     INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0,1)),
  note        TEXT,
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- M43: lista oczekujących na zwolniony termin.
CREATE TABLE IF NOT EXISTS waitlist (
  id          TEXT PRIMARY KEY,
  lead_id     TEXT NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  preferred   TEXT,                          -- np. 'III-IV, popołudnia'
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  notified_at TEXT,
  booked_at   TEXT
);

-- P8: dostęp do projektu dla drugiego domownika i wykonawcy, z rolą.
CREATE TABLE IF NOT EXISTS project_access (
  project_id  TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  account_id  TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('owner','household','contractor','viewer')),
  invited_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  revoked_at  TEXT,
  PRIMARY KEY (project_id, account_id)
);

-- P5, S4: harmonogram płatności etapami.
CREATE TABLE IF NOT EXISTS payment_schedule (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  stage       TEXT NOT NULL CHECK (stage IN ('deposit','concept','detailed_design','realization','final')),
  amount_pln  INTEGER NOT NULL CHECK (amount_pln > 0),
  due_on      TEXT,
  payment_id  TEXT REFERENCES payments (id),
  status      TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','invoiced','paid','waived')),
  UNIQUE (project_id, stage)
);

-- Dostarczane pliki projektowe z SketchUp, V-Ray i AutoCAD (17-CAD-3D.md).
CREATE TABLE IF NOT EXISTS design_assets (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN ('render','panorama','animation','plan_pdf','dwg','skp_link','plant_schedule','moodboard')),
  source_app    TEXT NOT NULL CHECK (source_app IN ('sketchup','vray','autocad','layout','inne')),
  version       INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  r2_key        TEXT,                        -- pliki lekkie u nas
  external_url  TEXT,                        -- np. link do modelu w Trimble Connect
  watermarked   INTEGER NOT NULL DEFAULT 0 CHECK (watermarked IN (0,1)),
  visible_to_client INTEGER NOT NULL DEFAULT 0 CHECK (visible_to_client IN (0,1)),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (r2_key IS NOT NULL OR external_url IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_design_assets ON design_assets (project_id, kind, version);

CREATE VIEW IF NOT EXISTS v_outbox_health AS
SELECT status, kind, COUNT(*) AS items, MIN(next_try_at) AS oldest_due, MAX(attempts) AS max_attempts
FROM outbox GROUP BY status, kind;

CREATE VIEW IF NOT EXISTS v_lead_duplicates AS
SELECT phone_e164, COUNT(*) AS leads, MIN(created_at) AS first_seen, MAX(created_at) AS last_seen
FROM leads WHERE phone_e164 IS NOT NULL
GROUP BY phone_e164 HAVING COUNT(*) > 1;

CREATE VIEW IF NOT EXISTS v_project_money AS
SELECT p.id AS project_id, p.value_pln,
       COALESCE(SUM(CASE WHEN s.status = 'paid' THEN s.amount_pln END), 0) AS paid_pln,
       COALESCE(SUM(CASE WHEN s.status IN ('planned','invoiced') THEN s.amount_pln END), 0) AS due_pln
FROM projects p LEFT JOIN payment_schedule s ON s.project_id = p.id
GROUP BY p.id, p.value_pln;
