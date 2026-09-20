# Prompty do Cursora (tryb Agent)

Jak używać:
1. Jedna faza = jeden nowy czat w Cursorze. Wklej prompt w całości.
2. Najpierw poproś o plan (Agent sam go poda, bo prompt tego wymaga), zaakceptuj, dopiero potem kod.
3. Po każdej fazie: `npm run check && npm run build && npm test`, przegląd na telefonie, commit.
4. Nie przechodź dalej, jeśli nie są spełnione kryteria akceptacji.

---

## F0. Fundament

```
Przeczytaj: .cursor/rules/formazieleni.mdc, docs/01-SPEC.md (§11, §12).

Najpierw wypisz plan kroków i poczekaj na akceptację.

Zadanie: utwórz projekt Astro 6 w bieżącym katalogu (TypeScript strict) i skonfiguruj:
- site: 'https://formazieleni.pl', trailingSlash: 'always', lang="pl"
- adapter @astrojs/cloudflare: strony prerenderowane, trasy src/pages/api/* z `export const prerender = false`
- Tailwind CSS v4 przez @tailwindcss/vite; plik src/styles/tokens.css (na razie pusty szkielet)
- @astrojs/react (tylko dla src/islands), @astrojs/sitemap (bez /panel/, /dziekujemy/, /quiz/wynik/, /dev/, /portal/, /partner/, /lp/, /moj-ogrod/, /newsletter/potwierdz/, /asystent/)
- ESLint, Prettier z prettier-plugin-astro, Vitest, Playwright z @axe-core/playwright, @lhci/cli z budżetami z SPEC §12, linkinator
- wrangler.jsonc: bindingi DB (D1) i UPLOADS (R2), zmienne z SPEC §11 (sekrety wyłącznie przez `wrangler secret put`, w repo tylko .dev.vars.example)
- strukturę katalogów z SPEC §11
- skrypty npm: dev, build, preview, check (astro check + eslint), test (vitest), e2e (playwright), lhci, placeholders (node scripts/check-placeholders.mjs dist)
- GitHub Actions: CI (check, test, build, placeholders, lhci na preview) oraz deploy uruchamiany przez push do main i przez repository_dispatch typu "sanity-publish"

Kryteria akceptacji:
- `npm run dev` i `npm run build` działają bez ostrzeżeń
- pusta strona testowa: Lighthouse mobile ≥ 95 we wszystkich kategoriach
- README_DEV.md z komendami i opisem zmiennych środowiskowych

Nie instaluj: bibliotek komponentów UI, bibliotek animacji, jQuery, lodash, moment.
```

---

## F1. System wizualny

```
Przeczytaj: docs/02-DESIGN.md w całości, .cursor/rules/formazieleni.mdc.

Najpierw przedstaw plan: tokeny, lista komponentów, sposób ładowania fontów. Poczekaj na akceptację.

Zadanie:
1. Tokeny kolorów, typografii i odstępów w src/styles/tokens.css i jako motyw Tailwind v4 (@theme).
2. Fonty przez Fonts API Astro 6: Newsreader (nagłówki, italic dla nazw łacińskich) i Schibsted Grotesk (tekst, UI), subset latin-ext, preload tylko pliku nagłówka hero. Wyrenderuj na stronie testowej zdanie „Zażółć gęślą jaźń. ŻÓŁTA ĆMA” oboma krojami i potwierdź komplet polskich znaków.
3. Komponenty z tabeli „Komponenty” w DESIGN.md: Button, Photo, PlantLabel, HeroPlan, BeforeAfter (web component), ProcessStep, PackageColumn, ReviewQuote, ProofLine, StickyMobileBar, FormStep, ProgressBar, FaqItem.
4. Photo przyjmuje obiekt obrazu z Sanity (na razie mock) i generuje srcset 480/768/1080/1600/2400, width/height, LQIP w tle; alt jest wymagany typem.
5. HeroPlan: SVG z linią planu rysowaną raz (stroke-dashoffset, 1200 ms, ease-out) po załadowaniu obrazu LCP; przy prefers-reduced-motion bez animacji; etykiety pozycjonowane w % zdjęcia.
6. Strona /dev/styleguide/ (noindex, wykluczona z sitemapy i z builda produkcyjnego) pokazująca wszystkie komponenty i stany: hover, focus, disabled, błąd.

Kryteria akceptacji:
- axe: 0 naruszeń na /dev/styleguide/
- kontrasty zgodne z tabelą w DESIGN.md
- BeforeAfter działa strzałkami, Home/End i dotykiem
- brak wzorców z listy „Czego unikamy” w DESIGN.md
- JS komponentów Astro = 0 KB (poza BeforeAfter i HeroPlan)
```

---

## F2. CMS Sanity

```
Przeczytaj: docs/01-SPEC.md (§6, §9, §10 M5–M6, §11), docs/03-COPY.md (sekcje Usługi, Pakiety, FAQ).

Najpierw plan schematów i zapytań. Poczekaj na akceptację.

Zadanie:
1. Katalog sanity/ ze Studio (do wdrożenia na *.sanity.studio). Schematy:
   - settings (singleton): nazwa firmy, NIP, adres/obszar, telefon, e-mail, godziny kontaktu, obszar działania (lista miejscowości), ocena Google, liczba opinii, liczba projektów, rok startu, sameAs (Facebook, Google Business Profile), link do wystawienia opinii Google
   - service: tytuł, slug, lead, sekcje, cena od, powiązane realizacje, FAQ usługi, SEO
   - package: nazwa, cena od, dla kogo, zawiera (lista), czas, poprawki, polecany (boolean, maks. jeden), CTA
   - realization: tytuł, slug, gmina, metraż, typ, styl (tag zgodny z quiz.json), czas projektu, wyzwanie, koncepcja (obrazy), wizualizacje, zdjęcia, para przed/po (dwa obrazy), rośliny [{łacińska, polska}], wypowiedź klienta, zgoda właściciela (boolean WYMAGANY do publikacji), SEO
   - review: imię i inicjał, ocena, treść (bez edycji), data, URL źródła
   - faq: pytanie, odpowiedź, kategoria
   - article: tytuł, slug, lead, treść Portable Text, obraz, fraza główna, wariant CTA (quiz/formularz/kalkulator/realizacje), SEO
   - award: nazwa, rok, organizator, link
   Walidacje: alt wymagany przy każdym obrazie; realizacja bez zgody właściciela nie może być opublikowana; polecany maksymalnie w jednym pakiecie.
2. src/lib/sanity/: klient, zapytania GROQ, typy z `sanity typegen`, helper obrazów (@sanity/image-url, auto=format, fit=max, q=75, srcset jak w Photo, wymiary i lqip z metadanych assetu).
3. Dane pobierane w czasie builda. Webhook Sanity przy publikacji → GitHub repository_dispatch "sanity-publish" → build i deploy (instrukcja w README_DEV.md).
4. Seed: przykładowe dokumenty z placeholderami {{…}} z COPY.md, żeby strony dało się budować.

Kryteria akceptacji:
- `astro build` pobiera treści i generuje strony
- zmiana w Studio → nowa wersja strony po zakończeniu GitHub Actions
- brak danych osobowych klientów w Sanity (tylko treści publiczne)
```

