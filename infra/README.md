# infra

Materiały infrastrukturalne Forma Zieleni.

## Zasady

- hosting produkcyjny, baza, storage i konkretny provider **nie są jeszcze wybrane**,
- katalog nie zakłada Cloudflare Workers, D1, R2 ani innego konkretnego stacku origin,
- sekrety nigdy nie trafiają do repozytorium.

## Struktura

- `environments/` — opisy środowisk
- `cloudflare/` — docelowy publiczny ingress (edge), bez decyzji o origin
