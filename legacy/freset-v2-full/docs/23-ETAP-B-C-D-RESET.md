# ETAP B–D po F-RESET

<!-- FRESET-V2-SYNC-2026-09-20 -->
> **F-RESET v2 — 2026-09-20 · Status: CURRENT SUPPORTING DOC.** Dokument pomocniczy; w konflikcie wygrywa warstwa kanoniczna. Źródła nadrzędne: `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md`, `30-F-RESET-EXECUTION-2026-09-20.md`, `31-IMPLEMENTATION-STATUS-MATRIX.md` oraz `contracts/openapi.yaml` dla API. Starsze F0–F33 i wskazania konkretnego hostingu są INPUT/LEGACY, nie kolejnością ani wyborem infrastruktury.

<!-- FRESET-SYNC-2026-09-20 -->
> **AKTUALIZACJA F-RESET — 2026-09-20:** Dokument obowiązuje razem z nowym Gate A i MASTER PLAN. ETAP D pozostaje zamrożony do Gate C.  
> W razie konfliktu obowiązują `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md` i `contracts/openapi.yaml`.


## ETAP B — wykonany kontrakt bazowy
`contracts/openapi.yaml` jest źródłem prawdy. Wspólny TypeScript client: `clients/typescript`; SketchUp: `clients/sketchup`. Web i mobile mają importować ten sam pakiet TS. Nie wolno tworzyć osobnych ręcznych modeli DTO.

Gate B: lint kontraktu, unikalne operationId, provider conformance, testy BOLA, regeneracja klientów w CI, diff kontraktu i blokada breaking changes bez świadomej wersji API.

## ETAP C — Core Domain
Migracja `db/0014_core_domain_reset.sql` dodaje kanoniczne: Auth, Sales, Capacity, Projects, Offers, Payments, Files, Events/Outbox, Automation, Idempotency, Webhook receipts, Audit. Istniejące `leads` pozostają wejściem CRM — migracja jest addytywna, żeby nie niszczyć danych.

Wymagana kolejność implementacji serwera: Auth → CRM → Sales → Capacity → Projects → Offers → Payments → Files → Events → Automation. Każdy endpoint `{id}`: test owner/tenant/role. Każda mutacja: idempotency. Każda ważna zmiana biznesowa: domain event w tej samej transakcji.

## ETAP D — zamrożony do Gate C
WWW, Portal, Mobile, SketchUp UX, Garden OS, AI i XR nie rozwijają własnej logiki domenowej przed zamknięciem Core Domain. Mogą powstawać prototypy bez połączenia z produkcyjnymi danymi.
