# Forma Zieleni — MASTER PLAN po F-RESET

<!-- FRESET-V2-SYNC-2026-09-20 -->
> **F-RESET v2 — 2026-09-20 · Status: CANONICAL/CURRENT.** Aktywny dokument sterujący lub kontrolny f-reset. Źródła nadrzędne: `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md`, `30-F-RESET-EXECUTION-2026-09-20.md`, `31-IMPLEMENTATION-STATUS-MATRIX.md` oraz `contracts/openapi.yaml` dla API. Starsze F0–F33 i wskazania konkretnego hostingu są INPUT/LEGACY, nie kolejnością ani wyborem infrastruktury.

**Status:** CANONICAL / CURRENT — 2026-09-20.  
**Zasada:** ten dokument, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md`, `contracts/openapi.yaml` i ADR-y są nadrzędne wobec historycznych faz F0–F33. Stare fazy pozostają materiałem wejściowym, ale nie sterują kolejnością wdrożenia.

## 1. Cel biznesowy
Forma Zieleni jest pracownią projektowania zieleni, w której głównym ograniczeniem jest czas jednej projektantki, nie maksymalna liczba leadów. System ma maksymalizować **wartość i marżę na godzinę właścicielki**, jakość klienta, przewidywalność realizacji i redukcję pracy administracyjnej. Marketing jest regulatorem obłożenia. Nie obiecujemy 100% konwersji; projektujemy lejek tak, aby maksymalizować wartość każdego kwalifikowanego wejścia i mierzyć miejsca utraty.

## 2. Jedna architektura produktu
PUBLIC EXPERIENCE: WWW, Site Analysis, Quiz, kalkulator, treści/SEO.  
SALES: Lead → Qualification → Consultation → Opportunity → Offer → Contract → Deposit/Payment.  
DELIVERY: Project → Design → Files → Tasks → Approvals → Capacity.  
CUSTOMER: Portal → Mobile → Garden OS.  
STUDIO: CRM → Operations → SketchUp/V-Ray/CAD → Automation.  
INTELLIGENCE: Site Intelligence → Plant Knowledge Graph → AI → Analytics.

Kanoniczna ścieżka: **Anonymous Visitor → Site Analysis → Qualified Lead → Consultation → Opportunity → Offer → Contract → Payment → Project → Garden → Garden OS → Review/Referral/Maintenance/Next Project.**

## 3. Obowiązująca kolejność wdrożenia
### ETAP A — Security + Infrastructure Lab
GitHub → dev → staging → production topology → Cloudflare zone → Cloudflare Tunnel → prywatny origin → API → DB → private files → backup → restore test → monitoring → BOLA/BFLA/BOPLA/SSRF/upload/webhook/rate-limit/session tests → load test.

**Hard requirement:** cały ruch publiczny do originu przechodzi przez Cloudflare. Preferowany Cloudflare Tunnel tworzy połączenie outbound-only i nie wymaga publicznego IP ani otwartych portów inbound. Nie wystawiamy DB do Internetu. Cloudflare jest warstwą ochronną, nie zamiennikiem autoryzacji aplikacyjnej.

Gate A: origin niepubliczny; staging oddzielony od prod; brak sekretów w repo; backup został realnie odtworzony; testy BOLA/BFLA/BOPLA i webhooków przechodzą; monitoring i audit działają.

### ETAP B — API Contract — AKTYWNY
Najpierw **OpenAPI 3.0.x** (obecnie 3.0.4), potem typed clients. `contracts/openapi.yaml` jest źródłem prawdy. Jeden wspólny klient TypeScript obsługuje web/portal/admin/mobile; SketchUp ma adapter Ruby do tego samego kontraktu. DTO nie są ręcznie duplikowane. CI: lint, unique operationId, breaking-change check, generation, provider/contract tests.

### ETAP C — Core Domain
Kolejność: **Auth → CRM → Sales → Capacity → Projects → Offers → Payments → Files → Events → Automation**. Moduły Site Analysis i Plant Knowledge dołączają do Core po ustabilizowaniu podstaw. Preferujemy modular monolith + API-first, nie mikroserwisy.

Każda ważna mutacja: idempotency; każda zmiana stanu: domain event/outbox w tej samej transakcji; każdy obiekt: owner/role/tenant authorization; pliki prywatne i niezgadywalne; webhooki podpisane, idempotentne, logowane i replay-safe.

### ETAP D — DOPIERO PO GATE C
**WWW → Portal → Mobile → SketchUp UX → Garden OS → AI → XR.** Prototypy mogą powstawać wcześniej wyłącznie bez własnej logiki domenowej i bez produkcyjnych danych.

## 4. WWW jako Sales Application
WWW nie jest broszurą. Główne intencje: pełny ogród; „sprawdź moją działkę”; widełki kosztu; mała przestrzeń/taras/balkon; konsultacja; portfolio. Główne CTA: **„Sprawdź moją działkę”**, drugie: „Zobacz realizacje”. Alternatywa: 7-pytaniowy kwalifikator.

Drabina zaangażowania: Site Analysis Lite → konsultacja → projekt → kompleksowy projekt → Garden OS/przeglądy. Lejek mierzymy od `page_view` przez `site_analysis_started/completed`, `lead.created`, qualified, consultation, offer, deposit i contract. Eksperymenty mierzą także jakość leada, sprzedaż, przychód i marżę/godz., nie sam CTR.

## 5. Site Intelligence Engine
Wejście: konkretna działka. Pipeline: Property → geospatial → environment → soil → climate/weather → sun → topography → context → Plant Knowledge → constraints/opportunities. Geoportal, SoilGrids, OSM i pogoda są źródłami zewnętrznymi; dane są normalizowane i cache'owane w **Forma Zieleni Data Layer**, aby UX nie zależał od dostępności pojedynczego API.

Wynik klienta tłumaczy dane na decyzje: światło, prywatność, woda, gleba, rzeźba, potencjał, ryzyka, możliwe kierunki projektu + CTA. AI interpretuje dane, ale nie jest źródłem prawdy.

## 6. Plant Knowledge Graph
Nie płaska tabela. Encje i relacje obejmują m.in. nazwę łacińską jako stabilny identyfikator, tolerancje, glebę/pH/wilgotność, światło, rozmiar docelowy, tempo wzrostu, sezonowość/kwitnienie, wartość dla fauny, pielęgnację, toksyczność, charakter wizualny, kompatybilność i ograniczenia. SketchUp przechowuje identyfikatory/atrybuty potrzebne do modelu; Core jest źródłem prawdy.

## 7. Revenue OS: CRM + Capacity + Offers + Payments
CRM odpowiada: kto, czego chce, skąd przyszedł, jaka nieruchomość/Site Analysis, wartość, next action, prawdopodobny nakład czasu i capacity impact. Capacity jest częścią sprzedaży; terminy nie są obiecywane „z głowy”. Oferta jest obiektem systemowym: scope, exclusions, price, timeline, milestones, payment schedule, validity, files, acceptance, contract. Aktywacja projektu: Offer accepted → Contract → Deposit → Project active.

Najważniejszy KPI biznesowy: **contribution margin / revenue per owner hour**. Pomocniczo: jakość leadów, offer rate, sale rate, 8-tygodniowe obłożenie, czas pierwszego kontaktu, godziny/projekt, terminowość, review/referral.

## 8. Google / Meta / konta
Google Workspace i Meta są integracjami, nie źródłem prawdy. Core przechowuje stan biznesowy, a eventy synchronizują działania. Obecnie podłączone konto Google Sebastiana jest **testowe/integracyjne**. Nie wolno kodować jego identyfikatorów na stałe. Produkcyjnie Agnieszka podłącza własne konto przez OAuth; system ma obsługiwać zmianę/odłączenie konta i w przyszłości wiele kont/użytkowników.

Calendar: odczyt availability + publikacja zaakceptowanych konsultacji/blokad; Capacity pozostaje kanoniczne. Drive: materiały robocze/dokumenty z minimalnymi uprawnieniami. Gmail: korespondencja i drafty/powiązania z CRM. Business Profile: metryki i opinie. Meta: leady/ads/webhooki przez oficjalne API. Każda integracja ma least privilege, audit, retry/idempotency i możliwość odłączenia.

## 9. Warsztat AI i software
GitHub + OpenAPI + Core API + wersjonowane reguły są centrum. Cursor = główne IDE/agent wykonawczy; Background Agents tylko dev/staging, bez produkcyjnych sekretów. ChatGPT/Codex = research, architektura, wieloetapowa implementacja/review. Claude = niezależny reviewer/refactor/debug. Grok = dodatkowy research/reviewer; automatyzacja tylko oficjalnym xAI API/MCP, nie przez automatyzację logowania/subskrypcji konsumenckiej.

Powstaje **FZ MCP** w dwóch powierzchniach: READ (np. get_project/get_lead/get_capacity/search_files/search_plants) oraz ACTIONS (update_lead/create_offer/send_message/create_payment/publish). ACTIONS wymagają silniejszej autoryzacji, approval dla działań wysokiego ryzyka i pełnego audit log.

AI Task Router dobiera klasę modelu do zadania i loguje provider/model/task/tokens/cost/duration/result/human_accepted. DATA → RULES → DOMAIN → AI; AI nigdy nie jest systemem rekordowym.

## 10. SketchUp + V-Ray
Plugin pracuje na `project_id`, `project_revision`, `designer_id`, `model_version`, nie samym slug. Przepływ: Core Project → SketchUp → plants/materials/scenes/revision → V-Ray → private upload → Files → Portal → approval → następny stage. Eliminujemy ręczne przepisywanie nazw/katalogów/list roślin.

V-Ray: najpierw Script Access/batch render i presety preview/final; App SDK/render worker dopiero gdy uzasadni to obciążenie. Render pipeline waliduje sceny, tekstury, metadata, output, tworzy deterministyczne nazwy plików i publikuje `file.created`.

## 11. Events + Automation
Przykładowe zdarzenia: `lead.created`, `lead.qualified`, `consultation.booked`, `offer.sent`, `offer.accepted`, `contract.signed`, `payment.received`, `project.created`, `file.created`, `client.approved`, `project.completed`, `review.requested`, `review.received`. Transactional outbox → worker → action. Automatyzacje mają retries, dead-letter/replay, idempotency i audit.

## 12. Observability i analityka
Od dnia 1: structured logs, metrics, traces, errors, audit, business events; vendor-neutral instrumentation (OpenTelemetry tam, gdzie pasuje). Dashboardy techniczne + biznesowe. `request_id`/correlation id przechodzi API → event → webhook/integracja.

## 13. Security baseline
Testujemy co najmniej: Auth, BOLA, BFLA, BOPLA, CSRF, CORS, SSRF, uploads, webhook signatures/replay, rate limiting/resource abuse, magic-link/session, IDOR, file authorization, admin escalation, tenant/user isolation, secrets, dependency/supply-chain, logs/PII, backup/restore. Produkcyjne dane i sekrety nie trafiają do agentów AI/background agents.

## 14. Co celowo odkładamy
XR, szerokie autonomiczne AI, community/marketplace, publiczne ciężkie 3D, mikroserwisy i automatyzacje bez mierzalnego związku z revenue/delivery/retention. Garden OS docelowo jest cyfrowym bliźniakiem ogrodu: property/design/plants/materials/maintenance/weather/photos/warranties/history/recommendations.

## 15. Zasada dokumentacji
Każda kolejna decyzja projektowa aktualizuje dokumentację w tym samym change-set/PR co kod. Nie ma „ustalenia tylko w czacie”. Zmiana architektury → ADR + MASTER/Decision Register + dotknięte specyfikacje. Dokumenty research zachowują historię, ale muszą mieć status i wskazanie aktualnej decyzji.

## 16. F-RESET v2 execution
Stan resetu i jego Definition of Done: `30-F-RESET-EXECUTION-2026-09-20.md`. Prawdziwy stan wdrożenia wszystkich obszarów: `31-IMPLEMENTATION-STATUS-MATRIX.md`. Żaden dokument produktowy ani historyczny nie może podnosić statusu ponad tę macierz.
