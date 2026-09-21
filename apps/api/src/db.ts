import { Kysely, PostgresDialect, sql } from 'kysely';
import { Migrator, type Migration, type MigrationProvider } from 'kysely/migration';
import pg from 'pg';

export interface Database {
  lead: {
    id: string;
    source: string;
    status: string;
    contact_name: string;
    contact_phone: string;
    contact_email: string | null;
    locality: string | null;
    site_analysis_requested: boolean;
    qualification_result: string;
    qualification_reasons: unknown;
    created_at: Date;
    updated_at: Date;
  };
  idempotency_record: {
    scope: string;
    idempotency_key: string;
    request_hash: string;
    response_status: number;
    response_body: unknown;
    created_at: Date;
  };
  domain_outbox: {
    id: string;
    event_type: string;
    lead_id: string;
    payload: unknown;
    created_at: Date;
    published_at: Date | null;
  };
  audit_event: {
    id: string;
    action: string;
    actor_id: string | null;
    lead_id: string;
    metadata: unknown;
    created_at: Date;
  };
}

const UP = `
CREATE TABLE lead (
  id text PRIMARY KEY,
  source text NOT NULL,
  status text NOT NULL,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  contact_email text,
  locality text,
  site_analysis_requested boolean NOT NULL,
  qualification_result text NOT NULL,
  qualification_reasons jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT lead_id_opaque CHECK (id ~ '^[a-z][a-z0-9]{15,63}$'),
  CONSTRAINT lead_source_known CHECK (source IN ('www', 'portal', 'admin', 'other')),
  CONSTRAINT lead_status_known CHECK (status IN ('received', 'site_analysis', 'qualified', 'consultation_ready', 'unqualified')),
  CONSTRAINT lead_qualification_known CHECK (qualification_result IN ('pending', 'qualified', 'unqualified', 'needs_review')),
  CONSTRAINT lead_contact_name_len CHECK (char_length(contact_name) BETWEEN 1 AND 120),
  CONSTRAINT lead_contact_phone_len CHECK (char_length(contact_phone) BETWEEN 9 AND 32)
);
CREATE INDEX lead_list_created ON lead (created_at DESC, id DESC);
CREATE INDEX lead_list_updated ON lead (updated_at DESC, id DESC);
CREATE INDEX lead_list_status_created ON lead (status, created_at DESC, id DESC);
CREATE TABLE idempotency_record (
  scope text NOT NULL,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,
  response_status integer NOT NULL,
  response_body jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (scope, idempotency_key),
  CONSTRAINT idempotency_key_len CHECK (char_length(idempotency_key) BETWEEN 8 AND 128)
);
CREATE TABLE domain_outbox (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  lead_id text NOT NULL REFERENCES lead (id),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  published_at timestamptz
);
CREATE TABLE audit_event (
  id text PRIMARY KEY,
  action text NOT NULL,
  actor_id text,
  lead_id text NOT NULL REFERENCES lead (id),
  metadata jsonb NOT NULL,
  created_at timestamptz NOT NULL
);
`;

const DOWN = `
DROP TABLE IF EXISTS audit_event;
DROP TABLE IF EXISTS domain_outbox;
DROP TABLE IF EXISTS idempotency_record;
DROP TABLE IF EXISTS lead;
`;

const migration: Migration = {
  async up(db) {
    await sql.raw(UP).execute(db);
  },
  async down(db) {
    await sql.raw(DOWN).execute(db);
  },
};

const provider: MigrationProvider = {
  async getMigrations() {
    return { '001_lead_vertical': migration };
  },
};

export function openDatabase(connectionString: string): { db: Kysely<Database>; pool: pg.Pool } {
  const pool = new pg.Pool({ connectionString, max: 4, connectionTimeoutMillis: 2000 });
  const db = new Kysely<Database>({ dialect: new PostgresDialect({ pool }) });
  return { db, pool };
}

export async function migrate(db: Kysely<Database>): Promise<void> {
  const migrator = new Migrator({ db, provider });
  const outcome = await migrator.migrateToLatest();
  if (outcome.error) throw outcome.error;
}
