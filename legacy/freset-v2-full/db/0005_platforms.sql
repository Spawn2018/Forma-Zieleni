-- Migracja 0005: platformy ogłoszeniowe (11-PLATFORMY.md). Wymaga 0001–0004.

-- Jedno źródło prawdy o profilach firmy na platformach (spójne dane NAP).
CREATE TABLE IF NOT EXISTS listings (
  id              TEXT PRIMARY KEY,
  platform        TEXT NOT NULL CHECK (platform IN ('gbp','facebook_page','instagram','bing_places','apple_business','oferteo','fixly','locayo','oferia','olx','linkedin','pinterest','youtube','directory','other')),
  url             TEXT,
  status          TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','verified','paused')),
  nap_checked_on  TEXT,
  rating          REAL CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  reviews_count   INTEGER,
  monthly_cost_pln INTEGER NOT NULL DEFAULT 0 CHECK (monthly_cost_pln >= 0),
  notes           TEXT,
  UNIQUE (platform, url)
);

-- Każdy kupiony kontakt z platformy typu Oferteo lub Fixly.
CREATE TABLE IF NOT EXISTS platform_contacts (
  id                TEXT PRIMARY KEY,
  platform          TEXT NOT NULL CHECK (platform IN ('oferteo','fixly','locayo','oferia','olx','other')),
  external_ref      TEXT,                       -- numer zapytania na platformie
  bought_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  cost_pln          REAL NOT NULL CHECK (cost_pln >= 0),
  points            INTEGER,
  estimated_value_pln INTEGER,                  -- szacowana wartość zlecenia z opisu
  lead_id           TEXT REFERENCES leads (id) ON DELETE SET NULL,
  first_response_at TEXT,
  outcome           TEXT NOT NULL DEFAULT 'bought' CHECK (outcome IN ('bought','no_response','call','offer','won','lost')),
  lost_reason       TEXT CHECK (lost_reason IS NULL OR lost_reason IN ('price','timing','scope','competitor','no_contact','other')),
  notes             TEXT,
  UNIQUE (platform, external_ref)
);
CREATE INDEX IF NOT EXISTS idx_platform_contacts ON platform_contacts (platform, bought_at, outcome);

-- Ekonomika platform: koszt kontaktu, szybkość odpowiedzi, koszt na umowę.
CREATE VIEW IF NOT EXISTS v_platform_economics AS
SELECT platform,
       substr(bought_at, 1, 7) AS month,
       COUNT(*) AS contacts,
       ROUND(SUM(cost_pln)) AS cost_pln,
       ROUND(AVG(cost_pln)) AS avg_cost_per_contact_pln,
       SUM(first_response_at IS NOT NULL
           AND (julianday(first_response_at) - julianday(bought_at)) * 1440 <= 60) AS responses_within_60min,
       SUM(outcome IN ('call','offer','won')) AS calls_or_more,
       SUM(outcome IN ('offer','won')) AS offers,
       SUM(outcome = 'won') AS won,
       CASE WHEN SUM(outcome = 'won') > 0 THEN ROUND(SUM(cost_pln) / SUM(outcome = 'won')) END AS cost_per_won_pln
FROM platform_contacts
GROUP BY platform, month;
