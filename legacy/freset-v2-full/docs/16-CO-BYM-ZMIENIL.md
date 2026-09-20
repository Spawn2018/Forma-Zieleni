# v8: co jeszcze bym zmienił w całym projekcie

<!-- FRESET-V2-SYNC-2026-09-20 -->
> **F-RESET v2 — 2026-09-20 · Status: ACTIVE INPUT / DEFERRED PRODUCT SPEC.** Wymagania zachowane, ale implementacja podlega kolejności a→b→c→d i decyzjom kanonicznym. Źródła nadrzędne: `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md`, `30-F-RESET-EXECUTION-2026-09-20.md`, `31-IMPLEMENTATION-STATUS-MATRIX.md` oraz `contracts/openapi.yaml` dla API. Starsze F0–F33 i wskazania konkretnego hostingu są INPUT/LEGACY, nie kolejnością ani wyborem infrastruktury.

<!-- FRESET-SYNC-2026-09-20 -->
> **AKTUALIZACJA F-RESET — 2026-09-20:** Rekomendacje podporządkowane F-RESET i bramkom A/B/C/D; nie wdrażamy dodatków przed fundamentem.  
> W razie konfliktu obowiązują `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md` i `contracts/openapi.yaml`.

> **INFRA F-RESET:** Wszystkie niższe wzmianki o Cloudflare Workers/D1/R2/Access/Pages/wrangler opisują **historyczny wariant/kandydata**, nie wybrany stack. Aktualna decyzja: Cloudflare = warstwa ochronna/public ingress; origin prywatny; hosting, compute, DB i storage wybieramy dopiero w ETAPIE A po labie, backup/restore/security/load. Nie implementować starego stacku bez nowego ADR.


Moja krytyczna lista braków w tym, co już jest w plikach 01–15. Priorytety: **P0** przed startem, **P1** do 3 miesięcy, **P2** później. Odwołania do dowodów (E…) jak w `01-SPEC.md` §4.

## 1. Wygląd i treść wizualna

| # | Zmiana | Dlaczego | Priorytet |
|---|---|---|---|
| W1 | Sezonowe zdjęcie w hero: cztery zestawy (wiosna, lato, jesień, zima) przełączane datą | Zimą ogród z pełni lata wygląda jak obietnica nie do sprawdzenia; sezonowość jest też argumentem sprzedażowym | P1 |
| W2 | Karta realizacji zawsze w układzie: przed, po, rok później | Dowód trwałości projektu, nie tylko efektu po odbiorze [E7] | P1 |
| W3 | Krótkie pętle wideo (5–8 s, bez dźwięku) zamiast części zdjęć na stronach usług | Ruch roślin pokazuje skalę i światło lepiej niż statyczny kadr; waga pliku pod kontrolą budżetu [E3] | P2 |
| W4 | Jeden zestaw szablonów do social mediów i ofert (ten sam krój, kreska planu, etykiety roślin) | Spójność wizualna między stroną, ofertą PDF i Instagramem | P1 |
| W5 | Arkusz do druku oferty i planu nasadzeń (styl print) | Klient drukuje projekt i pokazuje wykonawcy; teraz nie mamy nic dla druku | P2 |
| W6 | Zdjęcia zespołu i pracy przy stole projektowym, nie tylko ogrodów | Zaufanie do ludzi, nie tylko do efektu [E2] | P1 |

## 2. Proces sprzedaży

