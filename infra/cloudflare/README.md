# infra/cloudflare

Kierunek: Cloudflare jako **docelowy jedyny publiczny ingress** produkcyjny.

## Approved vs undecided

| Concern | Status |
|---------|--------|
| Cloudflare as public/security ingress | **Approved direction** |
| Private origin behind Cloudflare | **Approved target** (not implemented for CT8 yet) |
| Cloudflare Workers | **UNDECIDED** |
| Cloudflare D1 | **UNDECIDED** |
| Cloudflare R2 | **UNDECIDED** |
| Cloudflare Pages | **UNDECIDED** |
| Hosting / compute / DB / storage provider | **UNDECIDED** |

## Zakres tego katalogu

- notatki i przyszła konfiguracja związana z edge / DNS / dostępem publicznym,
- **bez** traktowania Workers / D1 / R2 / Pages jako wybranego stacku aplikacji,
- origin produkcyjny platformy **nie jest jeszcze wybrany**.

Editor Cloudflare plugins/tooling (if enabled) support ingress/security/documentation context only. They must not be read as selecting Workers, D1, R2 or Pages.

## Docelowy model

```text
Internet → Cloudflare (public ingress) → private origin (TBD)
```

## Stan obecny

- legacy produkcja / infrastruktura **CT8 nie jest jeszcze private origin**,
- ten katalog nie zmienia ani nie zastępuje obecnej strony produkcyjnej Forma Zieleni na CT8,
- migracja ruchu i private origin to osobny etap.

## Sekrety

Tokeny Cloudflare nigdy nie trafiają do git. Wyłącznie secret manager / env środowiska.

Binding architecture: [`../../docs/architecture/CURRENT-ARCHITECTURE.md`](../../docs/architecture/CURRENT-ARCHITECTURE.md).
