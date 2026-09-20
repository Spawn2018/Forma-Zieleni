-- Migracja 0002: CRM, marketing, automatyzacje, raporty. Wymaga 0001 (db/schema.sql).
-- Kolejność ma znaczenie: najpierw tabele, potem ALTER, na końcu widoki.

-- ===== Kampanie i wydatki =====
CREATE TABLE IF NOT EXISTS campaigns (
  id                 TEXT PRIMARY KEY,
  channel            TEXT NOT NULL CHECK (channel IN ('google_ads','meta_ads','gbp','seo','social','marketplace','referral','partner','pr','email','offline','tender','other')),
  name               TEXT NOT NULL,
  utm_source         TEXT,
  utm_medium         TEXT,
  utm_campaign       TEXT UNIQUE,
  starts_on          TEXT,
  ends_on            TEXT,
  stop_loss_cpl_pln  INTEGER,                 -- CPL max z 05-MARKETING §2
  notes              TEXT
);

CREATE TABLE IF NOT EXISTS campaign_spend (
  campaign_id  TEXT NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
  month        TEXT NOT NULL,                 -- 'RRRR-MM'
  spend_pln    INTEGER NOT NULL DEFAULT 0,
  impressions  INTEGER,
  clicks       INTEGER,
  PRIMARY KEY (campaign_id, month)
);

-- ===== Rozszerzenie leadów =====
ALTER TABLE leads ADD COLUMN heard_from TEXT
  CHECK (heard_from IS NULL OR heard_from IN ('google','google_maps','ai_assistant','social','facebook_group','oferteo','fixly','directory','pinterest','friend_referral','partner','article','other'));
ALTER TABLE leads ADD COLUMN ref_code TEXT;          -- z /polecenie/[kod]/
ALTER TABLE leads ADD COLUMN consultation_at TEXT;   -- pierwsze wejście w etap
ALTER TABLE leads ADD COLUMN offer_at TEXT;
ALTER TABLE leads ADD COLUMN won_at TEXT;

-- ===== Oferty i projekty =====
CREATE TABLE IF NOT EXISTS offers (
  id             TEXT PRIMARY KEY,
  lead_id        TEXT NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  package        TEXT NOT NULL CHECK (package IN ('consultation','concept','comprehensive','balcony_terrace','custom')),
  amount_pln     INTEGER NOT NULL CHECK (amount_pln > 0),
  status         TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  sent_at        TEXT,
  valid_until    TEXT,
  decided_at     TEXT,
  reject_reason  TEXT CHECK (reject_reason IS NULL OR reject_reason IN ('price','timing','scope','competitor','no_reply','other'))
);
CREATE INDEX IF NOT EXISTS idx_offers_lead   ON offers (lead_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers (status, valid_until);

-- Leady z projektem nie są kasowane automatycznie (brak kaskady); Worker retencji je pomija,
-- a delete_after ustawia według {{RETENCJA_KLIENCI}}.
CREATE TABLE IF NOT EXISTS projects (
  id                TEXT PRIMARY KEY,
  lead_id           TEXT NOT NULL UNIQUE REFERENCES leads (id),
  offer_id          TEXT REFERENCES offers (id),
  stage             TEXT NOT NULL DEFAULT 'site_visit' CHECK (stage IN ('site_visit','concept','detailed_design','realization','done')),
  value_pln         INTEGER NOT NULL CHECK (value_pln > 0),
  started_at        TEXT NOT NULL,
  completed_at      TEXT,
  realization_slug  TEXT,                     -- slug case study w Sanity
  publish_consent   INTEGER NOT NULL DEFAULT 0 CHECK (publish_consent IN (0,1))
);
CREATE INDEX IF NOT EXISTS idx_projects_stage ON projects (stage, completed_at);

-- ===== Praca handlowa =====
CREATE TABLE IF NOT EXISTS tasks (
  id       TEXT PRIMARY KEY,
  lead_id  TEXT NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  type     TEXT NOT NULL CHECK (type IN ('call','sms','email','meeting','other')),
  title    TEXT NOT NULL,
  due_at   TEXT NOT NULL,
  done_at  TEXT,
  origin   TEXT NOT NULL DEFAULT 'manual' CHECK (origin IN ('manual','sequence'))
);
CREATE INDEX IF NOT EXISTS idx_tasks_open ON tasks (done_at, due_at);

CREATE TABLE IF NOT EXISTS touchpoints (
  id         TEXT PRIMARY KEY,
  lead_id    TEXT NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  channel    TEXT NOT NULL CHECK (channel IN ('call','sms','email','meeting','booking')),
  direction  TEXT NOT NULL CHECK (direction IN ('out','in')),
  outcome    TEXT CHECK (outcome IS NULL OR outcome IN ('connected','no_answer','voicemail','replied','booked','bounced')),
  note       TEXT
);
CREATE INDEX IF NOT EXISTS idx_touchpoints_lead ON touchpoints (lead_id, at);

-- Idempotencja kroków: klucz (lead_id, sequence, step) w sequence_runs.
CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id           TEXT PRIMARY KEY,
  lead_id      TEXT NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  sequence     TEXT NOT NULL CHECK (sequence IN ('new_lead','offer_followup','post_project')),
  step         INTEGER NOT NULL DEFAULT 0,
  next_run_at  TEXT,
  stopped_at   TEXT,
  stop_reason  TEXT CHECK (stop_reason IS NULL OR stop_reason IN ('replied','booked','status_changed','completed','manual','email_only')),
  UNIQUE (lead_id, sequence)
);
CREATE INDEX IF NOT EXISTS idx_seq_due ON sequence_enrollments (stopped_at, next_run_at);

