-- Migracja 0003: portal klienta, partnerzy, płatności, bony, newsletter, pielęgnacja, wideo-opinie, asystent AI.
-- Wymaga 0001 i 0002.

CREATE TABLE IF NOT EXISTS accounts (
  id          TEXT PRIMARY KEY,
  role        TEXT NOT NULL CHECK (role IN ('client','partner','staff')),
  email       TEXT NOT NULL UNIQUE,
  name        TEXT,
  lead_id     TEXT REFERENCES leads (id) ON DELETE SET NULL,
  partner_id  TEXT REFERENCES partners (id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  disabled_at TEXT
);

CREATE TABLE IF NOT EXISTS login_tokens (
  token_hash  TEXT PRIMARY KEY,               -- SHA-256, token ważny 15 min, jednorazowy
  account_id  TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  expires_at  TEXT NOT NULL,
  used_at     TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id_hash     TEXT PRIMARY KEY,               -- SHA-256 identyfikatora z ciasteczka
  account_id  TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  expires_at  TEXT NOT NULL,
  revoked_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions (account_id, expires_at);

CREATE TABLE IF NOT EXISTS project_members (
  project_id  TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  account_id  TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, account_id)
);

CREATE TABLE IF NOT EXISTS project_stages (
  project_id  TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  stage       TEXT NOT NULL CHECK (stage IN ('site_visit','concept','detailed_design','realization','handover')),
  planned_on  TEXT,
  done_on     TEXT,
  note        TEXT,
  PRIMARY KEY (project_id, stage)
);

CREATE TABLE IF NOT EXISTS project_files (
  id                 TEXT PRIMARY KEY,
  project_id         TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  kind               TEXT NOT NULL CHECK (kind IN ('concept','visualization','plan','plant_list','document','other')),
  title              TEXT NOT NULL,
  version            INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  r2_key             TEXT NOT NULL UNIQUE,
  content_type       TEXT NOT NULL,
  size_bytes         INTEGER NOT NULL CHECK (size_bytes > 0),
  visible_to_client  INTEGER NOT NULL DEFAULT 1 CHECK (visible_to_client IN (0,1)),
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_project_files ON project_files (project_id, kind, version);

CREATE TABLE IF NOT EXISTS revision_rounds (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  round_no    INTEGER NOT NULL CHECK (round_no >= 1),
  opened_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  closed_at   TEXT,
  UNIQUE (project_id, round_no)
);

CREATE TABLE IF NOT EXISTS file_comments (
  id           TEXT PRIMARY KEY,
  file_id      TEXT NOT NULL REFERENCES project_files (id) ON DELETE CASCADE,
  account_id   TEXT NOT NULL REFERENCES accounts (id),
  round_id     TEXT REFERENCES revision_rounds (id),
  parent_id    TEXT REFERENCES file_comments (id) ON DELETE CASCADE,
  x_pct        REAL CHECK (x_pct IS NULL OR x_pct BETWEEN 0 AND 100),
  y_pct        REAL CHECK (y_pct IS NULL OR y_pct BETWEEN 0 AND 100),
  body         TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  resolved_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_comments_file ON file_comments (file_id, resolved_at);

CREATE TABLE IF NOT EXISTS approvals (
  id                 TEXT PRIMARY KEY,
  file_id            TEXT NOT NULL REFERENCES project_files (id) ON DELETE CASCADE,
  account_id         TEXT NOT NULL REFERENCES accounts (id),
  statement_version  TEXT NOT NULL,
  approved_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (file_id, account_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id                   TEXT PRIMARY KEY,
  provider             TEXT NOT NULL DEFAULT 'stripe',
  provider_session_id  TEXT UNIQUE,
  provider_event_id    TEXT UNIQUE,            -- idempotencja webhooków
  purpose              TEXT NOT NULL CHECK (purpose IN ('consultation','deposit','stage','voucher')),
  amount_pln           INTEGER NOT NULL CHECK (amount_pln > 0),
  status               TEXT NOT NULL CHECK (status IN ('pending','paid','refunded','failed','expired')),
  lead_id              TEXT REFERENCES leads (id) ON DELETE SET NULL,
  project_id           TEXT REFERENCES projects (id) ON DELETE SET NULL,
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  paid_at              TEXT
);

CREATE TABLE IF NOT EXISTS vouchers (
  id                TEXT PRIMARY KEY,
  code_hash         TEXT NOT NULL UNIQUE,
  product           TEXT NOT NULL,
  value_pln         INTEGER NOT NULL CHECK (value_pln > 0),
  payment_id        TEXT REFERENCES payments (id),
  buyer_email       TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','redeemed','expired','cancelled')),
  expires_on        TEXT NOT NULL,
  redeemed_lead_id  TEXT REFERENCES leads (id) ON DELETE SET NULL,
  redeemed_at       TEXT
);

-- topics: 'newsletter', 'care_reminders' albo oba po przecinku; wysyłka tylko przy status = 'confirmed'.
CREATE TABLE IF NOT EXISTS subscribers (
  id                  TEXT PRIMARY KEY,
  email               TEXT NOT NULL UNIQUE,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','unsubscribed')),
  topics              TEXT NOT NULL DEFAULT 'newsletter',
  confirm_token_hash  TEXT,
  consent_version     TEXT NOT NULL,
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  confirmed_at        TEXT,
  unsubscribed_at     TEXT
);

CREATE TABLE IF NOT EXISTS care_reminders (
  id          TEXT PRIMARY KEY,
  account_id  TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  project_id  TEXT REFERENCES projects (id) ON DELETE CASCADE,
  month       INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  task        TEXT NOT NULL,
  last_sent_year INTEGER
);

CREATE TABLE IF NOT EXISTS video_reviews (
  id               TEXT PRIMARY KEY,
  account_id       TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  project_id       TEXT REFERENCES projects (id),
  r2_key           TEXT NOT NULL UNIQUE,
  duration_s       INTEGER CHECK (duration_s IS NULL OR duration_s <= 90),
  consent_version  TEXT NOT NULL,
  social_consent   INTEGER NOT NULL DEFAULT 0 CHECK (social_consent IN (0,1)),
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','withdrawn')),
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  published_at     TEXT
);

-- Pytania do asystenta: przed zapisem usuń e-maile i numery telefonów; bez IP; retencja 90 dni.
CREATE TABLE IF NOT EXISTS assistant_questions (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  asked_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  question  TEXT NOT NULL CHECK (length(question) <= 500),
  answered  INTEGER NOT NULL CHECK (answered IN (0,1)),
  sources   TEXT                              -- JSON: lista URL użytych w odpowiedzi
);

CREATE VIEW IF NOT EXISTS v_portal_projects AS
SELECT pm.account_id, p.id AS project_id, p.stage, p.started_at,
       (SELECT COUNT(*) FROM revision_rounds r WHERE r.project_id = p.id) AS rounds_used,
       (SELECT COUNT(*) FROM file_comments c JOIN project_files f ON f.id = c.file_id
         WHERE f.project_id = p.id AND c.resolved_at IS NULL) AS open_comments
FROM project_members pm
JOIN projects p ON p.id = pm.project_id;

CREATE VIEW IF NOT EXISTS v_revenue_monthly AS
SELECT substr(paid_at, 1, 7) AS month, purpose, COUNT(*) AS payments, SUM(amount_pln) AS amount_pln
FROM payments WHERE status = 'paid'
GROUP BY month, purpose;

CREATE VIEW IF NOT EXISTS v_unanswered_assistant AS
SELECT question, COUNT(*) AS times_asked, MAX(asked_at) AS last_asked
FROM assistant_questions WHERE answered = 0
GROUP BY question ORDER BY times_asked DESC;