---

## F3. Strony i szablony

```
Przeczytaj: docs/01-SPEC.md (§6, §7, §8, §9), docs/02-DESIGN.md, docs/03-COPY.md. Teksty wstawiaj dosłownie z COPY.md albo z CMS.

Najpierw plan: lista stron, layouty, kolejność sekcji strony głównej. Poczekaj na akceptację.

Zadanie:
1. Layout bazowy: meta, canonical, OG, JSON-LD przez komponenty src/components/seo/, natywne CSS View Transitions, nagłówek sticky, stopka z danymi z settings, StickyMobileBar.
2. Strona główna: sekcje S1–S11 dokładnie w kolejności z SPEC §8, każda ze swoim kryterium akceptacji.
3. /uslugi/[slug]/, /realizacje/ (siatka z filtrem jako progresywne ulepszenie + dialog galerii), /realizacje/[slug]/ (szablon case study z SPEC §9), /cennik/ (pakiety + miejsce na kalkulator), /jak-pracujemy/, /o-nas/, /opinie/, /artykuly/ i /artykuly/[slug]/, /kontakt/, /polityka-prywatnosci/, /dla-firm-i-samorzadow/ (P1, może być szkielet), 404.
4. /obszar/[miejscowosc]/ generowane tylko dla miejscowości z co najmniej 2 realizacjami.
5. CTA „Chcę podobny ogród” przekazuje `?z=realizacja:slug` (bez danych osobowych).
6. Każdy placeholder {{…}} w trybie dev podświetlony na żółto; w buildzie produkcyjnym skrypt placeholders przerywa build.

Kryteria akceptacji:
- Lighthouse mobile ≥ 95/100/100/100 dla /, /realizacje/, jednej realizacji, /cennik/
- ≤ 1000 elementów DOM na stronie głównej
- jeden H1 na stronę, poprawna hierarchia nagłówków
- wszystko czytelne i klikalne na 360 px szerokości
```

---

## F4. Silnik leadów

```
Przeczytaj: docs/01-SPEC.md (§7, §10 M2, M8, M9, §11, §15), docs/03-COPY.md (Formularz, Dziękujemy, E-maile i SMS), db/schema.sql.

Najpierw plan: endpointy, walidacja, obsługa błędów, testy. Poczekaj na akceptację.

Zadanie:
1. Migracja D1 z db/schema.sql (wrangler d1 migrations).
2. POST /api/upload: jeden plik na żądanie, image/* (w tym HEIC), ≤ 10 MB, zapis do R2 pod losowym kluczem, zwraca klucz. Limit 10 plików na zgłoszenie. Bez publicznych URL-i.
3. POST /api/lead: schemat zod zgodny z kolumnami leads, weryfikacja Turnstile (siteverify), limit zgłoszeń z IP (binding Rate Limiting, a jeśli niedostępny, licznik w D1), ULID, delete_after = teraz + {{RETENCJA_MIESIĄCE}} miesięcy, zapis leads + lead_files w transakcji (batch).
4. Po zapisie, bez blokowania odpowiedzi (ctx.waitUntil):
   - e-mail do klienta (Resend) z treścią z COPY.md; termin kontaktu liczony z godzin pracy w settings
   - e-mail do właścicielki z pełnymi danymi i linkami do zdjęć (podpisane, ważne 7 dni, serwowane przez Worker)
   - SMS do właścicielki (SMSAPI.pl, normalize=1, treść z COPY.md)
   - błędy powiadomień logowane bez danych osobowych; ponowienie 1 raz
5. Wyspa src/islands/LeadForm.tsx: 3 kroki z COPY.md, walidacja po opuszczeniu pola, komunikaty błędów z COPY.md, pasek postępu, upload z podglądem i paskiem postępu, stan tylko w pamięci (bez localStorage/sessionStorage), `client:load` tylko na /wycena/, na stronie głównej krok 1 jako lekki formularz HTML przekazujący wybór parametrem.
6. /dziekujemy/ z tekstem zależnym od godziny, przyciskiem Cal.com (widżet ładowany po kliknięciu) i 2 realizacjami pasującymi do typu projektu.
7. workers/retention/: osobny Worker z Cron Trigger (codziennie 03:00), usuwa leady po delete_after i ich pliki z R2, zdarzenia starsze niż 13 miesięcy.
8. Testy: jednostkowe walidacji; e2e Playwright szczęśliwej ścieżki i błędów z zamockowanymi Turnstile, Resend i SMSAPI.

Kryteria akceptacji:
- zapis w D1 < 1 s, powiadomienia < 60 s (test na środowisku preview)
- dane osobowe nie pojawiają się w URL, logach, zdarzeniach ani storage przeglądarki
- formularz w pełni obsługiwany z klawiatury, axe: 0 naruszeń
```

---

## F5. Quiz i kalkulator

