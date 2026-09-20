# v10: pracownia na SketchUp, V-Ray, wtyczkach i Claude

Łączy modelowanie z witryną i portalem. Dowody E43–E45 w `01-SPEC.md` §4. Kod wtyczki: `sketchup-plugin/`.

## 1. Zasada

Model jest źródłem danych, nie tylko obrazków. Z jednego modelu wyciągamy: zestawienie roślin, obmiar do kosztorysu, widoki do prezentacji i link 3D dla klienta. Ręczne przepisywanie tych danych to najdroższa część pracy, więc ją automatyzujemy.

## 2. Standard modelu (warunek działania automatyzacji)

| Element | Zasada |
|---|---|
| Komponenty roślin | atrybuty w słowniku `fz`: `plant_latin`, `plant_pl`, opcjonalnie `spacing_cm` |
| Tagi (warstwy) | `01_teren`, `02_nawierzchnie`, `03_nasadzenia`, `04_mala_architektura`, `05_woda`, `06_oswietlenie` |
| Sceny | numerowane i nazwane: `01_wejscie`, `02_taras`, `03_rabata` |
| Powierzchnie do obmiaru | osobne grupy z nazwą pozycji kosztorysowej (np. `trawnik`, `nawierzchnia_zwirowa`) |
| Jednostki | metry, model wyzerowany do punktu odniesienia z podkładu |

Bez tego standardu wtyczka nie ma czego liczyć. To pięć minut przy zakładaniu projektu.

## 3. Wtyczki, które faktycznie skracają pracę [E45]

| Wtyczka | Do czego | Koszt orientacyjny |
|---|---|---|
| Skatter 2 | rozsiewanie roślin, kamieni, nawierzchni; największa oszczędność w projektach ogrodowych | ok. 69 USD |
| Profile Builder | ogrodzenia, obrzeża, murki, tarasy z profilu po ścieżce | ok. 49 USD |
| CleanUp³ | czyszczenie modelu po imporcie DWG, mniejszy plik przed renderem | bezpłatna |
| Solid Inspector² | kontrola brył przed eksportem i renderem | bezpłatna |
| Fredo6 (Curviloft, Bezier Spline) | ścieżki, skarpy, formy organiczne | bezpłatne |
| Skalp | przekroje z szrafurą do dokumentacji | ok. 59 USD |
| PlaceMaker | kontekst: sąsiedztwo, drogi, mapa wysokościowa | ok. 100 USD rocznie |

Ceny i zakres funkcji z zestawień branżowych, sprawdź przed zakupem. Zasada: nie instalujemy wszystkiego, bo każda wtyczka wydłuża start programu.

## 4. Wtyczka Forma Zieleni (w pakiecie)

`sketchup-plugin/forma_zieleni.rb` plus katalog `forma_zieleni`. Trzy polecenia w menu Rozszerzenia:

1. **Zestawienie roślin do CSV** – liczy instancje komponentów z `plant_latin` i zapisuje `nazwa_lacinska,nazwa_polska,sztuk,rozstawa_cm`. Plik zasila listę zakupów (M31) i atlas roślin (M14).
2. **Eksport scen do JPG** – zapisuje wszystkie sceny w nazewnictwie `RRRR-MM_projekt_NN-scena_v1.jpg` (zgodnie z `17-CAD-3D.md` §5).
3. **Wyślij ostatni eksport do portalu** – wysyła plik na `/api/studio/asset` z tokenem i nagłówkiem `Idempotency-Key`, więc powtórzone kliknięcie nie tworzy drugiej wersji.

Konfiguracja: plik `forma_zieleni_config.json` w katalogu Plugins, z polami `endpoint` i `token`. Token pracowni, nie klienta.

## 5. Gdzie pomaga Claude

| Zadanie | Jak |
|---|---|
| Rozwój wtyczki | Claude Code pisze i poprawia kod Ruby w `sketchup-plugin/`, testy ręczne w SketchUp |
| Budowa strony | prompty F0–F28 z `04-PROMPTS.md` |
| Teksty | szkice opisów realizacji z danych projektu (metraż, styl, rośliny), zawsze do sprawdzenia przez człowieka [E32] |
| Case study | po odbiorze: szkic z obmiaru, listy roślin i zdjęć; publikacja dopiero po akceptacji |
| Dane z portalu | serwer MCP (`12-ZGODNOSC-I-AGENCI.md` §5) pozwala pytać o stan projektów i leadów bez wchodzenia do panelu |
| Kosztorys | przeliczenie obmiaru z modelu na widełki kosztów realizacji (K2) |

Granice: Claude nie wymyśla cen, nazw roślin ani terminów. Wszystko pochodzi z CMS, bazy albo modelu.

## 6. Łańcuch: model → strona → klient

1. Model spełnia standard z §2.
2. Wtyczka zapisuje CSV roślin i widoki.
3. Wysyłka do `/api/studio/asset`: pliki trafiają do `design_assets`, CSV do listy zakupów, obmiar do `takeoffs`.
4. Portal pokazuje nową wersję koncepcji z terminem odpowiedzi (M13a) i linkiem do modelu w przeglądarce [E43].
5. Po akceptacji: rendery bez znaku wodnego, plan PDF, lista zakupów z rabatem partnera.
6. Po realizacji: zdjęcia obok renderu w case study [E7].

## 7. Automatyzacje

| ID | Wyzwalacz | Działanie |
|---|---|---|
| A39 | Nowy CSV roślin | Aktualizacja listy zakupów i sprawdzenie, czy każda roślina jest w atlasie |
| A40 | Nowy obmiar | Przeliczenie kosztorysu i alert, gdy pozycje nie mają cen (`v_takeoff_cost`) |
| A41 | Brak pulsu zadania cyklicznego | Alert do właściciela (`v_heartbeat_alerts`) |
| A42 | Wniosek RODO | Potwierdzenie linkiem, eksport albo usunięcie danych, wpis do dziennika (`gdpr_requests`) |

## 8. Czego nie robić

- Nie renderować modelu, który nie przeszedł czyszczenia i kontroli brył.
- Nie wysyłać do portalu plików bez znaku wodnego przed akceptacją koncepcji.
- Nie trzymać w modelu roślin bez atrybutów, bo wypadną z zestawienia.
- Nie publikować treści napisanej przez AI bez sprawdzenia [E32].
