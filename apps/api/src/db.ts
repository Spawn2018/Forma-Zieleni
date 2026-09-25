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
  opportunity: {
    id: string;
    lead_id: string;
    status: string;
    created_at: Date;
    updated_at: Date;
  };
  offer: {
    id: string;
    opportunity_id: string;
    status: string;
    client_subject: string | null;
    created_at: Date;
    updated_at: Date;
  };
  contract: {
    id: string;
    offer_id: string;
    status: string;
    created_at: Date;
    updated_at: Date;
  };
  project: {
    id: string;
    contract_id: string;
    status: string;
    client_subject: string | null;
    created_at: Date;
    updated_at: Date;
  };
  project_file: {
    id: string;
    project_id: string;
    client_subject: string | null;
    name: string;
    mime_type: string;
    size_bytes: number;
    created_at: Date;
    updated_at: Date;
  };
  project_milestone: {
    id: string;
    project_id: string;
    title: string;
    status: string;
    due_at: Date | null;
    created_at: Date;
    updated_at: Date;
  };
  project_decision_log: {
    id: string;
    project_id: string;
    kind: string;
    summary: string;
    recorded_by_actor_id: string;
    related_milestone_id: string | null;
    created_at: Date;
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

const GROWTH_CAPABILITY_SQL = [
  'leads:read',
  'leads:qualify',
  'content:read-draft',
  'content:edit',
  'content:review',
  'content:publish',
  'content:admin',
  'growth:plan',
  'semantic:review',
].map(capability => `'${capability}'`).join(', ');

const growthCapabilityMigration: Migration = {
  async up(db) {
    await sql.raw(`
      ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
      ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
        CHECK (capability IN (${GROWTH_CAPABILITY_SQL}));
    `).execute(db);
  },
  async down(db) {
    await sql.raw(`
      DELETE FROM actor_capability WHERE capability IN ('growth:plan', 'semantic:review');
      ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
      ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
        CHECK (capability IN (${CONTENT_CAPABILITY_SQL}));
    `).execute(db);
  },
};

const OPPORTUNITY_CAPABILITY_SQL = [
  'leads:read',
  'leads:qualify',
  'opportunities:read',
  'opportunities:create',
  'content:read-draft',
  'content:edit',
  'content:review',
  'content:publish',
  'content:admin',
  'growth:plan',
  'semantic:review',
].map(capability => `'${capability}'`).join(', ');

const opportunityMigration: Migration = {
  async up(db) {
    await sql.raw(`
CREATE TABLE opportunity (
  id text PRIMARY KEY,
  lead_id text NOT NULL REFERENCES lead (id),
  status text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT opportunity_id_opaque CHECK (id ~ '^[a-z][a-z0-9]{15,63}$'),
  CONSTRAINT opportunity_status_known CHECK (status IN ('open')),
  CONSTRAINT opportunity_lead_unique UNIQUE (lead_id)
);
CREATE INDEX opportunity_list_created ON opportunity (created_at DESC, id DESC);
CREATE INDEX opportunity_list_updated ON opportunity (updated_at DESC, id DESC);
CREATE INDEX opportunity_list_status_created ON opportunity (status, created_at DESC, id DESC);
ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
  CHECK (capability IN (${OPPORTUNITY_CAPABILITY_SQL}));
    `).execute(db);
  },
  async down(db) {
    await sql.raw(`
DELETE FROM actor_capability WHERE capability IN ('opportunities:read', 'opportunities:create');
ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
  CHECK (capability IN (${GROWTH_CAPABILITY_SQL}));
DROP TABLE IF EXISTS opportunity;
    `).execute(db);
  },
};

const OFFER_CAPABILITY_SQL = [
  'leads:read',
  'leads:qualify',
  'opportunities:read',
  'opportunities:create',
  'offers:read',
  'offers:create',
  'content:read-draft',
  'content:edit',
  'content:review',
  'content:publish',
  'content:admin',
  'growth:plan',
  'semantic:review',
].map(capability => `'${capability}'`).join(', ');

const offerMigration: Migration = {
  async up(db) {
    await sql.raw(`
CREATE TABLE offer (
  id text PRIMARY KEY,
  opportunity_id text NOT NULL REFERENCES opportunity (id),
  status text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT offer_id_opaque CHECK (id ~ '^[a-z][a-z0-9]{15,63}$'),
  CONSTRAINT offer_status_known CHECK (status IN ('draft')),
  CONSTRAINT offer_opportunity_unique UNIQUE (opportunity_id)
);
CREATE INDEX offer_list_created ON offer (created_at DESC, id DESC);
CREATE INDEX offer_list_updated ON offer (updated_at DESC, id DESC);
CREATE INDEX offer_list_status_created ON offer (status, created_at DESC, id DESC);
ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
  CHECK (capability IN (${OFFER_CAPABILITY_SQL}));
    `).execute(db);
  },
  async down(db) {
    await sql.raw(`
DELETE FROM actor_capability WHERE capability IN ('offers:read', 'offers:create');
ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
  CHECK (capability IN (${OPPORTUNITY_CAPABILITY_SQL}));
DROP TABLE IF EXISTS offer;
    `).execute(db);
  },
};

const CONTRACT_CAPABILITY_SQL = [
  'leads:read',
  'leads:qualify',
  'opportunities:read',
  'opportunities:create',
  'offers:read',
  'offers:create',
  'contracts:read',
  'contracts:create',
  'content:read-draft',
  'content:edit',
  'content:review',
  'content:publish',
  'content:admin',
  'growth:plan',
  'semantic:review',
].map(capability => `'${capability}'`).join(', ');

const contractMigration: Migration = {
  async up(db) {
    await sql.raw(`
CREATE TABLE contract (
  id text PRIMARY KEY,
  offer_id text NOT NULL REFERENCES offer (id),
  status text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT contract_id_opaque CHECK (id ~ '^[a-z][a-z0-9]{15,63}$'),
  CONSTRAINT contract_status_known CHECK (status IN ('draft')),
  CONSTRAINT contract_offer_unique UNIQUE (offer_id)
);
CREATE INDEX contract_list_created ON contract (created_at DESC, id DESC);
CREATE INDEX contract_list_updated ON contract (updated_at DESC, id DESC);
CREATE INDEX contract_list_status_created ON contract (status, created_at DESC, id DESC);
ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
  CHECK (capability IN (${CONTRACT_CAPABILITY_SQL}));
    `).execute(db);
  },
  async down(db) {
    await sql.raw(`
DELETE FROM actor_capability WHERE capability IN ('contracts:read', 'contracts:create');
ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
  CHECK (capability IN (${OFFER_CAPABILITY_SQL}));
DROP TABLE IF EXISTS contract;
    `).execute(db);
  },
};

const PORTAL_OFFER_CAPABILITY_SQL = [
  'leads:read',
  'leads:qualify',
  'opportunities:read',
  'opportunities:create',
  'offers:read',
  'offers:create',
  'offers:portal-read',
  'contracts:read',
  'contracts:create',
  'content:read-draft',
  'content:edit',
  'content:review',
  'content:publish',
  'content:admin',
  'growth:plan',
  'semantic:review',
].map(capability => `'${capability}'`).join(', ');

const portalOfferMigration: Migration = {
  async up(db) {
    await sql.raw(`
ALTER TABLE offer ADD COLUMN IF NOT EXISTS client_subject text;
CREATE INDEX IF NOT EXISTS offer_client_subject ON offer (client_subject) WHERE client_subject IS NOT NULL;
ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
  CHECK (capability IN (${PORTAL_OFFER_CAPABILITY_SQL}));
    `).execute(db);
  },
  async down(db) {
    await sql.raw(`
DELETE FROM actor_capability WHERE capability = 'offers:portal-read';
ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
  CHECK (capability IN (${CONTRACT_CAPABILITY_SQL}));
DROP INDEX IF EXISTS offer_client_subject;
ALTER TABLE offer DROP COLUMN IF EXISTS client_subject;
    `).execute(db);
  },
};

const PROJECT_CAPABILITY_SQL = [
  'leads:read',
  'leads:qualify',
  'opportunities:read',
  'opportunities:create',
  'offers:read',
  'offers:create',
  'offers:portal-read',
  'contracts:read',
  'contracts:create',
  'projects:read',
  'projects:create',
  'content:read-draft',
  'content:edit',
  'content:review',
  'content:publish',
  'content:admin',
  'growth:plan',
  'semantic:review',
].map(capability => `'${capability}'`).join(', ');

const projectMigration: Migration = {
  async up(db) {
    await sql.raw(`
CREATE TABLE project (
  id text PRIMARY KEY,
  contract_id text NOT NULL REFERENCES contract (id),
  status text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT project_id_opaque CHECK (id ~ '^[a-z][a-z0-9]{15,63}$'),
  CONSTRAINT project_status_known CHECK (status IN ('planned')),
  CONSTRAINT project_contract_unique UNIQUE (contract_id)
);
CREATE INDEX project_list_created ON project (created_at DESC, id DESC);
CREATE INDEX project_list_updated ON project (updated_at DESC, id DESC);
CREATE INDEX project_list_status_created ON project (status, created_at DESC, id DESC);
ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
  CHECK (capability IN (${PROJECT_CAPABILITY_SQL}));
    `).execute(db);
  },
  async down(db) {
    await sql.raw(`
DELETE FROM actor_capability WHERE capability IN ('projects:read', 'projects:create');
ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
  CHECK (capability IN (${PORTAL_OFFER_CAPABILITY_SQL}));
DROP TABLE IF EXISTS project;
    `).execute(db);
  },
};

const PORTAL_PROJECT_CAPABILITY_SQL = [
  'leads:read',
  'leads:qualify',
  'opportunities:read',
  'opportunities:create',
  'offers:read',
  'offers:create',
  'offers:portal-read',
  'contracts:read',
  'contracts:create',
  'projects:read',
  'projects:create',
  'projects:portal-read',
  'content:read-draft',
  'content:edit',
  'content:review',
  'content:publish',
  'content:admin',
  'growth:plan',
  'semantic:review',
].map(capability => `'${capability}'`).join(', ');

const portalProjectMigration: Migration = {
  async up(db) {
    await sql.raw(`
ALTER TABLE project ADD COLUMN IF NOT EXISTS client_subject text;
CREATE INDEX IF NOT EXISTS project_client_subject ON project (client_subject) WHERE client_subject IS NOT NULL;
ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
  CHECK (capability IN (${PORTAL_PROJECT_CAPABILITY_SQL}));
    `).execute(db);
  },
  async down(db) {
    await sql.raw(`
DELETE FROM actor_capability WHERE capability = 'projects:portal-read';
ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
  CHECK (capability IN (${PROJECT_CAPABILITY_SQL}));
DROP INDEX IF EXISTS project_client_subject;
ALTER TABLE project DROP COLUMN IF EXISTS client_subject;
    `).execute(db);
  },
};

const projectDeliveredMigration: Migration = {
  async up(db) {
    await sql.raw(`
ALTER TABLE project DROP CONSTRAINT IF EXISTS project_status_known;
ALTER TABLE project ADD CONSTRAINT project_status_known CHECK (status IN ('planned', 'delivered'));
    `).execute(db);
  },
  async down(db) {
    await sql.raw(`
DO $project_delivered_down$
BEGIN
  IF EXISTS (SELECT 1 FROM project WHERE status = 'delivered') THEN
    RAISE EXCEPTION 'PROJECT_DELIVERED_ROWS_BLOCK_DOWN';
  END IF;
END
$project_delivered_down$;
ALTER TABLE project DROP CONSTRAINT IF EXISTS project_status_known;
ALTER TABLE project ADD CONSTRAINT project_status_known CHECK (status IN ('planned'));
    `).execute(db);
  },
};

const PORTAL_FILE_CAPABILITY_SQL = [
  'leads:read',
  'leads:qualify',
  'opportunities:read',
  'opportunities:create',
  'offers:read',
  'offers:create',
  'offers:portal-read',
  'contracts:read',
  'contracts:create',
  'projects:read',
  'projects:create',
  'projects:portal-read',
  'files:read',
  'files:create',
  'files:portal-read',
  'content:read-draft',
  'content:edit',
  'content:review',
  'content:publish',
  'content:admin',
  'growth:plan',
  'semantic:review',
].map(capability => `'${capability}'`).join(', ');

const portalFileMigration: Migration = {
  async up(db) {
    await sql.raw(`
CREATE TABLE project_file (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES project (id),
  client_subject text,
  name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT project_file_id_opaque CHECK (id ~ '^[a-z][a-z0-9]{15,63}$'),
  CONSTRAINT project_file_name_len CHECK (char_length(name) BETWEEN 1 AND 255),
  CONSTRAINT project_file_mime_len CHECK (char_length(mime_type) BETWEEN 1 AND 200),
  CONSTRAINT project_file_size_nonneg CHECK (size_bytes >= 0)
);
CREATE INDEX project_file_list_created ON project_file (created_at DESC, id DESC);
CREATE INDEX project_file_list_updated ON project_file (updated_at DESC, id DESC);
CREATE INDEX project_file_project ON project_file (project_id, created_at DESC, id DESC);
CREATE INDEX project_file_client_subject ON project_file (client_subject) WHERE client_subject IS NOT NULL;
ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
  CHECK (capability IN (${PORTAL_FILE_CAPABILITY_SQL}));
    `).execute(db);
  },
  async down(db) {
    await sql.raw(`
DELETE FROM actor_capability WHERE capability IN ('files:read', 'files:create', 'files:portal-read');
ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
  CHECK (capability IN (${PORTAL_PROJECT_CAPABILITY_SQL}));
DROP TABLE IF EXISTS project_file;
    `).execute(db);
  },
};

const MILESTONE_CAPABILITY_SQL = [
  'leads:read',
  'leads:qualify',
  'opportunities:read',
  'opportunities:create',
  'offers:read',
  'offers:create',
  'offers:portal-read',
  'contracts:read',
  'contracts:create',
  'projects:read',
  'projects:create',
  'projects:portal-read',
  'files:read',
  'files:create',
  'files:portal-read',
  'milestones:read',
  'milestones:create',
  'content:read-draft',
  'content:edit',
  'content:review',
  'content:publish',
  'content:admin',
  'growth:plan',
  'semantic:review',
].map(capability => `'${capability}'`).join(', ');

const projectMilestoneMigration: Migration = {
  async up(db) {
    await sql.raw(`
CREATE TABLE project_milestone (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES project (id),
  title text NOT NULL,
  status text NOT NULL,
  due_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT project_milestone_id_opaque CHECK (id ~ '^[a-z][a-z0-9]{15,63}$'),
  CONSTRAINT project_milestone_title_len CHECK (char_length(title) BETWEEN 1 AND 200),
  CONSTRAINT project_milestone_status_known CHECK (status IN ('planned', 'active', 'done'))
);
CREATE INDEX project_milestone_list_created ON project_milestone (created_at DESC, id DESC);
CREATE INDEX project_milestone_list_updated ON project_milestone (updated_at DESC, id DESC);
CREATE INDEX project_milestone_project ON project_milestone (project_id, created_at DESC, id DESC);
CREATE TABLE project_decision_log (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES project (id),
  kind text NOT NULL,
  summary text NOT NULL,
  recorded_by_actor_id text NOT NULL,
  related_milestone_id text REFERENCES project_milestone (id),
  created_at timestamptz NOT NULL,
  CONSTRAINT project_decision_log_id_opaque CHECK (id ~ '^[a-z][a-z0-9]{15,63}$'),
  CONSTRAINT project_decision_log_kind_known CHECK (kind IN ('decision', 'change_order')),
  CONSTRAINT project_decision_log_summary_len CHECK (char_length(summary) BETWEEN 1 AND 2000),
  CONSTRAINT project_decision_log_actor_opaque CHECK (recorded_by_actor_id ~ '^[a-z][a-z0-9]{15,63}$')
);
CREATE INDEX project_decision_log_list_created ON project_decision_log (created_at DESC, id DESC);
CREATE INDEX project_decision_log_project ON project_decision_log (project_id, created_at DESC, id DESC);
ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
  CHECK (capability IN (${MILESTONE_CAPABILITY_SQL}));
    `).execute(db);
  },
  async down(db) {
    await sql.raw(`
DELETE FROM actor_capability WHERE capability IN ('milestones:read', 'milestones:create');
ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
  CHECK (capability IN (${PORTAL_FILE_CAPABILITY_SQL}));
DROP TABLE IF EXISTS project_decision_log;
DROP TABLE IF EXISTS project_milestone;
    `).execute(db);
  },
};

const CONTRACT_LIFECYCLE_CAPABILITY_SQL = [
  'leads:read',
  'leads:qualify',
  'opportunities:read',
  'opportunities:create',
  'offers:read',
  'offers:create',
  'offers:portal-read',
  'contracts:read',
  'contracts:create',
  'contracts:lifecycle',
  'projects:read',
  'projects:create',
  'projects:portal-read',
  'files:read',
  'files:create',
  'files:portal-read',
  'milestones:read',
  'milestones:create',
  'content:read-draft',
  'content:edit',
  'content:review',
  'content:publish',
  'content:admin',
  'growth:plan',
  'semantic:review',
].map(capability => `'${capability}'`).join(', ');

const contractLifecycleMigration: Migration = {
  async up(db) {
    await sql.raw(`
ALTER TABLE contract DROP CONSTRAINT IF EXISTS contract_status_known;
ALTER TABLE contract ADD CONSTRAINT contract_status_known
  CHECK (status IN ('draft', 'internal_review', 'approved', 'sent'));
ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
  CHECK (capability IN (${CONTRACT_LIFECYCLE_CAPABILITY_SQL}));
    `).execute(db);
  },
  async down(db) {
    await sql.raw(`
DO $contract_lifecycle_down$
BEGIN
  IF EXISTS (
    SELECT 1 FROM contract
    WHERE status IN ('internal_review', 'approved', 'sent')
  ) THEN
    RAISE EXCEPTION 'CONTRACT_LIFECYCLE_ROWS_BLOCK_DOWN';
  END IF;
END
$contract_lifecycle_down$;
DELETE FROM actor_capability WHERE capability = 'contracts:lifecycle';
ALTER TABLE actor_capability DROP CONSTRAINT actor_capability_known;
ALTER TABLE actor_capability ADD CONSTRAINT actor_capability_known
  CHECK (capability IN (${MILESTONE_CAPABILITY_SQL}));
ALTER TABLE contract DROP CONSTRAINT IF EXISTS contract_status_known;
ALTER TABLE contract ADD CONSTRAINT contract_status_known CHECK (status IN ('draft'));
    `).execute(db);
  },
};

const provider: MigrationProvider = {
  async getMigrations() {
    return {
      '001_lead_vertical': migration,
      '002_security_runtime': securityMigration,
      '003_content_capabilities': contentCapabilityMigration,
      '004_growth_capabilities': growthCapabilityMigration,
      '005_opportunity_contract': opportunityMigration,
      '006_offer_contract': offerMigration,
      '007_contract_domain': contractMigration,
      '008_portal_offer_projection': portalOfferMigration,
      '009_project_domain': projectMigration,
      '010_portal_project_projection': portalProjectMigration,
      '011_project_delivered_status': projectDeliveredMigration,
      '012_portal_file_projection': portalFileMigration,
      '013_project_milestone_domain': projectMilestoneMigration,
      '014_contract_lifecycle': contractLifecycleMigration,
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
