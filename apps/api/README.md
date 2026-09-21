# apps/api

Core API for Forma Zieleni. Hono on Node 24. PostgreSQL through Kysely.
This package serves the visitor lead vertical from `contracts/openapi.json`.

Binding shape: [`../../docs/architecture/CURRENT-ARCHITECTURE.md`](../../docs/architecture/CURRENT-ARCHITECTURE.md).

## Implemented

- `GET /v1/health` — process liveness only. It does not check the database.
- `POST /v1/leads` — public capture, strict JSON validation, idempotency, 8 KiB body cap, per-process rate limit.
- `GET /v1/leads` and `GET /v1/leads/{leadId}` — staff read. Anonymous callers receive 401. Authenticated callers without `leads:read` receive 403.
- `POST /v1/leads/{leadId}/qualify` — uses `packages/domain`. Same idempotency conflict (409) as the contract.
- Lead row, idempotency record, transactional `domain_outbox`, and `audit_event` in one database transaction.
- Structured JSON request logs and a small span boundary. No contact fields, tokens, or raw bodies.

## Not implemented

- WWW, Portal, Admin, mobile, SketchUp.
- The rest of CRM.
- Production Better Auth. `AUTH_MODE` other than `test` fails closed: every CRM call is 401. That is not production authentication acceptance.
- OpenObserve, session replay, Cloudflare, Garage, signing, payments.
- A delivery worker for the outbox. Rows are written unpublished.
- Database readiness on `/v1/health`.
- Socket-address rate limiting. The process default buckets every caller as `local` (30 captures per minute). Tests inject the key. Do not treat this as an edge limiter.

## Local run

PostgreSQL must already be running. This package does not install Docker or start a server for you.

```text
$env:LEAD_DATABASE_URL = 'postgres://USER@127.0.0.1:5432/forma_zieleni_dev'
node src/server.ts
```

The process listens on `127.0.0.1` and port `3000` unless `PORT` is set.
`AUTH_MODE=test` with `TEST_AUTH_SECRET` (at least 16 characters) enables the test session signer only. Do not use that mode as production auth.

## Tests

`pnpm --filter @forma-zieleni/api test`

HTTP tests use an in-memory store. They are not persistence acceptance.
`src/postgres.integration.test.mjs` uses `LEAD_DATABASE_URL` when set. Otherwise it starts a temporary PostgreSQL cluster with `initdb`/`pg_ctl` from `psql` on `PATH`, or `FORMA_PG_BIN`, bound to `127.0.0.1` with trust auth, then stops it. If neither is available the test is skipped and persistence acceptance is not claimed.

## Security status

Lead behavior is covered by the API tests, including authorization, source spoofing, idempotency, injection-as-data, and log redaction.
`pnpm audit` on 2026-09-21 reported no known vulnerabilities. OWASP Dependency-Check is not installed and was not run.
