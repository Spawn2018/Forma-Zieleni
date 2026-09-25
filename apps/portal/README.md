# apps/portal

Portal klienta Forma Zieleni.

## Odpowiedzialność

- dostęp klienta do projektów, ofert, umów i plików,
- komunikacja i status realizacji,
- autoryzowane widoki danych należących do klienta.

## Status

Aplikacja React Router Framework Mode (SSR). Układ, trasa `/` i granica
błędu są w `app/`. Sesja portalu klasyfikuje stany: wylogowany,
nieuprawniony, zalogowany (pusty). Tożsamość pochodzi z Core API
`GET /v1/portal/session` (Better Auth). Loader nie zmyśla ofert, projektów ani plików. Zalogowany klient
widzi projekcję ofert z Core API (`GET /v1/portal/offers`) — bez ceny
i warunków. Projekcja projektów to `PORTAL-PROJECT-VIEW`.

Kolory są tokenami kanonu. Kroje Newsreader i Schibsted Grotesk są
wskazane w CSS. Pliki fontów nie są dołączone.

Oddzielna strefa zaufania od `apps/web` i `apps/admin`. Brak wdrożenia,
DNS i Cloudflare. Meta `noindex` jest ustawione na portalu.
