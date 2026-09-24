# Site Intelligence data boundary

Status: contracted for `SITEINTEL-DATA-BOUNDARY` / `FZ-REQ-SITEINTEL-001`.

## Ordering (binding)

1. DATA
2. RULES
3. DOMAIN
4. AI

AI must not invent geospatial or site facts ahead of DATA/RULES/DOMAIN.

## Out of scope

- Live third-party dependency in critical UX.
- Twin database.
- Production third-party credentials.

Machine checks: `siteIntelligenceOrdering()` in `@forma-zieleni/domain`.

Next contracted step: `docs/architecture/SITEINTEL-RULES.md`
(`SITEINTEL-RULES` / `FZ-REQ-SITEINTEL-002`).
