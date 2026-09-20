# Development runbook

Lokalny rozwój monorepo Forma Zieleni.

## Wymagania

- Node.js `>= 24`
- pnpm `>= 10` (repo pinuje `pnpm@10.33.2` przez `packageManager`)
- Git

Nie wymagamy Dockera na tym etapie.

## Setup

```bash
pnpm install
```

Skopiuj zmienne środowiskowe tylko lokalnie (nigdy nie commituj sekretów):

```bash
cp .env.example .env
```

`.env.example` zawiera wyłącznie placeholdery.

## Skrypty root

| Skrypt | Opis |
|--------|------|
| `pnpm dev` | `turbo dev` — aplikacje, gdy będą miały task `dev` |
| `pnpm build` | `turbo build` |
| `pnpm lint` | `turbo lint` |
| `pnpm typecheck` | `turbo typecheck` |
| `pnpm test` | `turbo test` |

Na etapie samego fundamentu (bez pakietów z taskami) Turbo może zakończyć się bez pracy do wykonania — to oczekiwane.

## Struktura

- `apps/*` — aplikacje (`web`, `portal`, `admin`, `api`)
- `packages/*` — kod współdzielony
- `docs/*` — dokumentacja
- `infra/*` — notatki infrastrukturalne (bez wyboru hostingu)
- `tooling/*` — skrypty repo

## Zasady

- pracujemy na `main`,
- nie commituj sekretów ani danych klientów,
- nie zmieniaj legacy produkcji CT8 z tego repo na etapie fundamentu,
- nie instaluj frameworków aplikacji, dopóki nie zostaną zlecone.

## Powiązane dokumenty

- [../architecture/CURRENT-ARCHITECTURE.md](../architecture/CURRENT-ARCHITECTURE.md) — sole binding current architecture
- [../architecture/SECURITY.md](../architecture/SECURITY.md)
- [../../START-HERE-CURSOR.md](../../START-HERE-CURSOR.md) — Cursor agent entrypoint
