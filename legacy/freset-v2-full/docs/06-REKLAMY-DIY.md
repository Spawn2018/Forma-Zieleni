# Reklamy samodzielnie za maks. 300 zł miesięcznie

<!-- FRESET-V2-SYNC-2026-09-20 -->
> **F-RESET v2 — 2026-09-20 · Status: ACTIVE INPUT / DEFERRED PRODUCT SPEC.** Wymagania zachowane, ale implementacja podlega kolejności a→b→c→d i decyzjom kanonicznym. Źródła nadrzędne: `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md`, `30-F-RESET-EXECUTION-2026-09-20.md`, `31-IMPLEMENTATION-STATUS-MATRIX.md` oraz `contracts/openapi.yaml` dla API. Starsze F0–F33 i wskazania konkretnego hostingu są INPUT/LEGACY, nie kolejnością ani wyborem infrastruktury.

<!-- FRESET-SYNC-2026-09-20 -->
> **AKTUALIZACJA F-RESET — 2026-09-20:** Reklamy pozostają regulatorem capacity; Google/Meta integrowane przez oficjalne API/webhooki, Core zachowuje source of truth.  
> W razie konfliktu obowiązują `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md` i `contracts/openapi.yaml`.


Dane z `00-DANE.md`. Dowody E1–E11 jak w `01-SPEC.md` §4. Sezonowość to hipoteza: sprawdź ją w Google Trends i Search Console.

## 1. Ekonomika na Twoich liczbach

| Średnia umowa | Marża z 1 umowy | Budżet roczny (3 600 zł) jako % tej marży | Zwrot przy 1 umowie z reklam rocznie | Maks. koszt pozyskania umowy (10% marży) |
|---|---|---|---|---|
| 8 000 zł | 7 600 zł | 47% | 2,1× | 760 zł |
| 11 500 zł | 10 925 zł | 33% | 3,0× | 1 092 zł |
| 15 000 zł | 14 250 zł | 25% | 4,0× | 1 425 zł |

**Wniosek:** jedna umowa z reklam rocznie zwraca cały budżet co najmniej dwukrotnie. Opłacalność nie jest problemem. Problemem jest mała liczba danych, więc o budżecie decyduj co kwartał, a nie co tydzień.

Maksymalny koszt leada (CPL) przy wydawaniu 10% marży na pozyskanie umowy. Swoją konwersję lead → umowa odczytasz w panelu (`v_funnel_monthly`).

| Lead → umowa | Maks. CPL przy umowie 8 000 zł | przy 11 500 zł | przy 15 000 zł |
|---|---|---|---|
| 10% | 76 zł | 109 zł | 142 zł |
| 20% | 152 zł | 218 zł | 285 zł |
| 30% | 228 zł | 328 zł | 428 zł |

Ile leadów kupisz za 300 zł (wynik zależy od rzeczywistego CPL):

| Rzeczywisty CPL | Leady za 300 zł |
|---|---|
| 50 zł | 6,0 |
| 75 zł | 4,0 |
| 100 zł | 3,0 |
| 150 zł | 2,0 |
| 300 zł | 1,0 |

## 2. Podział 300 zł w roku

Budżet zależy od wolnych godzin w kalendarzu. Przy wypełnieniu powyżej 85% schodzimy do połowy, przy 100% wyłączamy kampanie (`22-JEDEN-PROJEKTANT.md` §2).

| Miesiące | Google Ads | Meta | Grupy reklam Google | Uwagi |
|---|---|---|---|---|
| I–II | 300 zł | 0 | AG1, AG3 | planowanie przed sezonem |
| III–V | 300 zł | 0 | AG1, AG2, AG3 | szczyt: tylko intencja z wyszukiwarki |
| VI–VIII | 200 zł | 100 zł | AG1, AG4 | Meta: balkony i tarasy, rozmowy w Messengerze |
| IX–X | 250 zł | 50 zł | AG1, AG3 | jesienne sadzenie, planowanie na wiosnę |
| XI | 200 zł | 100 zł | AG1 | bon podarunkowy, tylko jeśli jest w ofercie |
| XII | 150 zł | 0 | AG1 | niski popyt, oszczędność |

Wariant z platformami zapytań (III–V): Google Ads 200 zł i punkty Oferteo 100 zł. Zasady zakupu kontaktu, limity i ocena testu: `11-PLATFORMY.md` §1.

