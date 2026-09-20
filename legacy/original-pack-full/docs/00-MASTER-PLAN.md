# Plan główny: jedna całość

Ten plik spina wszystko, co powstało w projekcie. Czytaj go pierwszy. Indeks modułów, automatyzacji, dowodów i faz: `INDEKS.md`. Dane potwierdzone: `00-DANE.md`.

## 1. Sytuacja w pięciu zdaniach

Forma Zieleni projektuje zieleń od prawie 10 lat w Trójmieście i na Pomorzu, a projektuje jedna osoba: właścicielka firmy. Projekty kosztują od 2 500 do 25 000 zł, największe do 50 000 zł, średnia umowa to 8–15 tys. zł przy bardzo wysokiej marży. Obecna strona na WordPressie ma resztki szablonu, literówki, brak cen, procesu i realizacji, więc nie sprzedaje. Budżet reklam to maksymalnie 300 zł miesięcznie, prowadzonych samodzielnie. Ograniczeniem nie jest popyt, tylko liczba godzin jednej projektantki.

## 2. Cel i sposób jego osiągnięcia

**Cel:** wypełnić kalendarz projektantki zleceniami o jak najwyższej wartości, przy jak najmniejszej liczbie godzin na obsługę.

Trzy dźwignie, w tej kolejności:
1. **Dowód i jasność oferty** (strona): realizacje, ceny „od”, proces, terminy, opinie.
2. **Szybka i policzona sprzedaż**: dwie ścieżki zgłoszenia, kontakt w godzinę, oferta w trzech wariantach z terminem ważności, rezerwacja godzin w kalendarzu.
3. **Odciążenie pracowni**: automatyzacje, wtyczka SketchUp, portal, aplikacja, Fakturownia.

Reklamy są regulatorem, nie motorem: włączamy je tylko wtedy, gdy w kalendarzu są wolne godziny (`22-JEDEN-PROJEKTANT.md` §2).

## 3. Decyzje nadrzędne (gdy dokumenty się różnią, obowiązuje ta tabela)

| Temat | Decyzja | Zastępuje |
|---|---|---|
| Cel marketingu | ok. 11 leadów miesięcznie, w sezonie 15–20; powyżej sufitu rośnie cena, nie budżet | „maksymalizacja leadów” w `05-MARKETING.md` |
| Budżet reklam | 300 zł miesięcznie, zależny od wypełnienia kalendarza | stały podział w `06-REKLAMY-DIY.md` §2 |
| Powiadomienia o leadzie | push (Telegram albo ntfy), SMS tylko do klienta na jego życzenie | SMSAPI w `01-SPEC.md` §11 |
| Kalkulator | kreator zakresu M17 z `pricing.ts` | prosty kalkulator M3 |
| Faktury | Fakturownia przez API, KSeF po jej stronie | ręczne zadania fakturowe w `12-ZGODNOSC-I-AGENCI.md` §3 |
| Worker automatyzacji | `workers/automation` | `workers/retention` z fazy F4 |
| Elementy DOM na stronie głównej | ≤ 1000 | ≤ 1500 z wcześniejszej wersji §12 |
| Marketplace Facebooka | nie używamy, usługi są tam zakazane | pomysł ogłoszeń w Marketplace |
| Terminy dla klienta | wyłącznie z rezerwacji godzin (`capacity_bookings`) | terminy podawane z głowy |
| AI | podgląd stylu i asystent zawsze oznaczone, bez automatycznej publikacji | dowolne użycie AI |

## 4. System w czterech warstwach

| Warstwa | Co to jest | Pliki |
|---|---|---|
| Strona | dowód, oferta, ceny, treści, dwie ścieżki zgłoszenia, quiz, kreator | `01-SPEC`, `02-DESIGN`, `03-COPY`, `10-UX-AUTOMATYZACJA`, `15-EFEKTYWNOSC`, `16-CO-BYM-ZMIENIL` |
| Sprzedaż i marketing | sekwencje, reklamy za 300 zł, platformy, polecenia, ochrona zakresu | `05-MARKETING`, `06-REKLAMY-DIY`, `11-PLATFORMY`, `21-UPROSZCZENIE` |
| Obsługa klienta | portal, oferta online, płatności, aplikacja z GARDEN OS | `08-PORTAL-FUNKCJE`, `20-APLIKACJA-GARDEN-OS` |
| Pracownia | SketchUp, V-Ray, AutoCAD, wtyczka, czas i marża, przepustowość | `17-CAD-3D`, `18-SKETCHUP-CLAUDE`, `19-PRACOWNIA-IT`, `22-JEDEN-PROJEKTANT` |

