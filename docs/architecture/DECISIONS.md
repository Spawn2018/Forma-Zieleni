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
| Status | Superseded by ADR-014 |
| Decyzja | Nie wybieramy jeszcze hostingu origin, providera bazy, storage ani konkretnej infrastruktury produkcyjnej. Nie instalujemy Dockera jako wymogu. Nie zakładamy Cloudflare Workers / D1 / R2. |
| Kontekst | Najpierw architektura i kontrakt; unikamy lock-inu przed wymaganiami. |
| Konsekwencje | Historical: `infra/` contained directional notes only, and apps had no framework yet. ADR-014 records the later Gate A choices. Workers, D1, R2 and Pages remain unselected. Production compute and production object storage remain later Owner decisions. |

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
| Kontekst | ChatGPT is out of the runtime loop. Product construction continued with durable contracts while Gate A stack choices were still open. Those choices are now ADR-014. |
| Konsekwencje | Gate A architecture is recorded in ADR-014. Implementation of the lead vertical is defined in `NEXT-SLICE-LEAD-VERTICAL.md` and is not done by this ADR. |

## ADR-013 — Provider-neutral contract lifecycle (FZ-SIGN-1)

| Pole | Wartość |
|------|---------|
| Data | 2026-09-21 |
| Status | Accepted (boundary only) |
| Decyzja | Core API owns contract business state, authorization, lifecycle and archive metadata. Private object storage owns immutable artifacts. A signing engine is a replaceable adapter and is not the source of truth. Electronic signature is not treated as legally mandatory for every transaction. Provider remains UNDECIDED. |
| Kontekst | Commercial flow needs Offer → Contract → signature when required → payment → project, without letting a SaaS become the ACL or the only archive. |
| Konsekwencje | Canonical text: `FZ-SIGN-1-CONTRACT-LIFECYCLE.md`. Research: `OWNER-DECISION-PACKET-FZ-SIGN-1.md`. Recording this boundary did not itself decide Gate A. Gate A was decided later in ADR-014. Signing provider, SDK and schema remain for a later Owner decision. |

## ADR-014 — Gate A architecture selection

| Pole | Wartość |
|------|---------|
| Data | 2026-09-21 |
| Status | Accepted |
| Decyzja | Owner decided FZ-A1 OPTION A `DEPLOY=compose`; FZ-A2 OPTION F `API=Hono` (WWW, Portal and Admin are separate React Router Framework Mode apps); FZ-A3 OPTION E (PostgreSQL + Kysely); FZ-A4 OPTION A `LATER=garage`; FZ-A5 OPTION E `EMBED=B` (Better Auth now); FZ-A6 OPTION B `OBS=openobserve` `SECRETS=sops-age` `BACKUP=restic` `PG=pgbackrest`; FZ-A7 OPTION A `OVERLAY=none`. |
| Kontekst | Gate A packets stayed open until an explicit Owner reply. Local Windows development stays native. Linux Docker Compose, Garage, OpenObserve, pgBackRest and Cloudflare Tunnel are later horizons. Production compute and production object storage are not selected. No recurring spend is authorized. |
| Konsekwencje | Binding shape: `CURRENT-ARCHITECTURE.md`. Research remains in `OWNER-DECISION-PACKETS-GATE-A.md`. Next implementation definition: `NEXT-SLICE-LEAD-VERTICAL.md`. Architecture decided is not security acceptance. FZ-SIGN-1 provider stays UNDECIDED. Docker is not a Windows prerequisite. Cloudflare, DNS and production changes stay DANGEROUS. |
| Supersedes | ADR-007 “do not choose yet” for the horizons named above. ADR-001 through ADR-006 and ADR-008 remain in force. |

## ADR-015 — Content / media / visual publishing (FZ-CMS-1)

