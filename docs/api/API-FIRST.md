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

Na tym etapie:

- **nie** instalujemy frameworków API (NestJS, Fastify, itd.),
- **nie** wybieramy ORM,
- **nie** publikujemy jeszcze pełnej specyfikacji OpenAPI — najpierw fundament i decyzje.

### Legacy OpenAPI — not current

`legacy/freset-v2-full/contracts/openapi.yaml` (and provenance copies under `docs/knowledge/`) is **LEGACY / REFERENCE only**.

- It is **not** the current OpenAPI contract.
- It does **not** mean Master Plan Gate B is complete.
- It must **not** be implemented as the live contract without a new approved **API Contract** slice.

Kolejny krok kontraktowy (osobne zlecenie): szkielet OpenAPI i konwencje wersjonowania / błędów / auth.

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
