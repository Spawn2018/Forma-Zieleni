# apps/admin

Panel personelu Forma Zieleni (CRM / Revenue OS).

## Odpowiedzialność

- zarządzanie leadami, sprzedażą, projektami i płatnościami,
- konfiguracja procesów wewnętrznych,
- operacje wymagające uprawnień personelu Forma Zieleni.

## Status

Aplikacja React Router Framework Mode (SSR). Układ, trasa `/` i granica
błędu są w `app/`. Sesja administracyjna klasyfikuje stany: wylogowany,
nieuprawniony, zalogowany (pusty). Loader nie zmyśla leadów, ofert ani
projektów. Osobna strefa zaufania od `apps/web` i `apps/portal`. Brak
wdrożenia, DNS i Cloudflare. Meta `noindex` jest ustawione.

Kolory są tokenami kanonu. Kroje Newsreader i Schibsted Grotesk są
wskazane w CSS. Pliki fontów nie są dołączone.