```
Przeczytaj: docs/01-SPEC.md (§10 M1, M3), docs/03-COPY.md (Quiz, Kalkulator, Pakiety), src/data/quiz.json.

Najpierw plan: funkcja punktacji, stany widoku, testy. Poczekaj na akceptację.

Zadanie:
1. src/lib/quiz/score.ts: czysta funkcja (answers, quiz.json) → { style, maintenance, package, criteriaUsed }. Remisy rozstrzyga `tie_break` z quiz.json. Testy Vitest dla każdej reguły pakietu i remisów.
2. Wyspa src/islands/Quiz.tsx na /quiz/ (client:load): jedno pytanie na ekran, pasek postępu, Wstecz, pytanie ze zdjęciami z CMS (tag stylu), krok przetwarzania 1,5 s z listą criteriaUsed (bez animacji przy prefers-reduced-motion), wynik bez podawania danych.
3. Wynik: styl i opis z quiz.json, 3 zdjęcia realizacji w tym stylu, poziom pielęgnacji, pakiet z ceną z CMS, CTA z COPY.md, mini-formularz wysyłający POST /api/lead z source=quiz, quiz_style i quiz_answers.
4. /realizacje/?styl=… filtruje siatkę po stylu.
5. src/data/pricing.ts: formuła widełek (typ, metraż, zakres) z wartościami {{…}}; wyspa PriceCalculator na /cennik/ (client:visible); CTA przenosi wybór do /wycena/.
6. Zdarzenia: quiz_start, quiz_step{n}, quiz_complete{style}, calc_use.

Kryteria akceptacji:
- quiz i kalkulator w pełni obsługiwane z klawiatury
- JS wyspy quizu ≤ 35 KB gzip
- build produkcyjny przerywany, gdy pricing.ts zawiera placeholdery
```

---

## F6. Analityka i panel

```
Przeczytaj: docs/01-SPEC.md (§2, §10 M10–M12, §14, §15).

Najpierw plan. Poczekaj na akceptację.

Zadanie:
1. src/lib/track.ts: track(name, props) przez navigator.sendBeacon do POST /api/e; biała lista nazw z SPEC §14; props bez danych osobowych (walidacja zod po stronie serwera, odrzucenie nieznanych kluczy); bez IP i identyfikatorów.
2. Podpięcie zdarzeń: cta_click, form_step, form_error, lead_submit, call_click, sms_click, booking_click, filter_use, before_after_use.
3. /panel/ (prerender=false) chroniony Cloudflare Access; Worker dodatkowo weryfikuje JWT z nagłówka Cf-Access-Jwt-Assertion (certyfikaty zespołu, audience CF_ACCESS_AUD).
4. Widoki panelu: lista leadów (filtr statusu, źródła, dat), szczegóły ze zdjęciami, zmiana statusu (automatyczne first_contact_at przy pierwszym wyjściu ze statusu new), notatki, powód przegranej, lejek z 7 i 30 dni (quiz i formularz krok po kroku), mediana czasu do pierwszego kontaktu, eksport CSV.
5. M11: przy statusie won pole „data zakończenia realizacji”; Cron w workers/retention wysyła prośbę o opinię po 7 dniach i jedno przypomnienie po 14 dniach (treści z COPY.md), zapisuje fakt wysyłki.

Kryteria akceptacji:
- bez sesji Access /panel/ zwraca 403
- lejek zgadza się z liczbą rekordów w D1
- panel działa na telefonie
```

---

## F7. SEO, AI i migracja z WordPressa

```
Przeczytaj: docs/01-SPEC.md (§6, §13), docs/03-COPY.md (Meta), docs/redirects.csv, public/robots.txt, public/llms.txt.

Najpierw plan. Poczekaj na akceptację.

Zadanie:
1. Meta title/description z COPY.md, canonical, OG image ze zdjęcia realizacji (1200×630).
2. JSON-LD: LocalBusiness + ProfessionalService (z settings), Service + Offer z minPrice (pakiety), Article, BreadcrumbList, FAQPage. Bez AggregateRating dla własnej firmy.
3. noindex w meta dla /dziekujemy/, /quiz/wynik/, /panel/.
4. scripts/import-wordpress.ts: czyta eksport WXR, tworzy dokumenty article w Sanity z zachowaniem slugów, pobiera obrazy do Sanity, konwertuje HTML do Portable Text (@portabletext/block-tools + jsdom), raport pominiętych elementów.
5. Uzupełnij docs/redirects.csv o wszystkie URL-e z sitemapy WordPressa, które nie mają odpowiednika 1:1; dopisz w README_DEV.md instrukcję importu do Cloudflare Bulk Redirects.
6. Walidacja: Rich Results Test dla strony głównej, usługi, artykułu; sitemap-index.xml dostępny.

Kryteria akceptacji:
- każdy stary URL zwraca 200 (ten sam slug) albo 301 do właściwej strony
- treść stron widoczna w HTML bez uruchamiania JS
```

---

## F8. QA przed startem

```
Przeczytaj: docs/01-SPEC.md (§12, §14), .cursor/rules/formazieleni.mdc.

Zadanie: przygotuj i uruchom zestaw kontroli, a potem wypisz raport z listą błędów posortowaną według wpływu na konwersję.
1. Lighthouse CI: /, /realizacje/, 1 realizacja, /cennik/, /quiz/, /wycena/, 1 artykuł; budżety z SPEC §12.
2. Playwright na Pixel 7 i iPhone 14 (emulacja + throttling 4G): formularz od kroku 1 do /dziekujemy/, quiz do wyniku i leada, suwak przed/po, filtr realizacji, nawigacja wyłącznie klawiaturą.
3. axe: 0 naruszeń krytycznych i poważnych na wszystkich typach stron.
4. linkinator: 0 zepsutych linków.
5. placeholders: 0 niewypełnionych placeholderów w dist (skrypt npm run placeholders).
6. Testy ręczne (checklista do README_DEV.md): prawdziwy SMS i e-mail w środowisku preview, upload zdjęcia HEIC z iPhone'a, zgłoszenie z włączonym blokerem reklam, formularz przy wolnym internecie.

Kryteria akceptacji: wszystkie kontrole zielone albo błędy z uzasadnieniem zaakceptowane przez właściciela.
```

---

## F9. Start

```
Zadanie: przygotuj docs/LAUNCH.md z checklistą i przejdź ją ze mną krok po kroku, niczego nie zmieniając w DNS bez mojego potwierdzenia.
- Zanotuj obecne rekordy DNS, szczególnie MX, SPF, DKIM, DMARC (poczta agnieszka@formazieleni.pl musi działać bez przerwy).
- Rekordy Resend: jeden wspólny rekord SPF (scal z istniejącym, nie dodawaj drugiego), DKIM, sprawdzenie DMARC.
- Podpięcie domeny do Workera, HTTPS, przekierowanie www → bez www (lub odwrotnie, zgodnie z canonical).
- Włączenie Bulk Redirects i test 20 losowych starych URL-i.
- Search Console: nowa sitemapa, sprawdzenie indeksowania kluczowych stron.
- Google Business Profile: link do strony z UTM z SPEC §13.
- Zgłoszenie testowe na produkcji od początku do końca, potem usunięcie z D1.
- Cloudflare Web Analytics włączone; alerty błędów Workera.
- D1 Time Travel sprawdzony + cotygodniowy eksport bazy do osobnego, prywatnego bucketu R2 z automatycznym usuwaniem po 35 dniach (dane osobowe nie trafiają do GitHuba).
- Monitoring przez 14 dni: 404 w Search Console, Core Web Vitals, liczba leadów dziennie, czas do pierwszego kontaktu.
```

