# Admin milestone title revision

Status: contracted for `ADMIN-MILESTONE-TITLE-REVISE` / `FZ-REQ-ADMIN-024`.

## Surface

Staff posts `{ "title": "..." }` to `POST /v1/milestones/{milestoneId}/title`.

The title is trimmed. A blank title and a title longer than 200 characters
are refused. Status and the due instant stay unchanged. The same title is
returned unchanged. Payment and signing fields are refused.

The portal reads the new title and still omits `updatedAt`. The portal
cannot rename a milestone.

## Out of scope

- A status change or a due-date change on this route.
- Payment, signing, and a decision-log write.
- DNS, Cloudflare, deploy, and live customer data.
