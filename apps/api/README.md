# apps/api

Core API Forma Zieleni — modular monolith, API-first.

## Odpowiedzialność

- jedyne źródło prawdy dla danych domenowych (API + baza),
- kontrakt OpenAPI 3.0.x,
- autoryzacja i egzekucja reguł po stronie serwera,
- event-driven core oraz transactional outbox,
- integracje i automatyzacje uruchamiane w granicach API.

## Status

Szkielet katalogu. Framework HTTP, ORM i hosting nie zostały jeszcze wybrane.
Klienci (`web`, `portal`, `admin`, później mobile i SketchUp) korzystają z tego samego API.

Binding architecture: [`../../docs/architecture/CURRENT-ARCHITECTURE.md`](../../docs/architecture/CURRENT-ARCHITECTURE.md).  
Legacy OpenAPI under `legacy/` is reference only and does not complete Gate B.