| # | Zmiana | Dlaczego | Priorytet |
|---|---|---|---|
| S1 | Minimalna wartość projektu i jawne „poniżej X pracujemy w formie konsultacji” | Chroni kalendarz przed zleceniami, które nie pokryją czasu; dziś nie mamy dolnego progu | P0 |
| S2 | Oferta zawsze w trzech wariantach na jednym ekranie, z jawnym terminem ważności | Kompromisowy środek podnosi wybór droższego wariantu [E8]; termin kończy zawieszone rozmowy | P0 |
| S3 | Kwalifikacja przed wizytą: metraż, zakres, budżet, termin, decydent | Wizyta to najdroższy zasób; dziś kwalifikujemy dopiero na miejscu | P0 |
| S4 | Zaliczka rezerwująca termin projektowy i harmonogram płatności etapami | Zmniejsza rezygnacje po koncepcji i poprawia płynność | P1 |
| S5 | Lista oczekujących na sezon i jawne „najbliższy wolny termin: …” z kalendarza | Prawdziwa rzadkość zamiast sztucznej presji [E2] | P1 |
| S6 | Pakiet opieki po realizacji jako domyślny dodatek do projektu kompleksowego | Powtarzalny przychód i powód do kontaktu co sezon | P2 |
| S7 | Scenariusz rozmowy kwalifikacyjnej (15 min) i lista obiekcji z odpowiedziami | Powtarzalna jakość rozmów niezależnie od dnia | P1 |

## 3. Konwersja

| # | Zmiana | Dlaczego | Priorytet |
|---|---|---|---|
| K1 | Odzyskiwanie porzuconego formularza linkiem: po podaniu telefonu w kroku 1 wysyłamy link „dokończ zgłoszenie” | Dziś porzucony formularz znika bez śladu | P1 |
| K2 | Kalkulator kosztu realizacji (nie tylko projektu), z widełkami rynkowymi | Klient i tak szuka tej liczby; lepiej, żeby znalazł ją u nas [E24] | P1 |
| K3 | Sekcja „Ile to trwa” z realnym harmonogramem sezonu | Termin jest częstszą przyczyną rezygnacji niż cena | P0 |
| K4 | Dowód lokalny na stronach obszarów: liczba realizacji w promieniu X km i mapa | Lokalny dowód działa mocniej niż ogólne portfolio [E5, E14] | P1 |
| K5 | Jedna ścieżka dla „chcę tylko wycenę” i druga dla „chcę porozmawiać” | Dziś wszystko idzie jednym formularzem | P0 |
| K6 | Test hipotezy H10: cena „od” w hero kontra brak ceny w hero | Nie wiemy, czy cena filtruje, czy odstrasza | P1 |

## 4. UX

| # | Zmiana | Dlaczego | Priorytet |
|---|---|---|---|
| U1 | Strona cennika przepisana na porównanie: co dostajesz, czego nie | Tabela zakresu jest ważniejsza niż opis pakietu | P0 |
| U2 | Wyszukiwarka w FAQ i w atlasie z synonimami (np. „tuja” i „żywotnik”) | Klienci nie używają nazw z katalogu | P1 |
| U3 | Stany puste, ładowania i błędu zaprojektowane osobno dla każdej wyspy | Dziś opisane tylko dla portalu | P1 |
| U4 | Język prosty: zdania do 20 słów, bez żargonu, słownik pojęć przy pierwszym użyciu | Klient nie zna pojęć „inwentaryzacja” czy „rzut” | P0 |
| U5 | Skrót klawiaturowy i przycisk „wróć do wyników” w galerii i atlasie | Utrata miejsca po podejrzeniu zdjęcia to najczęstsza irytacja w galeriach | P2 |
| U6 | Tryb ciemny tylko dla portalu, nie dla strony ofertowej | Portal jest narzędziem, strona ofertowa ma wyglądać jak album ze zdjęciami | P2 |

## 5. Backend i niezawodność

