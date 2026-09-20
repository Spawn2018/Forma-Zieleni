# Audyt pakietu (17.09.2026)

Sprawdziłem cały czat, 8 zrzutów ekranu i obecną stronę (/, /o-nas/, /artykuly/). Status w §B nadaje skrypt: szuka w pliku konkretnego fragmentu. Tabela nie jest wpisana ręcznie.

## §A. Brutalna prawda: co było pominięte lub błędne

1. **Obecna strona.** Aż do tego audytu pobrałem tylko stronę główną, bez /o-nas/ i /artykuly/. Przez to w pakiecie brakowało:
   - głównego projektanta: inż. arch. kraj. Agnieszka Pupiało,
   - informacji „od prawie 10 lat”,
   - partnera DAMPS POL i rabatu dla klientów,
   - parków osiedlowych i roślinności przy ciągach pieszych i samochodowych,
   - wzorów kostki brukowej i małej architektury,
   - tarasów widokowych w apartamentach,
   - 6 istniejących artykułów.
2. **Błędne założenie o adresach.** W 01-SPEC napisałem „stare slugi zachowane”. Tymczasem artykuły mają adresy z datą (`/RRRR/MM/DD/slug/`), więc każdy potrzebuje 301. Plik przekierowań nie miał ani jednego artykułu. Jeden slug to `elementor-1143`.
3. **Błędna poprawka.** Usunąłem „osiedla” z tekstów jako niepotwierdzone, a obecna strona wymienia parki osiedlowe.
4. **Pliki, do których odsyłały dokumenty, a których nie było:**
   - `src/data/pricing.ts` (odsyłały do niego 01-SPEC M3, 04-PROMPTS F5, 08 M17 i reguły),
   - skrypt migracji artykułów obiecany w pierwszej odpowiedzi,
   - schematy CMS (była tylko lista pól w F2),
   - `docs/LAUNCH.md` i `.dev.vars.example` (były tylko polecenia dla Cursora).
5. **Błąd w bazie, który zatrzymałby wdrożenie v2.** `leads.source`, `leads.project_type` i `events.name` miały listy dozwolonych wartości bez nowych modułów. Zapis leada z kreatora, „mojego ogrodu”, Mikroretencji, konsultacji, strefy partnera czy asystenta skończyłby się błędem.
6. **Niespójności między plikami:**
   - `workers/retention` w jednym miejscu i `workers/automation` w innym,
   - 01-SPEC §7, §14, §15 i §18 nie uwzględniały modułów v2,
   - robots.txt nie blokował /portal/ i /partner/, a sitemapa w F0 nie wykluczała nowych stron prywatnych,
   - 02-DESIGN nie miał komponentów v2, a 03-COPY nie miał meta dla nowych podstron,
   - tekst SMS z góry zakładał, że do leadów dzwoni kobieta.
7. **Fakty z mojej wiedzy, niesprawdzone wyszukiwaniem w tym czacie** (zweryfikuj przed wdrożeniem):
   - ograniczenie wyników rozszerzonych FAQ w Google,
   - progi Core Web Vitals,
   - parametr `normalize` w SMSAPI,
   - BLIK i Przelewy24 w Stripe,
   - obowiązek przejrzystości z AI Act od 2.08.2026,
   - darmowy plan Cloudflare Access,
   - format CSV dla Bulk Redirects,
   - jurysdykcja EU w D1,
   - pole `_sanityAsset` w imporcie Sanity,
   - polskie znaki w krojach Newsreader i Schibsted Grotesk,
   - „ok. 50 zdarzeń tygodniowo” w Meta,
   - limit 30,4 × budżet dzienny w Google Ads,
   - podstawa z art. 6 ust. 1 lit. b RODO,
   - Prawo komunikacji elektronicznej przy ofertach B2B.
8. **Czego nie sprawdziłem:**
   - treści /agritech-about-us/ i /agritech-service/,
   - starszych artykułów za przyciskiem „Więcej”,
   - strony WFOŚiGW w Gdańsku (warunki Mikroretencji potwierdziłem dla Torunia i w źródłach krajowych).
9. **Zakres pakietu.** To specyfikacja plus część kodu: SQL, JSON, `pricing.ts`, schemat Sanity, import WordPressa i skrypt blokujący placeholdery. Kodu aplikacji (strony, API, portal) nie napisałem. Powstaje w Cursorze według promptów F0–F16.

