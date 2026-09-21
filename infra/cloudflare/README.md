# infra/cloudflare

Kierunek: Cloudflare jako **docelowy jedyny publiczny ingress** produkcyjny.

## Approved vs undecided

| Concern | Status |
|---------|--------|
| Cloudflare as public/security ingress | **Approved direction** |
| Private origin behind Cloudflare | **Approved target** (not implemented; localhost only now) |
| Later staging public ingress | **Cloudflare Tunnel** (FZ-A7). Not created. DNS/Cloudflare changes remain DANGEROUS |
| Operator overlay | **none** |
| Cloudflare Workers | **Not selected** |
| Cloudflare D1 | **Not selected** |
| Cloudflare R2 | **Not selected** |
| Cloudflare Pages | **Not selected** |
| Compute now | **Local Windows.** Docker is not a development prerequisite |
| Later Linux staging | **Docker Compose.** No host created |
| Production compute | **Later Owner decision** |
| Database | **PostgreSQL + Kysely** |
| Files now | **Local private adapter** |
| Later staging files | **Garage direction only.** Production store not permanently selected |

## Zakres tego katalogu

- notatki i przyszła konfiguracja związana z edge / DNS / dostępem publicznym,
- **bez** traktowania Workers / D1 / R2 / Pages jako wybranego stacku aplikacji,
- origin produkcyjny platformy **nie jest jeszcze wybrany**.

Editor Cloudflare plugins/tooling (if enabled) support ingress/security/documentation context only. They must not be read as selecting Workers, D1, R2 or Pages.

## Docelowy model

```text
Internet → Cloudflare (public ingress) → private origin
```

Now the origin is localhost only. The later staging path is Cloudflare
Tunnel. Production origin host is not selected. Workers, D1, R2 and
Pages are not the application stack.

## Stan obecny

- legacy produkcja / infrastruktura **CT8 nie jest jeszcze private origin**,
- ten katalog nie zmienia ani nie zastępuje obecnej strony produkcyjnej Forma Zieleni na CT8,
- migracja ruchu i private origin to osobny etap.

## Sekrety

Tokeny Cloudflare nigdy nie trafiają do git. Wyłącznie secret manager / env środowiska.

Binding architecture: [`../../docs/architecture/CURRENT-ARCHITECTURE.md`](../../docs/architecture/CURRENT-ARCHITECTURE.md).
