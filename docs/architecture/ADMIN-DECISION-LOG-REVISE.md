# Admin decision log summary revision

Status: contracted for `ADMIN-DECISION-LOG-REVISE` / `FZ-REQ-ADMIN-020`.

## Surface

Staff can correct the summary of a decision or change-order entry.
`POST /v1/decision-log/{entryId}/summary` accepts `summary` only.
Kind, project, recording actor, related milestone, and created time
stay unchanged. The same summary is stored once.

`apps/admin` shows the current text in **Poprawiona treść** and posts
**Popraw treść**. A blank summary does not leave the panel.

The portal still does not read the decision log.

## Out of scope

- Changing kind, project, actor, or the related milestone.
- Payment, signing, price, and contact fields.
- A portal decision log.
- DNS, Cloudflare, deploy, and live customer data.
