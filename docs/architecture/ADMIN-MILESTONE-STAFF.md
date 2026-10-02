# ADMIN-MILESTONE-STAFF

Status: COMPLETE. Gate: REVIEW.

Staff list and create project milestones in `apps/admin` through Core API
`GET /v1/milestones` and `POST /v1/milestones`. There is no second
milestone store.

## Projection

A row shows the title, status, due date or “bez terminu”, and the
project id. Empty, forbidden, and error states are visible. The create
form sends only `projectId` and `title`.

A milestone page that carries `payment`, `signing`, `price`, or
`provider` is refused as an error. The decision log is not on this
screen.

## Authorization

Existing staff capabilities `milestones:read` and `milestones:create`.
The portal does not gain a milestone view in this slice.
