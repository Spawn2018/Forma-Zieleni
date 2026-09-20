# v3: UX/UI, rozbudowa i automatyzacja (plan na lidera rynku)

Uzupełnia pliki 01–09. Dowody E21–E27 dopisane do `01-SPEC.md` §4. Źródła: `docs/_research-2026-09-17.md`. Oznaczenie **[wiedza]** = fakt z wiedzy modelu, niesprawdzony wyszukiwaniem w tym czacie; do weryfikacji.

## 0. Diagnoza pozycji

1. **Cena.** Szacunki kb.pl 2026 dla Gdańska (pełny projekt brutto): do 500 m² 4 220 zł, 500–1000 m² 6 110 zł, powyżej 1000 m² 9 660 zł; dodatkowa wizyta 279 zł/h [E24]. Średnia umowa Forma Zieleni (8–15 tys. zł) jest na poziomie największych projektów z tych szacunków lub wyżej. Wniosek: nie konkurujemy ceną. Strona musi uzasadnić cenę dowodami, procesem, portalem i opieką po projekcie.
2. **Presja aplikacji AI.** Aplikacje „zdjęcie → wizualizacja” (GenRoom, HomeDesigns AI, DreamYard, Yardwise) robią fotorealistyczny obraz w 15–60 s i promują się po polsku [E25]. Ładna wizualizacja przestaje być wyróżnikiem. Wyróżnikiem jest projekt wykonalny w lokalnych warunkach, realizacja i opieka.
3. **Lider online.** Yardzen łączy AI, zdjęcia, lokalne dane, iteracyjne poprawki i sieć sprawdzonych wykonawców [E25].
4. **Standard oprogramowania dla projektantów.** Houzz Pro ma panel klienta z wybieranymi modułami (wiadomości, finanse, mood boardy, rzuty 3D, zadania, harmonogram, pliki, dziennik), propozycje, faktury i płatności online [E26].
5. **Dostępność.** 95,9% stron głównych ma wykrywalne błędy WCAG, a 6 typów błędów to 96% wszystkich [E23]. Pełna dostępność to realny wyróżnik.
6. **Telefony.** Popularne „62% nieodebranych” to badanie z 2016 r. na 85 firmach. Nowsze dane Invoca (lipiec 2026): z człowiekiem rozmawiało 56% dzwoniących [E27]. Problem jest realny, skala mniejsza niż w reklamach dostawców.

## 1. Zasady UX/UI v3

| ID | Zasada | Dowód | Konsekwencja |
|---|---|---|---|
| U1 | Niska złożoność wizualna i typowy układ strony z branży | Tuch i in. 2012: najwyżej oceniane w ciągu 17–50 ms są strony proste i „prototypowe” [E21] | Oryginalność w zdjęciach i detalach (etykiety roślin), nie w nawigacji. Logo lewo, menu, CTA prawo, hero z realizacją |
| U2 | Jedna rzecz na ekran w formularzach | GOV.UK: łatwiej dla mniej pewnych użytkowników, lepiej na mobile, lepsza obsługa błędów; wskaźnik postępu nie zmienił ukończeń [E22] | Wariant formularza „jedno pytanie na ekran” (test H6); pasek postępu prosty, bez rozbudowy |
| U3 | Dostępność jako przewaga | WebAIM 2026 [E23] | CI blokuje 6 najczęstszych błędów; strona `/dostepnosc/`; kwartalny test z czytnikiem ekranu |
| U4 | Mniej elementów | Średnio 1 437 elementów na stronę [E23]; więcej elementów = niższa konwersja [E3] | Limit DOM strony głównej obniżony z 1 500 do 1 000 |
| U5 | Pokazuj pracę i postęp | [E7], panel klienta Houzz Pro [E26] | Portal z dziennikiem, wersjami i akceptacjami; klient widzi tylko to, co mu udostępniono |
| U6 | Każdy kontakt odebrany | [E9], [E27] | Oddzwanianie po nieodebranym połączeniu, SLA |

## 2. Ulepszenia istniejących elementów

