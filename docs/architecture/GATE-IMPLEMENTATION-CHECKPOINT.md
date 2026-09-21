# Gate A–D implementation checkpoint — 2026-09-21

Dependent implementation is paused where Owner decisions are missing. Independent contract and domain work continued. S2.5 CodeRabbit remediations for public lead capture, qualifyLead 409, validation types, quota-log path, native-test pwsh discovery and resumable Owner decisions are a local REVIEW slice. Eight native Windows process tests remain skipped until `pwsh.exe` is on PATH or `NATIVE_TEST_POWERSHELL` is set.

## Gate A implementation

OWNER-DECISION. FZ-A1–A7 are open in [OWNER-DECISION-PACKETS-GATE-A.md](./OWNER-DECISION-PACKETS-GATE-A.md). Packets were refined 2026-09-21 into coherent API+WWW+Portal+Admin bundles; FZ-A5 was expanded then delta-amended (Casdoor added to A5-D; SuperTokens, Authelia and Kanidm excluded). The same day a landscape-delta expanded FZ-A1 (compute vs DEPLOY=systemd|compose|coolify|dokploy|caprover), FZ-A2 (TanStack Start RC + React Router Framework Mode bundles), FZ-A3 (first-class Kysely), FZ-A4 (MinIO CE withdrawn; Garage/RustFS/local/managed S3), FZ-A6 (obs/secrets/backup split), and FZ-A7 (Cloudflare-required; Pangolin/FRP excluded as sole public ingress). No option was selected or implemented. No hosting, database, ORM, storage, auth library, observability vendor or Cloudflare mutation was executed.

Local reproducible app config, CI deploy, API skeleton, migrations, object storage, auth runtime, restore test, monitoring, webhook tests, load baseline and private-origin validation remain unstarted.

## Gate B API contract

REVIEW progress, not a complete runtime:

- Current OpenAPI 3.0.4: `contracts/openapi.json`
- Errors, `/v1`, cursor pagination, filter, sort, idempotency: present for the lead slice. `qualifyLead` declares 409 Conflict. Public `LeadCapture.source` is `PublicLeadSource` (`www`, `other`).
- Typed client surfaces for web/portal/admin/mobile: `packages/api-client` paths only, no HTTP transport
- Contract and breaking-change tests: `contracts/openapi.test.mjs`
- Generated runtime clients, CI publish and SketchUp Ruby client: blocked on FZ-A2 and later adapter work

## Gate C core domain

REVIEW progress for lead rules only:

- `packages/domain` create/qualify invariants
- Persistence, outbox, CRM visibility in Admin, Identity/Auth runtime: blocked on FZ-A3 and FZ-A5

## Gate D product surfaces

OWNER-DECISION / blocked:

- WWW, Portal, Admin/CRM UI and Mobile require FZ-A2 and FZ-A5
- No generic UI was added
- Visual/UX implementation waits for the application framework and supplied mockups
