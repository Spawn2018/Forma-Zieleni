# Plant Atlas identity

Status: contracted for `ATLAS-PLANT-IDENTITY` / `FZ-REQ-ATLAS-003`.

## Domain

- A **PlantIdentity** is a Core API domain record with a scientific name,
  opaque id, and taxonomic **citations**.
- Citations reference authorities from `botanicalSourcePolicy()` (Kew POWO,
  World Flora Online). They are citations, not horticultural proof.
- Identity starts `draft` and may become `approved`. Public listing is a
  later slice (`ATLAS-PUBLIC-SURFACE`).

Machine checks: `createPlantIdentity()`, `approvePlantIdentity()`, and
`assertPlantIdentityHasNoCultivationClaim()` in `@forma-zieleni/domain`.

## Out of scope

- Public Atlas UI or search.
- Cultivation advice, hardiness guarantees, watering schedules.
- Live third-party scrapers or credentials.
- Treating a citation as product-truth care evidence.

## Relation to the provenance boundary

`ATLAS-PROVENANCE-BOUNDARY` / `FZ-REQ-ATLAS-002` keeps sources taxonomic.
This slice adds the identity record that may cite those sources without
turning them into cultivation claims.
