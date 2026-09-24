# Site Intelligence rules

Status: contracted for `SITEINTEL-RULES` / `FZ-REQ-SITEINTEL-002`.

## Rules step (binding)

Rules consume **normalized** site observations only.

- Input source must be `normalized`.
- AI must not invent site facts ahead of or instead of rules.
- Raw live third-party payloads are refused as rules input.
- Third-party credentials stay out of this contract.

Ordering remains DATA → RULES → DOMAIN → AI
(`docs/architecture/SITEINTEL-DATA-BOUNDARY.md`).

## Out of scope

- Site Intelligence product runtime / HTTP API.
- Twin database.
- Production third-party credentials.
- Live third-party dependency in critical UX.

Machine checks: `applySiteIntelligenceRules()` and
`siteIntelligenceRulesBoundary()` in `@forma-zieleni/domain`.