---

## F10. CRM, sekwencje i raporty

```
Przeczytaj: docs/05-MARKETING.md (§8–§12), db/0002_crm_marketing.sql, docs/01-SPEC.md (§10 M10–M11, §15).

Najpierw plan. Poczekaj na akceptację.

Zadanie:
1. Migracja 0002. Przy pierwszym wejściu leada w consultation, offer, won ustawiaj consultation_at, offer_at, won_at (nie nadpisuj). first_contact_at = pierwszy touchpoint z outcome connected lub replied.
2. Panel: zakładki Zadania (v_tasks_due), Leady, Oferty, Projekty, Partnerzy, Polecenia, Przetargi, Kampanie (ręczny wpis wydatków miesięcznych), Raport (v_funnel_monthly, v_channel_economics z czerwonym oznaczeniem stop_loss_hit, v_first_contact_median, v_first_contact_sla, v_offer_winrate, v_referrals_summary).
3. Zmień workers/retention na workers/automation. Cron co 15 min: kroki sequence_enrollments z next_run_at <= teraz według tabel z 05-MARKETING §8; SMS i zadania telefoniczne tylko w godzinach pracy z settings; każdy krok zapisany w sequence_runs (klucz lead+sekwencja+krok, brak podwójnych wysyłek); stop przy touchpoint direction=in, rezerwacji, zmianie statusu, stop_reason email_only.
4. Odpowiedzi e-mail (P1): Cloudflare Email Routing na adres odpowiedzi → Email Worker zapisuje touchpoint direction=in i zatrzymuje sekwencję.
5. Formularz i quiz: pole heard_from, strona /polecenie/[kod]/ (kod musi istnieć w partners.ref_code lub być kodem klienta) przekazująca ref do /wycena/, wpis do consent_log przy każdym checkboxie z wersją tekstu.
6. Retencja: pomijaj leady z rekordem w projects; dla nich delete_after według {{RETENCJA_KLIENCI}}.
7. Eksport CSV każdej zakładki panelu.

Kryteria akceptacji:
- test: ten sam krok sekwencji uruchomiony dwa razy wysyła jedną wiadomość
- sekwencja zatrzymuje się najpóźniej 15 min po zmianie statusu
- liczby w raporcie zgadzają się z zapytaniami kontrolnymi na D1
```

---

## F11. Baner zgód, tagi reklamowe, strony docelowe

```
Przeczytaj: docs/05-MARKETING.md (§2, §6, §7, §11), docs/01-SPEC.md (§12, §15), .cursor/rules/formazieleni.mdc (zasada 5).

Najpierw plan. Poczekaj na akceptację.

Zadanie:
1. Lekki baner zgód (np. vanilla-cookieconsent) z Google Consent Mode v2: domyślnie odmowa, kategorie analityka i marketing, równorzędne przyciski „Akceptuję” i „Odrzucam”, link „Ustawienia cookies” w stopce, zapis wyboru dopiero po decyzji.
2. Tag Google (GA4 + Ads) i Meta Pixel ładowane wyłącznie po zgodzie marketingowej, asynchronicznie. Konwersje: lead_submit (wartość = wartość leada z 05-MARKETING §2, zmienna {{WARTOSC_LEADA}}), call_click, booking_click. Meta Conversions API tylko dla zgłoszeń ze zgodą.
3. Po zgodzie marketingowej zapamiętaj utm_* i ref z pierwszej wizyty (sessionStorage) i dołącz do leada. Bez zgody tylko parametry z adresu bieżącej strony + pole heard_from.
4. Dokument landingPage w Sanity (hasło, podtytuł, realizacje, pakiet, FAQ, utm_campaign) i szablon /lp/[slug]/: noindex, bez nawigacji, jedno CTA, formularz z kroku 1.
5. Budżety wydajności z SPEC §12 obowiązują także po zgodzie.

Kryteria akceptacji:
- bez zgody: 0 żądań do domen Google Ads, GA i Meta w zakładce Network
- po zgodzie: konwersja testowa widoczna w Google Ads i Meta Events Manager
- Lighthouse mobile /lp/ ≥ 95
```

---

## F12. Wyszukiwarka, atlas roślin, mój ogród, Mikroretencja

```
Przeczytaj: docs/08-PORTAL-FUNKCJE.md (M14, M15, M18, M25, §5), docs/07-WIEDZA-2026.md §6, .cursor/rules/formazieleni.mdc.
Najpierw plan. Poczekaj na akceptację.
Zadanie: schemat plant w Sanity i strony /rosliny/ z filtrami (progresywne ulepszenie); /moj-ogrod/ z zapisem do pamięci przeglądarki wyłącznie po kliknięciu „Zapisz”, link do udostępnienia i wysyłka listy do formularza; /mikroretencja/ ze sprawdzarką, treścią z CMS i datą weryfikacji; indeks Pagefind dla realizacji, usług, artykułów i roślin, ładowany po otwarciu wyszukiwarki.
Kryteria: Lighthouse mobile ≥ 95 na /rosliny/ i stronie rośliny; filtry i sprawdzarka działają z klawiatury; lista w mój ogród ma maksymalnie 20 elementów.
```

## F13. Kreator zakresu, kalendarz pielęgnacji, newsletter

```
Przeczytaj: docs/08-PORTAL-FUNKCJE.md (M17, M19, M20), docs/00-DANE.md, src/data/pricing.ts, db/0003_portal.sql.
Najpierw plan. Poczekaj na akceptację.
Zadanie: wyspa /kreator/ z 3 krokami i widełkami z pricing.ts (w granicach z 00-DANE.md), przekazanie wyboru do formularza; /kalendarz-pielegnacji/ z CMS; zapis do newslettera z podwójnym potwierdzeniem (tabele subscribers i consent_log), wysyłka miesięczna przez cron w workers/automation, link wypisania w każdym e-mailu.
Kryteria: bez potwierdzenia zapisu 0 wysyłek; wypisanie działa jednym kliknięciem; testy funkcji widełek.
```

## F14. Portal klienta i wideo-opinie

