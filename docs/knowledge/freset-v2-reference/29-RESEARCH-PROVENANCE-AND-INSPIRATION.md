# Research provenance & inspiration — F-RESET

<!-- FRESET-V2-SYNC-2026-09-20 -->
> **F-RESET v2 — 2026-09-20 · Status: CANONICAL/CURRENT.** Aktywny dokument sterujący lub kontrolny f-reset. Źródła nadrzędne: `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md`, `30-F-RESET-EXECUTION-2026-09-20.md`, `31-IMPLEMENTATION-STATUS-MATRIX.md` oraz `contracts/openapi.yaml` dla API. Starsze F0–F33 i wskazania konkretnego hostingu są INPUT/LEGACY, nie kolejnością ani wyborem infrastruktury.

**Status: CURRENT INDEX OF DISCUSSED RESEARCH.** Ten plik zapobiega zgubieniu nazw/wniosków, które pojawiły się w dwóch czatach i audytach, ale nie są decyzjami architektonicznymi. Przed wdrożeniem każdą zewnętrzną usługę/repo/cennik trzeba sprawdzić ponownie.

## Produkty/konkurencja/workflow, które były analizowane jako inspiracja
- Yardzen — zdalny/guided proces projektowania i sprzedaży; inspiracja dla prowadzonego lejka i productized service.
- GardenPuzzle — narzędzia wizualizacji/projektowania ogrodu; inspiracja funkcjonalna, nie zależność.
- iScape — wizualizacja krajobrazu/AR; inspiracja dla późniejszego D/XR, nie priorytet Core.
- Houzz Pro — CRM/operacje dla branży projektowej; inspiracja dla Revenue OS i workflow klienta.
- Jobber — field-service/landscaping operations; inspiracja dla harmonogramu, klienta i operacji.

## Software houses / product engineering analizowane jako benchmark sposobu pracy
- Netguru — benchmark product engineering/discovery/delivery.
- Monterail — benchmark case-study/product delivery.
- PostHog — benchmark product analytics/experimentation i podejścia do telemetryki; nie oznacza wyboru PostHog jako vendora.

## Standardy/narzędzia techniczne, które były sprawdzane
- OpenAPI 3.0.x — decyzja użytkownika; aktualny kontrakt 3.0.4.
- OpenAPI Generator (`typescript-fetch`) — kandydat do generowania wspólnego typed clienta; Gate B wymaga generatora+CI, konkretny generator może zostać zmieniony po teście.
- Pact — kandydat do consumer/provider contract testing obok OpenAPI; nie jest jeszcze obowiązkową zależnością.
- OWASP API Security Top 10 + ASVS — baza macierzy security; nie ograniczamy testów do samego BOLA.
- OpenTelemetry — kierunek vendor-neutral observability; konkretny backend telemetryki jeszcze nie wybrany.

## Dane działki / Site Intelligence
- Geoportal — źródła geodanych dla działki.
- SoilGrids — dane glebowe; zewnętrzne API nie może być runtime single point of failure, dlatego cache/normalizacja/fallback w Data Layer.
- OpenStreetMap/OSM — kontekst przestrzenny; respektować usage policy i nie uzależniać krytycznego UX od publicznego endpointu.
- Open-Meteo — kandydat do weather/historical climate data; dane pobierać przez adapter/cache i mieć możliwość wymiany providera.

## Google/Meta i sprzedaż
- Google Business Profile Performance + Reviews — metryki/prośby o opinie/odpowiedzi jako integracja, nie source of truth.
- Google LocalBusiness structured data — SEO dla publicznego WWW w ETAPIE D.
- Google Calendar/Drive/Gmail — adaptery do Capacity/projektów/komunikacji; konto Sebastiana testowe, Agnieszka produkcyjnie przez OAuth; multi-account-ready.
- Meta — oficjalne API/webhooki i atrybucja leadów; Core CRM zachowuje stan biznesowy.

## Narzędzia pracowni i AI
- Cursor Ultimate — główny interaktywny warsztat developerski; Project Rules/AGENTS wersjonowane; background agents bez prod secrets.
- ChatGPT/Codex — research/architektura/implementacja/review z repo jako stanem projektu.
- Claude — niezależny reviewer/refactor/debugger; nie osobny source of truth.
- Grok/xAI — interaktywnie w Cursorze w ramach dostępnego limitu; automatyzacja tylko oficjalnym API/MCP.
- SketchUp Ruby Extension API — adapter Core i automatyzacja modelu/projektu.
- V-Ray Script Access + batch rendering — pierwsza warstwa automatyzacji renderów; Application SDK dopiero później, jeśli wartość uzasadni złożoność.

## Reguła
Wymienienie produktu/usługi/repozytorium w tym indeksie nie oznacza wyboru. Decyzje są wyłącznie w `26-DECISION-REGISTER.md`; aktualny status implementacji w `CHECKPOINT.md` i `27/28`.
