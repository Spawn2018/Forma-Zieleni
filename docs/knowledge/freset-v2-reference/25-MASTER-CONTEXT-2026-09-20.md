# MASTER CONTEXT — Forma Zieleni — 2026-09-20

<!-- FRESET-V2-SYNC-2026-09-20 -->
> **F-RESET v2 — 2026-09-20 · Status: CANONICAL/CURRENT.** Aktywny dokument sterujący lub kontrolny f-reset. Źródła nadrzędne: `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md`, `30-F-RESET-EXECUTION-2026-09-20.md`, `31-IMPLEMENTATION-STATUS-MATRIX.md` oraz `contracts/openapi.yaml` dla API. Starsze F0–F33 i wskazania konkretnego hostingu są INPUT/LEGACY, nie kolejnością ani wyborem infrastruktury.

**CANONICAL.** Konsolidacja ustaleń z dwóch czatów projektowych i audytów. Używać jako kontekstu dla ludzi i agentów.

## Firma i ograniczenie
- Forma Zieleni: projektowanie zieleni, Trójmiasto/Pomorze; główna projektantka: Agnieszka Pupiało.
- Projekty historycznie ok. 2,5–25 tys. zł, największe do ok. 50 tys.; średnia umowa ok. 8–15 tys. zł — liczby traktować jako dane robocze z projektu i nie publikować bez potwierdzenia.
- Główne ograniczenie: godziny właścicielki. Optymalizujemy marżę/przychód na godzinę, nie wolumen leadów.
- Reklamy max 300 zł/mies. jako regulator capacity.

## Decyzje niepodlegające zgubieniu
1. F-RESET zastępuje roadmapę „WWW first”. Najpierw A Security/Infrastructure, B API Contract, C Core Domain, dopiero D produkty.
2. ETAP B: OpenAPI 3.0.x zgodnie z decyzją użytkownika; aktualny plik 3.0.4. Typed client po kontrakcie. Jeden TS client dla web/portal/admin/mobile + Ruby adapter SketchUp.
3. ETAP C kolejno: Auth, CRM, Sales, Capacity, Projects, Offers, Payments, Files, Events, Automation. Modular monolith/API-first.
4. ETAP D kolejno: WWW, Portal, Mobile, SketchUp, Garden OS, AI, XR.
5. Cloudflare ma być wyłącznie publiczną warstwą wejścia/ochrony. Origin prywatny; preferowany Tunnel outbound-only; żadnego omijania Cloudflare. DB prywatna. Wdrożyć przed publikacją aplikacji.
6. Hosting/infrastruktura docelowa jeszcze nie są wybrane. Kryterium: możliwie darmowe, niezawodne, przenośne. Nie przywiązujemy domeny do konkretnego hosta przed testami.
7. WWW = Sales Application, nie portfolio-broszura. Nie obiecujemy 100% konwersji; mierzymy cały lejek i maksymalizujemy wartość kwalifikowanego ruchu.
8. Site Analysis = Site Intelligence Engine oparty o działkę: Geoportal + SoilGrids + weather + OSM + Plant Knowledge + AI + CRM; dane zewnętrzne cache/normalize w Data Layer.
9. Plant Knowledge = graph/kanoniczna baza wiedzy; AI interpretuje, nie wymyśla botaniki.
10. CRM = Revenue OS i jest spięty z Capacity. Oferta jest obiektem systemowym. Payment webhooki są podpisane, idempotentne i replay-safe. Pliki prywatne.
11. Event-driven core z transactional outbox. Observability od dnia 1: logs/metrics/traces/errors/audit/business events.
12. Security: BOLA/BFLA/BOPLA + pełna macierz API/app security, restore test i load test przed produkcją.
13. GitHub/OpenAPI/Core są source of truth. Cursor/ChatGPT/Codex/Claude/Grok mają role komplementarne, nie osobne stany projektu.
14. Cursor rules i AGENTS.md są wersjonowane. Background agents bez prod secrets/data.
15. Grok w Cursorze może służyć interaktywnie w ramach dostępnego limitu; automatyzacja serwerowa tylko oficjalnym xAI API/MCP.
16. FZ MCP: READ osobno od ACTIONS; write/high-risk wymaga uprawnień/approval/audit.
17. SketchUp plugin ma używać project_id/revision/designer/model_version i eliminować ręczne przepisywanie. V-Ray: Script Access/batch najpierw, SDK później.
18. Google/Meta przez oficjalne API/webhooki. Google nie jest source of truth.
19. Obecne konto Google Sebastiana jest testowe/integracyjne. Produkcyjnie Agnieszka podłącza swoje przez OAuth. Żadnych hard-coded account IDs. Multi-account-ready. Calendar synchronizuje availability/accepted events, Drive pliki robocze, Gmail komunikację; Core zachowuje stan biznesowy.
20. Evidence Engine dla realizacji/case studies i unikalne lokalne SEO; żadnego programmatic-spam.
21. Mobile nie jest klonem portalu: task/photo/push/relacja. Garden OS = digital twin ogrodu.
22. SketchUp → API → project → plants/materials → portal bez retyping.
23. Każdy większy moduł: hypothesis → prototype → validation → implementation → measurement.
24. Odkładamy XR, community, marketplace, public advanced 3D, szerokie autonomiczne AI i mikroserwisy, dopóki dane nie uzasadnią.
25. Każde kolejne polecenie zmieniające projekt musi aktualizować dokumentację równolegle z kodem/specyfikacją.

## Kanoniczne artefakty
- `docs/00-MASTER-PLAN.md` — kolejność i architektura.
- `docs/25-MASTER-CONTEXT-2026-09-20.md` — pełny skondensowany kontekst.
- `docs/26-DECISION-REGISTER.md` — decyzje i status.
- `docs/27-AUDIT-COVERAGE-2026-09-20.md` — kontrola kompletności.
- `contracts/openapi.yaml` — kontrakt API.
- `db/0014_core_domain_reset.sql` — addytywny fundament Core.
- `AGENTS.md`, `.cursor/rules/` — reguły dla agentów.
