# Plant Atlas WWW surface

Status: contracted for `ATLAS-WWW-SURFACE` / `FZ-REQ-ATLAS-005`.

## Surface

- Public WWW route lists **approved** plant identities from
  `listPublicPlants` / `projectPlantForPublic`.
- Each entry shows the scientific name and taxonomic citation links
  (authority url + note). Citations are not cultivation advice.
- When the catalog is empty, the page states that honestly. It does not
  invent plants, awards, or SEO filler.

Machine checks: `apps/web/app/atlas-projection.ts` plus route tests.

## Out of scope

- Cultivation, hardiness, watering, or care claims as product truth.
- Live third-party scrapers or botanical API credentials.
- Full Atlas search, SEO program, or CMS-authored plant essays.
- Admin plant editing UI.

## Relation

Depends on `ATLAS-PUBLIC-SURFACE`. Provenance and identity rules still
apply. AI cannot invent plant facts for this page.
