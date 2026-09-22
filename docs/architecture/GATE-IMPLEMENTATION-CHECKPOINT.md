# Gate A–D implementation checkpoint — 2026-09-21

Gate A **architecture selection** is DECIDED. Gate A **implementation and
security acceptance** are not complete. FZ-SIGN-1 provider remains
UNDECIDED.

Eight native Windows process tests remain skipped until `pwsh.exe` is
on PATH or `NATIVE_TEST_POWERSHELL` is set. That is skipped, not pass.

## Gate A — architecture decided

Owner decisions are recorded in
[OWNER-DECISION-PACKETS-GATE-A.md](./OWNER-DECISION-PACKETS-GATE-A.md)
and ADR-014. Binding shape:
[CURRENT-ARCHITECTURE.md](./CURRENT-ARCHITECTURE.md).

- FZ-A1 OPTION A, `DEPLOY=compose`. Local Windows now. Docker Compose
  is the later Linux staging model. No host was created. Production
  compute is still later.
- FZ-A2 OPTION F, `API=Hono`. `apps/api` is the Hono lead vertical.
  WWW, Portal and Admin are not built.
- FZ-A3 OPTION E. PostgreSQL + Kysely. No ORM.
- FZ-A4 OPTION A, `LATER=garage`. Local private files now. Garage is a
  staging direction, not final production storage.
- FZ-A5 OPTION E, `EMBED=B`. Better Auth now. No dedicated IdP. Domain
  authorization stays in Core API.
- FZ-A6 OPTION B. `OBS=openobserve`, `SECRETS=sops-age`,
  `BACKUP=restic`, `PG=pgbackrest`. OpenObserve and pgBackRest are not
  stood up on Windows for this decision. Session replay stays off.
- FZ-A7 OPTION A, `OVERLAY=none`. Localhost now. Cloudflare Tunnel
  later. No DNS or Cloudflare change was made.

The option research in the packet stays as evidence. Rejected and
unselected alternatives were not deleted.

What is still not done: CI deploy, object-storage adapter, OpenObserve, webhook tests, load baseline, private-origin validation, ZAP, Dependency-Check, a supervised outbox worker, and off-site backup. The lead API now has Better Auth sessions, Core API grants, `GET /v1/ready`, a one-shot outbox dispatcher, and a local PostgreSQL dump/restore test. That is not security acceptance.

FZ-SIGN-1 remains a later contract-lifecycle boundary. It is not an
eighth Gate A decision. No signing provider was selected or integrated.

## Gate B API contract

REVIEW progress, not a complete runtime:

- Current OpenAPI 3.0.4: `contracts/openapi.json`
- Errors, `/v1`, cursor pagination, filter, sort, idempotency: present
  for the lead slice and for staff Opportunity create/list/get.
  `qualifyLead` and `createOpportunity` declare 409 Conflict. Public
  `LeadCapture.source` is `PublicLeadSource` (`www`, `other`).
  Opportunity create accepts only `leadId`; status is domain-owned.
- Typed client surfaces for web/portal/admin/mobile:
  `packages/api-client` paths only. The lead/opportunity HTTP server is
  `apps/api`. This package is not a generated transport client.
- Contract and breaking-change tests: `contracts/openapi.test.mjs`
- Generated runtime clients, CI publish and SketchUp Ruby client remain
  later adapter work. The framework choice no longer blocks them; the
  implementation does.

## Gate C core domain

REVIEW progress for lead and opportunity rules:

- `packages/domain` create/qualify lead invariants and
  `createOpportunity` from a qualified Lead
- Persistence, outbox dispatch, and the lead qualify/list/get plus
  opportunity create/list/get runtime are in `apps/api`. Better Auth
  identifies the session. Capability grants stay in Core API tables.
  Admin CRM UI is not done.

## Gate D product surfaces

Review progress:

- WWW (`apps/web`) is a React Router Framework Mode shell with
  published-content projection.
- Portal (`apps/portal`) is a React Router Framework Mode signed-out
  shell. Client auth and project projections are not built.
- Admin stays a directory skeleton.
- Mobile still waits on a later product slice.
- No generic UI was added.

## Lead vertical

[NEXT-SLICE-LEAD-VERTICAL.md](./NEXT-SLICE-LEAD-VERTICAL.md) is
implemented in `apps/api`: public capture, validation, PostgreSQL/Kysely
persistence, staff list/get/qualify, Better Auth sessions with Core API
grants, outbox dispatch, audit, readiness, and tests. Not the
whole CRM. ZAP, Dependency-Check, a supervised worker, and off-site
backup are not done. Architecture selection is still not
security acceptance.

CMS / public content is DECIDED (FZ-CMS-1 option B) and not
CMS-ACCEPT. The CMS/Search graph in
[`NEXT-SLICES-CMS.md`](./NEXT-SLICES-CMS.md) is acceptance history after
`RETURN-ROADMAP`. Ordinary READY work continues on
[`NEXT-SLICES-MAIN.md`](./NEXT-SLICES-MAIN.md): `LEAD-SEC-SESSION`,
`LEAD-OUTBOX-SUPERVISOR`, `PORTAL-APP`, and `CRM-OPPORTUNITY-CONTRACT`
are COMPLETE. Next READY is `LEAD-ZAP-BASELINE`. The isolated lab in
`labs/fz-cms-1`
remains evidence, not acceptance. Search Intelligence architecture is
[`FZ-SEARCH-1.md`](./FZ-SEARCH-1.md). Training-crawler production policy
stays OPEN. Lead remains not security-accepted.
