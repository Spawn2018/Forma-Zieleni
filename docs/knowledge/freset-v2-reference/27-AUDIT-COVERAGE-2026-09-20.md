# Deep Audit & Coverage — 2026-09-20

<!-- FRESET-V2-SYNC-2026-09-20 -->
> **F-RESET v2 — 2026-09-20 · Status: CANONICAL/CURRENT.** Aktywny dokument sterujący lub kontrolny f-reset. Źródła nadrzędne: `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md`, `30-F-RESET-EXECUTION-2026-09-20.md`, `31-IMPLEMENTATION-STATUS-MATRIX.md` oraz `contracts/openapi.yaml` dla API. Starsze F0–F33 i wskazania konkretnego hostingu są INPUT/LEGACY, nie kolejnością ani wyborem infrastruktury.

**Wynik:** ustalenia z dwóch czatów zostały skonsolidowane i wpisane do dokumentacji kanonicznej. Audyt rozróżnia **udokumentowane** od **faktycznie zaimplementowane** — nie oznaczamy planu jako wykonanego, jeśli istnieje tylko spec/schema.

## Macierz kompletności

| Ustalenie | Stan | Dowód w repo | Luka / następny gate |
|---|---|---|---|
| F-RESET replaces legacy roadmap | DOC=YES | `00-MASTER-PLAN, 23, 25, 26` | Implementation sequencing enforced by AGENTS/rules |
| ETAP A Security/Infrastructure Lab | DOC=YES | `00-MASTER-PLAN §3` | PENDING: hosting/dev/staging/tunnel/backup/restore/monitoring not deployed |
| Cloudflare only public ingress | DOC=YES | `MASTER §3, AGENTS, security rule` | PENDING deployment; Tunnel preferred; no AOP together with Tunnel |
| Infrastructure provider not selected | DOC=YES | `MASTER CONTEXT/Decision ADR-006` | OPEN by design; evaluate free/reliable options in Lab |
| OpenAPI 3.0 first | DOC+ARTIFACT=YES | `contracts/openapi.yaml = 3.0.4` | Validated: 44 operations / 12 schemas |
| Typed client before products | PARTIAL | `clients/typescript` | Scaffold exists but is NOT generated and covers only subset; Gate B pending |
| Web/mobile same TS client | DOC=YES | `MASTER/23/AGENTS` | PENDING consumers; ETAP D frozen |
| SketchUp same contract | PARTIAL | `clients/sketchup` | Adapter exists; stable revision/designer/model metadata still pending |
| Core Auth | SCHEMA+CONTRACT | `0014 + OpenAPI` | Server implementation pending |
| Core CRM | SCHEMA+CONTRACT | `existing leads + OpenAPI` | Server implementation pending |
| Core Sales | SCHEMA+CONTRACT | `opportunities + OpenAPI` | Server implementation pending |
| Core Capacity | SCHEMA+CONTRACT | `core_capacity_slots + OpenAPI` | Calendar adapter pending |
| Core Projects | SCHEMA+CONTRACT | `core_projects + OpenAPI` | Server implementation pending |
| Core Offers | SCHEMA+CONTRACT | `core_offers + OpenAPI` | Contract/signature object needs implementation detail |
| Core Payments | SCHEMA+CONTRACT | `core_payments + webhooks` | Provider adapters/signature verification pending |
| Core Files | SCHEMA+CONTRACT | `core_files + upload-intent` | Storage/download-intent/AV policy pending |
| Core Events | SCHEMA+CONTRACT | `domain_events + OpenAPI` | Outbox worker/retry/DLQ pending |
| Core Automation | SCHEMA+CONTRACT | `automation_rules + OpenAPI` | Runtime/approval policies pending |
| ETAP D frozen | DOC+RULE=YES | `MASTER/23/AGENTS/rules` | No domain duplication allowed |
| WWW = Sales Application | DOC=YES | `MASTER §4` | Implementation pending ETAP D |
| No 100% conversion promise | DOC=YES | `MASTER §1/4` | Funnel/value optimization instead |
| Site Intelligence Engine | DOC=YES | `MASTER §5/25` | Domain/API/data layer pending after Core fundamentals |
| Geoportal/SoilGrids/weather/OSM | DOC=YES | `MASTER §5` | Adapters/cache/fallback pending |
| Plant Knowledge Graph | DOC=YES | `MASTER §6` | Schema/API pending |
| AI not source of truth | DOC+RULE=YES | `MASTER/25/AGENTS` | Enforce in implementation/review |
| Revenue OS CRM + capacity | DOC=YES | `MASTER §7` | Implementation pending |
| Offer first-class object | PARTIAL | `OpenAPI/DB + MASTER` | scope/exclusions/milestones/payment schedule need richer schema |
| Signed/idempotent webhooks | PARTIAL | `webhook_receipts/OpenAPI docs` | Verification/replay tests pending |
| Private files | PARTIAL | `core_files + rules` | Real storage ACL/download intents pending |
| Event/outbox | PARTIAL | `domain_events + docs` | Transactional publishing worker pending |
| Observability from day 1 | DOC=YES | `MASTER §12` | Instrumentation/collector/vendor pending |
| Security matrix BOLA/BFLA/BOPLA/etc. | DOC=YES | `MASTER §13` | Automated test suite pending |
| Backup + real restore test | DOC=YES | `Gate A` | PENDING |
| Load test | DOC=YES | `Gate A` | PENDING |
| GitHub as source of truth | DOC=YES | `MASTER/24/AGENTS` | Repo connection/CI implementation pending |
| Cursor rules | ARTIFACT=YES | `.cursor/rules` | Added architecture/security/docs/integrations rules |
| Background agents no prod secrets | DOC+RULE=YES | `24/security rule` | Enforce in CI/secret scopes |
| ChatGPT/Codex role | DOC=YES | `24/MASTER` | No independent project state |
| Claude independent reviewer | DOC=YES | `24/MASTER` | No independent source of truth |
| Grok interactive vs API automation | DOC=YES | `24/MASTER` | Official xAI API/MCP for server automation |
| AI Task Router/cost logging | DOC=YES | `MASTER/24` | Implementation deferred to AI layer |
| FZ MCP READ vs ACTIONS | DOC=YES | `MASTER §9` | Implementation later; actions require auth/approval/audit |
| SketchUp stable IDs/revisions | DOC=YES | `MASTER §10` | Current Ruby adapter still minimal |
| V-Ray script/batch first | DOC=YES | `MASTER §10/24` | Implementation pending |
| Google adapters not source of truth | DOC+RULE=YES | `MASTER §8` | Calendar connector usable; product integration pending |
| Sebastian Google account test-only | DOC+RULE=YES | `MASTER/25/26/integrations rule` | No hard-coded ID in contract/client |
| Agnieszka prod OAuth/multi-account | DOC+RULE=YES | `MASTER §8` | OAuth integration schema/runtime pending |
| Google Calendar ↔ Capacity | DOC=YES | `MASTER §8` | Accepted events/availability adapter pending |
| Drive/Gmail ↔ CRM/project | DOC=YES | `MASTER §8` | Least-privilege adapters pending |
| Google Business Profile metrics/reviews | DOC=YES | `24/MASTER` | OAuth/API access implementation pending |
| Meta official API/webhooks | DOC=YES | `24/MASTER` | Integration pending |
| Evidence Engine/local SEO | DOC=YES | `25 + existing specs` | Implementation ETAP D |
| Mobile != portal clone | DOC=YES | `MASTER §14/25` | Implementation ETAP D |
| Garden OS digital twin | DOC=YES | `MASTER §14/25` | Implementation ETAP D |
| SketchUp → plants/materials → portal | DOC=YES | `MASTER/24` | Implementation ETAP D/Studio |
| Hypothesis→prototype→validate→implement→measure | DOC=YES | `25` | Process rule |
| XR/community/marketplace/microservices deferred | DOC=YES | `MASTER §14` | Do not implement now |
| Docs auto-updated with future project changes | DOC+RULE=YES | `MASTER §15/AGENTS/.cursor` | Operational rule established |

