# Zero-Omission Audit — 2026-09-20

<!-- FRESET-V2-SYNC-2026-09-20 -->
> **F-RESET v2 — 2026-09-20 · Status: CANONICAL/CURRENT.** Aktywny dokument sterujący lub kontrolny f-reset. Źródła nadrzędne: `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md`, `30-F-RESET-EXECUTION-2026-09-20.md`, `31-IMPLEMENTATION-STATUS-MATRIX.md` oraz `contracts/openapi.yaml` dla API. Starsze F0–F33 i wskazania konkretnego hostingu są INPUT/LEGACY, nie kolejnością ani wyborem infrastruktury.

**Cel:** maksymalnie mocna kontrola kompletności dokumentacji względem dostępnych ustaleń z dwóch czatów projektu. Ten dokument nie obiecuje logicznie niemożliwej absolutnej pewności; definiuje dowody, które muszą przejść przed stwierdzeniem „repo jest zsynchronizowane”.

## Wynik bieżącego audytu

Po ponownym audycie wykryto i naprawiono istotne niespójności, których poprzedni audyt nie usunął z treści: przede wszystkim starsze aktywne dokumenty i `.cursor/rules/formazieleni.mdc` nadal traktowały Cloudflare Workers + D1 + R2 jako wybrany stack, mimo że aktualna decyzja pozostawia hosting/compute/DB/storage otwarte i używa Cloudflare wyłącznie jako warstwy ochronnej/public ingress. Naprawiono także zbyt mocny status typed clienta w `CHECKPOINT.md` i status `01-SPEC.md` jako rzekomego nadrzędnego source of truth.

## Kanoniczne ustalenia objęte kontrolą

1. F-RESET: A → B → C → D; F0–F33 = legacy/input.
2. A: GitHub, dev, staging, Cloudflare zone, Tunnel/private origin, API, DB, backup, restore, monitoring, BOLA/security, webhook, load; production blocked until gates pass.
3. Cloudflare: jedyny publiczny ingress/protective edge; origin nie może przyjmować ruchu z Internetu poza kontrolowaną ścieżką. Hosting/compute/DB/storage nie są jeszcze wybrane.
4. B: OpenAPI 3.0.x first (aktualnie 3.0.4), potem generated typed client; wspólny TS client dla web/portal/admin/mobile i adapter SketchUp z tego samego kontraktu.
5. C: Auth, CRM, Sales, Capacity, Projects, Offers, Payments, Files, Events, Automation; modular monolith/API-first; event-driven + transactional outbox.
6. D dopiero po Gate C: WWW, Portal, Mobile, SketchUp, Garden OS, AI, XR.
7. WWW = Sales Application; Site Analysis/Site Intelligence; brak obietnicy 100% konwersji; pełny lejek i KPI marża/przychód na godzinę właścicielki.
8. Site Intelligence: działka → Geoportal/OSM/SoilGrids/weather + Data Layer/cache/fallback → constraints/opportunities → CRM/projekt.
9. Plant Knowledge Graph; AI interpretuje, ale nie jest źródłem prawdy.
10. CRM = Revenue OS; Capacity jest częścią sprzedaży; Offer jest first-class object; payment flow i webhooki idempotent/replay-safe.
11. Files prywatne/versioned/checksummed; brak publicznych zgadywalnych URL.
12. Security: BOLA/BFLA/BOPLA, auth/session/magic-link, CSRF/CORS, SSRF, uploads, webhook, rate/resource abuse, admin escalation, tenant/object isolation, secrets, PII/logging, backup/restore.
13. Observability: logs/metrics/traces/errors/audit/business events; business funnel także monitorowany.
14. GitHub/OpenAPI/Core = source of truth. Cursor/ChatGPT/Codex/Claude/Grok mają role komplementarne; brak niezależnych stanów projektu.
15. Cursor rules/AGENTS wersjonowane; background agents bez prod secrets/client data.
16. Grok UI/limit może służyć interaktywnie; automatyzacja przez oficjalne xAI API/MCP, nie sesję konsumencką.
17. FZ MCP READ oddzielone od ACTIONS; write/high-risk = auth + approval + audit.
18. SketchUp: project_id/revision/designer_id/model_version; API → plants/materials/scenes → V-Ray → private files → portal. V-Ray Script Access/batch przed SDK.
19. Google/Meta = adaptery przez oficjalne API/webhooki, nie source of truth. Calendar↔Capacity, Gmail↔CRM, Drive↔projekty/pliki robocze.
20. Konto Google Sebastiana = test/integration. Agnieszka podłącza produkcyjne konto przez OAuth. Brak hard-coded account IDs; multi-account-ready.
21. Evidence Engine/case studies/local SEO bez programmatic spam.
22. Mobile = task/photo/push/relationship, nie klon portalu. Garden OS = digital twin ogrodu.
23. Każdy duży moduł: hypothesis → prototype → validation → implementation → measurement.
24. XR/community/marketplace/public advanced 3D/szerokie autonomiczne AI/microservices = deferred.
25. Każda przyszła decyzja projektowa aktualizuje kod/spec + właściwe docs + Decision Register + CHECKPOINT w jednym change-set.

## Reguła interpretacji starych dokumentów

- `docs/_research-*`, sekcje LEGACY w `CHECKPOINT.md` oraz F0–F33 są historią/inputem i mogą zawierać historyczne stacki, limity i hipotezy.
- W aktywnych dokumentach wzmianki Workers/D1/R2/Pages/Access/wrangler są oznaczone `INFRA F-RESET` jako historyczny kandydat. Nie są decyzją infrastrukturalną.
- Przy konflikcie: `00-DANE` (potwierdzone fakty użytkownika) + `00-MASTER-PLAN` + `25-MASTER-CONTEXT` + `26-DECISION-REGISTER` + `contracts/openapi.yaml` + najnowsze ADR wygrywają.

## Kryteria PASS

- Każdy aktywny dokument ma status F-RESET albo jest kanoniczny.
- Żaden aktywny rule/AGENTS nie narzuca Workers/D1/R2 jako wybranego stacku.
- Nie występuje aktywne wymaganie OpenAPI 3.1; decyzja użytkownika to 3.0.x.
- Typed client nie jest oznaczony jako ukończony/generowany, dopóki generator+CI+pełne pokrycie nie istnieją.
- ETAP C nie jest oznaczony jako ukończony, dopóki endpointy/authz/testy nie istnieją.
- ETAP D nie jest kolejką implementacji przed Gate C.
- Google account decision i dokumentacja auto-update są obecne w MASTER, ADR, rules i checkpoint.
- `scripts/audit-doc-consistency.py` kończy się kodem 0.

- `docs/29-RESEARCH-PROVENANCE-AND-INSPIRATION.md` — indeks zewnętrznych benchmarków, konkurencji, narzędzi i źródeł omawianych w audytach.