| # | Zmiana | Dlaczego | Priorytet |
|---|---|---|---|
| B1 | Wzorzec outbox: każda wiadomość i każde zadanie najpierw zapisane w bazie, potem wysyłane przez cron z ponowieniami i kolejką błędów | Dziś wysyłka zależy od jednego żądania; awaria dostawcy gubi lead | P0 |
| B2 | Klucz idempotencji na każdym publicznym POST (formularz, quiz, płatność, webhook) | Podwójne kliknięcie to najczęstsze źródło duplikatów | P0 |
| B3 | Normalizacja telefonu do E.164 i wykrywanie duplikatów leadów (telefon lub e-mail w 30 dni) | Ten sam klient z quizu i formularza to dziś dwa leady | P0 |
| B4 | Środowisko testowe (osobna baza, bucket, domena) i próbne odtworzenie kopii raz na kwartał | Kopia, której nikt nie odtworzył, nie jest kopią | P0 |
| B5 | Monitor pulsu crona (brak sygnału w 30 min = alert) | Cicho niedziałający cron zatrzymuje wszystkie automatyzacje | P0 |
| B6 | Logowanie strukturalne z identyfikatorem żądania i zbieranie błędów (np. Sentry, plan darmowy) | Dziś błąd widać dopiero, gdy klient zadzwoni | P1 |
| B7 | Samoobsługa RODO: eksport i usunięcie danych z portalu, potwierdzone e-mailem | Obowiązek i oszczędność czasu | P1 |
| B8 | Przegląd indeksów i limitów D1 co kwartał, archiwizacja zdarzeń starszych niż 13 miesięcy do R2 | Baza rośnie najszybciej na zdarzeniach | P1 |
| B9 | Flagi funkcji w CMS (włącz lub wyłącz moduł bez wdrożenia) | Moduły P1 i P2 będą włączane stopniowo | P1 |
| B10 | Godziny pracy i dni wolne w jednym module (SLA, przypomnienia, terminy ofert) | Trzy miejsca liczą dziś czas osobno | P0 |

## 6. Portal klienta

| # | Zmiana | Dlaczego | Priorytet |
|---|---|---|---|
| P1 | Widget „co teraz”: jedno zadanie dla klienta na górze ekranu | Klient nie wie, czy czeka na siebie, czy na nas | P0 |
| P2 | Termin odpowiedzi przy każdej uwadze (np. „odpowiemy do wtorku”) | Brak terminu generuje telefony z pytaniem o status | P0 |
| P3 | Porównanie wersji koncepcji obok siebie z listą zmian | „Co się zmieniło” to najczęstsze pytanie przy wersji 2 i 3 | P1 |
| P4 | Podpis umowy i akceptacja oferty w jednym miejscu, z PDF-em do pobrania | Dziś akceptacja jest osobno od umowy | P1 |
| P5 | Harmonogram płatności z informacją, co już opłacone | Zmniejsza liczbę pytań o faktury | P1 |
| P6 | Lista roślin z projektu jako lista zakupowa z rabatem partnera i możliwością odhaczania | Ułatwia realizację i wiąże z partnerem | P1 |
| P7 | Instalacja portalu jako aplikacji na telefonie (PWA) i powiadomienia push | Klient wraca do portalu w trakcie realizacji, nie tylko po projekt | P2 |
| P8 | Dostęp dla drugiego domownika i dla wykonawcy, z różnym zakresem | Decyzje w ogrodzie podejmują zwykle dwie osoby | P1 |
| P9 | Archiwum po zakończeniu: pliki dostępne przez {{okres}}, potem link do pobrania całości | Porządek w R2 i jasna zasada retencji | P1 |

## 7. Co zrobiłbym najpierw (10 pozycji)

1. B1 outbox, B2 idempotencja, B3 duplikaty leadów.
2. B10 jeden moduł czasu pracy.
3. S3 kwalifikacja przed wizytą i S1 próg minimalnej wartości.
4. K5 dwie ścieżki zgłoszenia i K3 sekcja o terminach.
5. U1 cennik jako porównanie zakresu.
6. P1 i P2 w portalu: „co teraz” oraz terminy odpowiedzi.
7. B4 środowisko testowe i próbne odtworzenie kopii.
8. B5 monitor crona.
9. U4 prosty język na całej stronie.
10. S2 oferta w trzech wariantach z terminem ważności.

## 8. Czego bym nie robił

- Nie dodawałbym czatu na żywo, dopóki nie ma kto odpisywać w minutę.
- Nie budowałbym własnego edytora projektów w przeglądarce.
- Nie wprowadzałbym wersji angielskiej przed pierwszym sezonem z danymi z Search Console.
- Nie automatyzowałbym odpowiedzi na opinie ani nie generowałbym treści bez sprawdzenia przez człowieka [E32].
- Nie włączałbym płatności online, zanim oferta i harmonogram płatności nie będą ustalone [S4].