## 3. Google Ads: konfiguracja krok po kroku (ok. 60 min)

1. Załóż konto w **trybie eksperta**. Pomiń kampanię inteligentną.
2. Nowa kampania: cel **Potencjalni klienci**, typ **Sieć wyszukiwania**. Wyłącz sieć reklamową i partnerów wyszukiwania.
3. Lokalizacje: Gdańsk, Gdynia, Sopot oraz powiaty gdański, wejherowski, kartuski i pucki. Opcja: **Obecność** (osoby, które są w tych lokalizacjach), nie „zainteresowanie”.
4. Język: polski.
5. Budżet dzienny: **9,80 zł** (Google może wydać w miesiącu do 30,4 × budżet dzienny, czyli ok. 298 zł).
6. Stawki: **Maksymalizacja liczby kliknięć** z limitem maks. CPC (wartość sprawdź w Planerze słów kluczowych). Po zebraniu pierwszych kilkunastu konwersji przełącz na **Maksymalizację liczby konwersji**.
7. Harmonogram: pn–sb, 7:00–20:00. Zgłoszenia przychodzą wtedy, gdy możesz oddzwonić tego samego dnia [E9].
8. Tylko dopasowanie ścisłe `[...]` i do wyrażenia `"..."`, bez dopasowania szerokiego.
9. Wklej wykluczające słowa kluczowe z `ads/google-negatives.txt` na poziomie kampanii.
10. Zasoby: linki do podstron, objaśnienia, rozszerzenie informacji o usługach (§5), **zasób połączeń** z numerem 514 220 155 w godzinach pracy, zasób lokalizacji połączony z Google Business Profile.
11. Konwersje: główna `lead_submit` (wysłanie formularza), dodatkowa: połączenie z reklamy ≥ 60 s. Do czasu startu nowej strony licz połączenia oraz wejścia na stronę podziękowania obecnego formularza.
12. W ustawieniach konta wyłącz **automatycznie stosowane rekomendacje**.
13. **AI Max (od 1.09.2026):** wyłącz automatycznie tworzone komponenty (dostosowywanie tekstu) i dopasowanie szerokie na poziomie kampanii, AI Max zostaw wyłączone. Inaczej kampania zostanie przeniesiona do AI Max, a słowa ścisłe przestaną działać ściśle [E15].

## 4. Grupy reklam i słowa kluczowe

W katalogu `ads/` jest 193 linii do wklejenia.

| Grupa | Plik | Strona docelowa |
|---|---|---|
| AG1 Trójmiasto | `ads/google-ag1-trojmiasto.txt` | `/uslugi/projekt-ogrodu/` |
| AG2 Okolice i pomorskie | `ads/google-ag2-okolice.txt` | `/uslugi/projekt-ogrodu/` |
| AG3 Cena | `ads/google-ag3-cena.txt` | `/cennik/` |
| AG4 Tarasy i balkony (VI–VIII) | `ads/google-ag4-tarasy-balkony.txt` | `/uslugi/balkony-i-tarasy/` |
| AG5 Ogród deszczowy (VII–X, wiosna) | `ads/google-ag5-retencja.txt` | `/lp/mikroretencja/` |
| AG6 Mała architektura i nawierzchnie | `ads/google-ag6-mala-architektura.txt` | `/uslugi/mala-architektura-i-nawierzchnie/` |
| Etap 2 | `ads/google-etap2-kujawsko-pomorskie.txt` | osobna kampania (§9) |

## 5. Teksty reklam (limity sprawdzone skryptem)

Nagłówki (maks. 30 znaków). „Jaki ogród do Ciebie pasuje?” dodaj dopiero po uruchomieniu quizu na stronie. Numeru telefonu nie wpisuj w tekst reklamy, bo zasady Google na to nie pozwalają; do tego służy zasób połączeń.

| Tekst | Znaki | Limit |
|---|---|---|
| Projekt ogrodu Trójmiasto | 25 | 30 |
| Projekt ogrodu Gdańsk | 21 | 30 |
| Projekt ogrodu Gdynia | 21 | 30 |
| Architekt krajobrazu Gdańsk | 27 | 30 |
| Projektant ogrodów Pomorze | 26 | 30 |
| Projekty ogrodów od 2500 zł | 27 | 30 |
| Zobacz ogrody przed i po | 24 | 30 |
| Rośliny dobrane do działki | 26 | 30 |
| Małe ogrody i duże działki | 26 | 30 |
| Projekt balkonu i tarasu | 24 | 30 |
| Rabaty na cały sezon | 20 | 30 |
| Sprawdź nasze realizacje | 24 | 30 |
| Jaki ogród do Ciebie pasuje? | 28 | 30 |
| Forma Zieleni | 13 | 30 |
| Zamów projekt ogrodu | 20 | 30 |

