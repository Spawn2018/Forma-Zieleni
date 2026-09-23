# Garden OS domain record

Status: contracted for `GARDENOS-DOMAIN` / `FZ-REQ-GARDENOS-002`.

## Domain

- A **Garden** record is owned by Core API domain state.
- It links only to a Project whose status is `delivered`.
- Client isolation matches the project's `clientSubject` (BOLA).
- Portal may later project the linked garden; a missing garden is empty,
  not an invented live garden.

Machine checks: `createGarden()`, `deliverProject()`,
`projectGardenForPortal()`, and `assertGardenHasNoLiveInvent()` in
`@forma-zieleni/domain`.

## Out of scope

- Twin database, sensor ingestion, live garden invent, or Garden OS UI.
- HTTP garden routes and persistence tables (later when a product surface
  needs them).
- Globalizing one customer's garden into product-wide rules
  (`SCOPE_PROMOTION_REFUSED` in FZ-CIS).

## Relation to the boundary slice

`GARDENOS-RELATION-BOUNDARY` / `FZ-REQ-GARDENOS-001` remains the relation
boundary. This slice adds the domain garden record after delivery; it does
not authorize a digital-twin runtime.
