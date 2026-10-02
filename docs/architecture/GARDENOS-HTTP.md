# Garden OS HTTP

Status: contracted for `GARDENOS-HTTP` / `FZ-REQ-GARDENOS-003`.

## Routes

- `POST /v1/projects/{projectId}/deliver` — staff marks a planned project
  delivered (empty body). Capability `projects:create`.
- `POST /v1/gardens` — staff create from a delivered project.
  Capability `gardens:create`.
- `GET /v1/gardens`, `GET /v1/gardens/{gardenId}` — staff read.
  Capability `gardens:read`.
- `GET /v1/portal/gardens`, `GET /v1/portal/gardens/{gardenId}` —
  portal projection via `projectGardenForPortal`. Capability
  `gardens:portal-read`.

Persistence: memory store + Postgres table `garden` (migration
`016_garden_domain`) with capability CHECK for `gardens:*`.

## Out of scope

- Twin database, sensor feed, XR, plant advice, Garden OS UI.
- Live Geoportal or production deploy.

## Relation

Builds on `GARDENOS-DOMAIN` / `FZ-REQ-GARDENOS-002`. Does not authorize
a digital-twin runtime.
