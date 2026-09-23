# Plant Atlas public surface

Status: contracted for `ATLAS-PUBLIC-SURFACE` / `FZ-REQ-ATLAS-004`.

## Projection

- Public responses list **approved** plant identities only.
- Each entry cites taxonomic authorities (url + note). Citations are not
  cultivation advice.
- Draft / unpublished identities stay off the public response (`null` /
  omitted from the list).

Machine checks: `projectPlantForPublic()` and `listPublicPlants()` in
`@forma-zieleni/domain`.

## Out of scope

- Full WWW Atlas UI, search, or SEO pages (may consume this projection later).
- Cultivation facts as product truth.
- Live third-party scrapers.

## Relation

Depends on `ATLAS-PLANT-IDENTITY`. Provenance boundary rules still apply.
