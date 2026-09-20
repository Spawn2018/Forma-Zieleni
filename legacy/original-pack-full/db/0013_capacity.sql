-- Migracja 0013: przepustowość pracowni jednoosobowej (22-JEDEN-PROJEKTANT.md). Wymaga 0001–0012.

-- Ile godzin projektowych jest realnie dostępnych w miesiącu i ile już zajętych.
CREATE TABLE IF NOT EXISTS capacity_plan (
  month            TEXT PRIMARY KEY,          -- 'RRRR-MM'
  available_hours  REAL NOT NULL CHECK (available_hours >= 0),
  reserved_hours   REAL NOT NULL DEFAULT 0 CHECK (reserved_hours >= 0),  -- urlop, szkolenia, sprzedaż
  note             TEXT
);

-- Rezerwacja godzin pod konkretny projekt albo etap (podstawa terminu dla klienta).
CREATE TABLE IF NOT EXISTS capacity_bookings (
  id          TEXT PRIMARY KEY,
  month       TEXT NOT NULL REFERENCES capacity_plan (month) ON DELETE CASCADE,
  project_id  TEXT REFERENCES projects (id) ON DELETE SET NULL,
  lead_id     TEXT REFERENCES leads (id) ON DELETE SET NULL,
  stage       TEXT NOT NULL CHECK (stage IN ('wizyta','koncepcja','projekt','nadzor','poprawki')),
  hours       REAL NOT NULL CHECK (hours > 0),
  status      TEXT NOT NULL DEFAULT 'wstepna' CHECK (status IN ('wstepna','potwierdzona','zrealizowana','anulowana')),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_capacity_bookings ON capacity_bookings (month, status);

-- Normy godzinowe etapów: podstawa wyceny i terminu (aktualizowane z time_entries).
CREATE TABLE IF NOT EXISTS stage_norms (
  stage       TEXT NOT NULL CHECK (stage IN ('wizyta','koncepcja','projekt','nadzor','poprawki')),
  size_range  TEXT NOT NULL CHECK (size_range IN ('lt100','100_300','300_800','gt800','balkon')),
  hours       REAL NOT NULL CHECK (hours > 0),
  updated_on  TEXT NOT NULL,
  PRIMARY KEY (stage, size_range)
);

CREATE VIEW IF NOT EXISTS v_capacity AS
SELECT c.month,
       c.available_hours,
       c.reserved_hours,
       ROUND(COALESCE(SUM(CASE WHEN b.status IN ('wstepna','potwierdzona','zrealizowana') THEN b.hours END), 0), 1) AS booked_hours,
       ROUND(c.available_hours - c.reserved_hours
             - COALESCE(SUM(CASE WHEN b.status IN ('wstepna','potwierdzona','zrealizowana') THEN b.hours END), 0), 1) AS free_hours,
       CASE WHEN c.available_hours - c.reserved_hours > 0
            THEN ROUND(100.0 * COALESCE(SUM(CASE WHEN b.status IN ('wstepna','potwierdzona','zrealizowana') THEN b.hours END), 0)
                 / (c.available_hours - c.reserved_hours), 1) END AS fill_pct
FROM capacity_plan c LEFT JOIN capacity_bookings b ON b.month = c.month
GROUP BY c.month, c.available_hours, c.reserved_hours;