```
Przeczytaj: docs/08-PORTAL-FUNKCJE.md (M13, M24, §4, §5), db/0003_portal.sql.
Najpierw plan: model uprawnień, trasy, testy bezpieczeństwa. Poczekaj na akceptację.
Zadanie: migracja 0003; logowanie linkiem (token SHA-256, 15 min, jednorazowy; sesja HttpOnly/Secure/SameSite=Lax 30 dni; limity); /portal/ z listą projektów (v_portal_projects); /portal/projekt/[id]/ z osią etapów, plikami z R2 serwowanymi po kontroli uprawnień, uwagami przypiętymi do wizualizacji (x/y w %), rundami poprawek z limitem z CMS, akceptacją wersji; panel projektantki do wgrywania plików, zamykania rund i odpowiadania; e-maile o nowej wersji i odpowiedziach; wideo-opinie z zgodą i moderacją.
Kryteria: testy e2e, w których klient A nie widzi projektu klienta B; pobranie pliku bez sesji zwraca 403; JS portalu ≤ 150 KB gzip; axe: 0 naruszeń.
```

## F15. Płatności, bony, strefa partnera

```
Przeczytaj: docs/08-PORTAL-FUNKCJE.md (M21, M22, M23), db/0003_portal.sql, docs/05-MARKETING.md §9.
Najpierw plan. Poczekaj na akceptację.
Zadanie: Stripe Checkout (BLIK, Przelewy24, karta) dla /konsultacja/ i /bony/; webhook z weryfikacją podpisu i idempotencją po event.id; PDF bonu z kodem (w bazie skrót); realizacja kodu w formularzu; /partner/ z logowaniem linkiem, listą poleceń i nagród, formularzem „Poleć klienta” z potwierdzeniem zgody klienta, materiałami z kodem QR.
Kryteria: podwójny webhook nie tworzy drugiej płatności; bon nie daje się użyć dwa razy; partner widzi tylko swoje polecenia. Strona nie wystawia faktur.
```

## F16. Mapa realizacji i asystent AI

```
Przeczytaj: docs/08-PORTAL-FUNKCJE.md (M16, M26), db/0003_portal.sql.
Najpierw plan. Poczekaj na akceptację.
Zadanie: skrypt generujący uproszczoną mapę SVG z danych PRG (GUGiK) dla województw pomorskiego i kujawsko-pomorskiego, punkty z dokładnością do gminy, /mapa-realizacji/; asystent AI: indeks treści z CMS (usługi, ceny „od”, FAQ, proces, atlas) w Cloudflare Vectorize, odpowiedzi wyłącznie z indeksu z linkami do źródeł, brak odpowiedzi → formularz, informacja o rozmowie z AI, usuwanie e-maili i numerów telefonów z pytań przed zapisem, retencja 90 dni, widok v_unanswered_assistant w panelu.
Kryteria: SVG ≤ 60 KB; test 20 pytań spoza treści strony: asystent nie wymyśla cen ani terminów.
```

---

## F17. UX v3

```
Przeczytaj: docs/10-UX-AUTOMATYZACJA.md (§1, §2), docs/02-DESIGN.md, .cursor/rules/formazieleni.mdc.
Najpierw plan. Poczekaj na akceptację.
Zadanie: X3 szybka ścieżka „Oddzwońcie do mnie” (telefon + informacja o danych, source_detail=callback) w hero mobile, pasku mobilnym i /wycena/; X2 wariant formularza „jedno pytanie na ekran” z przełącznikiem testu H6; X4 strona /dostepnosc/ i testy CI na 6 najczęstszych błędów (kontrast, alt, etykiety, puste linki, puste przyciski, lang); X5 limit DOM 1000 w Lighthouse CI; X7 sekcja „Dlaczego projekt kosztuje tyle” na /cennik/; X8 pole „rok później” w realizacji; docs/TEST-5-SEKUND.md ze scenariuszem X1.
Kryteria: axe 0 błędów; DOM strony głównej ≤ 1000; oba warianty formularza zapisują ten sam model leada.
```

## F18. Automatyzacje

```
Przeczytaj: docs/10-UX-AUTOMATYZACJA.md (§3 M34–M36, §4), db/0004_automation.sql.
Najpierw plan: lista automatyzacji, wyzwalacze, klucze idempotencji, testy. Poczekaj na akceptację.
Zadanie: migracja 0004; wspólny moduł runAutomation(id, subjectId, key) z zapisem do automation_runs; A3 webhook operatora {{OPERATOR_TELEFONII}} → calls, SMS i zadanie (inna treść poza godzinami); A4 webhook Cal.com; A6 akceptacja oferty → projekt, konto, etapy, zadanie faktury; A8, A9 ankiety (surveys, link z tokenem), A11 powiadomienie o nowej opinii (jeśli dostęp do API Google Business Profile), A12 szkic case study w Sanity, A13 szkice wpisów, A15 rocznica, A16 alert stop-loss, A17 raport tygodniowy, A19 alert Mikroretencji, A21 pytania asystenta, A22 alert błędów; widoki v_calls_weekly, v_csat_by_stage, v_review_coverage, v_automation_errors w panelu.
Kryteria: każdy wyzwalacz uruchomiony dwa razy daje jedną akcję; wynik ankiety ≤ 3 tworzy zadanie „telefon w 48 h”; prośba o opinię Google trafia do każdego klienta niezależnie od wyniku ankiety.
```

## F19. AI podgląd stylu i centrum wiedzy

```
Przeczytaj: docs/10-UX-AUTOMATYZACJA.md (M27, M28, §7), db/0004_automation.sql, docs/08-PORTAL-FUNKCJE.md M14.
Najpierw plan z wyborem dostawcy modelu obrazowego i szacunkiem kosztu 1 obrazu. Poczekaj na akceptację.
Zadanie: /inspiracja-ai/: upload zdjęcia (zgoda z wersją), wybór stylu z quiz.json, 1–3 obrazy z trwałym napisem „Wizualizacja AI: inspiracja, nie projekt”, limit 3/dobę, miesięczny limit kosztów {{BUDZET_AI}} (po przekroczeniu moduł się wyłącza), usuwanie po 30 dniach, CTA do konsultacji z przekazaniem stylu; centrum wiedzy: strony filarowe, glosariusz (dokument glossaryTerm w Sanity), powiązania artykuł ↔ roślina ↔ realizacja, krótka odpowiedź na początku każdej strony.
Kryteria: 20 testowych zdjęć z Pomorza ocenionych ręcznie; brak obrazu bez napisu; koszt miesięczny widoczny w v_ai_preview_monthly.
```

