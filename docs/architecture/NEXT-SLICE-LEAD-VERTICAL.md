# Next slice — lead vertical

Status: IMPLEMENTED for the Core API lead vertical in `apps/api`.
Not security-accepted. Production Better Auth is not wired.

Gate A architecture is DECIDED (ADR-014,
[`CURRENT-ARCHITECTURE.md`](./CURRENT-ARCHITECTURE.md)). That selection
is not implementation, and it is not security acceptance.

## Objective

Implement the existing visitor lead vertical on the selected stack:

public lead capture → validation → persistence → authorized CRM
list/get/qualify → audit/observability → tests/security.

Do not broaden this slice into the rest of CRM, sales, offers,
contracts, payments or files.

## Source

- OpenAPI 3.0.4: `contracts/openapi.json`
- Domain rules: `packages/domain`
- Validation: `packages/validation`
- Gate A record: [`OWNER-DECISION-PACKETS-GATE-A.md`](./OWNER-DECISION-PACKETS-GATE-A.md)

## In scope

- `apps/api` as a Hono application on Node 24.
- PostgreSQL as persistence truth, accessed through Kysely.
- Transactional outbox for lead domain events in the same database
  transaction as the lead write.
- Public `POST /leads` stays anonymous.
- Staff list, get and qualify use Better Auth under the phased
  protocol-ready model: stable `actorId`, issuer/`sub` mapping, a
  distinct staff client identity, and domain BOLA/BFLA/BOPLA only in
  Core API.
- Structured JSON logs and OpenTelemetry-compatible instrumentation.
  No OpenObserve process on Windows.
- Local secrets outside git. No SOPS material unless the slice actually
  needs a repository-adjacent encrypted secret.
- Contract tests, domain tests, authorization tests and a tested local
  backup/restore note for the lead database. A copy without a restore
  check is not acceptance.
- Native Windows development with pnpm. Docker is not required.

## Out of scope

- WWW, Portal and Admin applications, including React Router surfaces.
  Those frameworks are selected; this slice does not build them.
- The rest of CRM.
- Mobile, SketchUp, generated Ruby client, CI client publish.
- Garage, any remote object store, and production storage.
- A dedicated identity provider.
- OpenObserve, pgBackRest, a Linux host, Docker Compose staging.
- Cloudflare Tunnel, DNS, firewall or production changes.
- FZ-SIGN-1 provider, payments, Fakturownia.
- Session replay.
- Real customer data, real credentials, paid services.

React Router loaders must not become a second business API when later
surfaces are built. They call Core API.

## Acceptance

- The lead operations in `contracts/openapi.json` are served by Hono
  and persist in PostgreSQL.
- Qualification uses `packages/domain`, not a client-supplied status.
- Anonymous callers cannot list, get or qualify another person's lead.
- Staff authorization is enforced in Core API.
- Audit events exist for capture and qualification without putting
  contact PII into logs.
- `pnpm test`, `pnpm typecheck`, `pnpm lint` and `pnpm repo:check` pass.
- ASVS rows for this slice move from “evidence later” only where a
  runtime test actually exists. ZAP and Dependency-Check stay NA until
  their preconditions are met. Skipped native Windows tests stay
  skipped, not pass.

## Risk

REVIEW for local code, schema and tests. OWNER-ONLY for any recurring
spend. DANGEROUS, and not part of this slice, for Cloudflare, DNS,
production, secrets in git, or destructive migration of real data.

## Failure

If PostgreSQL or Better Auth cannot run on local Windows without Docker
or paid services, stop that subpart, record the blocker, and do not
substitute another database, ORM or identity provider.
