# apps/web

Publiczna strona WWW Forma Zieleni — aplikacja sprzedażowa i marketingowa.

## Odpowiedzialność

- prezentacja oferty i marki,
- lejek sprzedażowy i pozyskiwanie leadów,
- treści publiczne bez dostępu do danych klienta.

## Status

Aplikacja React Router Framework Mode (SSR). Układ, trasa `/` i granica błędu są w `app/`. Tytuł strony głównej pochodzi wyłącznie z opublikowanego dokumentu Core API (`GET /v1/content/:id`), gdy ustawione są `FZ_API_ORIGIN` i `FZ_PUBLIC_HOME_ID`. Bez tej konfiguracji strona nie zmyśla oferty.

Kolory są tokenami kanonu. Kroje Newsreader i Schibsted Grotesk są wskazane w CSS. Pliki fontów nie są dołączone: kanon wymaga sprawdzenia licencji, polskich glifów i kosztu ładowania przed dostarczeniem plików, a zmierzonego podzbioru OFL jeszcze nie ma.

Brak wdrożenia, DNS i Cloudflare. Galeria i strony oferty są kolejnymi slice'ami.