## F20. Wykonawcy, lista zakupów, oferta online, dziennik, opieka

```
Przeczytaj: docs/10-UX-AUTOMATYZACJA.md (M29–M33), db/0004_automation.sql, docs/08-PORTAL-FUNKCJE.md M13.
Najpierw plan. Poczekaj na akceptację. Moduły M29 i M33 włączaj tylko po potwierdzeniu w 00-DANE.md, że pracownia to oferuje.
Zadanie: panel wykonawców (candidate → verified) i przypisanie do projektu z oceną klienta; lista zakupów z projektu (PDF/CSV, informacja o rabacie DAMPS POL); oferta w portalu z akceptacją (accepted_via_portal, wersja oświadczenia) i przejściem do zaliczki M21; dziennik realizacji ze zdjęciami; plan opieki z terminami wizyt i przypomnieniami.
Kryteria: klient widzi tylko swoje wpisy i dokumenty; akceptacja oferty zapisuje wersję treści; eksport listy zakupów działa na telefonie.
```

---

## F21. Platformy ogłoszeniowe

```
Przeczytaj: docs/11-PLATFORMY.md, db/0005_platforms.sql, docs/05-MARKETING.md §11.
Najpierw plan. Poczekaj na akceptację.
Zadanie: migracja 0005; w panelu zakładka „Platformy” z tabelą listings (status, data kontroli danych, ocena, liczba opinii, koszt miesięczny) i przyciskiem „sprawdzone dziś”; rejestr kupionych kontaktów platform_contacts z polami koszt, punkty, szacowana wartość zlecenia, czas pierwszej odpowiedzi, wynik, powód przegranej; raport v_platform_economics z alertem, gdy średni koszt kontaktu przekroczy limit z 11-PLATFORMY §1; automatyzacja A23: Cloudflare Email Routing na adres powiadomień → Email Worker → SMS do projektantki i zadanie „kup kontakt i odpowiedz” (bez pobierania danych z serwisu platformy); pole heard_from w formularzu rozszerzone o Grupa na Facebooku, Oferteo, Fixly, Katalog firm, Pinterest.
Kryteria: dwa powiadomienia o tym samym zapytaniu dają jedno zadanie (klucz platform + external_ref); raport liczy koszt na umowę; leady z platform mają source = 'marketplace' i source_detail = 'oferteo:<numer>'.
```

---

## F22. Zgodność 2026 i warstwa dla agentów AI

```
Przeczytaj: docs/12-ZGODNOSC-I-AGENCI.md, db/0006_compliance_agents.sql, docs/08-PORTAL-FUNKCJE.md M26, docs/10-UX-AUTOMATYZACJA.md M27.
Najpierw plan. Poczekaj na akceptację.
Zadanie:
1. Migracja 0006.
2. AI Act: stała etykieta „Asystent AI” i pierwsza wiadomość z informacją; obraz z M27 nie może zostać zapisany bez widocznego napisu i wpisu w ai_content_log (z metadanymi maszynowymi, jeśli dostawca je daje); docs/REJESTR-AI.md z tabelą systemów i datą przeglądu; widok v_ai_labeling_gaps w panelu.
3. Poczta: webhooki dostawcy → email_events; tabela email_suppressions blokuje wysyłki (sprawdzana przed każdą wiadomością marketingową i przypomnieniem); nagłówki List-Unsubscribe i List-Unsubscribe-Post zgodne z RFC 8058; osobne subdomeny dla strumienia transakcyjnego i marketingowego; widok v_email_health w panelu; automatyzacje A24 i A25.
4. Faktury: po statusie paid tworzenie invoice_tasks z typem odbiorcy (B2C albo B2B z NIP) i terminem; widok v_unissued_invoices; formularz B2B zbiera NIP. Strona nie wystawia faktur.
5. Warstwa dla agentów: /api/public/oferta.json, /api/public/faq.json, /api/public/realizacje.json (bez danych osobowych, z licencją i limitem zapytań), wpis w llms.txt; logowanie wywołań do agent_hits bez IP; widok v_agent_traffic.
6. P2, osobna decyzja: serwer MCP /mcp z narzędziami sprawdz_oferte, sprawdz_dostepnosc_konsultacji, zloz_zapytanie; zapytanie tworzy leada tylko po potwierdzeniu linkiem z e-maila.
Kryteria: asystent nigdy nie działa bez etykiety; obraz AI bez oznaczenia nie przechodzi zapisu; adres ze skargą nie dostaje kolejnej wysyłki; płatność bez zadania fakturowego nie istnieje; pliki JSON nie zawierają danych osobowych.
```

---

## F23. Wariant darmowy i Fakturownia

```
Przeczytaj: docs/13-KOSZTY-I-REPOZYTORIA.md, db/0007_fakturownia.sql, docs/12-ZGODNOSC-I-AGENCI.md §3.
Najpierw plan. Poczekaj na akceptację.
Zadanie:
1. Migracja 0007.
2. Powiadomienia o leadzie: kanał push (bot Telegrama albo ntfy) zamiast SMS; wspólny moduł notify(kanał, treść) z awaryjnym e-mailem; SMS do klienta tylko wtedy, gdy sam wybrał taki kontakt.
3. Fakturownia: klient API w Workerze (token w sekrecie FAKTUROWNIA_TOKEN, domena w FAKTUROWNIA_DOMAIN); po statusie paid sprawdzenie GET /invoices.json?oid=<payment_id>, a gdy brak, POST /invoices.json (kind proforma albo vat, dane B2C lub B2B z NIP, pozycje z pakietu); zapis fakturownia_invoice_id i numeru; wysyłka do klienta przez send_by_email; błąd zapisujemy w last_error i ponawiamy raz na godzinę, maksymalnie 5 razy.
4. Liczniki limitów: zapis dziennego zużycia do usage_counters (żądania Workera, wysłane e-maile, bajty w R2, obrazy AI) i alert przy 70% limitu (widok v_free_tier_pressure).
5. Panel: zakładka „Faktury” na widoku v_invoices_status i „Limity” na v_free_tier_pressure.
Kryteria: dwa webhooki tej samej płatności dają jedną fakturę (klucz oid); brak tokenu wyłącza integrację, ale nie blokuje płatności; żadne dane faktury poza numerem i identyfikatorem nie są zapisywane w D1.
```

---

## F24. Wybór bibliotek

