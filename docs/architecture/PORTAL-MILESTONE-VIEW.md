# Portal milestone view

Status: contracted for `PORTAL-MILESTONE-VIEW` / `FZ-REQ-PORTAL-011`.

## Surface

`apps/portal` reads `GET /v1/portal/milestones` for the signed-in client.
A row is `id`, `projectId`, `title`, `status`, `dueAt`, and `createdAt`.
Visibility follows the owning project's `clientSubject`. A milestone does
not store a client subject of its own. `updatedAt`, payment, and signing
stay off the projection.

The route uses capability `milestones:portal-read`. Migration
`022_portal_milestone_projection` adds that capability to the actor
capability check. The portal does not create or edit a milestone, and it
does not show the decision log.

## Out of scope

- Creating or editing milestones from the portal.
- Decision-log entries, actor ids, and customer contact fields.
- Payment, signing, and price.
- DNS, Cloudflare, deploy, and live customer data.

## Relation

Builds on `ADMIN-MILESTONE-STAFF` and `PORTAL-SITE-VIEW`. ADR-019 authorized
continued safe product depth. DANGEROUS actions stay unchanged.
