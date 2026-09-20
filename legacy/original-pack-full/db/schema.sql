-- Cloudflare D1 (SQLite). Schemat startowy dla migracji 0001.
-- Dane osobowe wyłącznie w tabeli leads (+ pliki w R2 wskazane w lead_files).
-- Znaczniki czasu w UTC, format ISO 8601.

CREATE TABLE IF NOT EXISTS leads (
  id                      TEXT PRIMARY KEY,                -- ULID
  created_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  -- skąd przyszło zgłoszenie
  source                  TEXT NOT NULL CHECK (source IN ('form', 'quiz', 'calculator', 'scope_builder', 'moodboard', 'microretention', 'consultation', 'partner', 'assistant', 'marketplace', 'b2b')),
  source_detail           TEXT,                            -- np. 'realizacja:ogrod-w-lesie', 'home-step1'
  utm_source              TEXT,
  utm_medium              TEXT,
  utm_campaign            TEXT,

  -- co i gdzie
  project_type            TEXT NOT NULL CHECK (project_type IN ('garden', 'balcony_terrace', 'flowerbed', 'small_architecture', 'estate_greenery', 'public_space')),
  start_timing            TEXT CHECK (start_timing IN ('asap', '3_months', 'this_year', 'unknown')),
  location                TEXT,
  area_range              TEXT CHECK (area_range IN ('lt100', '100_300', '300_800', 'gt800', 'balcony', 'unknown')),
  notes                   TEXT,

  -- quiz i kalkulator
  quiz_style              TEXT,                            -- id stylu z src/data/quiz.json
  quiz_answers            TEXT,                            -- JSON: { questionId: optionId | optionId[] }
  calc_estimate_min       INTEGER,                         -- PLN
  calc_estimate_max       INTEGER,

  -- kontakt
  name                    TEXT NOT NULL,
  phone                   TEXT NOT NULL,                   -- E.164, np. +48600100200
  email                   TEXT,
  contact_pref            TEXT NOT NULL DEFAULT 'phone' CHECK (contact_pref IN ('phone', 'sms', 'email')),
  privacy_ack             INTEGER NOT NULL CHECK (privacy_ack = 1),
  marketing_consent       INTEGER NOT NULL DEFAULT 0 CHECK (marketing_consent IN (0, 1)),

  -- sprzedaż (panel)
  status                  TEXT NOT NULL DEFAULT 'new'
                          CHECK (status IN ('new', 'contacted', 'consultation', 'offer', 'won', 'lost')),
  status_updated_at       TEXT,
  first_contact_at        TEXT,                            -- ustawiane przy pierwszym wyjściu ze statusu 'new'
  lost_reason             TEXT CHECK (lost_reason IS NULL OR lost_reason IN ('price', 'timing', 'scope', 'competitor', 'no_contact', 'other')),
  deal_value_pln          INTEGER,                         -- wartość umowy (P1)

  -- opinie po realizacji (M11)
  realization_completed_at TEXT,
  review_request_sent_at   TEXT,
  review_reminder_sent_at  TEXT,

  -- powiadomienia
  notify_client_email_at  TEXT,
  notify_owner_email_at   TEXT,
  notify_owner_sms_at     TEXT,

  -- retencja (RODO)
  delete_after            TEXT NOT NULL                    -- created_at + {{RETENCJA_MIESIĄCE}}; przy statusie 'won' aktualizowane zgodnie z umową
);

CREATE INDEX IF NOT EXISTS idx_leads_created      ON leads (created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status       ON leads (status, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_source       ON leads (source, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_delete_after ON leads (delete_after);
CREATE INDEX IF NOT EXISTS idx_leads_review_queue ON leads (status, realization_completed_at, review_request_sent_at);

CREATE TABLE IF NOT EXISTS lead_files (
  id            TEXT PRIMARY KEY,                          -- ULID
  lead_id       TEXT NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  r2_key        TEXT NOT NULL UNIQUE,                      -- losowy klucz w prywatnym buckecie
  content_type  TEXT NOT NULL,
  size_bytes    INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_lead_files_lead ON lead_files (lead_id);

CREATE TABLE IF NOT EXISTS lead_notes (
  id          TEXT PRIMARY KEY,                            -- ULID
  lead_id     TEXT NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON lead_notes (lead_id, created_at);

-- Zdarzenia analityczne: bez IP, bez identyfikatorów, bez danych osobowych.
CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  name        TEXT NOT NULL CHECK (name IN (
                'cta_click', 'quiz_start', 'quiz_step', 'quiz_complete',
                'form_step', 'form_error', 'lead_submit',
                'call_click', 'sms_click', 'booking_click',
                'calc_use', 'filter_use', 'before_after_use',
                'search_use', 'plant_filter', 'moodboard_save', 'moodboard_send', 'scope_complete',
                'microretention_check', 'newsletter_signup', 'consultation_checkout', 'voucher_checkout',
                'portal_login', 'comment_add', 'approval', 'assistant_question'
              )),
  path        TEXT,                                        -- ścieżka bez query string
  props       TEXT,                                        -- JSON z kluczami z białej listy
  variant     TEXT,                                        -- wariant testu, jeśli dotyczy
  utm_source  TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_name_created ON events (name, created_at);

-- Po usunięciu leada Worker retencji usuwa też obiekty R2 z lead_files (kaskada w D1 nie kasuje plików w R2).
-- Sprawdź przy migracji, czy D1 egzekwuje klucze obce w Twojej konfiguracji; jeśli nie, usuwaj powiązane rekordy jawnie.
