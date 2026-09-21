# Architecture Decision Log (ADR index)

Indeks **formalnych ADR** Forma Zieleni (historia decyzji).

Format: krótkie ADR-y. Status: `Proposed` | `Accepted` | `Superseded` | `Rejected`.

## Decision source roles (do not confuse)

| Document | Role |
|----------|------|
| **This file (`DECISIONS.md`)** | Formal ADR **history** — traceable architecture decisions |
| [`../knowledge/POST-V2-DECISIONS.md`](../knowledge/POST-V2-DECISIONS.md) | **Current override / decision ledger** for decisions after the F-RESET v2 baseline |

**Rule:** latest explicit owner decision wins; history remains traceable.

These are **not** two copies of the same source of truth. When they conflict, apply the latest explicit owner decision (typically recorded in the post-V2 ledger and/or a newer ADR), then update this ADR log so history stays coherent.

Binding architecture shape: [`CURRENT-ARCHITECTURE.md`](./CURRENT-ARCHITECTURE.md).

---

## ADR-001 — Monorepo pnpm + Turborepo

| Pole | Wartość |
|------|---------|
| Data | 2026-09-20 |
| Status | Accepted |
| Decyzja | Repozytorium jest monorepo zarządzanym przez pnpm workspaces i Turborepo. |
| Kontekst | Wiele aplikacji (web, portal, admin, api) i pakietów współdzielonych wymaga jednego repo i wspólnego pipeline’u. |
| Konsekwencje | Wspólny lockfile, skrypty root (`dev`, `build`, `lint`, `typecheck`, `test`), pakiety w `packages/*`. |

---

## ADR-002 — Modular monolith + API-first

| Pole | Wartość |
|------|---------|
| Data | 2026-09-20 |
| Status | Accepted |
| Decyzja | Backend jako modular monolith; kontrakt zewnętrzny API-first (OpenAPI 3.0.x). Core API + baza są źródłem prawdy. |
| Kontekst | Potrzeba wielu klientów i integracji bez przedwczesnego microservices. |
| Konsekwencje | Moduły domenowe wewnątrz `apps/api`; brak `services/*` w workspace na start; wydzielanie serwisów tylko przy twardej potrzebie. |

---

## ADR-003 — Oddzielne aplikacje web / portal / admin

| Pole | Wartość |
|------|---------|
| Data | 2026-09-20 |
| Status | Accepted |
| Decyzja | `apps/web`, `apps/portal`, `apps/admin` są osobnymi aplikacjami. `apps/mobile` dodamy później. |
| Kontekst | Różne konteksty zaufania, UX i cyklu wydawniczego (publiczny marketing vs klient vs personel). |
| Konsekwencje | Osobne deploye frontów możliwe; wspólne UI/types/client przez pakiety; wspólne Core API. |

---

## ADR-004 — Event-driven core + transactional outbox

| Pole | Wartość |
|------|---------|
| Data | 2026-09-20 |
| Status | Accepted |
| Decyzja | Rdzeń domenowy emituje eventy; publikacja przez transactional outbox. |
| Kontekst | Automatyzacje, integracje i projekcje muszą być wiarygodne przy awariach procesu. |
| Konsekwencje | Konsumenci idempotentni; brak bezpośredniego „fire-and-forget” jako jedynej ścieżki spójności. |

---

## ADR-005 — DATA → RULES → DOMAIN → AI

| Pole | Wartość |
|------|---------|
| Data | 2026-09-20 |
| Status | Accepted |
| Decyzja | AI nie jest źródłem prawdy. Obowiązuje hierarchia DATA → RULES → DOMAIN → AI. |
| Kontekst | Funkcje AI (Site Intelligence, asysta ofertowa itd.) nie mogą tworzyć kanonicznego stanu z pominięciem reguł. |
| Konsekwencje | Propozycje AI przechodzą przez walidację i reguły domenowe; audyt decyzji. |

---

## ADR-006 — Bezpieczeństwo: server-side authz i private ingress docelowo

| Pole | Wartość |
|------|---------|
| Data | 2026-09-20 |
| Status | Accepted |
| Decyzja | Autoryzacja wyłącznie serwerowa (AUTH/BOLA/BFLA/BOPLA). Docelowo Cloudflare jako jedyny publiczny ingress i private origin. Legacy CT8 nie jest jeszcze private origin i nie jest zmieniane w tym etapie. |
| Kontekst | Platforma przetwarza dane klientów, pliki, płatności i webhooki. |
| Konsekwencje | Checklist bezpieczeństwa dla endpointów; sekrety poza git; brak założenia, że obecny CT8 jest już izolowanym originem. |

---

## ADR-007 — Brak wyboru hostingu / DB / storage na etapie fundamentu