## Krytyczne luki wykryte przez audyt

1. **Typed client nie jest jeszcze naprawdę generowany z OpenAPI.** Istniejący `clients/typescript/src/index.ts` jest lekkim ręcznym scaffoldem i obejmuje tylko część 44 operacji. Gate B wymaga generatora + CI + diff breaking changes. Dokumentacja została skorygowana tak, aby nie nazywać tego ukończonym Gate B.
2. **Core Domain ma kontrakt i schemat, ale nie pełny serwer.** Nie wolno uznać ETAPU C za wykonany przed implementacją endpointów, authorization i testami.
3. **Offer model wymaga wzbogacenia** o scope/exclusions/milestones/payment schedule/version/acceptance/contract linkage, zanim stanie się pełnym obiektem sprzedażowym.
4. **Files wymagają realnej warstwy storage**: download intents, ACL, checksum verification, limity typu/rozmiaru, skanowanie/bezpieczny preview i retention.
5. **Events wymagają właściwego outbox runtime**: claim/lock, retry/backoff, dead-letter/replay i idempotent consumers.
6. **Google OAuth/multi-account jest decyzją architektoniczną, nie gotową integracją produktu.** Aktualne połączenie konta w ChatGPT nie może być traktowane jako backend OAuth Forma Zieleni.
7. **ETAP A nie został wdrożony.** Dopóki nie ma prywatnego originu, realnego restore testu i security test suite, publikacja aplikacji/portalu jest zablokowana.