Tekst reklamy (maks. 90 znaków). Opis 4 dodaj po uruchomieniu quizu.

| Tekst | Znaki | Limit |
|---|---|---|
| Projektujemy ogrody, balkony i tarasy w Trójmieście i na Pomorzu. Projekty od 2500 zł. | 86 | 90 |
| Rośliny dobrane do gleby, słońca i pór roku. Zobacz realizacje przed i po. | 74 | 90 |
| Małe ogrody przy domu i duże działki. Zostaw zgłoszenie, oddzwonimy. | 68 | 90 |
| Sprawdź w minutę, jaki styl ogrodu do Ciebie pasuje. Wynik od razu. | 67 | 90 |

Linki do podstron (link maks. 25 znaków, opisy maks. 35):

| Link | Opis 1 | Opis 2 | Adres |
|---|---|---|---|
| Realizacje | Ogrody przed i po | Listy roślin z projektów | `/realizacje/` |
| Cennik projektów | Projekty od 2500 zł | Sprawdź, co zawiera projekt | `/cennik/` |
| Jak pracujemy | 5 kroków do ogrodu | Od rozmowy do realizacji | `/jak-pracujemy/` |
| Quiz stylu ogrodu | Wynik w około minutę | Bez podawania danych | `/quiz/` |

Objaśnienia (maks. 25 znaków):

| Tekst | Znaki | Limit |
|---|---|---|
| Projekty od 2500 zł | 19 | 25 |
| Trójmiasto i Pomorze | 20 | 25 |
| Dobór roślin do działki | 23 | 25 |
| Małe i duże ogrody | 18 | 25 |
| Balkony i tarasy | 16 | 25 |
| Od prawie 10 lat | 16 | 25 |

Rozszerzenie informacji o usługach, nagłówek „Usługi” (wartości maks. 25 znaków):

| Tekst | Znaki | Limit |
|---|---|---|
| Projekt ogrodu | 14 | 25 |
| Projekt tarasu | 14 | 25 |
| Projekt balkonu | 15 | 25 |
| Rabaty bylinowe | 15 | 25 |
| Zieleń miejska | 14 | 25 |

## 6. Rutyna

**Co tydzień (15 min):**
1. Otwórz raport **Wyszukiwane hasła** i dodaj jako wykluczenia wszystko, co nie dotyczy projektu ogrodu.
2. Porównaj liczbę leadów w panelu z wydatkami.
3. Wstrzymaj słowo kluczowe, jeśli wydało więcej niż maks. CPL z §1 i nie dało żadnego leada.

**Co miesiąc (30 min):**
1. Wpisz wydatek do panelu (tabela `campaign_spend`).
2. Sprawdź `v_channel_economics` i przesuń budżet według §2.
3. Wymień najsłabszy nagłówek na nowy.

**Co kwartał:** jeśli w sezonie przez 3 miesiące nie było żadnej umowy z reklam, zmień słowa kluczowe i stronę docelową, zanim zmienisz budżet.

## 7. Meta (Facebook i Instagram) przy małym budżecie

- Nie ustawiaj celu „Potencjalni klienci” ani optymalizacji pod konwersje. Meta potrzebuje ok. 50 zdarzeń tygodniowo, żeby wyjść z fazy uczenia, a przy 100 zł miesięcznie to nierealne.
- VI–VIII: cel **Zaangażowanie → Wiadomości** (Messenger), kreacja przed/po albo balkon, kierowanie: 30 km od Gdańska i Gdyni.
- XI: promowanie najlepszego wpisu (przed/po albo proces) przez 5–7 dni, żeby zbudować dowód społeczny [E1, E7].
- Piksel i remarketing dopiero po wdrożeniu banera zgód (faza F11).
- Andromeda dobiera odbiorców na podstawie treści reklamy [E16]: 1 zestaw reklam, 3–5 wyraźnie różnych kreacji (przed/po, proces, roślina, wideo-opinia, balkon), wymiana co 4–6 tygodni.