| ID | Zmiana | Gdzie | Dowód | Priorytet | Kryterium odbioru |
|---|---|---|---|---|---|
| X1 | Test 5 sekund: 5 osób ogląda stronę główną przez 5 s i mówi, co firma robi i gdzie działa | S1–S2 | [E21] | P0 | ≥ 4 z 5 osób poprawnie podaje usługę i region |
| X2 | Wariant formularza „jedno pytanie na ekran” | M2 | [E22] | P1 | Test H6: ukończenie formularza |
| X3 | Szybka ścieżka „Oddzwońcie do mnie”: tylko telefon + informacja o danych | Hero mobile, pasek mobilny, `/wycena/` | [E9], [E22] | P0 | Lead zapisany z `source=form`, `source_detail=callback` |
| X4 | Strona `/dostepnosc/` (deklaracja, kontakt w sprawie barier) + testy 6 najczęstszych błędów w CI | F8, CI | [E23] | P0 | 0 błędów axe; ręczny test z czytnikiem ekranu raz na kwartał |
| X5 | Limit DOM strony głównej ≤ 1 000 | 01-SPEC §8 i §12, F3 | [E23], [E3] | P0 | Lighthouse CI |
| X6 | Sekcja i artykuł „Wizualizacja z aplikacji AI a projekt ogrodu” (wymiary, gatunki dobrane do gleby i klimatu, odwodnienie, lista zakupów, nadzór) | 03-COPY, artykuł nr 16 | [E25] | P0 | Link z FAQ i z AI podglądu (M27) |
| X7 | „Dlaczego projekt kosztuje tyle”: co zawiera pakiet i ile godzin pracy stoi za etapami | `/cennik/` | [E24], [E7] | P1 | Test H2 (ceny widoczne) z tą sekcją |
| X8 | Każda realizacja: przed, po oprawie i „rok później” | Case study | [E1], [E7] | P1 | Min. 3 realizacje z „rok później” w 12 mies. |
| X9 | Małe testy użyteczności co kwartał na 5 osobach [wiedza: praktyka NN/g] | Proces | — | P1 | Raport z 3 największymi problemami i poprawkami |

## 3. Nowe moduły v3

| ID | Moduł | Opis i zabezpieczenia | Dowód | Priorytet |
|---|---|---|---|---|
| M27 | AI podgląd stylu | Klient wgrywa zdjęcie działki i wybiera styl z quizu; dostaje 1–3 obrazy kierunku. Na obrazie stały napis „Wizualizacja AI: inspiracja, nie projekt”. Zgoda na przetwarzanie zdjęcia; usunięcie po 30 dniach; limit 3 generacji na dobę; miesięczny limit kosztów `{{BUDZET_AI}}`. CTA: „Zamień inspirację w projekt” → konsultacja. Oznaczanie treści AI [wiedza: AI Act, art. 50]. | [E25] | P1 |
| M28 | Centrum wiedzy | Strony filarowe (projekt ogrodu, rośliny, woda, mała architektura, balkony) + artykuły + glosariusz pojęć + atlas roślin (M14) + FAQ, powiązane linkami; każda strona zaczyna się od krótkiej odpowiedzi | [E13], [E14] | P1 |
| M29 | Opieka po projekcie | Przeglądy ogrodu {{2}} razy w roku, zdjęcia postępu w portalu, przypomnienia (M19). Tylko jeśli w ofercie. | [E12] | P2 |
| M30 | Sieć sprawdzonych wykonawców | Katalog wykonawców w portalu, przekazanie projektu, ocena wykonawcy przez klienta po realizacji; powiązanie z tabelą `partners` | [E25] | P1 |
| M31 | Lista zakupów z projektu | Eksport roślin i materiałów do PDF/CSV; informacja o rabacie DAMPS POL | [E26] | P1 |
| M32 | Oferta online z akceptacją | Oferta w portalu (zakres, cena, termin, ważność), przycisk akceptacji z zapisem wersji; zaliczka przez M21 | [E26] | P1 |
| M33 | Dziennik realizacji | Wpisy ze zdjęciami przy nadzorze realizacji, widoczne w portalu. Tylko jeśli pracownia nadzoruje realizacje. | [E7], [E26] | P2 |
| M34 | Oddzwanianie po nieodebranym połączeniu | Numer w operatorze z webhookiem `{{OPERATOR_TELEFONII}}`: nieodebrane → SMS do dzwoniącego „Oddzwonimy dziś do {{godzina}}” + zadanie w panelu; poza godzinami inny tekst | [E27], [E9] | P1 |
| M35 | Ankieta satysfakcji po etapach | 1 pytanie (1–5) + opcjonalny komentarz po koncepcji i po odbiorze; wynik tylko do użytku wewnętrznego. O opinię w Google prosimy wszystkich klientów niezależnie od wyniku [wiedza: zakaz selektywnego zbierania pozytywnych opinii w zasadach Google] | [E12] | P1 |
| M36 | Raport tygodniowy właściciela | E-mail w poniedziałek: leady, źródła, CPL, czas do kontaktu, nieodebrane telefony, oferty, umowy, opinie, błędy automatyzacji | [E9], [E12] | P1 |

## 4. Automatyzacje

Wszystkie idempotentne (tabela `automation_runs`, `db/0004_automation.sql`). Działają w `workers/automation` (cron co 15 min) albo po webhooku.