```
Przeczytaj: docs/14-REPOZYTORIA-PLUS.md §7, docs/01-SPEC.md §12, .cursor/rules/formazieleni.mdc (reguła 3).
Zadanie: zanim dodasz jakąkolwiek zależność, przygotuj krótką notatkę: co robi, rozmiar po spakowaniu, licencja, data ostatniego commitu, czy działa w Workers, jak ją usunąć. Dla portalu (F14) porównaj better-auth z własnym logowaniem linkiem z migracji 0003 i wybierz jedno rozwiązanie. Wynik dopisz do docs/DECYZJE-TECHNICZNE.md.
Kryteria: żadna nowa zależność nie trafia do repozytorium bez wpisu w tym pliku; budżety JS z §12 nadal spełnione.
```

---

## F25. Skuteczność (M43–M46)

```
Przeczytaj: docs/15-EFEKTYWNOSC.md, db/0004_automation.sql, db/0002_crm_marketing.sql (referrals).
Najpierw plan. Poczekaj na akceptację.
Zadanie:
1. M43: potwierdzenie po rezerwacji, przypomnienia 24 h i 2 h z przyciskami „Potwierdzam” i „Zmieniam termin” (linki z tokenem, bez logowania), odwołanie zwalnia termin i powiadamia listę oczekujących; tabela waitlist i pole no_show w kalendarzu; automatyzacje A30–A32 z kluczem idempotencji.
2. M44: pasek postępu liczony z faktycznie udzielonych odpowiedzi; wybór z hero przenoszony do quizu i formularza jako pierwszy ukończony krok; oś etapów w portalu pokazuje, ile zostało.
3. M45: zaproszenie do programu poleceń tylko po ankiecie z wynikiem 4–5 i 30 dni po odbiorze; kod w referrals; kwartalny raport porównujący wartość umów z poleceń i bez.
4. M46: skrypt Speculation Rules w layoucie: prefetch linków wewnętrznych, prerender dla /realizacje/, /cennik/, /wycena/; wykluczenia /panel/, /portal/, /api/, linki z parametrami; zdarzenia analityczne wysyłane dopiero po aktywacji strony (prerenderingchange).
Kryteria: żadne przypomnienie nie wychodzi dwa razy; pasek postępu nigdy nie pokazuje postępu bez odpowiedzi; prerender nie dotyczy stron zmieniających stan; LCP p75 mierzone przed i po.
```

---

## F26. Fundament niezawodności (B1–B5, B10)

```
Przeczytaj: docs/16-CO-BYM-ZMIENIL.md §5, db/0004_automation.sql, src/lib/notify.ts.
Najpierw plan. Poczekaj na akceptację.
Zadanie:
1. Outbox: tabela outbox (typ, payload, status, próby, next_try_at, last_error); każda wiadomość i zadanie najpierw zapisywane, wysyłka przez cron co 5 min z wykładniczym ponawianiem i kolejką błędów; panel pokazuje zaległości.
2. Idempotencja: nagłówek Idempotency-Key na publicznych POST-ach, tabela request_keys z TTL 24 h; powtórka zwraca pierwszy wynik.
3. Telefon w E.164 i wykrywanie duplikatów leadów (ten sam telefon lub e-mail w 30 dni) z oznaczeniem duplicate_of zamiast kasowania.
4. Moduł czasu pracy: godziny z ustawień, polskie dni wolne, funkcje nextBusinessTime i deadline używane przez SLA, przypomnienia i ważność ofert.
5. Środowisko testowe: osobna baza, bucket i domena; skrypt eksportu i odtworzenia kopii; monitor pulsu crona (brak sygnału 30 min = alert).
Kryteria: awaria dostawcy poczty nie gubi leada (wiadomość zostaje w outboxie); dwa identyczne POST-y dają jeden rekord; test odtworzenia kopii opisany w docs/LAUNCH.md.
```

---

## F27. Portal v3 i pipeline CAD

```
Przeczytaj: docs/17-CAD-3D.md, docs/16-CO-BYM-ZMIENIL.md §6, db/0008_reliability.sql, docs/08-PORTAL-FUNKCJE.md M13a.
Najpierw plan. Poczekaj na akceptację.
Zadanie: migracja 0008; w portalu widget „Co teraz”, terminy odpowiedzi przy uwagach i wersjach, porównanie dwóch wersji koncepcji z listą zmian, harmonogram płatności, role dostępu (właściciel, domownik, wykonawca, oglądający) z testami uprawnień; zakładka 3D z linkiem do modelu i panoramą 360 w lekkiej przeglądarce; rejestr design_assets z wersjonowaniem, znakiem wodnym i flagą widoczności; import listy roślin z CSV do listy zakupów i atlasu po nazwie łacińskiej; automatyzacje A35–A38 przez outbox.
Kryteria: wykonawca widzi tylko pliki oznaczone dla niego; render bez znaku wodnego nie pojawia się przed akceptacją koncepcji; panorama ładuje się dopiero po kliknięciu; pliki źródłowe (.skp, .dwg) nie trafiają do R2.
```

---

## F28. API pracowni, obmiar, puls i RODO

```
Przeczytaj: docs/18-SKETCHUP-CLAUDE.md, db/0009_studio.sql, sketchup-plugin/forma_zieleni/main.rb.
Najpierw plan. Poczekaj na akceptację.
Zadanie:
1. Migracja 0009.
2. POST /api/studio/asset: token pracowni, nagłówek Idempotency-Key, przyjmuje plik base64 (render, panorama, plan, CSV roślin, obmiar), zapisuje do R2 i design_assets albo do takeoffs i listy zakupów; limit rozmiaru zgodny z 17-CAD-3D.md §6; odrzuca plik bez znaku wodnego, gdy koncepcja nie jest zaakceptowana.
3. Import CSV roślin: dopasowanie po nazwie łacińskiej do atlasu, raport braków; import obmiaru: pozycje do takeoffs i przeliczenie v_takeoff_cost.
4. Puls zadań: każde zadanie cykliczne zapisuje heartbeat; cron sprawdza v_heartbeat_alerts i wysyła alert przez outbox.
5. Samoobsługa RODO: formularz na stronie, potwierdzenie linkiem, eksport danych do ZIP albo usunięcie z zachowaniem danych wymaganych prawem; wpis do gdpr_requests i dziennik.
Kryteria: dwa wysłania tego samego pliku dają jedną wersję; CSV z rośliną spoza atlasu tworzy zadanie „uzupełnij atlas”; brak pulsu przez dwa okresy daje alert; wniosek RODO wykonany w 30 dni ma wpis z datą.
```