**Naprawione dziś:** punkty 1–6 (szczegóły w §B–§E). Punkty 7–9 pozostają do weryfikacji i są też na liście w `00-DANE.md`.

## §B. Każdy punkt ze zrzutów ekranu

Na zrzutach jest 126 linii, bo część się powtarza między nachodzącymi ekranami. Unikalnych punktów: 113. Punkty typu „Created…” czy „Reviewing…” to czynności. Dla nich kontrola sprawdza, czy istnieje ich wynik.

| # | Punkt ze zrzutu | Plik | Sprawdzany fragment | Status |
|---|---|---|---|---|
| 1 | Designing a high-converting website with actionable recommendations | `docs/01-SPEC.md` | `## 7. Silnik konwersji` | ✓ |
| 2 | Planning a Cursor-ready spec file with build prompts | `docs/04-PROMPTS.md` | `## F0. Fundament` | ✓ |
| 3 | Dobierając źródła wzmacniające rekomendacje konwersji | `docs/01-SPEC.md` | `## 4. Fundament dowodowy` | ✓ |
| 4 | Planując strukturę pakietu i moduły konwersji strony | `README.md` | `## Co jest w środku` | ✓ |
| 5 | Dobierając stos technologiczny i budżety wydajności | `docs/01-SPEC.md` | `## 12. Budżety wydajności` | ✓ |
| 6 | Dobierając odpowiednie umiejętności i format dostarczanych plików | `README.md` | `formazieleni.mdc` | ✓ |
| 7 | Weryfikując badania o transparentności procesu i efekcie kompromisowym | `docs/01-SPEC.md` | `Buell i Norton` | ✓ |
| 8 | Wyszukiwanie: HBR „The Short Life of Online Sales Leads” | `docs/01-SPEC.md` | `The Short Life of Online Sales Leads` | ✓ |
| 9 | Wyszukiwanie: Spiegel Research Center, opinie | `docs/01-SPEC.md` | `Spiegel Research Center` | ✓ |
| 10 | Wyszukiwanie: Buell i Norton „The Labor Illusion” | `docs/01-SPEC.md` | `The Labor Illusion` | ✓ |
| 11 | Gathering supporting research on relevant behavioral studies | `docs/01-SPEC.md` | `\| Ograniczenia \|` | ✓ |
| 12 | Wyszukiwanie: Simonson 1989, efekt kompromisu | `docs/01-SPEC.md` | `Compromise Effects` | ✓ |
| 13 | Drafting a product specification with design guidance | `docs/02-DESIGN.md` | `# Kierunek wizualny` | ✓ |
| 14 | Reading frontend design skill | `docs/02-DESIGN.md` | `Czego unikamy` | ✓ |
| 15 | Dobierając unikalny kierunek kolorystyczny i typograficzny | `docs/02-DESIGN.md` | `## Kolory` | ✓ |
| 16 | Reading spec-writing skill | `docs/01-SPEC.md` | `## 3. Poza zakresem v1` | ✓ |
| 17 | Reading UX copy skill | `docs/03-COPY.md` | `## Zasady głosu` | ✓ |
| 18 | Reading SEO and AI-visibility skill | `docs/01-SPEC.md` | `## 13. SEO lokalne i widoczność w AI` | ✓ |
| 19 | Planning a site structure with placeholder credentials and AI-friendly crawling | `public/llms.txt` | `## Kontakt` | ✓ |
| 20 | Reading content-creation skill | `docs/03-COPY.md` | `## 12 artykułów startowych` | ✓ |
| 21 | Building a document package with setup instructions and specs | `README.md` | `## Kolejność` | ✓ |
| 22 | Dobierając stack technologiczny i strukturę plików projektu | `docs/01-SPEC.md` | `### Struktura repozytorium` | ✓ |
| 23 | Planując integracje CMS, powiadomień i analityki | `docs/01-SPEC.md` | `### M9. Powiadomienia speed-to-lead` | ✓ |
| 24 | Projektując lejek konwersji: quiz stylu i kalkulator wyceny | `docs/01-SPEC.md` | `### M1. Quiz stylu` | ✓ |
| 25 | Budując formularz zgłoszeniowy i architekturę zaufania oraz ofertową | `docs/01-SPEC.md` | `### M2. Formularz 3 kroki` | ✓ |
| 26 | Układając kolejność sekcji strony i budżety wydajności | `docs/01-SPEC.md` | `## 8. Strona główna, sekcja po sekcji` | ✓ |
| 27 | Planując SEO lokalne, treści blogowe i szybkość reakcji na leady | `docs/05-MARKETING.md` | `## 8. Sekwencje sprzedażowe` | ✓ |
| 28 | Ustalając KPI, kwestie prawne i otwarte pytania projektu | `docs/01-SPEC.md` | `## 17. Otwarte pytania` | ✓ |
| 29 | Dobierając paletę kolorów i typografię marki | `docs/02-DESIGN.md` | `## Typografia` | ✓ |
| 30 | Projektując układ strony, animacje i ton komunikacji | `docs/02-DESIGN.md` | `## Ruch` | ✓ |
| 31 | Pisząc treści, prompty wdrożeniowe i szablony komunikacji | `docs/03-COPY.md` | `## E-maile i SMS` | ✓ |
| 32 | Planując analitykę, SEO, QA i schemat bazy danych | `docs/04-PROMPTS.md` | `## F8. QA przed startem` | ✓ |
| 33 | Układając pytania quizu i planując zakres każdego pliku | `src/data/quiz.json` | `"questions"` | ✓ |
| 34 | Weryfikując techniczne fakty i źródła przed spisaniem plików | `docs/01-SPEC.md` | `jurysdykcja EU, jeśli dostępna` | ✓ |
| 35 | Sprawdzając zgodność ze schematami danych i przepisami prawa | `docs/01-SPEC.md` | `nie porada prawna` | ✓ |
| 36 | Dobierając optymalizację obrazów i zestawiając źródła dowodów | `docs/01-SPEC.md` | `LQIP` | ✓ |
| 37 | Zaznaczając ograniczenia dowodów i planując testy A/B | `docs/01-SPEC.md` | `### Hipotezy do testów` | ✓ |
| 38 | Spisując strukturę specyfikacji sekcja po sekcji | `docs/01-SPEC.md` | `## 19. Bibliografia` | ✓ |
| 39 | Ustalając mierzalne cele i wyłączenia zakresu projektu | `docs/01-SPEC.md` | `## 2. Cele i KPI` | ✓ |
| 40 | Zestawiając badania z decyzjami projektowymi i ich ograniczeniami | `docs/01-SPEC.md` | `\| Decyzja na stronie \|` | ✓ |
| 41 | Zestawiając badania rynkowe z decyzjami dotyczącymi ofert i leadów | `docs/01-SPEC.md` | `\| E4 \| Yardzen` | ✓ |
| 42 | Ustalając mapę strony, nawigację i przekierowania URL | `docs/redirects.csv` | `elementor-1143` | ✓ (uzupełnione dziś) |
| 43 | Projektując lejek konwersji i sekcje strony głównej | `docs/01-SPEC.md` | `### Lejek` | ✓ |
| 44 | Projektując szablony realizacji, usług i stron obszarowych | `docs/01-SPEC.md` | `## 9. Szablony podstron` | ✓ |
| 45 | Projektując moduły quizu i wieloetapowego formularza z kryteriami akceptacji | `docs/01-SPEC.md` | `AC: działa na klawiaturze` | ✓ |
| 46 | Projektując kalkulator cenowy, suwak porównawczy i galerię realizacji | `src/data/pricing.ts` | `export function estimate` | ✓ (uzupełnione dziś) |
| 47 | Projektując schemat bazy danych dla zgłoszeń klientów | `db/schema.sql` | `CREATE TABLE IF NOT EXISTS leads` | ✓ |
| 48 | Dodając tabele plików, notatek i zdarzeń oraz retencję danych | `db/schema.sql` | `lead_notes` | ✓ |
| 49 | Układając strukturę quizu stylu i punktację opcji | `src/data/quiz.json` | `"scores"` | ✓ |
| 50 | Dobierając punktację pytań i zasady doboru pakietu | `src/data/quiz.json` | `package_rules` | ✓ |
| 51 | Pisząc opisy stylów ogrodu i planując reguły robots.txt | `public/robots.txt` | `Disallow: /api/` | ✓ |
| 52 | Planując politykę indeksowania oraz strukturę pliku README | `docs/01-SPEC.md` | `noindex` | ✓ |
| 53 | Projektując schematy danych CMS dla usług i realizacji | `sanity/schema.ts` | `name: 'realization'` | ✓ (uzupełnione dziś) |
| 54 | Projektując endpointy leadów i mechanizm bezpiecznego przesyłania plików | `docs/04-PROMPTS.md` | `POST /api/upload` | ✓ |
| 55 | Planując prosty upload plików przez Workera oraz migrację treści | `scripts/import-wordpress.mjs` | `_sanityAsset` | ✓ (uzupełnione dziś) |
| 56 | Planując testy QA, checklistę startową i zasady projektu w Cursorze | `docs/LAUNCH.md` | `# Checklista startu` | ✓ (uzupełnione dziś) |
| 57 | Spisując zasady projektu i finalizując treść plików | `.cursor/rules/formazieleni.mdc` | `# Twarde zasady` | ✓ |
| 58 | Weryfikując szczegóły integracji SMS, e-mail i kalendarza | `docs/01-SPEC.md` | `normalize=1` | ✓ |
| 59 | Create folder structure for the Cursor starter pack | `README.md` | `## Co jest w środku` | ✓ |
| 60 | Recreate folder structure without brace expansion | `README.md` | `## Kolejność` | ✓ |
| 61 | Created 01-SPEC.md | `docs/01-SPEC.md` | `# Forma Zieleni` | ✓ |
| 62 | Drafting a design system document with visual guidelines | `docs/02-DESIGN.md` | `## Komponenty` | ✓ |
| 63 | Created 02-DESIGN.md | `docs/02-DESIGN.md` | `# Kierunek wizualny` | ✓ |
| 64 | Ustalając architekturę techniczną i strukturę repozytorium | `docs/01-SPEC.md` | `## 11. Architektura techniczna` | ✓ |
| 65 | Ustalając przekierowania URL, zmienne środowiskowe i budżety wydajności | `.dev.vars.example` | `TURNSTILE_SECRET` | ✓ (uzupełnione dziś) |
| 66 | Planując SEO, dane strukturalne i migrację treści z WordPressa | `docs/01-SPEC.md` | `JSON-LD` | ✓ |
| 67 | Ustalając pomiar eksperymentów oraz podstawy prawne RODO | `docs/01-SPEC.md` | `art. 6 ust. 1 lit. b RODO` | ✓ |
| 68 | Spisując checklistę materiałów wymaganych od klienta | `docs/01-SPEC.md` | `## 16. Materiały od właściciela` | ✓ |
| 69 | Dobierając paletę kolorów i sprawdzając kontrast dostępności | `docs/02-DESIGN.md` | `\| Kontrast \|` | ✓ |
| 70 | Obliczając kontrast kolorów akcentowych z tłem | `docs/02-DESIGN.md` | `5,6:1` | ✓ |
| 71 | Dobierając typografię i skalę rozmiarów tekstu | `docs/02-DESIGN.md` | `Skala (px)` | ✓ |
| 72 | Planując animacje, siatkę layoutu i wytyczne fotograficzne | `docs/02-DESIGN.md` | `## Fotografia` | ✓ |
| 73 | Dobierając wymagania fotograficzne i komponenty strony | `docs/02-DESIGN.md` | `Minimum 2400 px` | ✓ |
| 74 | Pisząc treści nagłówków i opisów sekcji usługowych | `docs/03-COPY.md` | `**Mała architektura i nawierzchnie**` | ✓ (uzupełnione dziś) |
| 75 | Opisując etapy współpracy i zawartość pakietów ofertowych | `docs/03-COPY.md` | `## Pakiety` | ✓ |
| 76 | Pisząc pytania i odpowiedzi do sekcji FAQ | `docs/03-COPY.md` | `## FAQ` | ✓ |
| 77 | Pisząc mikrocopy formularza i komunikaty błędów | `docs/03-COPY.md` | `**Komunikaty błędów**` | ✓ |
| 78 | Pisząc treści quizu stylu ogrodu oraz wiadomości potwierdzające | `docs/03-COPY.md` | `### Potwierdzenie do klienta` | ✓ |
| 79 | Planując treści e-maili, SMS-ów i tematy artykułów blogowych | `docs/03-COPY.md` | `### SMS do właścicielki` | ✓ |
| 80 | Analizowanie wskazówek świadczących o sztucznym pochodzeniu tekstu | `.cursor/rules/formazieleni.mdc` | `Zakazane:` | ✓ |
| 81 | Remove middle-dot meta string from wireframe | `docs/02-DESIGN.md` | brak: `około minuty ·` | ✓ |
| 82 | Created 03-COPY.md | `docs/03-COPY.md` | `# Copy deck` | ✓ |
| 83 | Analizowanie tekstu reklamowego dotyczącego nasadzeń ogrodowych | `docs/03-COPY.md` | `Etykiety roślin w hero` | ✓ |
| 84 | Oznaczanie niepotwierdzonych obietnic jako opcjonalnych elementów oferty | `docs/03-COPY.md` | `{{OPCJA:` | ✓ |
| 85 | Mark unconfirmed offer elements as options and remove assumed audiences | `docs/03-COPY.md` | `Parki osiedlowe` | ✓ (uzupełnione dziś) |
| 86 | Created 04-PROMPTS.md | `docs/04-PROMPTS.md` | `# Prompty do Cursora` | ✓ |
| 87 | Przygotowując strukturę bazy danych i harmonogram eksportu | `docs/04-PROMPTS.md` | `eksport bazy` | ✓ |
| 88 | Store DB backups in private R2 instead of GitHub artifacts | `docs/04-PROMPTS.md` | `prywatnego bucketu R2` | ✓ |
| 89 | Created formazieleni.mdc | `.cursor/rules/formazieleni.mdc` | `alwaysApply: true` | ✓ |
| 90 | Reviewing project files across the codebase | `docs/09-AUDYT.md` | `# Audyt` | ✓ (uzupełnione dziś) |
| 91 | Created schema.sql | `db/schema.sql` | `CREATE TABLE IF NOT EXISTS events` | ✓ |
| 92 | Checking a SQL script's placeholders and settings | `db/schema.sql` | `{{RETENCJA_MIESIĄCE}}` | ✓ |
| 93 | Remove PRAGMA that may be rejected by D1 migrations | `db/schema.sql` | brak: `PRAGMA foreign_keys` | ✓ |
| 94 | Budowanie quizu z kryteriami dopasowanymi do listy | `src/data/quiz.json` | `criteria_labels` | ✓ |
| 95 | Ustalanie reguł doboru pakietów do struktury quizu | `src/data/quiz.json` | `"package": "comprehensive"` | ✓ |
| 96 | Przebudowywanie struktury pytań i punktacji quizu | `src/data/quiz.json` | `skip_if` | ✓ |
| 97 | Precyzowanie reguł przypisywania pakietów i etykiet kryteriów | `src/data/quiz.json` | `package_ids_note` | ✓ |
| 98 | Created quiz.json | `src/data/quiz.json` | `"version": 1` | ✓ |
| 99 | Ustalanie liczby pytań w quizie w zależności od miejsca | `docs/03-COPY.md` | `liczba pytań po uwzględnieniu skip_if` | ✓ |
| 100 | Validate quiz JSON and align copy, design and spec with dynamic question count | `docs/02-DESIGN.md` | `Do 7 pytań` | ✓ |
| 101 | Reviewing site files and configuration for the project | `docs/09-AUDYT.md` | `§E` | ✓ (uzupełnione dziś) |
| 102 | Tworzenie plików robots.txt i llms.txt z treścią zastępczą | `public/llms.txt` | `{{CENA_1}}` | ✓ |
| 103 | Przygotowywanie pliku przekierowań w formacie Cloudflare CSV | `docs/redirects.csv` | `,301,false,true,false,false` | ✓ |
| 104 | Write robots.txt, llms.txt, redirects, placeholder check script and test it | `scripts/check-placeholders.mjs` | `process.exit(1)` | ✓ |
| 105 | Checking a placeholder scanner for false positives in code files | `scripts/check-placeholders.mjs` | `fałszywe trafienia` | ✓ |
| 106 | Refining the placeholder pattern to avoid minified code matches | `scripts/check-placeholders.mjs` | `(?!\s*` | ✓ |
| 107 | Weighing edge cases where colons or digits could break the pattern | `scripts/check-placeholders.mjs` | `[^{}\n]{1,200}` | ✓ |
| 108 | Tighten placeholder regex to avoid false positives in minified JS and test it | `scripts/check-placeholders.mjs` | `const pattern` | ✓ |
| 109 | Drafting a README with setup and redirect details | `README.md` | `## Format ʼdocs/redirects.csvʼ` | ✓ |
| 110 | Created README.md | `README.md` | `# Forma Zieleni: pakiet startowy` | ✓ |
| 111 | Reviewing spec files for consistency and errors | `docs/09-AUDYT.md` | `§A` | ✓ (uzupełnione dziś) |
| 112 | Wyłapując drobne niespójności w treści specyfikacji | `docs/01-SPEC.md` | `Zachowaj kotwice ʼ#uslugiʼ` | ✓ (uzupełnione dziś) |
| 113 | Fix CSP wording and step-1 handoff in spec | `docs/01-SPEC.md` | `widżet Cal.com ładowany dopiero po kliknięciu` | ✓ |