| ID | Wyzwalacz | Akcja | Status |
|---|---|---|---|
| A1 | Nowy lead | SMS i e-mail do projektantki, e-mail do klienta, zadanie „telefon” | istnieje (F4, F10) |
| A2 | Brak kontaktu po 2 h | SMS do klienta | istnieje (05 §8) |
| A3 | Nieodebrane połączenie | SMS do dzwoniącego + zadanie | nowa (M34) |
| A4 | Rezerwacja rozmowy (webhook Cal.com) | Stop sekwencji, przypomnienie 24 h i 2 h przed rozmową | nowa |
| A5 | Oferta wysłana | Follow-up T+2, T+7, przed wygaśnięciem | istnieje (05 §8) |
| A6 | Oferta zaakceptowana | Projekt, konto w portalu, etapy, zadanie „faktura zaliczkowa w księgowości” | nowa (M32) |
| A7 | Nowa wersja pliku | E-mail do klienta | istnieje (M13) |
| A8 | Brak reakcji na wersję przez 5 dni | Przypomnienie do klienta | nowa |
| A9 | Etap zakończony | Ankieta satysfakcji | nowa (M35) |
| A10 | Odbiór projektu | Prośba o opinię T+7 i T+14, prośba o wideo-opinię | istnieje (M11, M24) |
| A11 | Nowa opinia Google | Powiadomienie + szkic odpowiedzi do ręcznej edycji (bez automatycznej publikacji) [wiedza: dostęp do API Google Business Profile wymaga zgody Google] | nowa |
| A12 | Projekt odebrany ze zgodą na publikację | Szkic case study w Sanity z plikami z portalu | nowa |
| A13 | Case study opublikowane | Szkice wpisu do Google Business Profile i postów social do akceptacji | nowa |
| A14 | 1. dzień miesiąca | Kalendarz pielęgnacji do subskrybentów | istnieje (M19, M20) |
| A15 | Rocznica odbioru | E-mail „pokaż ogród rok później” + oferta opieki (M29) | nowa |
| A16 | `stop_loss_hit = 1` | E-mail z alertem | nowa (widok istnieje) |
| A17 | Poniedziałek 7:00 | Raport tygodniowy (M36) | nowa |
| A18 | Nowe postępowanie z frazami zieleni | Alert [do sprawdzenia: czy e-Zamówienia udostępniają API lub RSS] | nowa |
| A19 | Data weryfikacji Mikroretencji starsza niż 60 dni | Alert do aktualizacji treści | nowa |
| A20 | Codziennie | Retencja danych i plików | istnieje |
| A21 | Poniedziałek | Lista pytań bez odpowiedzi asystenta do FAQ | nowa (widok istnieje) |
| A22 | Błąd automatyzacji | E-mail do właściciela + wpis w raporcie | nowa |
| A23 | Powiadomienie e-mail z Oferteo lub Fixly | SMS do projektantki + zadanie „kup kontakt i odpowiedz” | nowa (`11-PLATFORMY.md` §2.3) |

## 5. Przewaga, której nie da się szybko skopiować

1. **Lokalne dane.** Atlas roślin z własnych realizacji na Pomorzu, ze zdjęciami „rok później”. Aplikacje AI tego nie mają.
2. **Proces jak w oprogramowaniu.** Portal, wersje, akceptacje, dziennik, oferta online (wzorzec Houzz Pro).
3. **Sieć.** Wykonawcy, DAMPS POL, deweloperzy, gminy.
4. **Jakość techniczna.** WCAG 2.2 AA i szybkość, gdy 95,9% stron ma błędy dostępności.
5. **Treści pod AI i Google.** Centrum wiedzy i spójne dane [E13], [E14].
6. **Ciągły napływ opinii i szybkie odpowiedzi** [E12].
7. **Uczciwe AI.** Podgląd stylu z jasnym oznaczeniem i przejściem do prawdziwego projektu.

## 6. KPI i testy v3

| KPI | Cel |
|---|---|
| Odsetek nieodebranych połączeń | pomiar 30 dni, potem cel względny −50% |
| Oddzwonienie po nieodebranym | mediana < 60 min w godzinach pracy |
| Ankieta satysfakcji (1–5) | średnia ≥ 4,5; każdy wynik ≤ 3 → telefon w 48 h |
| Projekty z opinią Google | ≥ 70% odebranych projektów w 30 dni (cel wewnętrzny, bez benchmarku) |
| Leady z AI podglądu | porównanie z quizem po 60 dniach |
| Błędy dostępności (axe) | 0 |

| Test | Warianty | Metryka |
|---|---|---|
| H6 | Formularz 3 kroki vs jedno pytanie na ekran | ukończenie |
| H7 | Główne CTA: quiz vs AI podgląd stylu | leady / sesje |
| H8 | Szybka ścieżka „Oddzwońcie” widoczna vs ukryta | leady i odsetek rozmów |

## 7. Czego nie robić

- Nie przedstawiać wizualizacji AI jako projektu.
- Nie prosić o opinie wyłącznie zadowolonych klientów [wiedza: zasady Google].
- Nie publikować automatycznych odpowiedzi na opinie (szablonowe zniechęcają [E12]).
- Nie komplikować nawigacji dla oryginalności [E21].
- Nie powtarzać „62% nieodebranych telefonów” jako aktualnego faktu [E27].
- Nie włączać modułów P2 (opieka, dziennik) bez potwierdzenia, że pracownia to oferuje.
