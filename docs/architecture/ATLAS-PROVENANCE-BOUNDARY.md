# Plant Atlas provenance boundary

Status: contracted for `ATLAS-PROVENANCE-BOUNDARY` / `FZ-REQ-ATLAS-002`.

## Source of truth

- Core API / domain owns plant identity and provenance records when they exist.
- Botanical sources (for example Kew POWO, World Flora Online) are
  **taxonomic authorities**. They name plants. They do not prove horticultural
  practice, hardiness, watering, or care advice as product truth.
- `botanicalSourcePolicy()` in `@forma-zieleni/domain` is the machine-readable
  list of those authorities for this tree.

## Out of scope for this slice

- Atlas runtime UI, search, or public plant pages.
- Invented plant advice derived from taxonomic lists.
- Live third-party credentials or production scrapers.

## Security

Do not present taxonomic authority output as guaranteed garden advice.
Runtime atlas product work is a later slice after this boundary stays COMPLETE.
