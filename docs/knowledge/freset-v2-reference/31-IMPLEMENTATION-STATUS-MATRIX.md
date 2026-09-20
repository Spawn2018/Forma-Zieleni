# Implementation Status Matrix — po F-RESET v2

<!-- FRESET-V2-SYNC-2026-09-20 -->
> **INFRA F-RESET:** Workers/D1/R2/Pages/wrangler, jeśli są wspomniane, są wyłącznie historycznym kandydatem; hosting/compute/DB/storage nie są wybrane.
> **Status: CANONICAL/CURRENT — 2026-09-20.** Jedno miejsce do sprawdzania różnicy między decyzją, dokumentacją, implementacją, testem i produkcją.

| Obszar | Decided | Documented | Implemented | Tested | Production verified | Następny gate |
|---|---:|---:|---:|---:|---:|---|
| F-RESET A→B→C→D | YES | YES | n/a | audit PASS | n/a | utrzymać kolejność |
| Cloudflare-only ingress/private origin | YES | YES | NO | NO | NO | Gate A |
| Hosting/compute/DB/storage | OPEN | YES | NO | NO | NO | lab + ADR |
| dev/staging/prod separation | YES | YES | NO | NO | NO | Gate A |
| backup + restore | YES | YES | NO | NO | NO | real restore |
| monitoring/observability/audit | YES | YES | PARTIAL SCHEMA | NO | NO | Gate A/C |
| security matrix | YES | YES | NO | NO | NO | Gate A |
| OpenAPI 3.0.4 | YES | YES | YES: 44 ops/12 schemas | VALIDATED | NO | Gate B |
| generated TS typed client | YES | YES | PARTIAL SCAFFOLD | NO | NO | generator + CI |
| SketchUp API adapter | YES | YES | PARTIAL SCAFFOLD | NO | NO | contract coverage |
| Auth | YES | YES | DB/API CONTRACT PARTIAL | NO | NO | Gate C |
| CRM | YES | YES | DB/API CONTRACT PARTIAL | NO | NO | Gate C |
| Sales | YES | YES | DB/API CONTRACT PARTIAL | NO | NO | Gate C |
| Capacity | YES | YES | DB/API CONTRACT PARTIAL | NO | NO | Gate C |
| Projects | YES | YES | DB/API CONTRACT PARTIAL | NO | NO | Gate C |
| Offers | YES | YES | DB/API CONTRACT PARTIAL | NO | NO | Gate C |
| Payments/webhooks | YES | YES | PARTIAL LEGACY | NO | NO | signed/idempotent/replay tests |
| Files/private access | YES | YES | PARTIAL LEGACY | NO | NO | storage decision + authz |
| Events/outbox | YES | YES | SCHEMA PARTIAL | NO | NO | worker + transactional tests |
| Automation | YES | YES | PARTIAL LEGACY | NO | NO | rule engine/actions/audit |
| Site Intelligence/Data Layer | YES | YES | NO | NO | NO | after Core fundamentals |
| Plant Knowledge Graph | YES | YES | NO | NO | NO | after Core fundamentals |
| Google multi-account OAuth | YES | YES | CONNECTOR DEV CONTEXT ONLY | NO | NO | production OAuth adapter |
| Meta adapters | YES | YES | NO | NO | NO | Events/Automation |
| WWW Sales Application | YES | YES | PROTOTYPES/LEGACY ONLY | NO | NO | Gate C then D |
| Portal | YES | YES | PROTOTYPES/LEGACY ONLY | NO | NO | Gate C then D |
| Mobile | YES | YES | PROTOTYPES/LEGACY APK/CONCEPT | NO | NO | Gate C then D |
| SketchUp product workflow | YES | YES | PARTIAL PLUGIN | NO | NO | Gate C then D |
| Garden OS | YES | YES | CONCEPT/SCHEMA PARTIAL | NO | NO | Gate C then D |
| AI layer/FZ MCP | YES | YES | NO | NO | NO | after reliable domain/data |
| XR | DEFERRED | YES | NO | NO | NO | evidence required |

## Reguła statusu
`YES` w kolumnie Documented nigdy nie oznacza Implemented. `PARTIAL` nie zamyka gate. Produkcja może dostać `YES` wyłącznie po sprawdzeniu rzeczywistego środowiska, nie na podstawie pliku konfiguracyjnego lub deklaracji.