| Pole | Wartość |
|------|---------|
| Data | 2026-09-20 |
| Status | Accepted |
| Decyzja | Nie wybieramy jeszcze hostingu origin, providera bazy, storage ani konkretnej infrastruktury produkcyjnej. Nie instalujemy Dockera jako wymogu. Nie zakładamy Cloudflare Workers / D1 / R2. |
| Kontekst | Najpierw architektura i kontrakt; unikamy lock-inu przed wymaganiami. |
| Konsekwencje | `infra/` zawiera tylko opisy i placeholdery kierunkowe; implementacja app bez frameworków na tym etapie. |

---

## ADR-008 — Workspace bez services/*

| Pole | Wartość |
|------|---------|
| Data | 2026-09-20 |
| Status | Accepted |
| Decyzja | Usunięto `services/*` z `pnpm-workspace.yaml`. |
| Kontekst | Modular monolith w `apps/api` wystarcza na start; osobne serwisy wprowadzałyby przedwczesną złożoność. |
| Konsekwencje | Automatyzacje i integracje startują jako moduły / workery w granicach monorepo API, nie jako osobny glob `services/*`. |

---

## ADR-009 — Single binding architecture entrypoint

| Pole | Wartość |
|------|---------|
| Data | 2026-09-20 |
| Status | Accepted |
| Decyzja | `docs/architecture/CURRENT-ARCHITECTURE.md` is the sole binding/current architecture entrypoint. `ARCHITECTURE.md` is superseded as binding and retained only as redirect/provenance after merge. |
| Kontekst | Documentation consistency-fix: two architecture files competed as “current”. |
| Konsekwencje | Active docs link to CURRENT-ARCHITECTURE; narrative detail merged there; agents must not treat ARCHITECTURE.md as Canon. |

---

## ADR-010 — Grok Bot collaboration model (manual handoff)

| Pole | Wartość |
|------|---------|
| Data | 2026-09-20 |
| Status | Accepted |
| Decyzja | Encode verified Cursor OS ↔ Grok Bot roles in `docs/cursor-os/GROK-BOT-OPERATING-MODEL.md`. Manual owner handoff is the current Cursor→Grok path. Custom bridges NOT APPROVED. Cursor SDK is not a Grok Bot API. |
| Kontekst | Capability discovery: Grok→CloudAgent and Grok↔Grok available; Cursor local→named Grok Bot programmatic invoke+return not available. |
| Konsekwencje | Use skill `grok-research-handoff` for structured briefs; Grok memory never overrides Canon; CloudAgent from Grok must not silently override main-only; SDK/Orchestrate/Supermemory/Continual Learning/custom bridge require DECISION. |

---

## ADR-011 — Local Autonomous Session Controller bootstrap

| Pole | Wartość |
|------|---------|
| Data | 2026-09-20 |
| Status | Accepted (explicit Owner bootstrap authorization) |
| Decyzja | Local Node 24 standard-library controller, repo-scoped atomic local JSON checkpoints, bounded capability allowlist and advisory OpenAI decision integration. No agent framework dependency. |
| Kontekst | Owner requested auditable resumable sessions without manual task transfer; broad coding execution needs a separately verified sandbox boundary. |
| Konsekwencje | Controller alone owns sessions; Cursor implements bounded slices. Existing binding loop is preserved. DECISION-GATES is the sole classifier. Grok is optional with local adversarial fallback. Initial capability is deterministic repo audit; autonomous coding adapters remain blocked. No bootstrap push or production actions. |
| Supersedes | ADR-010 generic DECISION wording and any whole-session Cursor coordinator wording; manual Grok provenance and protected-action restrictions remain. |
| Alternatives | Existing editor CLI execution was not adopted without verified sandbox/structured return; SDK/framework wrappers would add unjustified capability/dependency surface. |
| Contract | `docs/cursor-os/AUTONOMOUS-SESSION-CONTROLLER.md` |

## ADR-012 — Owner-in-loop controller and current lead contract

| Pole | Wartość |
|------|---------|
| Data | 2026-09-21 |
| Status | Accepted |
| Decyzja | Session-controller `choose-audit` is OWNER-DECISION resolved by `DECISION FZ-###: OPTION X`. OpenAI adapter stays unused. Current Core API source of truth for the first vertical is `contracts/openapi.json` (OpenAPI 3.0.4 lead qualification). |
| Kontekst | ChatGPT is out of the runtime loop. Product construction continues with durable contracts while Gate A stack choices remain open. |
| Konsekwencje | Missing Owner replies block only the dependent slice. HTTP/DB/UI runtimes wait for FZ-A1–A7. |

## Szablon kolejnego ADR

```markdown
## ADR-00X — Tytuł

| Pole | Wartość |
|------|---------|
| Data | YYYY-MM-DD |
| Status | Proposed |
| Decyzja | … |
| Kontekst | … |
| Konsekwencje | … |
```
