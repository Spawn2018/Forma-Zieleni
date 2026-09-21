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
- FZ-A2 OPTION F, `API=Hono`. WWW, Portal and Admin are separate React
  Router Framework Mode applications. Not scaffolded in the recording
  slice.
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

What is still not done: app config, CI deploy, Hono skeleton,
migrations, object-storage adapter, auth runtime, restore test,
monitoring process, webhook tests, load baseline, private-origin
validation, ZAP, Dependency-Check.

FZ-SIGN-1 remains a later contract-lifecycle boundary. It is not an
eighth Gate A decision. No signing provider was selected or integrated.

## Gate B API contract

REVIEW progress, not a complete runtime:

- Current OpenAPI 3.0.4: `contracts/openapi.json`
- Errors, `/v1`, cursor pagination, filter, sort, idempotency: present
  for the lead slice. `qualifyLead` declares 409 Conflict. Public
  `LeadCapture.source` is `PublicLeadSource` (`www`, `other`).
- Typed client surfaces for web/portal/admin/mobile:
  `packages/api-client` paths only, no HTTP transport yet
- Contract and breaking-change tests: `contracts/openapi.test.mjs`
- Generated runtime clients, CI publish and SketchUp Ruby client remain
  later adapter work. The framework choice no longer blocks them; the
  implementation does.

## Gate C core domain

REVIEW progress for lead rules only:

- `packages/domain` create/qualify invariants
- Persistence, outbox, Identity/Auth runtime and Admin CRM visibility
  are the next implementation work, defined in
  [NEXT-SLICE-LEAD-VERTICAL.md](./NEXT-SLICE-LEAD-VERTICAL.md). They are
  not done.

## Gate D product surfaces

Not started:

- WWW, Portal and Admin stay unbuilt. Their framework is selected.
- The lead vertical does not include those surfaces.
- Mobile still waits on a later product slice.
- No generic UI was added.

## Next executable slice

[NEXT-SLICE-LEAD-VERTICAL.md](./NEXT-SLICE-LEAD-VERTICAL.md): public
lead capture, validation, PostgreSQL/Kysely persistence, authorized CRM
list/get/qualify, audit/observability and tests. Not the whole CRM.
Not started by this checkpoint.
