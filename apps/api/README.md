# apps/api

Core API for Forma Zieleni. Hono on Node 24. PostgreSQL through Kysely.
This package serves the visitor lead vertical and staff Opportunity
endpoints from `contracts/openapi.json`.

Binding shape: [`../../docs/architecture/CURRENT-ARCHITECTURE.md`](../../docs/architecture/CURRENT-ARCHITECTURE.md).

## Implemented

- `GET /v1/health` — process liveness. It does not check the database.
- `GET /v1/ready` — readiness. The server runs `select 1`. Failure is `503` with code `NOT_READY` and no SQL or connection text.
- `POST /v1/leads` — public capture, strict JSON validation, idempotency, 8 KiB streamed body cap.
- `GET /v1/leads` and `GET /v1/leads/{leadId}` — require a server-derived actor with `leads:read`.
- `POST /v1/leads/{leadId}/qualify` — domain rules, `leads:qualify`, idempotency `409`.
- `POST /v1/opportunities` — staff create from a qualified Lead only (`opportunities:create`). Body is `leadId`; status is domain-owned (`open`). Idempotency `409`. Duplicate lead → `409 OPPORTUNITY_EXISTS`.
- `GET /v1/opportunities` and `GET /v1/opportunities/{opportunityId}` — require `opportunities:read`.
- Better Auth email/password sessions in schema `auth`. The mounted handler has sign-up disabled. Bearer tokens are signed session tokens. Cookie mutations require a trusted `Origin`. Staff `POST /api/auth/sign-out` invalidates the session for subsequent list/get/qualify (see postgres logout test).
- Capabilities live in `actor_capability`. The stable `actor_id` is an opaque Core API id mapped from issuer + Better Auth user id, not from email.
- `AUTH_MODE=test` is a separate HMAC signer. It starts only when `ALLOW_TEST_AUTH=1` and `NODE_ENV` is not `production`.
- Lead, Opportunity, idempotency, outbox, and audit rows share one transaction.
- `node src/dispatch-once.ts` claims pending outbox rows with `FOR UPDATE SKIP LOCKED`, delivers them to a local stdout sink, and records retry or poison. There is no broker and no long-running worker.
- Structured JSON request logs. No contact fields, cookies, tokens, or raw bodies.
- Public capture rate limit keys the direct TCP peer. `X-Forwarded-For` is used only when `TRUST_PROXY=1` and the peer is listed in `TRUSTED_PROXIES`, and then only the last hop. The limiter is in-process, bounded, and replaceable.

## Not implemented

- WWW, Portal, Admin, mobile, SketchUp, and the rest of CRM.
- Social login, MFA, password recovery, organizations, and SSO.
- A supervised outbox worker. Run `dispatch-once` when a local delivery pass is needed.
- OpenObserve, session replay, Cloudflare, Garage, signing, and payments.
- Distributed rate limiting. Do not treat the process limiter as an edge control.
- ZAP and OWASP Dependency-Check on this machine.

## Local run

PostgreSQL must already be running. This package does not install Docker.

```text
$env:LEAD_DATABASE_URL = 'postgres://USER@127.0.0.1:5432/forma_zieleni_dev'
$env:BETTER_AUTH_SECRET = '<32+ random characters>'
$env:BETTER_AUTH_URL = 'http://127.0.0.1:3000'
$env:TRUSTED_ORIGINS = 'http://127.0.0.1:3000'
node src/server.ts
```

The process listens on `127.0.0.1` and port `3000` unless `PORT` is set. Startup logs the port and auth mode. It does not print `LEAD_DATABASE_URL`.

Staff grants are rows in `identity_principal` and `actor_capability`. A valid session without a grant receives `403`.

`pnpm --filter @forma-zieleni/api typecheck` uses `--skipLibCheck` because the published Better Auth types reference `bun:sqlite`.

## Tests

`pnpm --filter @forma-zieleni/api test`

HTTP tests use an in-memory store. They are not persistence acceptance.
`src/postgres.integration.test.mjs` uses `LEAD_DATABASE_URL` when set. Otherwise it starts a temporary PostgreSQL cluster with `initdb`/`pg_ctl` from `psql` on `PATH`, or `FORMA_PG_BIN`, bound to `127.0.0.1` with trust auth, then stops it. If neither is available the test is skipped and persistence acceptance is not claimed.

When the test owns that cluster, it also runs `pg_dump` / `pg_restore` into a disposable `forma_restore` database and drops it. That is local evidence only. restic and pgBackRest remain later.

## Security status

Not security-accepted. Authentication, authorization, validation, idempotency, and the local restore check have tests. ZAP and Dependency-Check were not run. `pnpm audit --audit-level=moderate` on 2026-09-21 reported no known vulnerabilities.

Direct dependency added for identity: `better-auth` 1.7.5, MIT. It is the selected embedded session library. Domain grants are not stored as Better Auth roles.
