# Forma Zieleni: pakiet do zbudowania strony, portalu, aplikacji i pracowni

Zacznij od `docs/00-MASTER-PLAN.md`. Indeks wszystkich modułów, automatyzacji, dowodów i faz: `docs/INDEKS.md`.

## Ścieżki czytania

| Chcę | Czytaj po kolei |
|---|---|
| Zrozumieć całość | `00-MASTER-PLAN`, `00-DANE`, `01-SPEC` |
| Zbudować stronę | `01-SPEC`, `02-DESIGN`, `03-COPY`, `04-PROMPTS` (fazy F0–F9) |
| Sprzedawać i reklamować | `05-MARKETING`, `06-REKLAMY-DIY`, `11-PLATFORMY`, `22-JEDEN-PROJEKTANT` |
| Obsłużyć klienta | `08-PORTAL-FUNKCJE`, `20-APLIKACJA-GARDEN-OS` |
| Usprawnić pracownię | `17-CAD-3D`, `18-SKETCHUP-CLAUDE`, `19-PRACOWNIA-IT`, `21-UPROSZCZENIE` |
| Sprawdzić zgodność i koszty | `12-ZGODNOSC-I-AGENCI`, `13-KOSZTY-I-REPOZYTORIA`, `14-REPOZYTORIA-PLUS` |
| Zobaczyć, co było pominięte | `09-AUDYT`, `CHECKPOINT.md` |

## Zawartość

| Katalog | Co w nim jest |
|---|---|
| `docs/` | plan główny, specyfikacja, design, teksty, prompty F0–F33, marketing, reklamy, platformy, zgodność, koszty, pracownia, audyt, indeks |
| `db/` | 13 migracji: leady i zdarzenia, CRM, portal, automatyzacje, platformy, zgodność i agenci, Fakturownia, niezawodność, pracownia, operacje, aplikacja, zakres, przepustowość |
| `src/` | `data/pricing.ts`, `data/quiz.json`, `lib/fakturownia.ts`, `lib/notify.ts` |
| `sanity/` | schematy CMS (14 typów treści) |
| `sketchup-plugin/` | wtyczka: zestawienie roślin, eksport scen, wysyłka do portalu |
| `scripts/` | import WordPressa, blokada placeholderów |
| `ads/` | słowa kluczowe i wykluczenia do Google Ads |
| `public/` | `robots.txt`, `llms.txt` |

## Jak pracować

1. Uzupełnij dane z `00-MASTER-PLAN.md` §7.
2. Skopiuj pakiet do pustego repozytorium (z ukrytym katalogiem `.cursor`).
3. Uruchamiaj prompty z `docs/04-PROMPTS.md` po kolei, każdy w nowym czacie Cursora, zgodnie z etapami z §5 planu głównego.
4. Po każdej fazie: `npm run check`, `npm run build`, `npm run placeholders`, testy i commit.
5. Start według `docs/LAUNCH.md`.

## Zasady nadrzędne

Tabela decyzji nadrzędnych jest w `00-MASTER-PLAN.md` §3. Gdy dokumenty się różnią, obowiązuje ona, a dane potwierdzone z `00-DANE.md` mają pierwszeństwo przed wszystkim.
