# ADMIN-DECISION-LOG

Status: COMPLETE. Gate: REVIEW.

Staff list and create decision-log entries in `apps/admin` through Core
API `GET /v1/decision-log` and `POST /v1/decision-log`. There is no
second decision store.

## Projection

A row shows the summary, the kind (`decyzja` or `zmiana zakresu`), the
project id, and the related milestone id or “bez kamienia milowego”.
The recording actor id is accepted from Core API and is not rendered.
Empty, forbidden, and error states are visible.

## Create

The form sends `projectId`, `kind`, and `summary`. `relatedMilestoneId`
is sent only when the staff member fills it. The server records the
actor. The client does not send `recordedByActorId`.

A page that carries `payment`, `provider`, `signing`, `price`, `email`,
or `phone` is refused as an error.

## Authorization

Existing staff capabilities `milestones:read` and `milestones:create`.
The portal does not gain a decision log in this slice.