Wynik kontroli: 113/113 punktów znalezionych w plikach.

## §C. Obietnice i propozycje z odpowiedzi w czacie

| Odpowiedź | Obietnica | Status |
|---|---|---|
| 1 | Skrypt przerabiający artykuły i generujący listę przekierowań | Dziś: `scripts/import-wordpress.mjs`, przetestowany na próbnym WXR. Zamiast Markdown robi import do Sanity, bo CMS zmienił się w odpowiedzi 3 |
| 1 | Eksport WP + kopia `wp-content/uploads`, zachowanie URL-i lub 301, Search Console, MX bez zmian | `docs/LAUNCH.md` pkt 1–4 i 7 |
| 1 | Prompt: strony, formularz, SEO, schema, Lighthouse 95+, dostępność, przekierowania, poprawna polszczyzna | 01-SPEC, 03-COPY, 04-PROMPTS F0–F9 |
| 2 | Panel CMS dla Agnieszki | Sanity + `sanity/schema.ts` (dziś kod) |
| 2 | Quiz, kalkulator, suwak przed/po jako wyspy React | M1, M3→M17, M4 (suwak jako web component, bez Reacta, żeby oszczędzić JS) |
| 2 | Workers + D1 + R2 | 01-SPEC §11 |
| 2 | Wnioski 1–7: quiz, pakiety z cenami, formularz ze zdjęciami, case study (przed/po, render kontra efekt, lista roślin, czas), proces 5 kroków, SEO lokalne i GBP, treści eksperckie w CMS | 01-SPEC §8–§10, §13; 03-COPY |
| 2 | Nowy prompt z quizem, pakietami, Keystatic i D1 | Zrobione w odpowiedzi 3 z Sanity zamiast Keystatic (§D) |
| 3 | Uzupełnię placeholdery po otrzymaniu danych | Obszar, ceny projektów, budżet, a dziś dane z obecnej strony. Reszta czeka na dane (00-DANE) |
| 4 | Plan marketingowy i baza CRM | 05-MARKETING, `db/0002_crm_marketing.sql` |
| 5 | Ekonomika, reklamy za 300 zł, słowa kluczowe | 06-REKLAMY-DIY, `ads/` |
| 6 | Wiedza 2026 i jej wdrożenie | 07-WIEDZA-2026, E12–E20 w SPEC |
| 7 | Portal i funkcje v2 | 08-PORTAL-FUNKCJE, `db/0003_portal.sql`, F12–F16 |

