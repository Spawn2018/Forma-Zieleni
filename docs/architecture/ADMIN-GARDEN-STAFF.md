# ADMIN-GARDEN-STAFF

Status: COMPLETE. Gate: REVIEW.

Staff list and create gardens in `apps/admin` through Core API
`GET /v1/gardens` and `POST /v1/gardens`. There is no second garden store.

## Projection

A row shows the garden id, the project id, and `createdAt`. The client
subject is accepted from Core API and is not rendered. Empty, forbidden,
and error states are visible. The create form sends only `projectId`.
Delivery is still enforced by Core API.

A garden page that carries `twinDatabase`, `liveTwinUi`, `liveGarden`,
`sensorFeed`, `plants`, `advice`, or `xr` is refused as an error.

## Authorization

Existing staff capabilities `gardens:read` and `gardens:create`.
The portal projection is unchanged.
