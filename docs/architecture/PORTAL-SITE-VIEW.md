# Portal site view

Status: contracted for `PORTAL-SITE-VIEW` / `FZ-REQ-PORTAL-010`.

## Surface

`apps/portal` reads `GET /v1/portal/site-intelligence` for the signed-in
client. A row is `id`, `projectId`, observation ids, constraint codes,
opportunity codes, and `createdAt`. A finding may carry only `id` and
`code`. Credentials, a twin, a geoportal claim, or an invented conclusion
is an error and is not rendered.

The route and capability `siteintel:portal-read` already exist from
`SITEINTEL-HTTP`. This slice does not add a table or a write.

## Out of scope

- Creating or editing findings from the portal.
- Third-party credentials and live map calls.
- An invented site conclusion.
- DNS, Cloudflare, deploy, and live customer data.

## Relation

Builds on `SITEINTEL-HTTP` and `PORTAL-GARDEN-VIEW`. ADR-019 authorized
continued safe product depth. DANGEROUS actions stay unchanged.
