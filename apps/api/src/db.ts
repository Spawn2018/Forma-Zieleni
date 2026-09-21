import { Kysely, PostgresDialect, sql, type Generated } from 'kysely';
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
    attempts: Generated<number>;
    next_attempt_at: Date | null;
    claimed_at: Date | null;
    claim_token: string | null;
    last_error: string | null;
    delivery_status: string;
  };
  identity_principal: {
    actor_id: string;
    issuer: string;
    subject: string;
    client_id: string;
    created_at: Date;
  };
  actor_capability: {
    actor_id: string;
    capability: string;
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

const UP_SECURITY = `
ALTER TABLE domain_outbox
  ADD COLUMN attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN next_attempt_at timestamptz,
  ADD COLUMN claimed_at timestamptz,
  ADD COLUMN claim_token text,
  ADD COLUMN last_error text,
  ADD COLUMN delivery_status text NOT NULL DEFAULT 'pending';
ALTER TABLE domain_outbox
  ADD CONSTRAINT domain_outbox_attempts_bound CHECK (attempts >= 0 AND attempts <= 20),
  ADD CONSTRAINT domain_outbox_status_known CHECK (delivery_status IN ('pending', 'published', 'poison')),
  ADD CONSTRAINT domain_outbox_error_code CHECK (last_error IS NULL OR last_error = 'DELIVERY_FAILED');
UPDATE domain_outbox SET delivery_status = 'published' WHERE published_at IS NOT NULL;
CREATE TABLE identity_principal (
  actor_id text PRIMARY KEY,
  issuer text NOT NULL,
  subject text NOT NULL,
  client_id text NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT identity_actor_opaque CHECK (actor_id ~ '^[a-z][a-z0-9]{15,63}$'),
  CONSTRAINT identity_client_known CHECK (client_id IN ('web', 'portal', 'admin', 'mobile', 'sketchup', 'm2m')),
  CONSTRAINT identity_issuer_len CHECK (char_length(issuer) BETWEEN 1 AND 200),
  CONSTRAINT identity_subject_len CHECK (char_length(subject) BETWEEN 1 AND 200),
  UNIQUE (issuer, subject)
);
CREATE TABLE actor_capability (
  actor_id text NOT NULL REFERENCES identity_principal (actor_id),
  capability text NOT NULL,
  PRIMARY KEY (actor_id, capability),
  CONSTRAINT actor_capability_known CHECK (capability IN ('leads:read', 'leads:qualify'))
);
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE auth."user" (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image text,
  "createdAt" timestamptz NOT NULL,
  "updatedAt" timestamptz NOT NULL
);
CREATE TABLE auth.session (
  id text PRIMARY KEY,
  "expiresAt" timestamptz NOT NULL,
  token text NOT NULL UNIQUE,
  "createdAt" timestamptz NOT NULL,
  "updatedAt" timestamptz NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES auth."user" (id) ON DELETE CASCADE
);
CREATE INDEX auth_session_user ON auth.session ("userId");
CREATE TABLE auth.account (
  id text PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES auth."user" (id) ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz NOT NULL,
  "updatedAt" timestamptz NOT NULL,
  UNIQUE ("providerId", "accountId")
);
CREATE INDEX auth_account_user ON auth.account ("userId");
CREATE TABLE auth.verification (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL,
  "updatedAt" timestamptz NOT NULL
);
CREATE INDEX auth_verification_identifier ON auth.verification (identifier);
`;

const DOWN_SECURITY = `
DROP TABLE IF EXISTS auth.verification;
DROP TABLE IF EXISTS auth.account;
DROP TABLE IF EXISTS auth.session;
DROP TABLE IF EXISTS auth."user";
DROP SCHEMA IF EXISTS auth;
DROP TABLE IF EXISTS actor_capability;
DROP TABLE IF EXISTS identity_principal;
ALTER TABLE domain_outbox DROP CONSTRAINT IF EXISTS domain_outbox_error_code;
ALTER TABLE domain_outbox DROP CONSTRAINT IF EXISTS domain_outbox_status_known;
ALTER TABLE domain_outbox DROP CONSTRAINT IF EXISTS domain_outbox_attempts_bound;
ALTER TABLE domain_outbox
  DROP COLUMN IF EXISTS delivery_status,
  DROP COLUMN IF EXISTS last_error,
  DROP COLUMN IF EXISTS claim_token,
  DROP COLUMN IF EXISTS claimed_at,
  DROP COLUMN IF EXISTS next_attempt_at,
  DROP COLUMN IF EXISTS attempts;
`;

const migration: Migration = {
  async up(db) {
    await sql.raw(UP).execute(db);
  },
  async down(db) {
    await sql.raw(DOWN).execute(db);
  },
};

const securityMigration: Migration = {
  async up(db) {
    await sql.raw(UP_SECURITY).execute(db);
  },
  async down(db) {
    await sql.raw(DOWN_SECURITY).execute(db);
  },
};

const CONTENT_CAPABILITY_SQL = [
  'leads:read',
  'leads:qualify',
  'content:read-draft',
  'content:edit',
  'content:review',
  'content:publish',
  'content:admin',
].map(capability => `'${capability}'`).join(', ');

const contentCapabilityMigration: Migration = {
  async up(db) {
    await sql.raw(`
      ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
      ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
        CHECK (capability IN (${CONTENT_CAPABILITY_SQL}));
    `).execute(db);
  },
  async down(db) {
    await sql.raw(`
      DELETE FROM actor_capability WHERE capability LIKE 'content:%';
      ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
      ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
        CHECK (capability IN ('leads:read', 'leads:qualify'));
    `).execute(db);
  },
};

const provider: MigrationProvider = {
  async getMigrations() {
    return {
      '001_lead_vertical': migration,
      '002_security_runtime': securityMigration,
      '003_content_capabilities': contentCapabilityMigration,
    };
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