## Korekty po ponownym audycie internetowym

- Cloudflare Tunnel jest właściwym dopasowaniem do wymagania „origin bez publicznego IP/portów inbound”; przy Tunnel **Authenticated Origin Pulls nie ma zastosowania** — nie należy projektować obu mechanizmów na tym samym hostname.
- OWASP API Security Top 10 2023 potwierdza priorytet BOLA, broken authentication, BOPLA, resource consumption, BFLA, sensitive business flows, SSRF i inventory/unsafe API consumption — macierz bezpieczeństwa została utrzymana szerzej niż samo BOLA.
- Google Workspace MCP jest nadal oznaczony jako Developer Preview w oficjalnej dokumentacji; produkcyjne integracje Forma Zieleni powinny mieć adapter API/OAuth i nie zależeć wyłącznie od preview MCP.
- Google Business Profile oficjalnie udostępnia Performance API oraz API opinii; integracja metryk/opinii jest zasadna, ale wymaga OAuth/API access.
- OpenAI remote MCP pozwala ograniczać dozwolone narzędzia/read-only; wspiera to rozdział FZ MCP READ/ACTIONS, ale approval/audit pozostają odpowiedzialnością naszej warstwy.
- xAI oficjalnie obsługuje remote MCP, więc decyzja „Grok UI do pracy interaktywnej, API/MCP do automatyzacji” pozostaje właściwa.
- SketchUp oficjalnie wspiera Ruby Extension API do automatyzacji workflow; plugin jako adapter Core jest zgodny z platformą.

## Definition of Done dla kompletności dokumentacji

Każda nowa decyzja musi mieć: (1) wpis w `26-DECISION-REGISTER.md`, (2) aktualizację dotkniętej specyfikacji, (3) zmianę MASTER/CONTEXT, jeśli wpływa na architekturę/roadmapę, (4) kontrakt/migrację/test, jeśli zmienia system, (5) checkpoint. CI docelowo powinno sprawdzać datę/marker dokumentacji dla PR-ów zmieniających `contracts/`, `db/`, `src/`, `clients/` lub `.cursor/`.

## Ponowny audyt pełnotekstowy — korekta

Ponowna kontrola wykryła, że samo dodanie bannerów F-RESET nie wystarczało: część starszych aktywnych dokumentów oraz główna reguła Cursora nadal semantycznie narzucały Workers/D1/R2 jako wybrany stack. Zostało to skorygowane. Obowiązuje `28-ZERO-OMISSION-AUDIT-2026-09-20.md` i automatyczny `scripts/audit-doc-consistency.py`.
