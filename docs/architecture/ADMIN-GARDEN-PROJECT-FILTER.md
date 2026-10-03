# Staff garden project filter

Status: contracted for `ADMIN-GARDEN-PROJECT-FILTER` / `FZ-REQ-ADMIN-035`.

## Surface

Staff filter the garden list by an opaque project id. An empty filter
loads the full list. A valid id is sent as `projectId` on the existing
`GET /v1/gardens` query.

An invalid id does not call Core API. The screen says the id is invalid
and does not show a garden row.

## Out of scope

- A new garden field or a second garden store.
- Filtering site observations.
- Payment, signing, and a live garden invent.
- DNS, Cloudflare, deploy, and live customer data.
