-- Migracja 0007: integracja z Fakturownią (13-KOSZTY-I-REPOZYTORIA.md §3). Wymaga 0001–0006.

ALTER TABLE invoice_tasks ADD COLUMN fakturownia_invoice_id TEXT;
ALTER TABLE invoice_tasks ADD COLUMN fakturownia_number TEXT;
ALTER TABLE invoice_tasks ADD COLUMN kind TEXT NOT NULL DEFAULT 'vat' CHECK (kind IN ('vat','proforma'));
ALTER TABLE invoice_tasks ADD COLUMN sent_to_client_at TEXT;
ALTER TABLE invoice_tasks ADD COLUMN sent_to_ksef_at TEXT;
ALTER TABLE invoice_tasks ADD COLUMN last_error TEXT;

-- Alerty dla darmowych planów: gdy zbliżamy się do limitu, wiemy o tym zanim coś przestanie działać.
CREATE TABLE IF NOT EXISTS usage_counters (
  day        TEXT NOT NULL,
  metric     TEXT NOT NULL CHECK (metric IN ('worker_requests','emails_sent','r2_bytes','d1_rows_written','ai_images')),
  value      REAL NOT NULL DEFAULT 0,
  free_limit REAL,
  PRIMARY KEY (day, metric)
);

CREATE VIEW IF NOT EXISTS v_free_tier_pressure AS
SELECT day, metric, value, free_limit,
       CASE WHEN free_limit > 0 THEN ROUND(100.0 * value / free_limit, 1) END AS pct_of_limit
FROM usage_counters
WHERE free_limit IS NOT NULL AND value >= 0.7 * free_limit
ORDER BY day DESC;

CREATE VIEW IF NOT EXISTS v_invoices_status AS
SELECT substr(p.paid_at, 1, 7) AS month,
       i.buyer_type, i.kind,
       COUNT(*) AS payments,
       SUM(i.status = 'issued') AS issued,
       SUM(i.fakturownia_invoice_id IS NOT NULL) AS in_fakturownia,
       SUM(i.sent_to_ksef_at IS NOT NULL) AS in_ksef,
       SUM(i.last_error IS NOT NULL) AS errors
FROM invoice_tasks i JOIN payments p ON p.id = i.payment_id
GROUP BY month, i.buyer_type, i.kind;
