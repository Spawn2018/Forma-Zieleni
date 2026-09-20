# Decision Register — Forma Zieleni

<!-- FRESET-V2-SYNC-2026-09-20 -->
> **F-RESET v2 — 2026-09-20 · Status: CANONICAL/CURRENT.** Aktywny dokument sterujący lub kontrolny f-reset. Źródła nadrzędne: `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md`, `30-F-RESET-EXECUTION-2026-09-20.md`, `31-IMPLEMENTATION-STATUS-MATRIX.md` oraz `contracts/openapi.yaml` dla API. Starsze F0–F33 i wskazania konkretnego hostingu są INPUT/LEGACY, nie kolejnością ani wyborem infrastruktury.

| ID | Decyzja | Status | Implementacja / dokument |
|---|---|---|---|
| ADR-001 | F-RESET: A→B→C→D; legacy F0–F33 nie steruje kolejnością | ACCEPTED | `00-MASTER-PLAN`, `23-*` |
| ADR-002 | OpenAPI 3.0.x first; aktualnie 3.0.4 | ACCEPTED | `contracts/openapi.yaml` |
| ADR-003 | Jeden TS typed client + Ruby SketchUp adapter | ACCEPTED | `clients/` |
| ADR-004 | Modular monolith/API-first | ACCEPTED | Core Domain |
| ADR-005 | Cloudflare-only public ingress; private origin via Tunnel preferowany | ACCEPTED | Gate A; infra TBD |
| ADR-006 | Hosting jeszcze nie wybrany; testujemy darmowe/niezawodne opcje | OPEN | ETAP A lab |
| ADR-007 | Event-driven core + transactional outbox | ACCEPTED | DB/Core |
| ADR-008 | Site Intelligence + Data Layer | ACCEPTED | po Core fundamentals |
| ADR-009 | Plant Knowledge Graph; AI not source of truth | ACCEPTED | po Core fundamentals |
| ADR-010 | CRM = Revenue OS; Capacity w sprzedaży | ACCEPTED | ETAP C |
| ADR-011 | Offers first-class; signed/idempotent payment webhooks | ACCEPTED | ETAP C |
| ADR-012 | Private versioned files; no guessable public URLs | ACCEPTED | ETAP C |
| ADR-013 | OpenTelemetry-compatible observability from day 1 | ACCEPTED | Gate A/Core |
| ADR-014 | OWASP API matrix incl. BOLA/BFLA/BOPLA/SSRF/resource abuse | ACCEPTED | Gate A/B/C |
| ADR-015 | GitHub/OpenAPI/Core = source of truth for AI tools | ACCEPTED | `AGENTS.md`, rules |
| ADR-016 | MCP READ separated from ACTIONS | ACCEPTED | later integration layer |
| ADR-017 | Grok subscription/UI not automation backend; official API for automation | ACCEPTED | AI orchestration |
| ADR-018 | SketchUp stable IDs/revisions; V-Ray batch/script first | ACCEPTED | Studio integration |
| ADR-019 | Google/Meta are adapters, not source of truth | ACCEPTED | Events/Automation |
| ADR-020 | Sebastian Google account test-only; Agnieszka prod OAuth; multi-account-ready | ACCEPTED | Google integration |
| ADR-021 | WWW = guided sales app; conversion measured end-to-end | ACCEPTED | ETAP D |
| ADR-022 | Garden OS = digital twin; mobile != portal clone | ACCEPTED | ETAP D |
| ADR-023 | XR/community/marketplace/microservices deferred | ACCEPTED | roadmap |
| ADR-024 | Documentation updated with every project change | ACCEPTED | repo workflow |
| ADR-025 | Workers/D1/R2/Pages/Access/wrangler w starszych docs = historyczny kandydat, nie wybrany stack | ACCEPTED | `28-ZERO-OMISSION-AUDIT`, active-doc INFRA F-RESET notices, Cursor rules |
| ADR-026 | F-RESET v2: każdy dokument ma jawny status; jedna macierz implementation status; legacy requirements zachowane bez sterowania kolejnością | ACCEPTED | `30-F-RESET-EXECUTION-2026-09-20`, `31-IMPLEMENTATION-STATUS-MATRIX` |