| Pole | Wartość |
|------|---------|
| Data | 2026-09-21 |
| Status | Accepted |
| Decyzja | `DECISION FZ-CMS-1: OPTION B` `VISUAL=vendor-native` `MEDIA=fz-pipeline`. Content engine: ApostropheCMS on PostgreSQL. Visual editing: Apostrophe native/in-context editing; do not add Puck by default. Media: Forma Zieleni owns the intelligent media pipeline. CMS is the content domain only. |
| Kontekst | WWW needs an editor-operated content and media system that is not CRM. Gate A stack stays binding. Research, an isolated native lab, and a 2026-09-21 finalist validation lab are in `OWNER-DECISION-PACKET-FZ-CMS-1.md` and `labs/fz-cms-1`. The Owner reply selected option B with those constraints. The lab did not execute the vendor Admin UI or the PostgreSQL adapter. |
| Konsekwencje | Execute `NEXT-SLICES-CMS.md`. This ADR is not CMS-ACCEPT. Acceptance items A–Q stay open. Apostrophe must not become CRM, Lead, Contract, Payment, business Project truth, Core API authorization, or private business file authority. Puck is not installed unless a later Owner decision records an evidence-based fallback. Search Intelligence is a separate bounded capability in `FZ-SEARCH-1.md`, not an Apostrophe table. FZ-SIGN-1 stays UNDECIDED. Lead security acceptance is unchanged. |

## ADR-016 — Crawl policy, payment provider, production hosting direction

| Pole | Wartość |
|------|---------|
| Data | 2026-10-02 |
| Status | Accepted |
| Decyzja | `DECISION FZ-SEARCH-CRAWL-1: OPTION A`. `DECISION payment-provider: Przelewy24`. `DECISION production-hosting: 0 PLN until cutover. First remote host is one Hetzner CX23 EU, DEPLOY=compose, not a second VM. No purchase now.` FZ-SIGN-1 provider stays UNDECIDED. |
| Kontekst | Owner accepted the recorded suggestions. OPTION A disallows `GPTBot`, `ClaudeBot`, and `Google-Extended` in production robots and leaves search-indexing tokens allowed, including the Gemini-grounding opt-out. Przelewy24 is the single payment adapter name. Fakturownia stays invoicing. Hosting stays on this workstation until cutover. The first remote machine is one Hetzner Cloud CX23 in FSN, Nuremberg, or Helsinki. |
| Konsekwencje | Production `robots.txt` emits those three groups. The live Cloudflare zone is not changed. No payment is captured and no Przelewy24 credential is created. No VM is purchased. DNS, Cloudflare, spend, and deploy stay DANGEROUS. Signing engine stays unselected until ADR-017. |

## ADR-017 — Next slice wave: signing re-read and Przelewy24 sandbox

| Pole | Wartość |
|------|---------|
| Data | 2026-10-02 |
| Status | Accepted |
| Decyzja | `AUTHORIZE PAY-ADAPTER-1: Przelewy24 sandbox only. Core API adapter, webhooks, schedule status. No live charge, no production keys.` `AUTHORIZE FZ-SIGN-1-REREAD: re-read Documenso Community production API from official docs. Select it only if that API has no per-signature fee. Otherwise stop. No QES.` |
| Kontekst | The main product graph had no remaining AUTO/REVIEW slice. The Owner authorized the next wave with those two statements. |
| Konsekwencje | FZ-SIGN-1-REREAD is COMPLETE: Documenso Community self-host is the selected engine because the official self-host plan table shows unlimited documents and no per-signature fee. Documenso Cloud is not selected. No QES. PAY-ADAPTER-1 followed. Live charges, production keys, DNS, Cloudflare, and hosting purchase stay outside this wave. |

## ADR-018 — Safe slices after the blockers are deferred