## §D. Decyzje zmienione w trakcie (świadomie)

| Było | Jest | Powód |
|---|---|---|
| Markdown / Content Collections (odp. 1) → Keystatic lub Sanity (odp. 2) | Sanity | Realizacje z wieloma zdjęciami, CDN obrazów, edycja bez Gita |
| Cloudflare Pages lub Vercel | Cloudflare Workers | Adapter Astro 6; D1, R2 i cron w jednym miejscu |
| Web3Forms | Własny Worker + D1 + Turnstile | Lead w bazie, SMS, sekwencje, panel |
| `public/_redirects` | Cloudflare Bulk Redirects | Pewne 301 na poziomie strefy |
| astro:assets | CDN obrazów Sanity | Obrazy z CMS |
| Zieleń + beż + grafit, serif | „Plan nasadzeń”: kamień, igliwie, rudbekia | Beż z serifem to wzorzec generowanych stron |
| Kalkulator M3 | Kreator zakresu M17 | Strefy ogrodu zamiast samego metrażu |
| `workers/retention` | `workers/automation` (od F10) | Sekwencje, przypomnienia, newsletter |
| „Stare slugi zachowane” | 301 z `/RRRR/MM/DD/slug/` | Błąd wykryty dziś (§A.2) |
| Usunięte „osiedla” | Parki osiedlowe przywrócone | Błąd wykryty dziś (§A.3) |

