# Site Intelligence domain records

Status: contracted for `SITEINTEL-DOMAIN` / `FZ-REQ-SITEINTEL-003`.

## Domain

- Core API owns **site constraint** and **site opportunity** records.
- Records are produced only from `RULES` output over normalized
  observations (`applySiteIntelligenceRules` →
  `recordSiteIntelligenceFromRules`).
- AI cannot author or invent those records.
- Client isolation follows the owning project's `clientSubject` (BOLA).
- Empty RULES findings are refused at the domain step; RULES must emit
  at least one observation-backed constraint or opportunity code.

Machine checks: `recordSiteIntelligenceFromRules()`,
`projectSiteIntelligenceForPortal()`,
`siteIntelligenceDomainBoundary()`, and
`assertSiteIntelligenceAiCannotWrite()` in `@forma-zieleni/domain`.

## Out of scope

- HTTP site API.
- Twin database or live third-party credentials.
- AI stage conclusions.
- Persistence tables and operator UI (later product surfaces).

## Relation to earlier steps

Ordering remains DATA → RULES → DOMAIN → AI
(`docs/architecture/SITEINTEL-DATA-BOUNDARY.md`).
`SITEINTEL-RULES` / `FZ-REQ-SITEINTEL-002` remains the rules contract.
This slice records domain state from that rules output; it does not
authorize a Site Intelligence product runtime.
