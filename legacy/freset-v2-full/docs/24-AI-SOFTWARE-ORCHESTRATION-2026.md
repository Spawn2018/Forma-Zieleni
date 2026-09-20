# Forma Zieleni — orkiestracja narzędzi 2026

<!-- FRESET-V2-SYNC-2026-09-20 -->
> **F-RESET v2 — 2026-09-20 · Status: CURRENT SUPPORTING DOC.** Dokument pomocniczy; w konflikcie wygrywa warstwa kanoniczna. Źródła nadrzędne: `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md`, `30-F-RESET-EXECUTION-2026-09-20.md`, `31-IMPLEMENTATION-STATUS-MATRIX.md` oraz `contracts/openapi.yaml` dla API. Starsze F0–F33 i wskazania konkretnego hostingu są INPUT/LEGACY, nie kolejnością ani wyborem infrastruktury.

<!-- FRESET-SYNC-2026-09-20 -->
> **AKTUALIZACJA F-RESET — 2026-09-20:** Rozszerzono zasady o Google OAuth/multi-account, MCP READ/ACTIONS, AI task routing i brak automatyzacji konsumenckich sesji.  
> W razie konfliktu obowiązują `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md` i `contracts/openapi.yaml`.


## Zasada
GitHub + OpenAPI + Core API są centrum. Modele AI nie przekazują sobie stanu przez kopiowanie czatów. Stan projektu jest wersjonowany w repo: `AGENTS.md`, `.cursor/rules`, kontrakt API, ADR-y, testy i issue/PR. MCP/API są adapterami.

## Podział pracy
- Cursor: główne IDE i agent wykonawczy; Project Rules są wersjonowane. Background Agents tylko na repo bez produkcyjnych sekretów i z obowiązkowym PR/review.
- ChatGPT/Codex: audyt architektury, research, test plans, review repo i zadania wieloetapowe; GitHub jest wspólnym źródłem kodu.
- Claude/Claude Code: niezależny reviewer/refactor/debugger; ten sam `AGENTS.md`, OpenAPI i MCP read-only domyślnie.
- Grok: drugi niezależny research/reviewer, szczególnie źródła X/web. Do automatyzacji używać oficjalnego xAI API/MCP, a nie automatyzować logowania do konsumenckiej subskrypcji.
- SketchUp: plugin Ruby pobiera projekt i upload-intent z Core API; model ma stabilne `project_id`, nie tylko slug.
- V-Ray: render queue uruchamiana z metadanych scen; najpierw Ruby Script Access / batch render, a App SDK tylko jeśli potrzebny będzie osobny render-worker.
- Google: Business Profile Performance + reviews do hurtowni metryk; Workspace przez oficjalne API/MCP; żaden agent nie dostaje pełnego Drive/Gmail bez potrzeby.
- Meta: reklamy/lead-y/wiadomości wyłącznie przez oficjalne API i webhooki; normalizacja do `lead.created` + `source`.

## Automatyczny pipeline kodu
Issue/spec → kontrakt OpenAPI → lint/breaking-change check → wygenerowany client → implementacja → unit/integration → provider contract → BOLA/security → PR → AI review 1 → AI review 2 dla ryzykownych zmian → human approve → staging → smoke/load → production.

## Pipeline projektu ogrodu
CRM Project → SketchUp `project_id` → sceny + plant metadata → V-Ray batch/render → prywatny upload intent → Files → `file.created` → Portal approval → `client.approved` → następny etap projektu.

## Pipeline sprzedażowy
Google/Meta/WWW → lead ingestion → dedupe → lead.created → qualification → next action → consultation → offer → payment webhook → project.created. AI może przygotować draft, scoring i podsumowanie, ale nie samodzielnie wysyłać ceny/umowy bez reguły i akceptacji.

## Kontrola kosztów modeli
Router zadań: tani/szybki model do klasyfikacji i ekstrakcji; mocny model do architektury i zmian wieloplikowych; drugi model tylko do review wysokiego ryzyka. Logować provider/model/task/tokens/cost/result. Limity subskrypcji w UI traktować jako interaktywne narzędzia człowieka; automatyzacje serwerowe korzystają z API keys/service accounts z budżetami i limitami.

## Bezpieczeństwo MCP/agentów
Domyślnie read-only. Write tools osobno. Produkcja bez shell/browser write dla agentów. Sekrety poza repo. Egress allowlist dla agentów wykonujących kod. Prompt injection traktować jak wejście niezaufane. Każde działanie na CRM/płatnościach/plikach ma actor, request_id i audit log.

## Google account lifecycle
Aktualne konto Sebastiana jest wyłącznie testowe/integracyjne. Produkcja: Agnieszka przechodzi własny OAuth. Tokeny są per connection/user, szyfrowane i odwoływalne; żadnych stałych account IDs w kodzie. Adapter ma obsługiwać reconnect/revoke i w przyszłości wiele kont. Calendar synchronizuje availability i zaakceptowane terminy, ale Capacity/Core pozostaje source of truth. Drive/Gmail są pobierane minimalnym zakresem uprawnień. Workspace MCP może pomagać agentom, lecz ponieważ oficjalnie jest Developer Preview, backend produktu musi mieć stabilny adapter API/OAuth.

## MCP surfaces
`FZ MCP READ`: get_project, get_lead, get_capacity, get_offer, get_site_analysis, search_plants, search_project_files.  
`FZ MCP ACTIONS`: update_lead, create_draft_offer, create_task, request_render, send_message, create_payment, publish. ACTIONS: osobne scopes, step-up auth/approval dla ryzyka, actor/request_id/audit.

## AI Task Router
Loguj: provider, model, task_type, tokens, cost, duration, result, human_accepted. Tani/szybki model: ekstrakcja/klasyfikacja; coding agent: implementacja; mocny model: architektura/security; drugi niezależny model: review zmian wysokiego ryzyka. Subskrypcje UI (Cursor/Grok itp.) nie są backendem automatyzacji.
