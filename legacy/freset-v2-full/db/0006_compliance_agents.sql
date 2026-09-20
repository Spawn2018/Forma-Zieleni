-- Migracja 0006: dostarczalność poczty, faktury, ruch agentów AI (12-ZGODNOSC-I-AGENCI.md). Wymaga 0001–0005.

-- Zdarzenia pocztowe z webhooków dostawcy (Resend). Adres trzymamy, bo bez niego nie da się wyłączyć wysyłek.
CREATE TABLE IF NOT EXISTS email_events (
  id           TEXT PRIMARY KEY,
  provider_id  TEXT UNIQUE,
  email        TEXT NOT NULL,
  stream       TEXT NOT NULL CHECK (stream IN ('transactional','marketing')),
  type         TEXT NOT NULL CHECK (type IN ('sent','delivered','bounce_hard','bounce_soft','complaint','unsubscribe','open_disabled')),
  reason       TEXT,
  occurred_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_email_events ON email_events (type, occurred_at);
CREATE INDEX IF NOT EXISTS idx_email_events_addr ON email_events (email, type);

-- Adresy wykluczone z wysyłek (twarde odbicie, skarga, wypisanie).
CREATE TABLE IF NOT EXISTS email_suppressions (
  email       TEXT PRIMARY KEY,
  reason      TEXT NOT NULL CHECK (reason IN ('bounce_hard','complaint','unsubscribe','manual')),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Każda opłacona płatność musi mieć zadanie fakturowe (B2C poza KSeF, B2B w KSeF).
CREATE TABLE IF NOT EXISTS invoice_tasks (
  id          TEXT PRIMARY KEY,
  payment_id  TEXT NOT NULL UNIQUE REFERENCES payments (id) ON DELETE CASCADE,
  buyer_type  TEXT NOT NULL CHECK (buyer_type IN ('b2c','b2b')),
  nip         TEXT,
  status      TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','issued','not_required')),
  due_on      TEXT,
  issued_at   TEXT,
  note        TEXT,
  CHECK (buyer_type = 'b2c' OR nip IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_invoice_tasks ON invoice_tasks (status, due_on);

-- Ruch agentów AI i publicznych plików JSON. Bez IP i bez danych osobowych.
CREATE TABLE IF NOT EXISTS agent_hits (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  occurred_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  surface     TEXT NOT NULL CHECK (surface IN ('api_public','mcp','llms_txt')),
  path        TEXT NOT NULL,
  agent       TEXT,                       -- nazwa z User-Agent, bez identyfikatorów
  status      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agent_hits ON agent_hits (surface, occurred_at);

-- Rejestr oznaczeń treści AI (dowód na wypadek kontroli).
CREATE TABLE IF NOT EXISTS ai_content_log (
  id            TEXT PRIMARY KEY,
  kind          TEXT NOT NULL CHECK (kind IN ('image_preview','assistant_answer','text_draft')),
  provider      TEXT NOT NULL,
  visible_label INTEGER NOT NULL CHECK (visible_label IN (0,1)),
  machine_label TEXT,                     -- np. 'C2PA', 'IPTC', 'brak'
  human_review  INTEGER NOT NULL DEFAULT 0 CHECK (human_review IN (0,1)),
  ref_id        TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE VIEW IF NOT EXISTS v_email_health AS
SELECT substr(occurred_at, 1, 7) AS month, stream,
       SUM(type = 'sent') AS sent,
       SUM(type = 'bounce_hard') AS bounces_hard,
       SUM(type = 'complaint') AS complaints,
       SUM(type = 'unsubscribe') AS unsubscribes,
       ROUND(100.0 * SUM(type = 'complaint') / NULLIF(SUM(type = 'sent'), 0), 3) AS complaint_rate_pct,
       ROUND(100.0 * SUM(type = 'bounce_hard') / NULLIF(SUM(type = 'sent'), 0), 3) AS bounce_rate_pct
FROM email_events GROUP BY month, stream;

CREATE VIEW IF NOT EXISTS v_agent_traffic AS
SELECT substr(occurred_at, 1, 7) AS month, surface, COUNT(*) AS hits,
       SUM(status >= 400) AS errors
FROM agent_hits GROUP BY month, surface;

CREATE VIEW IF NOT EXISTS v_unissued_invoices AS
SELECT i.id, i.payment_id, i.buyer_type, i.due_on, p.amount_pln, p.paid_at
FROM invoice_tasks i JOIN payments p ON p.id = i.payment_id
WHERE i.status = 'todo' ORDER BY i.due_on;

CREATE VIEW IF NOT EXISTS v_ai_labeling_gaps AS
SELECT kind, provider, COUNT(*) AS items
FROM ai_content_log
WHERE visible_label = 0 OR machine_label IS NULL OR machine_label = 'brak'
GROUP BY kind, provider;
