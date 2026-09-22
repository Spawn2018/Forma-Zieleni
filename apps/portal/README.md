# apps/portal

Portal klienta Forma Zieleni.

## Odpowiedzialność

- dostęp klienta do projektów, ofert, umów i plików,
- komunikacja i status realizacji,
- autoryzowane widoki danych należących do klienta.

## Status

Aplikacja React Router Framework Mode (SSR). Układ, trasa `/` i granica
błędu są w `app/`. Strona startowa jest bramką wylogowaną: nie pokazuje
projektów, ofert ani plików i nie zmyśla faktów CRM. Logowanie klienta
i odczyt projekcji z Core API są kolejnymi slice'ami.

Kolory są tokenami kanonu. Kroje Newsreader i Schibsted Grotesk są
wskazane w CSS. Pliki fontów nie są dołączone.

Oddzielna strefa zaufania od `apps/web` i `apps/admin`. Brak wdrożenia,
DNS i Cloudflare. Meta `noindex` jest ustawione na portalu.
