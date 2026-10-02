# Capacity staff surface

Status: contracted for `CAPACITY-STAFF` / `FZ-REQ-CRM-CAPACITY-002`.

## Routes

- `POST /v1/capacity-windows` — staff create. Capability `capacity:write`.
  Idempotent. Body is actor id, kind (`consultation` or `start`), and a
  UTC range. Calendar providers and customer fields are rejected.
- `GET /v1/capacity-windows`, `GET /v1/capacity-windows/{windowId}` —
  staff read. Capability `capacity:read`.
- `POST /v1/capacity-decisions` — staff check whether a promised instant
  sits inside recorded windows. Capability `capacity:read`. A refusal is
  HTTP 200 with `ok: false`. This route does not write a promise.

Persistence: memory store + Postgres table `capacity_window` (migration
`020_capacity_window`) with capability CHECK for `capacity:read` and
`capacity:write`.

`apps/admin` lists windows, records a window, and shows the decision
sentence. It does not import `@forma-zieleni/domain`.

## Out of scope

- Google Calendar or any other calendar SaaS.
- Customer name, email, or phone on a capacity row.
- Public or portal read.
- A written consultation promise. The decision only reports the domain
  result.
- Spend, price, and live publication.

## Relation

Builds on `CAPACITY-DOMAIN` / `FZ-REQ-CRM-CAPACITY-001`. ADR-019
authorized this slice while Cloudflare, DNS, secrets, spend, live
charges, and deploy stay DANGEROUS.
