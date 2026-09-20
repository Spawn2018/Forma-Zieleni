# F-RESET v2 — wykonanie pełnego resetu architektury i dokumentacji

<!-- FRESET-V2-SYNC-2026-09-20 -->
> **INFRA F-RESET:** Workers/D1/R2/Pages/wrangler, jeśli są wspomniane, są wyłącznie historycznym kandydatem; hosting/compute/DB/storage nie są wybrane.
> **Status: CANONICAL/CURRENT — 2026-09-20.** Ten reset zastępuje interpretację wszystkich wcześniejszych roadmap, bez usuwania wartościowych wymagań historycznych.

## 1. Cel resetu

F-RESET v2 zamienia dotychczasowy zbiór pomysłów, prototypów i faz F0–F33 w jeden kontrolowany program budowy platformy. Nie dokładamy nowej funkcji produktu. Porządkujemy zależności, źródła prawdy, bramki jakości, status implementacji i odpowiedzialność dokumentów tak, aby kolejne prace nie mogły przypadkowo wrócić do starego stacku lub zacząć ETAPU D przed fundamentem.

## 2. Stan po resecie

**Kolejność bez wyjątków:** A Security & Infrastructure Lab → B API Contract → C Core Domain → D Products.

**Źródła prawdy:** fakty właściciela w `00-DANE.md`; program i architektura w `00-MASTER-PLAN.md`; skondensowany kontekst w `25-MASTER-CONTEXT-2026-09-20.md`; decyzje w `26-DECISION-REGISTER.md`; kontrakt API w `contracts/openapi.yaml`; stan wykonania w `31-IMPLEMENTATION-STATUS-MATRIX.md`; bieżący checkpoint w `/CHECKPOINT.md`.

**Infrastruktura:** Cloudflare jest obowiązkową publiczną warstwą ochronną/ingress. Origin ma być prywatny. Hosting, compute, DB i object storage pozostają do wyboru w ETAPIE A na podstawie testów kosztu, niezawodności, backup/restore, bezpieczeństwa i przenośności. Historyczne Workers/D1/R2/Pages nie są wyborem.

**API:** OpenAPI 3.0.x first. Aktualny kontrakt 3.0.4 ma 44 operacje i 12 schematów. Ręczne scaffoldy klientów nie zamykają Gate B. Gate B wymaga generatora, CI, pełnego pokrycia kontraktu, contract tests i kontroli breaking changes.

**Core:** modular monolith/API-first. Auth → CRM → Sales → Capacity → Projects → Offers → Payments → Files → Events → Automation. Site Intelligence i Plant Knowledge dołączają po stabilizacji fundamentu. Domain events/outbox, idempotency, authorization, audit i observability są częścią Core, a nie dodatkiem po premierze.

**Produkty:** WWW, Portal, Mobile, SketchUp UX, Garden OS, AI i XR nie mogą tworzyć własnych modeli domenowych. Mogą istnieć prototypy UI, ale produkcyjna logika czeka na Gate C.

## 3. Model sprzedaży i operacji

Jedna ścieżka: Anonymous Visitor → Site Analysis → Qualified Lead → Consultation → Opportunity → Offer → Contract → Payment → Project → Garden → Garden OS → Review/Referral/Maintenance/Next Project.

WWW jest Sales Application. Site Analysis jest wejściem niskiego oporu. CRM jest Revenue OS. Capacity jest elementem sprzedaży. Oferta jest obiektem systemowym. Projekt powstaje po spełnieniu reguł kontraktu/płatności. Najważniejszy KPI biznesowy to wartość/marża na godzinę właścicielki, nie liczba leadów.

## 4. Site Intelligence i wiedza roślinna

Property → geospatial → environment → soil → climate/weather → sun → topography → context → Plant Knowledge → constraints/opportunities. Geoportal, OSM, SoilGrids i pogoda są adapterami danych. Dane normalizujemy/cache'ujemy w Forma Zieleni Data Layer. AI może tłumaczyć i syntetyzować, ale nie jest źródłem prawdy botanicznej ani geodezyjnej.

Plant Knowledge Graph ma przechowywać m.in. tolerancje, glebę/pH/wilgotność, światło, rozmiar docelowy, tempo wzrostu, sezonowość, kwitnienie, wartość dla fauny, pielęgnację, toksyczność, charakter wizualny, kompatybilność i ograniczenia.

## 5. Security baseline

Produkcja jest zablokowana do przejścia Gate A. Minimalna macierz: BOLA, BFLA, BOPLA, broken auth, session/magic-link, CSRF/CORS, SSRF, uploads, file authorization, admin escalation, object/tenant isolation, webhook signature/idempotency/replay, rate/resource abuse, secrets, PII/logging, backup i realny restore, monitoring oraz load test. Cloudflare nie zastępuje authorization w aplikacji.

## 6. Integracje i narzędzia

Google/Meta są adapterami. Core pozostaje source of truth. Konto Google Sebastiana jest test/integration; Agnieszka podłączy konto produkcyjne przez OAuth. Brak hard-coded account IDs; model multi-account-ready. Calendar ↔ Capacity, Gmail ↔ CRM/communication, Drive ↔ project working files.

SketchUp identyfikuje projekt przez `project_id`, `project_revision`, `designer_id`, `model_version`; przepływ prowadzi przez Core API do plants/materials/scenes, V-Ray batch/render, private Files i Portal. Eliminujemy ręczne przepisywanie.

GitHub/OpenAPI/Core są wspólnym stanem pracy agentów. Cursor implementuje według rules/AGENTS. ChatGPT/Codex wspiera architekturę/implementację/review; Claude może pełnić niezależny review; Grok interaktywnie w dostępnym limicie, a automatyzacja wyłącznie oficjalnym API/MCP. FZ MCP rozdziela READ i ACTIONS; ryzykowne write wymaga auth/approval/audit.

## 7. Automatyzacja developmentu

Docelowy pipeline: Issue/decision → spec/ADR → OpenAPI (gdy dotyczy API) → generated clients → implementation → unit/integration/contract/security tests → independent review → PR → human approval → staging → smoke/load/security → production. Każda zmiana aktualizuje dokumentację w tym samym change-set.

## 8. Co zostało celowo odroczone

XR, community, marketplace, public advanced 3D, szerokie autonomiczne AI i mikroserwisy. Mogą wrócić dopiero po danych potwierdzających wpływ na sprzedaż, delivery, retencję lub marżę.

## 9. Definition of Done F-RESET v2

F-RESET v2 jest zakończony, gdy: każdy dokument ma status względem resetu; wszystkie kanoniczne decyzje są w Decision Register; istnieje jedna macierz statusu; stare stacki nie mogą sterować implementacją; OpenAPI przechodzi walidację; audyt dokumentacji przechodzi; CHECKPOINT wskazuje prawdziwy stan; manifest plików jest odtworzony. To nie oznacza ukończenia A/B/C/D — reset porządkuje program, nie udaje implementacji.
