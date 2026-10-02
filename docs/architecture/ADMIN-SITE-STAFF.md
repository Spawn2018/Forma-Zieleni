# ADMIN-SITE-STAFF

Status: COMPLETE. Gate: REVIEW.

Staff list site findings and record one synthetic observation in
`apps/admin` through Core API `GET /v1/site-intelligence` and
`POST /v1/site-intelligence`. There is no second site store.

## Projection

A row shows the record id, the project id, source stage `RULES`,
constraint codes, and opportunity codes. The client subject is accepted
from Core API and is not rendered. Empty, forbidden, and error states
are visible.

## Create

The form sends one observation: `projectId`, `observationId`, and a kind
from the closed set `slope`, `topography`, `soil`, `sun`, `aspect`,
`surroundings`, `climate`. The request marks it `normalized`, source
`normalized`, and `synthetic`. Constraint and opportunity codes stay
RULES output.

A page that carries `twinDatabase`, `aiConclusion`,
`thirdPartyCredentials`, `geoportal`, `credentials`, or
`inventedSiteFacts` is refused as an error.

## Authorization

Existing staff capabilities `siteintel:read` and `siteintel:create`.
The portal projection is unchanged.
