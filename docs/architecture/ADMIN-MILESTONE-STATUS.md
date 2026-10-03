# Admin milestone status

Status: contracted for `ADMIN-MILESTONE-STATUS` / `FZ-REQ-ADMIN-017`.

## Surface

`apps/admin` posts `POST /v1/milestones/{milestoneId}/status` with the
next status only. The allowed steps are planned → active → done. A
done milestone has no control. The list shows the Polish status label.

The portal keeps reading the same projection. After a staff advance it
shows the new status and still omits `updatedAt`.

## Out of scope

- Skipping a step or moving backward.
- Payment, signing, and price fields.
- A portal control that changes status.
- The decision log.
- DNS, Cloudflare, deploy, and live customer data.

## Relation

Builds on `ADMIN-MILESTONE-STAFF` and `PORTAL-MILESTONE-VIEW`. ADR-019
authorized continued safe product depth. DANGEROUS actions stay unchanged.