---

## F29. System pracy pracowni i jakość wdrożeń

```
Przeczytaj: docs/19-PRACOWNIA-IT.md, db/0010_studio_ops.sql, docs/18-SKETCHUP-CLAUDE.md.
Najpierw plan. Poczekaj na akceptację.
Zadanie:
1. Migracja 0010.
2. Panel: zakładka „Pracownia” z wpisem czasu w 2 kliknięciach (projekt, etap, minuty), widokami v_project_margin, v_wip i alertem przy przekroczeniu limitu 3 koncepcji.
3. Metryki wdrożeń: GitHub Actions po każdym wdrożeniu wysyła wpis do /api/ops/deploy (sha, czas od commita, flaga ai_assisted); awaria zgłoszona w panelu wiąże się z ostatnim wdrożeniem; widok v_delivery_metrics; flaga freeze blokująca wdrożenia nowych funkcji przy odsetku nieudanych powyżej 15%.
4. Rośliny: import i eksport CSV danych atlasu (masowa edycja), tabela plant_supply z dostępnością i ceną u partnera, zadanie odświeżenia po 90 dniach, pokazanie ceny orientacyjnej w liście zakupów klienta.
5. Kontrola kompletności przed wysłaniem projektu do portalu: brak ceny w obmiarze, roślina spoza atlasu, render bez znaku wodnego, brak alt w zdjęciu; wynik jako lista do odhaczenia.
Kryteria: marża projektu liczy się dopiero, gdy są godziny; freeze faktycznie blokuje wdrożenie funkcji; kontrola kompletności nie pozwala opublikować wersji z brakami.
```

---

## F30. Aplikacja mobilna, MVP

```
Przeczytaj: docs/20-APLIKACJA-GARDEN-OS.md (§2–§4, §9), db/0011_app.sql, docs/08-PORTAL-FUNKCJE.md M13.
Najpierw plan. Poczekaj na akceptację.
Zadanie: projekt Expo (SDK zgodny z React Native w momencie startu), TypeScript, Expo Router; logowanie linkiem e-mail na tym samym API co portal (sesja w bezpiecznym magazynie urządzenia); zakładki Projekt, GARDEN OS, Rośliny, Kontakt; rejestracja tokenu push w tabeli devices; ekran ustawień powiadomień (kanał, pora, wyłączenie); konto demo dla recenzenta z przykładowym projektem; ekran prywatności zgodny z tym, co zbieramy; brak uprawnień do kontaktów i lokalizacji w tle; EAS Build i EAS Update skonfigurowane na planie darmowym.
Kryteria: aplikacja działa bez internetu w trybie odczytu ostatnio pobranych danych; wylogowanie czyści dane lokalne; żaden ekran nie prosi o uprawnienie, którego nie używa; zgłoszenie do sklepów ma komplet z §3.
```

## F31. GARDEN OS

```
Przeczytaj: docs/20-APLIKACJA-GARDEN-OS.md §5–§7, db/0011_app.sql, atlas roślin (docs/08-PORTAL-FUNKCJE.md M14).
Najpierw plan. Poczekaj na akceptację.
Zadanie: reguły pielęgnacji przy gatunku w CMS (miesiąc, czynność, warunek); generowanie garden_tasks przy tworzeniu projektu (kopia reguł, bez wstecznych zmian); ekran „Dziś w ogrodzie” z jednym zadaniem i powodem; kalendarz 12 miesięcy z v_garden_month; dziennik ze zdjęciem i notatką do care_log i R2; alerty pogodowe z darmowego API prognoz dla lokalizacji ogrodu, tylko dla projektów z roślinami wrażliwymi, z deduplikacją w weather_alerts; gwarancje z przypomnieniem 30 dni wcześniej; zgłoszenie problemu z rośliną jako zadanie dla pracowni, bez automatycznej diagnozy; limit 4 powiadomień miesięcznie.
Kryteria: zadania klienta nie zmieniają się po edycji reguł w atlasie; alert przymrozkowy wychodzi raz na dzień; zgłoszenie problemu trafia do panelu z e-mailem i zdjęciem.
```

---

## F32. Ochrona zakresu i marży

```
Przeczytaj: docs/21-UPROSZCZENIE.md §2 i §7, db/0012_scope.sql, docs/19-PRACOWNIA-IT.md §3.
Zadanie: migracja 0012; w panelu przy projekcie sekcja „Poza zakresem” (opis, szacunek godzin, przycisk „wyceń” albo „gratis”, zapis decyzji i daty) oraz dziennik decyzji z jednym polem na temat i decyzję, z możliwością wskazania wersji pliku; w portalu klient widzi wycenę zmiany i akceptuje ją jednym kliknięciem; raporty v_scope_creep i v_content_coverage w zakładce Pracownia; po odbiorze projektu automatyczne utworzenie pięciu wpisów w content_assets ze statusem „planowany”.
Kryteria: zmiana powyżej 2 godzin nie da się oznaczyć jako wykonana bez decyzji; każda akceptacja klienta ma datę i źródło; projekt bez kompletu materiałów jest widoczny na liście.
```

---

## F33. Przepustowość i tryb awaryjny

```
Przeczytaj: docs/22-JEDEN-PROJEKTANT.md, db/0013_capacity.sql, db/0010_studio_ops.sql.
Najpierw plan. Poczekaj na akceptację.
Zadanie: migracja 0013; w panelu zakładka „Kalendarz mocy” z widokiem v_capacity (dostępne, zarezerwowane, wolne godziny, wypełnienie w procentach na 3 miesiące do przodu); normy godzinowe stage_norms liczone z time_entries i aktualizowane jednym przyciskiem; po akceptacji oferty automatyczna rezerwacja godzin w capacity_bookings według norm i metrażu; na stronie i w ofercie pole „najbliższy wolny termin” liczone z v_capacity; reguła budżetu reklam: wypełnienie powyżej 85% obniża dzienny budżet o połowę, 100% wstrzymuje kampanie (flaga feature_flags); tryb awaryjny jako jedna flaga, która wstrzymuje kampanie i sekwencje, przełącza formularz na listę oczekujących i podmienia teksty na wersję z terminem.
Kryteria: termin nigdy nie pochodzi z ręcznego wpisu, tylko z rezerwacji; włączenie trybu awaryjnego nie zatrzymuje spraw klientów w toku; wyłączenie kampanii działa w mniej niż 5 minut.
```
