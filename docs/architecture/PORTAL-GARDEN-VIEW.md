# Portal garden view

Status: contracted for `PORTAL-GARDEN-VIEW` / `FZ-REQ-PORTAL-009`.

## Surface

`apps/portal` reads `GET /v1/portal/gardens` for the signed-in client.
The row is `id`, `projectId`, and `createdAt`. A twin, sensor, live
garden, plant list, or advice field is treated as an error and is not
rendered.

The route, capability `gardens:portal-read`, and BOLA projection already
exist from `GARDENOS-HTTP`. This slice does not add a table or a write.

## Out of scope

- Creating or editing a garden from the portal.
- A digital twin, sensor feed, or invented live garden.
- Plant advice and XR.
- DNS, Cloudflare, deploy, and live customer data.

## Relation

Builds on `GARDENOS-HTTP` and `PORTAL-CONTRACT-VIEW`. ADR-019 authorized
continued safe product depth. DANGEROUS actions stay unchanged.
