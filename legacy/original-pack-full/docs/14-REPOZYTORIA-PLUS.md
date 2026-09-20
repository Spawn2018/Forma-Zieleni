# Repozytoria, część 2: konkretne biblioteki pod moduły

Uzupełnia listę z `13-KOSZTY-I-REPOZYTORIA.md` §4. Kolumna „Sprawdzone” mówi, czy potwierdziłem istnienie i sposób działania wyszukiwaniem 17.09.2026. Licencję i aktywność repozytorium sprawdź przed użyciem komercyjnym.

## 1. Portal klienta i baza (M13, `db/0003`)

| Repozytorium | Do czego | Uwagi | Sprawdzone |
|---|---|---|---|
| `better-auth/better-auth` | logowanie linkiem e-mail, sesje, role dla portalu i strefy partnera | od 1.5 obsługuje D1 bezpośrednio (`database: env.DB`); pakiet ESM-only; instancję twórz wewnątrz obsługi żądania, bo binding D1 nie istnieje poza nią | tak |
| `drizzle-team/drizzle-orm` | typowane zapytania do D1 i migracje | alternatywa dla ręcznego SQL; nasze migracje 0001–0007 zostają źródłem schematu | tak |
| `cloudflare/workers-sdk` | Wrangler: migracje, sekrety, lokalne uruchamianie | podstawa pracy z D1 i R2 | tak |

## 2. Faktury, firmy, terminy (M42, F23, SLA)

| Repozytorium | Do czego | Uwagi | Sprawdzone |
|---|---|---|---|
| `fakturownia/API` | dokumentacja API z przykładami | używane przez `src/lib/fakturownia.ts` | tak |
| `wojtekmaj/is-valid-nip` | walidacja NIP w formularzu B2B | mała biblioteka, bez zależności | tak |
| `nip24pl/nip24-javascript-client` | sprawdzenie firmy po NIP, REGON, KRS, VAT UE | Apache 2.0, wymaga konta w NIP24 | tak |
| `pawel-id/bir1` | dane firmy z wyszukiwarki REGON (GUS) | darmowe źródło zamiast płatnego API | tak |
| `commenthol/date-holidays` | polskie dni ustawowo wolne do liczenia SLA i terminów kontaktu | potwierdź wsparcie dla Polski i licencję | nie |

## 3. Agenci AI i MCP (`12-ZGODNOSC-I-AGENCI.md` §5)

| Repozytorium | Do czego | Uwagi | Sprawdzone |
|---|---|---|---|
| `cloudflare/ai` (katalog `demos`) | szablony zdalnego serwera MCP, w tym `remote-mcp-authless` | start: `npm create cloudflare@latest -- mcp --template=cloudflare/ai/demos/remote-mcp-authless` | tak |
| `cloudflare/mcp-server-cloudflare` | produkcyjne przykłady serwerów MCP | wzorzec dla narzędzi `sprawdz_oferte` i `zloz_zapytanie` | tak |
| `modelcontextprotocol/typescript-sdk` | SDK protokołu | Agents SDK Cloudflare od lipca 2026 używa MCP SDK v2 z rozdzielonymi API serwera i klienta | tak |

## 4. Front i treść (M4, M14, M25, F1)

| Repozytorium | Do czego | Uwagi | Sprawdzone |
|---|---|---|---|
| `withastro/astro` | framework, katalog `examples` | podstawa projektu | tak (wcześniej) |
| `CloudCannon/pagefind` | wyszukiwarka statyczna | moduł M25 | tak (wcześniej) |
| `sneas/img-comparison-slider` | suwak przed/po jako web component | alternatywa dla własnego komponentu M4; sprawdź obsługę klawiatury | nie |
| `orestbida/cookieconsent` | baner zgód | faza F11 | tak (wcześniej) |
| `lovell/sharp` | przygotowanie zdjęć realizacji przed wgraniem | uruchamiane lokalnie, nie w Workerze | nie |
| `resend/react-email` | szablony e-maili jako komponenty | tylko jeśli zostajemy przy Resend | nie |

## 5. Jakość, pomiar, bezpieczeństwo

| Repozytorium | Do czego | Uwagi | Sprawdzone |
|---|---|---|---|
| `GoogleChrome/lighthouse-ci` | budżety wydajności w CI | `01-SPEC.md` §12 | nie |
| `dequelabs/axe-core`, `pa11y/pa11y-ci` | testy dostępności, sześć najczęstszych błędów | `10-UX-AUTOMATYZACJA.md` X4 | nie |
| `microsoft/playwright` | testy e2e formularza, quizu i portalu | fazy F8 i F14 | nie |
| `JustinBeckwith/linkinator` | martwe linki po migracji | faza F8 | nie |
| `louislam/uptime-kuma` | monitoring dostępności i webhooków | opcjonalnie na własnym serwerze | nie |
| `OWASP/CheatSheetSeries` | lista kontrolna bezpieczeństwa formularzy i sesji | materiał, nie biblioteka | nie |

## 6. Zapasowe warianty (gdy coś zacznie kosztować)

| Repozytorium | Zastępuje | Sprawdzone |
|---|---|---|
| `Thinkmill/keystatic` | Sanity | nie |
| `knadh/listmonk` | newsletter u dostawcy | nie |
| `umami-software/umami` | analityka | nie |
| `formbricks/formbricks` | ankiety M35 | nie |
| `binwiederhier/ntfy` | SMS-y o leadzie | nie |

## 7. Jak wybierać repozytorium

1. Czy da się to zrobić bez biblioteki? Jeśli tak, robimy bez niej (reguła 3 w `.cursor/rules/formazieleni.mdc`).
2. Licencja pozwala na użycie komercyjne (uwaga na fair-code, np. n8n).
3. Ostatni commit w ostatnich 6 miesiącach i brak otwartych zgłoszeń bezpieczeństwa.
4. Rozmiar po spakowaniu mieści się w budżecie JS z `01-SPEC.md` §12.
5. Działa w środowisku Workers (brak zależności od Node API), jeśli ma działać po stronie serwera.
6. Da się ją usunąć w jeden dzień. Jeśli nie, to nie biblioteka, tylko fundament.