Warstwy techniczne wspólne dla wszystkich: `12-ZGODNOSC-I-AGENCI` (prawo, poczta, agenci AI), `13-KOSZTY-I-REPOZYTORIA` i `14-REPOZYTORIA-PLUS` (koszt 0 zł, biblioteki), `07-WIEDZA-2026` (aktualna wiedza), `09-AUDYT` (co było pominięte i jak sprawdzone).

## 5. Kolejność: pięć etapów z bramkami

| Etap | Fazy | Bramka wejścia do następnego etapu |
|---|---|---|
| I. Strona, która sprzedaje | F0–F9 plus F17, F26 | Strona żyje, pierwsze 10 zgłoszeń w bazie, czas kontaktu poniżej godziny |
| II. Widoczność i pierwsze reklamy | F7, F10, F11, F21, F23 | Znany koszt leada i pierwsza umowa ze strony |
| III. Obsługa i porządek | F12–F14, F27, F32, F33 | Portal używany przez 3 klientów, terminy z kalendarza, zmiany poza zakresem policzone |
| IV. Pracownia i automatyzacje | F18, F19, F28, F29 | Godziny na projekt spadają, komplet materiałów z każdego projektu |
| V. Rozszerzenia | F15, F16, F20, F22, F24, F25, F30, F31 | Włączamy tylko moduły, które mają uzasadnienie w danych |

Zasada: jeden etap naraz. Moduł z późniejszego etapu można włączyć wcześniej tylko wtedy, gdy zastępuje ręczną pracę, która już boli.

## 6. Co jest kodem, a co specyfikacją

**Gotowy kod w pakiecie:** 13 migracji bazy (`db/`), `src/lib/fakturownia.ts`, `src/lib/notify.ts`, `src/data/pricing.ts`, `src/data/quiz.json`, `sanity/schema.ts`, `scripts/import-wordpress.mjs`, `scripts/check-placeholders.mjs`, wtyczka `sketchup-plugin/`, `public/robots.txt`, `public/llms.txt`, `ads/*.txt`, `docs/redirects.csv`.

Baza po wszystkich migracjach: 77 tabel i 37 widoków raportowych, sprawdzone jednym przebiegiem w SQLite.

**Do zbudowania w Cursorze:** strony, API, portal, aplikacja. Służą do tego prompty F0–F33 w `04-PROMPTS.md`, po jednym na czat.

## 7. Czego brakuje, żeby ruszyć

1. Ceny i zawartość trzech pakietów oraz stawka godzinowa.
2. Godziny projektowe tygodniowo i tygodnie pracy w roku.
3. Zdjęcia 8–12 realizacji i zgody właścicieli posesji.
4. Godziny kontaktu, decyzja o zaliczce i terminie ważności oferty.
5. Token Fakturowni, kanał powiadomień, dane rejestrowe do polityki prywatności.
6. Wzór umowy z przeniesieniem praw autorskich po zapłacie.

Pełne listy: `00-DANE.md` i `01-SPEC.md` §16.

## 8. Liczby, po których poznamy, że działa

| Warstwa | Metryka | Cel |
|---|---|---|
| Strona | leady na sesje | baseline +50% w 90 dni |
| Sprzedaż | mediana czasu do pierwszego kontaktu | poniżej 60 minut |
| Sprzedaż | leady miesięcznie | 11, w sezonie 15–20 |
| Pracownia | wypełnienie kalendarza na 8 tygodni | 70–85% |
| Pracownia | godziny na projekt i marża z godzin | spadek godzin, marża rosnąca |
| Klient | opinie Google | co najmniej 1 nowa miesięcznie |
| System | nieudane wdrożenia, brak pulsu, płatności bez faktury | poniżej 15%, zero, zero |

## 9. Zasady, które obowiązują zawsze

1. Żadnych wymyślonych liczb, opinii, nagród i terminów. Brak danych to `{{PLACEHOLDER}}`, a build produkcyjny się nie uda.
2. Wizualizacja AI nigdy nie udaje zdjęcia ani projektu.
3. O opinię prosimy wszystkich klientów, nigdy wybiórczo.
4. Nic nie wychodzi do klienta bez zapisu w bazie (outbox) i bez klucza idempotencji.
5. Terminy pochodzą z kalendarza, ceny z CMS, dane roślin z atlasu.
6. Nowy moduł wchodzi dopiero, gdy poprzedni ma dane potwierdzające sens.
