# Forma Zieleni: pakiet do zbudowania strony, portalu, aplikacji i pracowni

Zacznij od `docs/00-MASTER-PLAN.md`, potem `docs/30-F-RESET-EXECUTION-2026-09-20.md` i `docs/31-IMPLEMENTATION-STATUS-MATRIX.md`. `docs/INDEKS.md` kataloguje również historyczne moduły/fazy, ale nie jest roadmapą.

## Ścieżki czytania

| Chcę | Czytaj po kolei |
|---|---|
| Zrozumieć całość | `00-MASTER-PLAN`, `25-MASTER-CONTEXT-2026-09-20`, `30-F-RESET-EXECUTION-2026-09-20`, `31-IMPLEMENTATION-STATUS-MATRIX`, potem `00-DANE`/`01-SPEC` jako input |
| Zbudować stronę | Najpierw Gate A/B/C; dopiero ETAP D: `01-SPEC`, `02-DESIGN`, `03-COPY`, `04-PROMPTS` jako wymagania/legacy input |
| Sprzedawać i reklamować | `05-MARKETING`, `06-REKLAMY-DIY`, `11-PLATFORMY`, `22-JEDEN-PROJEKTANT` |
| Obsłużyć klienta | `08-PORTAL-FUNKCJE`, `20-APLIKACJA-GARDEN-OS` |
| Usprawnić pracownię | `17-CAD-3D`, `18-SKETCHUP-CLAUDE`, `19-PRACOWNIA-IT`, `21-UPROSZCZENIE` |
| Sprawdzić zgodność i koszty | `12-ZGODNOSC-I-AGENCI`, `13-KOSZTY-I-REPOZYTORIA`, `14-REPOZYTORIA-PLUS` |
| Zobaczyć, co było pominięte | `09-AUDYT`, `CHECKPOINT.md` |

## Zawartość

| Katalog | Co w nim jest |
|---|---|
| `docs/` | plan główny, specyfikacja, design, teksty, prompty F0–F33, marketing, reklamy, platformy, zgodność, koszty, pracownia, audyt, indeks |
| `db/` | 14 migracji: leady i zdarzenia, CRM, portal, automatyzacje, platformy, zgodność i agenci, Fakturownia, niezawodność, pracownia, operacje, aplikacja, zakres, przepustowość |
| `src/` | `data/pricing.ts`, `data/quiz.json`, `lib/fakturownia.ts`, `lib/notify.ts` |
| `sanity/` | schematy CMS (14 typów treści) |
| `sketchup-plugin/` | wtyczka: zestawienie roślin, eksport scen, wysyłka do portalu |
| `scripts/` | import WordPressa, blokada placeholderów |
| `ads/` | słowa kluczowe i wykluczenia do Google Ads |
| `public/` | `robots.txt`, `llms.txt` |

## Jak pracować

1. Uzupełnij dane z `00-MASTER-PLAN.md` §7.
2. Skopiuj pakiet do pustego repozytorium (z ukrytym katalogiem `.cursor`).
3. Realizuj aktualną kolejność z `docs/00-MASTER-PLAN.md`: ETAP A → B → C → D. Prompty F0–F33 są materiałem LEGACY/INPUT i nie sterują kolejnością.
4. Po każdej fazie: `npm run check`, `npm run build`, `npm run placeholders`, testy i commit.
5. Start według `docs/LAUNCH.md`, dopiero po przejściu Gate A/B/C.

## Zasady nadrzędne

Tabela decyzji nadrzędnych jest w `00-MASTER-PLAN.md` §3. Gdy dokumenty się różnią, obowiązuje ona, a dane potwierdzone z `00-DANE.md` mają pierwszeństwo przed wszystkim.


## F-RESET 2026-09-20 — API/Core
- `contracts/openapi.yaml` — ETAP B, kanoniczny OpenAPI 3.0.4
- `clients/typescript/` — wspólny typed client dla web/mobile
- `clients/sketchup/` — klient Ruby względem tego samego kontraktu
- `db/0014_core_domain_reset.sql` — ETAP C Core Domain
- `docs/23-ETAP-B-C-D-RESET.md` — bramki B/C/D
- `docs/24-AI-SOFTWARE-ORCHESTRATION-2026.md` — orkiestracja SketchUp/V-Ray/AI/Google/Meta

## Dokumentacja kanoniczna po audycie
- `docs/25-MASTER-CONTEXT-2026-09-20.md` — wszystkie ustalenia z dwóch czatów.
- `docs/26-DECISION-REGISTER.md` — rejestr decyzji.
- `docs/27-AUDIT-COVERAGE-2026-09-20.md` — macierz kompletności.
- `AGENTS.md` + `.cursor/rules/` — obowiązek synchronizacji dokumentacji przy każdej zmianie.

- `docs/28-ZERO-OMISSION-AUDIT-2026-09-20.md` — najsurowszy audyt kompletności i reguły anty-pominięciowe.

- `docs/29-RESEARCH-PROVENANCE-AND-INSPIRATION.md` — indeks zewnętrznych benchmarków, konkurencji, narzędzi i źródeł omawianych w audytach.

- `docs/30-F-RESET-EXECUTION-2026-09-20.md` — wykonanie F-RESET v2.
- `docs/31-IMPLEMENTATION-STATUS-MATRIX.md` — jedyna macierz realnego stanu implementacji.
