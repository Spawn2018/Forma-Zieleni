# Site Intelligence HTTP

Status: contracted for `SITEINTEL-HTTP` / `FZ-REQ-SITEINTEL-004`.

## Routes

- `POST /v1/site-intelligence` — staff create from a project plus synthetic
  normalized observations. Capability `siteintel:create`. Applies RULES then
  records DOMAIN findings. Rejects AI invent, credentials, twin, and crawl
  invent fields.
- `GET /v1/site-intelligence`, `GET /v1/site-intelligence/{recordId}` —
  staff read. Capability `siteintel:read`.
- `GET /v1/portal/site-intelligence`,
  `GET /v1/portal/site-intelligence/{recordId}` — portal projection via
  `projectSiteIntelligenceForPortal`. Capability `siteintel:portal-read`.

Persistence: memory store + Postgres table `site_intelligence` (migration
`017_site_intelligence`) with capability CHECK for `siteintel:*`.

## Out of scope

- Live Geoportal credentials or production crawl.
- AI conclusion stage.
- Twin database.
- Operator UI (later product surfaces).

## Relation

Builds on `SITEINTEL-DOMAIN` / `FZ-REQ-SITEINTEL-003` and
`GARDENOS-HTTP` pattern. Client apps must not import `@forma-zieleni/domain`;
they call Core API only. Does not authorize live third-party site data.