CREATE TABLE IF NOT EXISTS sequence_runs (
  lead_id   TEXT NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  sequence  TEXT NOT NULL,
  step      INTEGER NOT NULL,
  run_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  result    TEXT NOT NULL CHECK (result IN ('sent','task_created','skipped','failed')),
  PRIMARY KEY (lead_id, sequence, step)
);

-- ===== Zgody (dowód dla RODO) =====
CREATE TABLE IF NOT EXISTS consent_log (
  id            TEXT PRIMARY KEY,
  lead_id       TEXT REFERENCES leads (id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('privacy_ack','marketing_email','photo_publication')),
  granted       INTEGER NOT NULL CHECK (granted IN (0,1)),
  text_version  TEXT NOT NULL,                -- np. 'privacy-2026-09'
  source        TEXT,                         -- 'form','quiz','panel'
  at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_consent_lead ON consent_log (lead_id, type, at);

-- ===== Partnerzy, polecenia, przetargi =====
CREATE TABLE IF NOT EXISTS partners (
  id               TEXT PRIMARY KEY,
  company          TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('contractor','nursery','architect','interior_designer','hardscape','irrigation_lighting','developer','property_manager','building_supply_garden_center','other')),
  city             TEXT,
  contact_name     TEXT,
  email            TEXT,
  phone            TEXT,
  contact_basis    TEXT NOT NULL CHECK (contact_basis IN ('consent','existing_relationship','inbound','public_tender')),
  ref_code         TEXT UNIQUE,
  status           TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect','talking','active','paused')),
  last_contact_at  TEXT,
  notes            TEXT,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS referrals (
  id                TEXT PRIMARY KEY,
  referred_lead_id  TEXT NOT NULL UNIQUE REFERENCES leads (id) ON DELETE CASCADE,
  referrer_type     TEXT NOT NULL CHECK (referrer_type IN ('client','partner')),
  referrer_lead_id  TEXT REFERENCES leads (id) ON DELETE SET NULL,
  partner_id        TEXT REFERENCES partners (id) ON DELETE SET NULL,
  reward_status     TEXT NOT NULL DEFAULT 'pending' CHECK (reward_status IN ('pending','earned','paid','not_eligible')),
  reward_note       TEXT
);

CREATE TABLE IF NOT EXISTS tenders (
  id                   TEXT PRIMARY KEY,
  source               TEXT NOT NULL CHECK (source IN ('e_zamowienia','bzp','platforma_zakupowa','direct','other')),
  title                TEXT NOT NULL,
  buyer                TEXT NOT NULL,
  url                  TEXT,
  deadline_at          TEXT,
  estimated_value_pln  INTEGER,
  status               TEXT NOT NULL DEFAULT 'watching' CHECK (status IN ('watching','go','no_go','submitted','won','lost')),
  decision_note        TEXT,
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_tenders_deadline ON tenders (status, deadline_at);

-- ===== Widoki raportowe =====

-- Lejek według miesiąca utworzenia leada (kohorta) i kanału.
CREATE VIEW IF NOT EXISTS v_funnel_monthly AS
SELECT substr(l.created_at, 1, 7)                          AS month,
       COALESCE(l.utm_source, l.heard_from, 'direct')      AS channel,
       COUNT(*)                                            AS leads,
       SUM(l.first_contact_at IS NOT NULL)                 AS contacted,
       SUM(l.consultation_at IS NOT NULL)                  AS consultations,
       SUM(l.offer_at IS NOT NULL)                         AS offers,
       SUM(l.won_at IS NOT NULL)                           AS won,
       COALESCE(SUM(p.value_pln), 0)                       AS revenue_pln
FROM leads l
LEFT JOIN projects p ON p.lead_id = l.id
GROUP BY month, channel;

-- CPL, CAC i stop-loss na kampanię i miesiąc (umowy przypisane do miesiąca leada).
CREATE VIEW IF NOT EXISTS v_channel_economics AS
WITH ls AS (
  SELECT substr(created_at, 1, 7) AS month, utm_campaign,
         COUNT(*) AS leads, SUM(won_at IS NOT NULL) AS won
  FROM leads WHERE utm_campaign IS NOT NULL
  GROUP BY month, utm_campaign
)
SELECT c.channel, c.name, s.month, s.spend_pln,
       COALESCE(ls.leads, 0) AS leads,
       COALESCE(ls.won, 0)   AS won,
       CASE WHEN ls.leads > 0 THEN ROUND(1.0 * s.spend_pln / ls.leads) END AS cpl_pln,
       CASE WHEN ls.won   > 0 THEN ROUND(1.0 * s.spend_pln / ls.won)   END AS cac_pln,
       c.stop_loss_cpl_pln,
       CASE WHEN c.stop_loss_cpl_pln IS NOT NULL AND (
              (ls.leads >= 10 AND 1.0 * s.spend_pln / ls.leads > c.stop_loss_cpl_pln)
           OR (COALESCE(ls.leads, 0) = 0 AND s.spend_pln >= 2 * c.stop_loss_cpl_pln)
            ) THEN 1 ELSE 0 END AS stop_loss_hit
FROM campaign_spend s
JOIN campaigns c ON c.id = s.campaign_id
LEFT JOIN ls ON ls.utm_campaign = c.utm_campaign AND ls.month = s.month;

-- Mediana minut do pierwszego kontaktu (surowy czas; wersję "w godzinach pracy" liczy aplikacja).
CREATE VIEW IF NOT EXISTS v_first_contact_median AS
WITH d AS (
  SELECT substr(created_at, 1, 7) AS month,
         (julianday(first_contact_at) - julianday(created_at)) * 1440.0 AS minutes
  FROM leads WHERE first_contact_at IS NOT NULL
), r AS (
  SELECT month, minutes,
         ROW_NUMBER() OVER (PARTITION BY month ORDER BY minutes) AS rn,
         COUNT(*)     OVER (PARTITION BY month)                  AS cnt
  FROM d
)
SELECT month, ROUND(AVG(minutes), 1) AS median_minutes, MAX(cnt) AS contacted_leads
FROM r WHERE rn IN ((cnt + 1) / 2, (cnt + 2) / 2)
GROUP BY month;

-- Odsetek leadów z kontaktem do 60 min [E9].
CREATE VIEW IF NOT EXISTS v_first_contact_sla AS
SELECT substr(created_at, 1, 7) AS month,
       COUNT(*) AS leads,
       ROUND(100.0 * SUM(first_contact_at IS NOT NULL
             AND (julianday(first_contact_at) - julianday(created_at)) * 1440.0 <= 60) / COUNT(*), 1) AS pct_within_60min
FROM leads GROUP BY month;

-- Skuteczność ofert i udział pakietów w umowach (sprawdzenie efektu środka [E8]).
CREATE VIEW IF NOT EXISTS v_offer_winrate AS
SELECT package,
       COUNT(*)                                                     AS decided_offers,
       SUM(status = 'accepted')                                     AS accepted,
       ROUND(100.0 * SUM(status = 'accepted') / COUNT(*), 1)        AS win_rate_pct,
       ROUND(AVG(amount_pln))                                       AS avg_amount_pln,
       SUM(status = 'rejected' AND COALESCE(reject_reason, '') = 'price')         AS lost_on_price,
       ROUND(100.0 * SUM(status = 'accepted')
             / (SELECT COUNT(*) FROM offers WHERE status = 'accepted'), 1) AS share_of_all_won_pct
FROM offers
WHERE status IN ('accepted','rejected','expired')
GROUP BY package;

-- Zadania na dziś i zaległe (dla panelu).
CREATE VIEW IF NOT EXISTS v_tasks_due AS
SELECT t.id, t.lead_id, t.type, t.title, t.due_at, t.origin, l.name, l.phone, l.status
FROM tasks t
JOIN leads l ON l.id = t.lead_id
WHERE t.done_at IS NULL AND t.due_at <= strftime('%Y-%m-%dT23:59:59Z', 'now')
ORDER BY t.due_at;

-- Źródła poleceń.
CREATE VIEW IF NOT EXISTS v_referrals_summary AS
SELECT r.referrer_type,
       COALESCE(p.company, 'klient') AS referrer,
       COUNT(*)                      AS leads,
       SUM(l.won_at IS NOT NULL)     AS won,
       SUM(r.reward_status = 'earned') AS rewards_to_pay
FROM referrals r
JOIN leads l ON l.id = r.referred_lead_id
LEFT JOIN partners p ON p.id = r.partner_id
GROUP BY r.referrer_type, referrer;

-- Obecny partner z /o-nas/ (warunki do potwierdzenia).
INSERT OR IGNORE INTO partners (id, company, type, contact_basis, status, notes)
VALUES ('damps-pol', 'DAMPS POL', 'building_supply_garden_center', 'existing_relationship', 'active',
        'Hurtownia budowlana i centrum ogrodnicze; rabat dla klientów powołujących się na realizację Forma Zieleni; www.dampspol.pl');
