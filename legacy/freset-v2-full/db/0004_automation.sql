-- Migracja 0004: automatyzacje v3 (10-UX-AUTOMATYZACJA.md). Wymaga 0001–0003.

-- Idempotencja wszystkich automatyzacji A1–A22.
CREATE TABLE IF NOT EXISTS automation_runs (
  run_key        TEXT PRIMARY KEY,            -- np. 'A8:file:<id>:v3'
  automation_id  TEXT NOT NULL CHECK (automation_id GLOB 'A[0-9]*'),
  subject_id     TEXT,
  status         TEXT NOT NULL CHECK (status IN ('done','skipped','failed')),
  error          TEXT,                        -- bez danych osobowych
  run_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_automation_runs ON automation_runs (automation_id, status, run_at);

-- M34: połączenia telefoniczne z webhooka operatora. Numer dzwoniącego to dane osobowe: retencja jak leady.
CREATE TABLE IF NOT EXISTS calls (
  id                TEXT PRIMARY KEY,
  provider_call_id  TEXT UNIQUE,
  caller_phone      TEXT NOT NULL,
  started_at        TEXT NOT NULL,
  duration_s        INTEGER NOT NULL DEFAULT 0 CHECK (duration_s >= 0),
  outcome           TEXT NOT NULL CHECK (outcome IN ('answered','missed','voicemail')),
  within_hours      INTEGER NOT NULL CHECK (within_hours IN (0,1)),
  sms_sent_at       TEXT,
  callback_at       TEXT,
  lead_id           TEXT REFERENCES leads (id) ON DELETE SET NULL,
  delete_after      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_calls_started ON calls (started_at, outcome);

-- M35: ankieta satysfakcji po etapach (wynik tylko wewnętrznie; o opinię Google prosimy wszystkich).
CREATE TABLE IF NOT EXISTS surveys (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  stage        TEXT NOT NULL CHECK (stage IN ('concept','detailed_design','handover')),
  token_hash   TEXT NOT NULL UNIQUE,
  sent_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  score        INTEGER CHECK (score IS NULL OR score BETWEEN 1 AND 5),
  comment      TEXT CHECK (comment IS NULL OR length(comment) <= 1000),
  answered_at  TEXT,
  followup_done_at TEXT,                      -- wynik ≤ 3 → telefon w 48 h
  UNIQUE (project_id, stage)
);

-- M27: AI podgląd stylu. Zdjęcia usuwane po 30 dniach.
CREATE TABLE IF NOT EXISTS ai_previews (
  id               TEXT PRIMARY KEY,
  input_r2_key     TEXT NOT NULL UNIQUE,
  output_r2_keys   TEXT NOT NULL DEFAULT '[]', -- JSON
  style            TEXT NOT NULL CHECK (style IN ('naturalistic','modern','forest','family','classic')),
  consent_version  TEXT NOT NULL,
  cost_pln         REAL NOT NULL DEFAULT 0 CHECK (cost_pln >= 0),
  lead_id          TEXT REFERENCES leads (id) ON DELETE SET NULL,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  delete_after     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_previews_created ON ai_previews (created_at);

-- M30: sieć wykonawców.
CREATE TABLE IF NOT EXISTS contractors (
  id          TEXT PRIMARY KEY,
  partner_id  TEXT REFERENCES partners (id) ON DELETE SET NULL,
  company     TEXT NOT NULL,
  trades      TEXT NOT NULL,                  -- np. 'nasadzenia,nawierzchnie,nawadnianie'
  area        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'candidate' CHECK (status IN ('candidate','verified','paused')),
  verified_at TEXT,
  notes       TEXT
);
CREATE TABLE IF NOT EXISTS contractor_assignments (
  project_id      TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  contractor_id   TEXT NOT NULL REFERENCES contractors (id),
  status          TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','accepted','in_progress','done','cancelled')),
  client_rating   INTEGER CHECK (client_rating IS NULL OR client_rating BETWEEN 1 AND 5),
  client_comment  TEXT,
  PRIMARY KEY (project_id, contractor_id)
);

-- M31: lista zakupów z projektu.
CREATE TABLE IF NOT EXISTS shopping_lists (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  version      INTEGER NOT NULL DEFAULT 1,
  items        TEXT NOT NULL,                 -- JSON: [{name, latin?, qty, unit, note}]
  exported_at  TEXT,
  UNIQUE (project_id, version)
);

-- M29: opieka po projekcie (tylko jeśli w ofercie).
CREATE TABLE IF NOT EXISTS care_plans (
  id              TEXT PRIMARY KEY,
  account_id      TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  project_id      TEXT REFERENCES projects (id) ON DELETE SET NULL,
  visits_per_year INTEGER NOT NULL CHECK (visits_per_year BETWEEN 1 AND 12),
  price_pln       INTEGER CHECK (price_pln IS NULL OR price_pln > 0),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
  next_visit_on   TEXT
);

-- M33: dziennik realizacji.
CREATE TABLE IF NOT EXISTS site_logs (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  logged_on   TEXT NOT NULL,
  body        TEXT NOT NULL CHECK (length(body) <= 2000),
  photo_keys  TEXT NOT NULL DEFAULT '[]',     -- JSON: klucze R2
  visible_to_client INTEGER NOT NULL DEFAULT 1 CHECK (visible_to_client IN (0,1))
);

-- A12: szkice case study.
CREATE TABLE IF NOT EXISTS case_study_drafts (
  project_id       TEXT PRIMARY KEY REFERENCES projects (id) ON DELETE CASCADE,
  sanity_draft_id  TEXT,
  status           TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','draft_created','published','rejected')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- M32: akceptacja oferty w portalu.
ALTER TABLE offers ADD COLUMN accepted_via_portal INTEGER NOT NULL DEFAULT 0 CHECK (accepted_via_portal IN (0,1));
ALTER TABLE offers ADD COLUMN accepted_statement_version TEXT;
ALTER TABLE offers ADD COLUMN accepted_by_account_id TEXT REFERENCES accounts (id);

-- Widoki raportowe (M36).
CREATE VIEW IF NOT EXISTS v_calls_weekly AS
SELECT strftime('%Y-W%W', started_at) AS week,
       COUNT(*) AS calls,
       SUM(outcome <> 'answered') AS not_answered,
       ROUND(100.0 * SUM(outcome <> 'answered') / COUNT(*), 1) AS pct_not_answered,
       SUM(outcome <> 'answered' AND callback_at IS NOT NULL
           AND (julianday(callback_at) - julianday(started_at)) * 1440 <= 60) AS callbacks_within_60min
FROM calls GROUP BY week;

CREATE VIEW IF NOT EXISTS v_csat_by_stage AS
SELECT stage, COUNT(score) AS answers, ROUND(AVG(score), 2) AS avg_score,
       SUM(score <= 3) AS low_scores, SUM(score <= 3 AND followup_done_at IS NULL) AS low_without_followup
FROM surveys GROUP BY stage;

CREATE VIEW IF NOT EXISTS v_review_coverage AS
SELECT COUNT(*) AS projects_done,
       SUM(l.review_request_sent_at IS NOT NULL) AS review_requested,
       (SELECT COUNT(DISTINCT project_id) FROM video_reviews WHERE status = 'approved') AS with_video_review
FROM projects p JOIN leads l ON l.id = p.lead_id
WHERE p.stage = 'done';

CREATE VIEW IF NOT EXISTS v_automation_errors AS
SELECT automation_id, COUNT(*) AS failures, MAX(run_at) AS last_failure
FROM automation_runs WHERE status = 'failed'
GROUP BY automation_id ORDER BY failures DESC;

CREATE VIEW IF NOT EXISTS v_ai_preview_monthly AS
SELECT substr(created_at, 1, 7) AS month, COUNT(*) AS previews,
       ROUND(SUM(cost_pln), 2) AS cost_pln, SUM(lead_id IS NOT NULL) AS with_lead
FROM ai_previews GROUP BY month;