Teksty:
1. **Przed/po:** Tak wyglądał ten ogród, zanim zaczęliśmy projekt. Przesuń zdjęcia i zobacz efekt. Projektujemy ogrody w Trójmieście i na Pomorzu, od 2500 zł.
2. **Balkon:** Balkon od południa nie musi być pustynią. Dobieramy rośliny i donice, które zniosą upał i wiatr. Napisz, pokażemy, co da się zrobić.
3. **Proces:** Od szkicu do ogrodu, w którym chce się być. Zobacz, jak powstaje projekt krok po kroku.

## 8. Darmowe kanały, które dadzą więcej niż 300 zł

- **Google Business Profile:** 1 wpis tygodniowo, nowe zdjęcia realizacji, usługi z cenami, obszar obsługi: Trójmiasto i powiaty z §3.
- **Opinie:** poproś dotychczasowych klientów o opinię w Google (cel: ≥ 5), a potem uruchom automatyczną prośbę po każdej realizacji [E10].
- **Instagram i Facebook:** 2 posty tygodniowo w formatach z `05-MARKETING.md` §5.
- **Partnerzy:** 20 lokalnych firm z `05-MARKETING.md` §9.

Wpisy do Google Business Profile, jeden flagowy na miesiąc:

| Miesiąc | Treść wpisu | Przycisk „Więcej” prowadzi do |
|---|---|---|
| I | Styczeń to dobry moment na projekt: gdy ruszy sezon, będziesz gotowy do sadzenia. | `/jak-pracujemy/` |
| II | Mały ogród przy szeregowcu? Pokażemy układ, w którym zmieści się taras, rabata i zioła. | `/realizacje/` |
| III | Ruszają wiosenne terminy. Sprawdź, ile kosztuje projekt ogrodu: od 2500 zł. | `/cennik/` |
| IV | Przed i po: {{nazwa realizacji}}. Zobacz na stronie, jak zmienił się ten ogród. | `/realizacje/{{slug}}/` |
| V | Roślina miesiąca: szałwia omszona (Salvia nemorosa). Długo kwitnie, lubi słońce i przyciąga pszczoły. | `/artykuly/` |
| VI | Balkon od południa? Dobieramy rośliny i donice, które zniosą upał i wiatr. | `/uslugi/balkony-i-tarasy/` |
| VII | Susza w ogrodzie: rośliny, które poradzą sobie bez codziennego podlewania. | `/artykuly/{{art-7}}/` |
| VIII | Ogród deszczowy zatrzymuje wodę na działce i może być ozdobą ogrodu. | `/artykuly/{{art-8}}/` |
| IX | Wrzesień i październik to dobry czas na sadzenie bylin i drzew. Zaplanuj rabatę na przyszły sezon. | `/uslugi/rabaty-i-przestrzen-miejska/` |
| X | Zaprojektuj ogród teraz, a wiosną posadzisz go bez pośpiechu. | `/wycena/` |
| XI | {{OPCJA: Bon podarunkowy na konsultację w ogrodzie.}} | `/kontakt/` |
| XII | Dziękujemy za sezon pełen ogrodów. Zobacz realizacje z tego roku. | `/realizacje/` |

## 9. Etap 2: kujawsko-pomorskie

Warunki startu:
1. W kalendarzu projektów są wolne terminy.
2. Koszt dojazdu jest wliczony w cenę: {{DOJAZD}}.

Kroki:
1. Google Business Profile: dodaj do obszaru obsługi Bydgoszcz, Toruń i Grudziądz.
2. Google Ads: osobna kampania z plikiem `ads/google-etap2-kujawsko-pomorskie.txt`, budżet 60–90 zł przesunięty z AG2.
3. Strony `/obszar/bydgoszcz/` i `/obszar/torun/` twórz dopiero, gdy są tam co najmniej 2 realizacje (`01-SPEC.md` §9).

## 10. Czego nie robić przy 300 zł

- Performance Max, sieć reklamowa, kampanie inteligentne.
- Dopasowanie szerokie.
- Wiele kampanii naraz: jedna kampania z grupami AG1–AG4 wystarczy.
- Reklamy w nocy [E9].
- Liczenie sukcesu po kliknięciach zamiast po umowach.
- Zmiany co kilka dni: przy tak małym budżecie to szum, nie sygnał.
