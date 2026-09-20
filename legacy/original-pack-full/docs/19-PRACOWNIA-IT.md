# v11: pracownia prowadzona jak zespół IT

Dowody E46–E47 w `01-SPEC.md` §4. Źródło danych o wdrożeniach: raporty DORA i ich przeglądy z 2026 r.

## 1. Lekcja z badań nad pracą z AI [E46]

DORA (ok. 5 tys. specjalistów, 100+ godzin wywiadów, wydanie z 2025 r. i przeglądy z 2026 r.):
- AI jest wzmacniaczem: poprawia wyniki zespołów, które mają testy, kontrolę wersji i szybkie sprzężenie zwrotne, a pogłębia bałagan tam, gdzie ich nie ma;
- w 2024 r. wzrost użycia AI o 25% wiązał się ze spadkiem przepustowości o ok. 1,5% i stabilności o ok. 7,2%; w 2025 r. przepustowość odwróciła się na plus, ale **stabilność nadal spada drugi rok z rzędu**;
- ok. 90% specjalistów używa AI, ponad 80% czuje wzrost produktywności, a ok. 30% nie ufa kodowi z AI;
- wąskie gardło przeniosło się z pisania kodu na przegląd, testy i wdrożenie.

**Co z tego wynika dla nas** (budujemy stronę z Cursorem i Claude):
1. Małe zmiany, jedna faza z `04-PROMPTS.md` na raz, żadnych wielkich scaleń.
2. Każda zmiana z AI ma test albo ręczną kontrolę na telefonie, zanim trafi na produkcję (podatek od weryfikacji).
3. Flagi funkcji zamiast długich gałęzi (`feature_flags`, migracja 0008).
4. Mierzymy cztery liczby: częstotliwość wdrożeń, czas od zmiany do wdrożenia, odsetek nieudanych wdrożeń, czas naprawy (`v_delivery_metrics`).
5. Budżet błędów: jeśli odsetek nieudanych wdrożeń przekroczy 15% w miesiącu, przez dwa tygodnie robimy tylko poprawki, bez nowych funkcji.
6. Wdrożenie oznaczamy jako wspomagane AI (`deploys.ai_assisted`), żeby po pół roku wiedzieć, czy stabilność faktycznie spada.

## 2. Czego uczy konkurencja software'owa [E47]

**Land F/X** (wtyczka do AutoCAD, SketchUp, Revit, Rhino): baza ponad 55 tys. roślin weryfikowana przez ogrodnika, automatyczne ilości, natychmiastowe zestawienia, kontrola błędów, kosztorysy i specyfikacje, osobny moduł nawodnienia z danymi katalogowymi producentów.
**Vectorworks Landmark 2026**: Plant Style Manager z edycją danych roślin jak w arkuszu (masowo, setkami) oraz Copy External Data, które zaciąga aktualne dane ze stron szkółek partnerskich.

Nie zbudujemy bazy 55 tys. roślin i nie ma sensu próbować. Przewagę daje co innego:

| Oni | My |
|---|---|
| Ogromna baza roślin | Mała baza **sprawdzona lokalnie**: zdjęcia z naszych realizacji po roku i po trzech latach |
| Dane z katalogów producentów | **Dostępność i cena u partnera** (DAMPS POL) w tabeli `plant_supply` |
| Zestawienia w CAD | Zestawienie z modelu **plus lista zakupów w portalu klienta** |
| Kontrola błędów w rysunku | Kontrola kompletności **projektu i publikacji**: brak ceny w obmiarze, roślina spoza atlasu, render bez znaku wodnego |
| Kosztorysy w programie | Kosztorys z obmiaru **widoczny dla klienta** z widełkami |

Wnioski wdrożeniowe: edycja danych roślin masowo (import i eksport CSV), pole dostępności i ceny, kontrola błędów przed wysłaniem projektu, specyfikacja PDF generowana z atlasu.

## 3. System pracy pracowni

| Zasada | Jak |
|---|---|
| Czas mierzony na etapach | Wpis do `time_entries` po każdej sesji pracy (sprzedaż, wizyta, koncepcja, projekt, nadzór, poprawki, admin) |
| Prawdziwa marża | `v_project_margin` liczy godziny razy stawka z `studio_rates` i porównuje z wartością umowy. Deklarowane 95% marży sprawdzimy liczbami, a nie odczuciem |
| Limit pracy w toku | Maksymalnie {{3}} koncepcje jednocześnie (`v_wip`); nowy projekt startuje, gdy poprzedni wychodzi z etapu |
| Definicja ukończenia etapu | Koncepcja: model czysty, 3 rendery, panorama, lista roślin, obmiar. Projekt: PDF planów, zestawienia, kalendarz pielęgnacji |
| Przegląd tygodniowy, 30 minut | Lejek, czas do kontaktu, projekty w toku, marża zamkniętych projektów, cztery metryki wdrożeń |
| Sezon | Limit przyjęć na miesiąc liczony z godzin, nie z chęci. Po przekroczeniu: lista oczekujących (`waitlist`) |

## 4. Sprzedaż: co zmienia model 3D w rozmowie

1. **Model na żywo** przy pierwszej rozmowie zdalnej: link do przeglądarki [E43], klient widzi bryłę działki i proporcje.
2. **Szkic tego samego dnia**: prosty model masowy plus jeden szybki render jako załącznik do oferty.
3. **Pakiet ekspresowy** „koncepcja w 7 dni” z dopłatą {{%}}: sprzedaje termin, nie zakres.
4. **Decyzja z terminem**: oferta ważna {{14}} dni, po terminie sprawdzamy kalendarz.
5. **Opcje zamiast negocjacji ceny**: zmniejszamy zakres stref (kreator M17), nie stawkę.

## 5. Automatyzacje

| ID | Wyzwalacz | Działanie |
|---|---|---|
| A43 | Zamknięcie projektu | Raport marży z `v_project_margin` i porównanie z założeniem |
| A44 | Wdrożenie | Wpis do `deploys`; awaria w 24 h wiąże się z wdrożeniem i podnosi odsetek nieudanych |
| A45 | Odsetek nieudanych wdrożeń powyżej 15% | Blokada nowych funkcji na 2 tygodnie (flaga `freeze`) |
| A46 | Cena rośliny u partnera starsza niż 90 dni | Zadanie „zaktualizuj dostępność i ceny” (`plant_supply`) |

## 6. KPI

| Metryka | Cel |
|---|---|
| Marża projektu liczona z godzin | ≥ {{70}}% dla pakietu koncepcja |
| Godziny na koncepcję | mediana spada kwartał do kwartału |
| Projekty w toku | ≤ 3 koncepcje równolegle |
| Odsetek nieudanych wdrożeń | ≤ 15% miesięcznie [E46] |
| Czas naprawy awarii | ≤ 120 minut |
| Rośliny z aktualną ceną partnera | ≥ 80% pozycji z ostatnich projektów |

## 7. Czego nie robić

- Nie ufać deklarowanej marży bez godzin w `time_entries`.
- Nie wdrażać kilku faz naraz, bo to dokładnie ta sytuacja, w której AI psuje stabilność [E46].
- Nie budować własnej bazy 55 tys. roślin [E47].
- Nie obiecywać terminu ekspresowego, gdy limit pracy w toku jest przekroczony.
