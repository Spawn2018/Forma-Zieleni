# API-first — Forma Zieleni

## Zasada

Kontrakt API powstaje przed (lub równolegle i nadrzędnie względem) implementacją UI.

Wszystkie klienci korzystają z **tego samego Core API**:

- `apps/web`
- `apps/portal`
- `apps/admin`
- przyszłe mobile
- przyszła integracja SketchUp
- integracje zewnętrzne

## OpenAPI 3.0.x

- kontrakt HTTP definiujemy w **OpenAPI 3.0.x**,
- OpenAPI jest źródłem prawdy powierzchni API,
- docelowo generujemy typy (`packages/types`) i klienta (`packages/api-client`).

## Source of truth

**Core API + baza** są źródłem prawdy danych domenowych.

- klienci nie definiują kanonicznego stanu,
- walidacja i autoryzacja są egzekwowane na serwerze,
- ewentualne read-modele są pochodne.

## Granice etapu

Current-tree contract:

- [`../../contracts/openapi.json`](../../contracts/openapi.json) is OpenAPI 3.0.4 and the source of truth for the visitor lead-qualification slice.
- Shared errors, `/v1`, cursor pagination, filter, sort and idempotency are defined there.
- Typed path contracts live in `packages/api-client`. The lead HTTP runtime is `apps/api` (Hono). `GET /v1/health` is liveness. `GET /v1/ready` checks PostgreSQL. This package does not generate a transport client.
- Core API framework is Hono. Data access is Kysely on PostgreSQL. Local development is native Windows; later Linux staging is Docker Compose. Production compute remains a later Owner decision. See [`../architecture/CURRENT-ARCHITECTURE.md`](../architecture/CURRENT-ARCHITECTURE.md).

### Legacy OpenAPI — not current

`legacy/freset-v2-full/contracts/openapi.yaml` (and provenance copies under `docs/knowledge/`) is **LEGACY / REFERENCE only**.

- It is **not** the current OpenAPI contract.
- It does **not** mean every Gate B runtime client is complete.
- It must **not** be implemented as the live contract.

## Konwencje (kierunkowe, do utrwalenia w ADR)

- wersjonowanie API (np. `/v1`) — decyzja przy pierwszym kontrakcie,
- jednolity format błędów,
- idempotency dla mutacji finansowych i webhooki,
- korelacja requestów (`requestId`) w logach.

## Powiązane dokumenty

- [../architecture/CURRENT-ARCHITECTURE.md](../architecture/CURRENT-ARCHITECTURE.md) — sole binding current architecture
- [../architecture/SECURITY.md](../architecture/SECURITY.md)
- [../architecture/DECISIONS.md](../architecture/DECISIONS.md) — ADR history
- [../knowledge/POST-V2-DECISIONS.md](../knowledge/POST-V2-DECISIONS.md) — current override ledger