| Pole | Wartość |
|------|---------|
| Data | 2026-10-02 |
| Status | Accepted |
| Decyzja | Owner: otworzyć kolejne bezpieczne slice'e. Blokady (Cloudflare, DNS, zakup hostingu, prawdziwa wpłata, security-accept bez ZAP) zostają na później. `AUTHORIZE SIGN-ADAPTER-1` i `AUTHORIZE ADMIN-SIGN-SANDBOX`. |
| Kontekst | Oba grafy były COMPLETE. Owner zgodził się otworzyć następną pracę produktową i wrócić do blokad później. |
| Konsekwencje | SIGN-ADAPTER-1 jest lokalnym sandboxem Documenso bez QES i bez tokenu. ADMIN-SIGN-SANDBOX jest następnym slice'em staff. DANGEROUS bez zmian. |

## ADR-019 — Continue safe product depth past exhausted Owner pauses

| Pole | Wartość |
|------|---------|
| Data | 2026-10-02 |
| Status | Accepted |
| Decyzja | Owner: pominąć pauzy OWNER-DECISION i budować dalej do 10:00 Europe/Warsaw w oknie `/noc`. `AUTHORIZE CAPACITY-STAFF`. `AUTHORIZE ADMIN-MILESTONE-STAFF`. `AUTHORIZE ADMIN-GARDEN-STAFF`. `AUTHORIZE ADMIN-SITE-STAFF`. `AUTHORIZE ADMIN-DECISION-LOG`. `AUTHORIZE ADMIN-PROJECT-DELIVER`. `AUTHORIZE PORTAL-MILESTONE-VIEW`. `AUTHORIZE ADMIN-MILESTONE-STATUS`. `AUTHORIZE ADMIN-MILESTONE-DUE`. `AUTHORIZE ADMIN-MILESTONE-DUE-REVISE`. `AUTHORIZE ADMIN-DECISION-LOG-REVISE`. |
| Kontekst | Graf AUTO/REVIEW był wyczerpany. Owner nie wybrał dostawcy ani wdrożenia. Polecił kontynuację bezpiecznej głębokości produktu. |
| Konsekwencje | CAPACITY-STAFF jest panelem dyspozycyjności personelu w Core API i `apps/admin`. PORTAL-CONTRACT-VIEW pokazuje klientowi status własnej umowy, bez ceny, podpisu i płatności. ADMIN-MILESTONE-STAFF pokazuje personelowi kamienie milowe projektu przez istniejące Core API, bez płatności i bez dziennika decyzji. ADMIN-GARDEN-STAFF pokazuje personelowi ogród dostarczonego projektu, bez bliźniaka cyfrowego i bez podmiotu klienta na liście. ADMIN-SITE-STAFF pokazuje personelowi kody ustaleń o terenie z reguł i zapisuje jedną syntetyczną obserwację znormalizowaną. ADMIN-DECISION-LOG pokazuje personelowi dziennik decyzji i zmian zakresu, bez ceny, podpisu i danych kontaktowych. ADMIN-PROJECT-DELIVER pozwala personelowi oznaczyć zaplanowany projekt jako dostarczony przez istniejące Core API. PORTAL-MILESTONE-VIEW pokazuje klientowi kamienie milowe własnego projektu, bez płatności, podpisu i dziennika decyzji. ADMIN-MILESTONE-STATUS pozwala personelowi przesunąć kamień milowy o jeden krok: zaplanowany, w toku, zrobiony. Pominięcie kroku, płatność i podpis są odrzucane. ADMIN-MILESTONE-DUE pozwala personelowi podać opcjonalny termin UTC przy tworzeniu kamienia. Puste pole zostaje pominięte. Zły zapis nie wychodzi z panelu. ADMIN-MILESTONE-DUE-REVISE pozwala personelowi poprawić albo usunąć termin po utworzeniu. Status zostaje. Puste pole korekty nie usuwa terminu. ADMIN-DECISION-LOG-REVISE pozwala personelowi poprawić treść wpisu w dzienniku. Rodzaj, projekt, aktor i kamień milowy zostają. Pusta treść, płatność i kontakt są odrzucane. Portal nadal nie czyta dziennika. Brak kalendarza zewnętrznego, brak obietnicy zapisu poza oknem. Cloudflare, DNS, sekrety, spend, prawdziwa wpłata, dane klientów i deploy zostają DANGEROUS. |

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
