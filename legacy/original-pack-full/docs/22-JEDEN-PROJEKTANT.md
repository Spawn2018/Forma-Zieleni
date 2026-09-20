# v14: pracownia jednoosobowa. Przepustowość zamiast liczby leadów

Projektuje jedna osoba, właścicielka firmy. To zmienia cel całego systemu: nie chodzi o maksymalną liczbę zgłoszeń, tylko o **pełne wykorzystanie ograniczonej liczby godzin przy jak najwyższej stawce**. Ten plik koryguje wcześniejsze założenia (`05-MARKETING.md`, `06-REKLAMY-DIY.md`, `19-PRACOWNIA-IT.md`).

## 1. Policz sufit, zanim zwiększysz sprzedaż

| Wejście | Wartość |
|---|---|
| Godziny projektowe tygodniowo (po odjęciu sprzedaży, ofert, admina) | `{{25}}` |
| Tygodnie pracy w roku (bez urlopu i świąt) | `{{44}}` |
| Godziny na projekt (koncepcja plus dokumentacja) | `{{40}}` |
| Średnia wartość umowy | 8 000–15 000 zł |

Wzory:
- **Godziny rocznie** = godziny tygodniowo × tygodnie
- **Sufit projektów** = godziny rocznie ÷ godziny na projekt
- **Sufit przychodu** = sufit projektów × średnia umowa
- **Potrzebne leady** = sufit projektów ÷ (lead → umowa)

Przykład liczbowy (ilustracja): 25 × 44 = 1 100 godzin; 1 100 ÷ 40 = **27 projektów rocznie**; przy 11 500 zł to ok. **310 tys. zł przychodu**; przy konwersji 20% potrzeba ok. **135 leadów rocznie**, czyli 11 miesięcznie, a w sezonie 15–20.

**Wniosek:** powyżej tego progu zwiększanie liczby leadów szkodzi. Kolejne zgłoszenia to nieodebrane telefony, dłuższe terminy i gorsze opinie. Zamiast tego rośnie cena albo spada liczba godzin na projekt.

## 2. Cena jako regulator popytu

| Sytuacja | Działanie |
|---|---|
| Kalendarz wypełniony poniżej 60% na 8 tygodni do przodu | Reklamy na pełnym budżecie, promocja pakietu koncepcja |
| 60–85% | Budżet bez zmian, priorytet dla większych zleceń (filtr wartości z `11-PLATFORMY.md` §1) |
| Powyżej 85% | Podnieś cenę nowych ofert o `{{10}}%` albo wydłuż termin; reklamy na połowę budżetu |
| 100% i lista oczekujących dłuższa niż `{{5}}` osób | Reklamy wyłączone, nowe zgłoszenia na listę, decyzja o podwyżce cennika w kolejnym sezonie |

To nie jest sztuczna rzadkość, tylko prawdziwy stan kalendarza. Wypełnienie liczy widok `v_capacity`.

## 3. Co musi zniknąć z głowy właścicielki

| Zadanie dziś na niej | Rozwiązanie |
|---|---|
| Przepisywanie zestawień roślin | Wtyczka SketchUp (`18-SKETCHUP-CLAUDE.md`) |
| Pilnowanie terminów i przypomnień | Automatyzacje A1–A51 |
| Pierwsza odpowiedź na leada | Szablon z `05-MARKETING.md` §8 plus powiadomienie push |
| Dokumentacja rysunkowa | Podwykonawca na godziny albo stałą stawkę za projekt |
| Wizualizacje seryjne | Trzy presety i kolejka renderów w chmurze |
| Publikacja treści | Pięć materiałów z projektu generowanych automatycznie (`21-UPROSZCZENIE.md` §7) |
| Faktury | Fakturownia przez API (`13-KOSZTY-I-REPOZYTORIA.md` §3) |

Cel: godzina właścicielki idzie na rozmowę z klientem, koncepcję i decyzje projektowe. Reszta jest albo zautomatyzowana, albo zlecona.

## 4. Terminy podawane z kalendarza, nie z głowy

1. Normy godzinowe etapów (`stage_norms`) wyliczane z `time_entries` co kwartał.
2. Po zaakceptowaniu oferty system rezerwuje godziny w `capacity_bookings` na konkretny miesiąc.
3. Klient w ofercie i na stronie widzi **najbliższy wolny termin**, a nie obietnicę.
4. Zmiana terminu przez klienta zwalnia godziny i podbija listę oczekujących.

## 5. Tryb awaryjny (choroba, urlop, przeciążenie)

Jedno kliknięcie w panelu włącza tryb, który:
- wstrzymuje kampanie Google i Meta,
- zmienia tekst na stronie i w autoodpowiedziach na „przyjmujemy zgłoszenia, pierwszy termin od `{{data}}`”,
- przełącza formularz na listę oczekujących,
- wstrzymuje sekwencje sprzedażowe (bez wstrzymywania spraw klientów w toku),
- wysyła klientom w toku informację o nowym terminie.

Do tego: partner na przeciążenie, czyli druga pracownia, która przejmie koncepcję za ustaloną stawkę, oraz pakiet przekazania (standard modelu, szablony, dostęp do plików).

## 6. Korekty wcześniejszych celów

| Dokument | Było | Jest |
|---|---|---|
| `05-MARKETING.md` | Maksymalizacja liczby leadów | Cel: `{{11}}` leadów miesięcznie, w sezonie 15–20; powyżej tego reklamy schodzą z budżetu |
| `06-REKLAMY-DIY.md` | Stały budżet 300 zł | Budżet zależny od wypełnienia kalendarza (§2) |
| `19-PRACOWNIA-IT.md` | Limit 3 koncepcji w toku | Zostaje, ale liczony też w godzinach: maksimum `{{60}}` godzin zarezerwowanych na miesiąc |
| `15-EFEKTYWNOSC.md` | Nieobecności jako strata slotu | Przy jednej osobie każda nieobecność to bezpowrotnie stracone godziny, więc zaliczka za wizytę ma wyższy priorytet |
| `20-APLIKACJA-GARDEN-OS.md` | Aplikacja jako kontakt z klientem | Także jako narzędzie odciążające: mniej telefonów z pytaniem „co teraz robić w ogrodzie” |

## 7. Co mierzyć

| Metryka | Cel |
|---|---|
| Wypełnienie kalendarza na 8 tygodni | 70–85% |
| Godziny na projekt (mediana) | spada kwartał do kwartału |
| Udział godzin właścicielki na koncepcję i rozmowy | ≥ `{{60}}%` |
| Leady miesięcznie wobec potrzeby | w przedziale, bez nadmiaru |
| Przychód na godzinę pracy | rośnie rok do roku |

## 8. Czego nie robić

- Nie zwiększać reklam, gdy kalendarz jest pełny.
- Nie podawać terminu bez rezerwacji godzin.
- Nie przyjmować projektu, który nie mieści się w normach godzinowych, bez dopłaty za tryb ekspresowy.
- Nie zostawiać jednej osoby bez trybu awaryjnego i bez partnera na przeciążenie.
