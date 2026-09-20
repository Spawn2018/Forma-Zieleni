# v13: uproszczenie, przepustowość i ochrona marży

Po dwunastu dokumentach projekt ma ponad 50 modułów, 12 migracji i 31 promptów. Największym ryzykiem nie jest już brak funkcji, tylko to, że zakres przekracza możliwości małej pracowni. Ten plik mówi, co wyciąć, co chroni marżę i co realnie przyspiesza pracę.

## 1. Co budujemy w pierwszych 6 tygodniach, a co czeka

**Budujemy (bez tego nie ma sprzedaży):**
1. Strona z realizacjami, cennikiem, procesem i FAQ (fazy F0–F3).
2. Dwie ścieżki zgłoszenia: „Chcę wycenę” i „Oddzwońcie do mnie” (F4, X3).
3. Quiz stylu (F5) i powiadomienie push o leadzie (F23).
4. Panel z leadami, zadaniami i statusami (F6, F10).
5. Outbox, idempotencja i wykrywanie duplikatów (F26).
6. SEO, migracja starych artykułów, przekierowania (F7).

**Czeka do pierwszych umów z nowej strony:** portal klienta, płatności online, bony, strefa partnera, asystent AI, mapa realizacji, aplikacja mobilna, serwer MCP, AI podgląd stylu.

Zasada: każdy moduł włączamy dopiero, gdy poprzedni ma dane, które potwierdzają sens. Flagi funkcji z migracji 0008 są po to, żeby to było jedno kliknięcie, a nie wdrożenie.

## 2. Ochrona marży: zakres, zmiany, decyzje

Największy wyciek pieniędzy w pracowni projektowej to praca poza zakresem, której nikt nie policzył.

| Mechanizm | Jak działa |
|---|---|
| Zakres w ofercie | Lista „zawiera” i lista „nie zawiera”, obie widoczne dla klienta |
| Rundy poprawek | Limit z pakietu, licznik w portalu (M13) |
| Zmiana poza zakresem | Wpis do `change_orders` z szacunkiem godzin; klient dostaje wycenę albo informację, że to gratis; nic nie idzie „po cichu” |
| Dziennik decyzji | `decisions`: temat, decyzja, kto zdecydował, gdzie (portal, telefon, wizyta) i przy której wersji pliku |
| Raport wycieku | `v_scope_creep` pokazuje godziny zmian, w tym darowane, i dopłaty |

Reguła: powyżej `{{2}}` godzin praca poza zakresem zawsze ma wycenę. Poniżej może być gratis, ale i tak jest zapisana, bo inaczej nie wiadomo, ile naprawdę kosztuje „drobna zmiana”.

## 3. Umowa i prawa, których jeszcze nie opisaliśmy

To wytyczne do rozmowy z prawnikiem, nie porada prawna. Wzór umowy powinien mieć:

1. **Przeniesienie autorskich praw majątkowych po pełnej zapłacie**, z wymienionymi polami eksploatacji (realizacja, zmiany, publikacja). Do czasu zapłaty klient ma licencję na wgląd.
2. **Zgoda na publikację** projektu i zdjęć w portfolio, z prawem do odmowy i z zapisem, co publikujemy (bez adresu).
3. **Zakres i wyłączenia** spójne z ofertą, w tym liczba rund poprawek.
4. **Terminy i siła wyższa**: pogoda, dostępność materiału roślinnego, opóźnienia wykonawcy.
5. **Gwarancja**: co obejmuje projekt, a co szkółka i wykonawca. Terminy trafiają do `warranties` w aplikacji.
6. **Zasady zmian**: odesłanie do `change_orders` i stawka godzinowa.
7. **Dane osobowe**: powierzenie przy przekazaniu projektu wykonawcy.
8. **Ubezpieczenie OC zawodowe** — do sprawdzenia, czy pracownia je ma.

## 4. Przepustowość: jak skrócić czas koncepcji

| Działanie | Efekt |
|---|---|
| Biblioteka komponentów SketchUp z gotowymi atrybutami roślin | Zestawienie działa od pierwszego dnia projektu (§2 w `18-SKETCHUP-CLAUDE.md`) |
| Biblioteka detali (obrzeża, nawierzchnie, schody, oświetlenie) | Mniej modelowania od zera |
| Szablon pliku projektowego i szablon LayOut z tabelami | Dokumentacja jako uzupełnianie, nie składanie |
| Trzy presety renderów | Koniec z dobieraniem ustawień przy każdym projekcie |
| Normy godzinowe na etap (z `time_entries`) | Wycena w 10 minut zamiast „na wyczucie” |
| Podwykonawca do dokumentacji rysunkowej | Godziny projektanta zostają na koncepcję i sprzedaż |
| Limit trzech koncepcji w toku | Krótsze czasy realizacji, mniej przełączania |

## 5. Jedno źródło prawdy o roślinach

Dziś rośliny żyją w trzech miejscach: atlas na stronie, komponenty w SketchUp i dane od dostawcy. To się rozjedzie w trzy miesiące.

Zasada: **nazwa łacińska jest identyfikatorem**. Atlas jest źródłem prawdy dla opisu i zdjęć, `plant_supply` dla ceny i dostępności, a komponent w SketchUp ma tylko nazwę łacińską i polską. Import CSV z modelu porównuje nazwy i zgłasza braki, zamiast tworzyć nowe wpisy.

## 6. Ryzyko jednej osoby

| Ryzyko | Zabezpieczenie |
|---|---|
| Choroba lub urlop projektantki | Autoodpowiedź z terminem, wstrzymanie reklam jednym kliknięciem (flaga), lista oczekujących |
| Wiedza tylko w głowie | Instrukcje w `docs/`, runbook awaryjny, konta w menedżerze haseł z dostępem awaryjnym |
| Utrata plików | Kopie: Trimble Connect, dysk lokalny, R2; test odtworzenia raz na kwartał (F26) |
| Zależność od jednego wykonawcy | Minimum trzech sprawdzonych wykonawców w `contractors` |

## 7. Jeden projekt, pięć materiałów

Każdy odebrany projekt ma dać: case study, 2 posty, 1 artykuł i 1 wpis do newslettera. Tabela `content_assets` pilnuje kompletu, a `v_content_coverage` pokazuje projekty bez materiałów. To najtańsze źródło treści, bo praca i tak jest wykonana.

## 8. Co mierzyć od pierwszego dnia

| Metryka | Dlaczego |
|---|---|
| Godziny na koncepcję (mediana) | Wprost przekłada się na marżę |
| Godziny poza zakresem, w tym darowane | Pokazuje, ile kosztuje uprzejmość |
| Czas od zgłoszenia do oferty | Krótszy czas, wyższa skuteczność [E9] |
| Udział projektów z kompletem materiałów | Treści bez dodatkowej pracy |
| Liczba modułów włączonych, ale nieużywanych | Sygnał do wyłączenia i uproszczenia |

## 9. Czego bym nie robił

- Nie uruchamiał portalu, aplikacji i płatności w jednym kwartale.
- Nie utrzymywał modułu, którego nikt nie użył przez 60 dni.
- Nie przyjmował projektu bez zakresu spisanego w ofercie.
- Nie robił poprawek poza rundami bez wpisu w `change_orders`.
- Nie trzymał wiedzy o procesie wyłącznie w głowie jednej osoby.