## §E. Obecna strona → nowa strona

| Element obecnej strony | Gdzie w pakiecie |
|---|---|
| Hasło „Twoja wymarzona FORMA ZIELENI w ogrodzie” | Zastąpione nagłówkami A/B/C w 03-COPY (test H4/H1) |
| Usługi: ogrody przydomowe, przestrzeń miejska, rabaty, balkony, tarasy, kostka brukowa | 03-COPY „Usługi” (5 bloków, w tym „Mała architektura i nawierzchnie”, „Parki osiedlowe…”) |
| Ogrody mniejsze (szeregowe, przyblokowe) i większe | 03-COPY „Projekt ogrodu” |
| Balkony („oaza spokoju… widok na okno sąsiada”), tarasy przydomowe i widokowe w apartamentach | 03-COPY „Balkony i tarasy” |
| Rabaty: warunki glebowe i klimatyczne, pory roku, spaliny, owady; rekreacja, ścieżki piesze i rowerowe, drogi o dużym ruchu | 03-COPY „Rabaty i przestrzeń miejska” |
| Przestrzeń miejska: dobór roślin i małej architektury | 03-COPY, 01-SPEC §9 B2B |
| O nas: „od prawie 10 lat”, wartości, zakres (ogrody, parki osiedlowe, ciągi piesze i samochodowe, kostka, tarasy, balkony) | 00-DANE, 03-COPY (pasek dowodów, „Kto projektuje”), llms.txt |
| Główny projektant: inż. arch. kraj. Agnieszka Pupiało | 00-DANE, 03-COPY, 01-SPEC S9 |
| Partner DAMPS POL z rabatem | 03-COPY „Partnerzy” i FAQ, 05-MARKETING §9, `db/0002` (wiersz partnera) |
| Formularz: imię i nazwisko, telefon, e-mail, obszar, wiadomość, zgoda | M2 (świadomie tylko imię, bez nazwiska: mniej pól); obszar → „Co projektujemy?”; zgoda → informacja RODO |
| Kontakt: e-mail, telefon, Facebook | 03-COPY, llms.txt, JSON-LD |
| Menu: O nas, Porady i artykuły, Kontakt (#kontakt) | 01-SPEC §6; kotwice `#uslugi` i `#kontakt` zachowane |
| Stopka: /agritech-about-us/, /agritech-service/ („Twój własny projekt”) | `docs/redirects.csv` → /o-nas/ i /wycena/ (treści tych stron nie sprawdziłem) |
| 6 artykułów z adresami z datą | 03-COPY „Istniejące artykuły”, `docs/redirects.csv`, import |
| Autor /author/formazieleni/ | 301 → /o-nas/ |
| Logo PNG 512 px | 01-SPEC §16: potrzebne SVG |
| Literówki (arktykuły, klenta, doślin, ścieżech, zajmumemy, klienic, poniewż, DAMS POL) | 01-SPEC §1; nowe teksty bez nich |

## §F. Kontrole automatyczne wykonane dziś

- **SQL:** 3 migracje wczytane razem w SQLite. Insert z nowym źródłem (`scope_builder`), typem (`small_architecture`) i zdarzeniem (`moodboard_save`) działa. Wiersz DAMPS POL istnieje. Widoki zwracają dane.
- **JSON i TypeScript:** `quiz.json` jest poprawny. `pricing.ts` przechodzi `tsc --strict`; `estimate()` zwraca `null`, dopóki są placeholdery.
- **Import WordPressa:** na próbnym WXR `elementor-1143` dostaje slug z tytułu, powstają przekierowania, obraz trafia jako `_sanityAsset`, strona trafia do `pages.txt`, a pusta treść z Elementora generuje ostrzeżenie.
- **Kontrast WCAG** wyliczony wzorem:

| Para | Wyliczony kontrast | W 02-DESIGN | Zgodne |
|---|---|---|---|
| --igliwie na --kamien | 10.76:1 | 10,8 | tak |
| --mech na --kamien | 5.17:1 | 5,2 | tak |
| --igliwie na --rudbekia | 5.64:1 | 5,6 | tak |
| --kreska na --kamien (dekoracja) | 2.68:1 | nie podano | tak |

- **Odwołania do plików pakietu:** wszystkie pliki z `docs/`, `db/`, `ads/`, `public/`, `scripts/`, `src/data/` i `sanity/` wymienione w dokumentach istnieją.
- **Placeholdery:** skrypt nadal blokuje publikację, dopóki zostaje choć jeden `{{…}}`. Tak ma być.
