# Forma Zieleni: specyfikacja strony nastawionej na sprzedaż

Wersja 1.0, 16.09.2026. Dokument jest źródłem prawdy dla Cursora. Oznaczenia `[E1]`–`[E11]` odsyłają do tabeli dowodów w §4. Wszystko w `{{…}}` to dane, które musi dostarczyć właściciel (lista w §16). Nie wolno ich zgadywać.

---

## 1. Problem i cel

Obecna strona (WordPress + Elementor, szablon „agritech”) ma resztki demo (formularz „Contact Form Demo”, linki `/agritech-about-us/`, `/agritech-service/`), literówki („arktykuły”, „klenta”, „doślin”, „ścieżech”, „zajmumemy”, „klienic”, „poniewż”, „DAMS POL” zamiast „DAMPS POL”), artykuły pod adresami z datą (`/2026/08/31/…/`), jeden ze slugiem `elementor-1143`, ikony z szablonu zamiast zdjęć realizacji, brak cen, brak opisu procesu, brak opinii i jeden ogólny formularz. Każdy z tych braków uderza w czynniki, które badania łączą z oceną wiarygodności strony i decyzją o kontakcie [E1, E2, E5, E7, E10].

**Cel:** strona, która zamienia odwiedzających w zakwalifikowane zapytania o projekt i skraca drogę od zapytania do podpisanej umowy. Strona jest częścią systemu sprzedaży: dowód → oferta → zgłoszenie → natychmiastowa reakcja → rozmowa → umowa → opinia.

---

## 2. Cele i KPI

Nie istnieje wiarygodny benchmark konwersji dla polskich pracowni projektowania ogrodów. Dlatego cele konwersji są **względne wobec baseline** z pierwszych 30 dni. Cele techniczne i reakcji na leady mają oparcie w źródłach.

### Wskaźniki wyprzedzające (dni–tygodnie)

| Metryka | Definicja | Cel | Pomiar |
|---|---|---|---|
| Współczynnik leadów | leady / sesje | baseline +50% w 90 dni | D1 `leads` + Cloudflare Web Analytics |
| Ukończenie quizu | `quiz_complete` / `quiz_start` | ≥ 60%; poniżej 40% skróć quiz | D1 `events` |
| Lead z quizu | `lead_submit{source=quiz}` / `quiz_complete` | baseline +30% w 90 dni | D1 |
| Odpad w formularzu | spadek między `form_step{1→2→3}` | największy odpad < 30% | D1 `events` |
| Czas do pierwszego kontaktu | `first_contact_at − created_at` | mediana < 60 min w godzinach pracy [E9] | panel leadów |
| LCP p75 mobile | Core Web Vitals | ≤ 1,8 s [E3] | CrUX / Search Console |
| INP / CLS p75 | Core Web Vitals | ≤ 200 ms / ≤ 0,05 | CrUX |

### Wskaźniki opóźnione (tygodnie–miesiące)

| Metryka | Cel |
|---|---|
| Zakwalifikowane zapytania / miesiąc | baseline +50% w sezonie rok do roku |
| Konwersja rozmowa → umowa | mierzona od startu, cel ustalany po 60 dniach |
| Przychód na lead | mierzony w panelu (pole wartości umowy, P1) |
| Opinie Google | ≥ 5 w 90 dni, potem stały przyrost [E10] |
| Ruch organiczny | kliknięcia w Search Console, połączenia i kliknięcia z Google Business Profile |

Uwaga o sezonowości: zapytania o projekty ogrodów mają silny sezon. Porównuj okresy rok do roku albo krótkie, sąsiednie okresy.

---

## 3. Poza zakresem v1

| Nie robimy | Dlaczego |
|---|---|
| Sklep z roślinami | inny model biznesowy, nie zwiększa sprzedaży projektów |
| Chatbot AI na stronie | w v1 nie; asystent odpowiadający wyłącznie z treści strony to P2 (`08-PORTAL-FUNKCJE.md` M26) |
| Generator wizualizacji AI dla klienta | obiecuje efekt, którego projekt może nie dać; P2 |
| Konfigurator 3D w przeglądarce | koszt i waga JS niewspółmierne do zysku [E3]; zamiast tego rendery z prawdziwych projektów |
| Pop-upy exit-intent, fałszywe liczniki („zostały 2 terminy”) | sztuczna presja obniża wiarygodność [E2] |
| Wersje językowe | brak popytu poza PL w v1 |

---

## 4. Fundament dowodowy

Każda decyzja na stronie wynika z jednego z tych ustaleń. Kolumna „Ograniczenia” mówi, czego badanie **nie** dowodzi.

| ID | Źródło | Ustalenie (parafraza) | Decyzja na stronie | Ograniczenia |
|---|---|---|---|---|
| E1 | Lindgaard i in., 2006, *Behaviour & Information Technology* 25(2) | Atrakcyjność wizualną strony ludzie oceniają w ok. 50 ms, a ta ocena zgadza się z oceną po dłuższym oglądaniu. | Hero = najlepsze zdjęcie realizacji. Zero ikon z szablonu. Jeden spójny system wizualny. | Mierzono atrakcyjność, nie zaufanie ani zakup. |
| E2 | Fogg i in., 2003, *DUX '03* (N = 2684) | Przy ocenie wiarygodności najczęściej komentowano wygląd strony (46,1% komentarzy), potem strukturę i fokus informacji. Niechlujny, składany na szybko wygląd obniżał ocenę. | Zero literówek i resztek szablonu. Czytelna nawigacja. Jedna sprawa na sekcję. | Swobodne komentarze, strony informacyjne, 2003 r. |
| E3 | Google/SOASTA, 2017 | Prawdopodobieństwo odrzucenia rośnie z czasem ładowania: 1→3 s o 32%, 1→5 s o 90%. Wzrost liczby elementów na stronie z 400 do 6000 obniżał prawdopodobieństwo konwersji o 95%. | Budżety wydajności (§12). Limit elementów DOM. Statyczny HTML, JS tylko w wyspach. | Analiza mobilnych stron docelowych reklam. |
| E4 | Yardzen (lider rynku projektowania ogrodów online, USA) | Quiz stylu, pakiety z jawnymi cenami, określone terminy (pierwszy projekt w 5–10 dni), rundy poprawek, rendery i plany CAD. | Quiz stylu, 3 pakiety z cenami „od”, proces z terminami i liczbą poprawek. | Praktyka rynkowa, nie badanie. Model w pełni online. |
| E5 | Praktyki branżowe: Green Valley Hardscapes (2026), ThemeMasterly (2026) | Profesjonalne zdjęcia, portfolio wyselekcjonowane zamiast „wszystkiego”, osobna strona procesu od konsultacji do odbioru. Filtrowana siatka realizacji i przyklejony nagłówek. | 8–12 case studies z filtrem, strona „Jak pracujemy”, sticky header. | Opinie praktyków, nie eksperymenty. |
| E6 | Rynek PL: propertydesign.pl (2026), Plebiscyt Polska Architektura XXL 2025 | Najmocniejsze pracownie (Archigrest, topoScape, RS Architektura Krajobrazu, eM4 Brataniec) budują pozycję nagrodami i realizacjami. Plebiscyt ma kategorię ogrodów prywatnych. | Sekcja wyróżnień (tylko prawdziwe), plan zgłaszania realizacji do konkursów. | Dowód anegdotyczny. |
| E7 | Buell i Norton, 2011, *Management Science* 57(9) | Gdy serwis pokazuje pracę wykonywaną dla klienta (operational transparency), ludzie wyżej cenią usługę, nawet przy dłuższym oczekiwaniu. | Case study: szkic → wizualizacja → realizacja. Krok „Dopasowujemy styl” w quizie z listą realnie użytych kryteriów. | Symulacje usług online (podróże, randki). |
| E8 | Simonson, 1989, *Journal of Consumer Research* 16(2) | Opcja, która staje się kompromisem między skrajnymi, zyskuje udział w wyborach. | 3 pakiety; środkowy oznaczony jako „Polecany”. | Efekt słabnie, gdy klient dokładnie wie, czego chce. |
| E9 | Oldroyd, McElheran, Elkington, 2011, *Harvard Business Review* | Firmy, które próbowały kontaktu w ciągu godziny, miały prawie 7× większą szansę zakwalifikować leada niż godzinę później i ponad 60× większą niż po 24 h. | SMS + e-mail do właścicielki natychmiast, SLA < 60 min, samodzielna rezerwacja rozmowy. | Firmy z USA. Automatyczna odpowiedź to nie rozmowa. |
| E10 | Spiegel Research Center (Northwestern), 2017 | Wyświetlanie opinii silnie podnosi szansę zakupu; największy efekt dają pierwsze ~5 opinii; efekt silniejszy przy droższych produktach; szansa zakupu jest najwyższa przy średniej 4,0–4,7, a spada przy ocenach bliskich 5,0. | Prawdziwe opinie Google przy CTA, automatyczna prośba o opinię po realizacji, bez ukrywania ocen poniżej 5. | Dane e-commerce. Przeniesienie na usługi to założenie. |
| E11 | Astro/Cloudflare, 2026 | Cloudflare przejął zespół Astro (framework zostaje MIT). Astro 6.0: nowy serwer dev, wbudowane Fonts API, Live Content Collections, CSP API. | Wybór frameworka i hostingu (§11). | Źródła producenta. |
| E12 | BrightLocal, Local Consumer Review Survey 2026 | Coraz więcej osób wymaga ocen ≥ 4,5 i opinii z ostatnich 3 miesięcy, oczekuje odpowiedzi na opinie i szuka firm przez AI. | Ciągły proces opinii, odpowiedź w 48 h, daty opinii na stronie. | USA, ankieta deklaratywna. |
| E13 | Pew Research Center, 2025 | Przy podsumowaniu AI kliknięcia w zwykłe wyniki spadają mniej więcej o połowę (8% zamiast 15%). | Mierzenie obecności marki, nie tylko kliknięć; artykuły z krótką odpowiedzią na początku. | USA, dane z marca 2025. |
| E14 | Whitespark, Local Search Ranking Factors 2026 | W widoczności w AI najważniejsze są sygnały ze strony, potem opinie; w mapach Google Business Profile. | Konkretne lokalne strony usług i obszarów, spójne dane w katalogach. | Ankieta ekspertów, nie eksperyment. |
| E15 | Google Ads, AI Max (IX 2026) | Automatyczne przenoszenie kampanii do AI Max; słowa ścisłe w AI Max przestają gwarantować ścisłe dopasowanie. | Wyłączone automatyczne komponenty i dopasowanie szerokie, bez AI Max przy 300 zł. | Dane smec z e-commerce w EMEA. |
| E16 | Meta Andromeda (2025–2026) | Dobór odbiorców opiera się na treści kreacji; podobne kreacje ograniczają emisję. | 3–5 wyraźnie różnych kreacji, kierowanie geograficzne. | Źródła branżowe. |
| E17 | Chalmin-Pui i in., 2021, *Landscape and Urban Planning* 205 | Rośliny w małych ogródkach frontowych wiązały się ze spadkiem stresu i poprawą profilu kortyzolu. | Argument dla małych ogrodów, bez obietnic medycznych. | Mała próba, Wielka Brytania. |
| E18 | White i in., 2019, *Scientific Reports* 9 | Co najmniej 120 min tygodniowo w naturze wiązało się z lepszym zdrowiem i samopoczuciem. | Projekt pod codzienne użycie ogrodu. | Badanie przekrojowe, związek, nie przyczyna. |
| E19 | RHS Chelsea Flower Show 2026 | Kierunki: odporność na klimat i suszę, nasadzenia naturalistyczne, gospodarka wodą, zdrowie psychiczne, balkony. | Treści, podpowiedzi w quizie, kreacje sezonowe. | Trendy wystawowe, Wielka Brytania. |
| E20 | Mikroretencja 2026 (NFOŚiGW/WFOŚiGW) | Do 8 000 zł na zatrzymanie deszczówki przy domach, nabór od 22.06.2026. | Usługa sezonowa „Ogród deszczowy”, AG5, strona `/lp/mikroretencja/`. | Sprawdź, czy koszt projektu jest kwalifikowany. |
| E21 | Tuch i in., 2012, *International Journal of Human-Computer Studies* 70(11) | Złożoność wizualna i typowość układu wpływają na ocenę strony już w 17–50 ms; najwyżej oceniane są strony proste i typowe dla kategorii. | Typowy układ nawigacji, oryginalność w zdjęciach i detalach; test 5 sekund. | Screenshoty, ocena estetyki, nie konwersja. |
| E22 | GOV.UK Service Manual, „one thing per page” | Jedno pytanie na ekran pomaga mniej pewnym użytkownikom, działa na mobile, ułatwia obsługę błędów; usunięcie wskaźnika postępu nie zmieniło ukończeń. | Wariant formularza H6, prosty wskaźnik postępu. | Usługi publiczne, nie sprzedaż. |
| E23 | WebAIM Million 2026 | 95,9% stron głównych ma wykrywalne błędy WCAG; średnio 1 437 elementów; 6 typów błędów to 96% wszystkich. | CI blokuje 6 błędów, `/dostepnosc/`, limit DOM 1 000. | Tylko błędy wykrywalne automatycznie. |
| E24 | kb.pl, cenniki projektowania ogrodów 2026 | Szacunki dla Gdańska: 4 220 / 6 110 / 9 660 zł brutto za pełny projekt do 500 / 500–1000 / ponad 1000 m². | Pozycjonowanie premium uzasadnione wartością, sekcja „Dlaczego projekt kosztuje tyle”. | Szacunki z ofert w internecie, nie ceny transakcyjne. |
| E25 | Yardzen FAQ; rankingi aplikacji AI do projektowania ogrodów 2026 | Lider łączy AI, lokalne dane, iteracje i sieć wykonawców; aplikacje AI dają wizualizację w 15–60 s. | AI podgląd stylu z oznaczeniem (M27), sieć wykonawców (M30), treść „AI a projekt”. | Materiały producentów. |
| E26 | Houzz Pro (pomoc, Capterra) | Standard oprogramowania dla projektantów: panel klienta z wybieranymi modułami, mood boardy, propozycje, płatności, dziennik. | Portal: oferta online (M32), lista zakupów (M31), dziennik (M33). | Materiały producenta i recenzje. |
| E27 | Invoca, lipiec 2026 (za Nextiva); 411 Locals 2016 | „62% nieodebranych” pochodzi z 2016 r. (85 firm); w danych Invoca 2026 z człowiekiem rozmawiało 56% dzwoniących. | Oddzwanianie po nieodebranym (M34), KPI nieodebranych. | Dane z USA, różne metody pomiaru. |
| E28 | Oferteo: „Jak działa”, FAQ, cennik, katalog firm (2026) | Zlecający nie płacą; wykonawca kupuje punktami dostęp do danych kontaktowych; ten sam kontakt dostaje zwykle kilku wykonawców; cena punktów zależy od branży, wielkości i lokalizacji; odznaki „Sprawdzona Firma” i „Najlepsi”; katalog ok. 734 tys. firm ze średnią 4,91. | Test Oferteo z limitem kosztu kontaktu, szybka odpowiedź, profil z weryfikacją, opinie od wszystkich klientów. | Materiały platformy; koszty pojedynczego kontaktu podają źródła zewnętrzne. |
| E29 | stadvert.pl (2025), locayo.app i oferia.com.pl (2026) | Kontakt na Oferteo może kosztować od kilkunastu do kilkuset zł bez gwarancji zlecenia; pakiet ok. 207 zł netto za 25 punktów; na Fixly wykonawca płaci 0–50 punktów za ofertę; ci sami wykonawcy są równolegle na kilku platformach. | Kolejność testów: Oferteo, potem Fixly; rozłożenie pakietu na sezon; ocena co 10 kontaktów. | Źródła konkurencyjne i blogowe, nie dane platform. |
| E30 | Meta, Commerce Policies i wytyczne ofert | Marketplace służy sprzedaży konsument–konsument; firmy z EOG mogą mieć ograniczony dostęp; przedmioty niefizyczne, w tym usługi, są zakazane. | Rezygnacja z Marketplace; zamienniki: strona firmowa, grupy, Meta Ads, Instagram. | Polityka producenta, może się zmienić. |
| E31 | houzz.com, selektor krajów (2026) | Na liście rynków Houzz nie ma Polski. | Houzz pominięty w planie na rynek polski. | Obserwacja strony, nie oświadczenie firmy. |
| E32 | Komisja Europejska i gov.pl (VIII 2026), Digital Omnibus (24.07.2026) | Od 2.08.2026 obowiązuje art. 50 AI Act: informowanie, że rozmawia się z AI, oznaczanie treści generowanych, w tym maszynowo, oraz deepfake'ów; wysokie ryzyko przesunięte na 2.12.2027; kary do 15 mln EUR lub 3% obrotu. | Etykieta asystenta, oznaczanie obrazów AI widocznie i maszynowo, rejestr systemów AI, brak automatycznej publikacji. | Przepisy nowe, praktyka egzekwowania dopiero się tworzy. |
| E33 | Polski Akt o Dostępności (obowiązuje od 28.06.2025) | Obejmuje sprzedaż usług przez strony i aplikacje, ale usługi mikroprzedsiębiorców (poniżej 10 osób, do 2 mln EUR) są wyłączone. | WCAG 2.2 AA jako standard własny; monitorowanie progu mikroprzedsiębiorstwa. | Interpretacja zakresu dla stron usługowych bywa sporna. |
| E34 | Przewodniki KSeF 2026 (ifirma, meetergo) | Wystawianie w KSeF: 1.02.2026 dla sprzedaży powyżej 200 mln zł, 1.04.2026 dla pozostałych; odbieranie od 1.02.2026 dla wszystkich czynnych podatników VAT; najmniejsi do 1.01.2027; kary od 1.01.2027; faktury B2C poza KSeF. | Strona nie wystawia faktur; zadania fakturowe z podziałem B2C i B2B; NIP w formularzu B2B. | Źródła wtórne; potwierdź u księgowości i na podatki.gov.pl. |
| E35 | Wymogi nadawców Gmail, Yahoo i Microsoft (2024–2026) | SPF, DKIM, DMARC i zgodność, jedno kliknięcie wypisania (RFC 8058) obsłużone w 2 dni, odsetek skarg poniżej 0,3% (cel poniżej 0,1%); od XI 2025 Gmail odrzuca niezgodny ruch. | Konfiguracja DNS przed pierwszą wysyłką, rozdzielone strumienie, tabela zdarzeń pocztowych, alerty i higiena listy. | Progi dotyczą nadawców masowych (5 tys./dobę), ale zasady stosujemy zawsze. |
| E36 | Przeglądy handlu agentowego 2026 (Wix AI Search Lab, VortexIQ, Jacob Tyler) | Protokoły MCP, WebMCP, UCP, ACP; Shopify otworzył witryny agentowe domyślnie; ruch z AI rośnie i konwertuje dobrze, ale zakupy w samym czacie u Walmartu konwertowały około trzykrotnie słabiej niż na stronie. | Trzy poziomy gotowości: treść czytelna maszynowo, publiczne pliki JSON, serwer MCP z potwierdzeniem przez człowieka; sprzedaż zostaje na stronie. | Źródła branżowe i dane producentów, nie badania naukowe. |
| E37 | Cloudflare, plan Free (przeglądy 2026) | Workers: 100 000 żądań dziennie; R2: 10 GB, 1 mln operacji A i 10 mln B miesięcznie, bez opłat za ruch wychodzący; Pages: 500 buildów miesięcznie. | Cały stack mieści się w planie darmowym; progi przejścia na płatny w `13-KOSZTY-I-REPOZYTORIA.md` §5. | Opracowania zewnętrzne; limity D1, Turnstile i Access do potwierdzenia w cenniku. |
| E38 | Fakturownia: KSeF i API (2026) | Integracja z KSeF jest bezpłatna w każdym abonamencie; API pozwala tworzyć faktury, pobierać PDF, wysyłać e-mailem i szukać po zewnętrznym `oid`. | Automatyczne tworzenie faktur po płatności, bez duplikatów; KSeF po stronie Fakturowni. | Materiały producenta; sprawdź limity API dla swojego abonamentu. |

---

## 5. Persony i ich ścieżki

| Persona | Sytuacja | Obawy | Czego potrzebuje na stronie | Główna ścieżka |
|---|---|---|---|---|
| P1 Nowy dom | działka po budowie, ogród od zera | koszt, błędy, których nie da się cofnąć | ceny „od”, proces, realizacje „od zera” | Quiz → wynik → rozmowa |
| P2 Metamorfoza | istniejący ogród, który nie działa | czy da się uratować to, co jest | przed/po, konsultacja w ogrodzie | Realizacja → „Chcę podobny ogród” → formularz |
| P3 Balkon / taras | apartament, mała przestrzeń | czy to w ogóle „projekt” | pakiet balkon z ceną, zdjęcia małych przestrzeni | Usługa balkon → formularz |
| P4 Firmy i samorządy | osiedle, rabaty miejskie, przestrzeń publiczna | referencje, formalności | portfolio PDF, dane firmy, ścieżka ofertowa | /dla-firm-i-samorzadow/ → formularz B2B (P1) |

---

## 6. Architektura informacji

Zasada URL: `trailingSlash: 'always'`, tak jak w WordPressie, żeby zachować jak najwięcej starych adresów.

```
/                                   strona główna
/uslugi/projekt-ogrodu/
/uslugi/balkony-i-tarasy/
/uslugi/rabaty-i-przestrzen-miejska/
/realizacje/                        siatka z filtrem
/realizacje/[slug]/                 case study
/cennik/                            pakiety + kalkulator
/jak-pracujemy/
/quiz/                              quiz stylu
/quiz/wynik/                        noindex
/wycena/                            formularz 3 kroki
/o-nas/                             (stary URL zachowany)
/opinie/
/dla-firm-i-samorzadow/             P1
/artykuly/  /artykuly/[slug]/       (stare adresy /RRRR/MM/DD/slug/ → 301)
/uslugi/mala-architektura-i-nawierzchnie/
/obszar/[miejscowosc]/              tylko gdy są ≥ 2 realizacje w okolicy
/kontakt/
/dziekujemy/                        noindex
/polityka-prywatnosci/
/panel/                             Cloudflare Access, noindex
```

Nawigacja główna: Realizacje, Usługi, Rośliny, Cennik, Jak pracujemy, Artykuły, Kontakt, przycisk „Zacznij projekt”. Adresy v2 (portal, atlas, kreator, mapa, bony): `08-PORTAL-FUNKCJE.md` §1.

Przekierowania 301 (pełna lista w `docs/redirects.csv`): `/agritech-about-us/` → `/o-nas/`, `/agritech-service/` → `/uslugi/projekt-ogrodu/`. Wszystkie pozostałe URL-e z sitemapy WordPressa trzeba zmapować przed startem.

---

## 7. Silnik konwersji

### Lejek

```
Wejście (Google, Mapy, FB/IG, polecenie)
  → Dowód (zdjęcia, realizacje, opinie)          [E1 E2 E5 E10]
  → Zrozumienie (proces, ceny, terminy)          [E4 E7 E8]
  → Mikro-zobowiązanie (quiz 60 s, kalkulator)   [E4]
  → Zgłoszenie (formularz 3 kroki)
  → Natychmiastowa reakcja (e-mail + SMS + link do rozmowy)  [E9]
  → Rozmowa < 60 min → konsultacja → umowa
  → Realizacja → prośba o opinię                 [E10]
  → opinia wraca na stronę jako dowód
```

### Pięć wejść, jeden pipeline

Wszystkie trafiają do tabeli `leads` z polem `source`.

1. **Quiz** → wynik bez podawania danych → „Wyślij wynik i umów rozmowę” (`source=quiz`).
2. **Formularz** `/wycena/` (`source=form`, `source_detail` = strona pochodzenia, np. `realizacja:ogrod-w-lesie`).
3. **Kalkulator widełek** na `/cennik/` (`source=calculator`).
4. **Rezerwacja rozmowy** Cal.com (zdarzenie `booking_click`; rezerwacje trafiają do kalendarza).
5. **Telefon / SMS** (zdarzenia `call_click`, `sms_click`).
6. **v2** (`08-PORTAL-FUNKCJE.md`): kreator zakresu (`scope_builder`), mój ogród (`moodboard`), Mikroretencja (`microretention`), płatna konsultacja (`consultation`), partner (`partner`), asystent AI (`assistant`).

### Zasady CTA

- Jedno główne CTA na sekcję.
- Ta sama nazwa akcji w całej ścieżce: przycisk „Wyślij zgłoszenie projektu” → strona „Zgłoszenie projektu wysłane”.
- Główne CTA w hero: quiz (niski próg). Formularz jako drugie. Kolejność weryfikuje test H1 (§14).

---

## 8. Strona główna, sekcja po sekcji

Limit: ≤ 1000 elementów DOM na całej stronie głównej [E3, E23]. Zachowaj kotwice `#uslugi` i `#kontakt` z obecnej strony, bo prowadzą do nich istniejące linki.

| # | Sekcja | Zawartość | Dowód | Kryterium akceptacji |
|---|---|---|---|---|
| S1 | Nagłówek (sticky) | logo, nawigacja, telefon (desktop), przycisk „Zacznij projekt”; mobile: logo, menu, ikona telefonu | E5 | nie zasłania > 64 px na mobile; focus widoczny |
| S2 | Hero | pełnoekranowe zdjęcie najlepszej realizacji (element LCP), H1 ≤ 10 słów, podtytuł z obszarem i ceną „od”, CTA „Sprawdź, jaki ogród do Ciebie pasuje” + mikrotekst, CTA drugie „Zobacz realizacje”, ocena Google pod CTA (gdy ≥ 5 opinii). Sygnatura: linia planu nasadzeń rysowana raz + 3 etykiety roślin | E1 E3 E10 | LCP ≤ 1,8 s p75; obraz `fetchpriority="high"`; animacja startuje po LCP |
| S3 | Pasek dowodów | {{liczba projektów}}, {{rok startu}}, ocena Google, {{wyróżnienie}} | E2 E6 | tylko prawdziwe liczby; brak danych = element ukryty |
| S4 | Usługi | 3 bloki ze zdjęciami realizacji, cena „od”, link | E4 E5 | żadnych ikon z szablonu |
| S5 | Wybrane realizacje | 3 case studies, jedno z suwakiem przed/po | E5 E7 | suwak działa z klawiatury i dotyku |
| S6 | Jak pracujemy | 5 kroków z czasem trwania i tym, co klient dostaje | E4 E7 | numeracja tylko tutaj (to prawdziwa sekwencja) |
| S7 | Pakiety | 3 pakiety + link do kalkulatora; środkowy „Polecany” | E8 E4 | ceny z CMS; brak ceny = blokada builda produkcyjnego |
| S8 | Opinie | 3 opinie + średnia i liczba z Google + link do źródła | E10 | treść opinii bez redakcji; imię + inicjał |
| S9 | Kto projektuje | zdjęcie portretowe w ogrodzie, inż. arch. kraj. Agnieszka Pupiało, wartości z /o-nas/, 2–3 zdania | E2 | brak stockowych zdjęć |
| S10 | FAQ | 6–8 obiekcji (`<details>`) | E2 | działa bez JS |
| S11 | Finał | krok 1 formularza osadzony na stronie + telefon | E9 | przejście do `/wycena/` z wyborem z kroku 1 w parametrach URL (typ, termin; bez danych osobowych, bez storage) |
| — | Stopka | nazwa, adres/obszar, telefon, e-mail, godziny kontaktu, social, polityka | E2 | dane zgodne z Google Business Profile |
| — | Pasek mobilny (sticky dół) | „Zadzwoń”, „Quiz 60 s”; pojawia się po hero, znika przy formularzu | E9 | nie zasłania pól formularza ani klawiatury |

---

## 9. Szablony podstron

**Case study `/realizacje/[slug]/`:** tytuł, gmina, metraż, zakres, styl, czas projektu → wyzwanie → koncepcja (szkic lub plan) → wizualizacje → realizacja (zdjęcia) → przed/po → lista roślin (nazwa łacińska + polska) → wypowiedź klienta (za zgodą) → CTA „Chcę podobny ogród” (`/wycena/?z=realizacja:slug`, parametr bez danych osobowych). Publikacja w CMS zablokowana bez zaznaczonej zgody właściciela posesji [E5, E7].

**Usługa:** problem klienta → co dostajesz → proces → realizacje z tej kategorii → pakiet z ceną „od” → FAQ usługi → CTA.

**Obszar `/obszar/[miejscowosc]/`:** tylko gdy są co najmniej 2 realizacje w okolicy. Unikalna treść: te realizacje, zasięg dojazdu, terminy wizyt. Bez stron-wydmuszek dla miast bez realizacji.

**Dla firm i samorządów (P1):** zakres według obecnej strony: parki osiedlowe, roślinność przy ciągach pieszych i samochodowych, rabaty w przestrzeni miejskiej, dobór małej architektury; referencje, dane firmy, portfolio PDF, formularz ofertowy z polami: instytucja, lokalizacja, zakres, termin, budżet orientacyjny.

**Dziękujemy:** potwierdzenie → kiedy nastąpi kontakt (uczciwie, zależnie od godziny) → przycisk rezerwacji rozmowy → 2 realizacje podobne do zgłoszenia.

---

## 10. Moduły

Priorytety: **P0** = start bez tego nie ma sensu, **P1** = szybko po starcie, **P2** = później.

### M1. Quiz stylu (P0) [E4, E7]
- Maksymalnie 7 pytań (część pomijana przez `skip_if`), jedno na ekran, pasek postępu liczony po pominięciach, przycisk „Wstecz”. Definicja w `src/data/quiz.json`.
- Wybór „Przestrzeń dla firmy lub gminy” kończy quiz wynikiem specjalnym ze ścieżką B2B.
- Pytanie ze zdjęciami: zdjęcia pobierane z CMS po tagu stylu.
- Krok „Dopasowujemy styl…” trwa 1,5 s i pokazuje **realnie użyte** kryteria (`criteria_labels`). Przy `prefers-reduced-motion` bez animacji.
- Wynik widoczny od razu, **bez podawania danych**: styl, opis, 3 zdjęcia realizacji w tym stylu, poziom pielęgnacji, rekomendowany pakiet z ceną „od”.
- Pełniejszy wynik e-mailem + rozmowa: po podaniu imienia i telefonu (e-mail opcjonalny).
- Zdarzenia: `quiz_start`, `quiz_step{n}`, `quiz_complete{style}`, `lead_submit{source=quiz}`.
- AC: działa na klawiaturze; `<noscript>` z linkiem do `/wycena/`; logika punktacji w czystej funkcji TS z testami (w tym remisy).

### M2. Formularz 3 kroki (P0) [E9]
- **Krok 1:** co projektujemy (kafle), kiedy start (kafle).
- **Krok 2:** miejscowość, orientacyjna powierzchnia (kafle), zdjęcia działki (opcjonalnie, do 10 plików, ≤ 10 MB każdy, w tym HEIC z iPhone'a), uwagi.
- **Krok 3:** imię, telefon (wymagany), e-mail (opcjonalny), preferowany kontakt, potwierdzenie zapoznania się z informacją o danych (niezaznaczone), Turnstile.
- Walidacja inline po opuszczeniu pola; komunikat mówi, co jest źle i jak to naprawić.
- Serwer: `zod`, weryfikacja Turnstile, limit zgłoszeń z IP (binding Rate Limiting lub licznik w D1), ULID, `delete_after`.
- Upload: każdy plik osobnym `POST /api/upload` przez Workera do R2 (prywatny bucket, losowy klucz). Bez publicznych URL-i.
- AC: zapis w D1 < 1 s; e-mail do klienta i SMS do właścicielki < 60 s; brak danych osobowych w URL, logach i storage przeglądarki.

### M3. Kalkulator widełek (P1; P0 gdy ceny są dostarczone) [E4, E8]
W v2 zastąpiony kreatorem zakresu M17. Formuła i stawki: `src/data/pricing.ts`.
- Wejście: typ, metraż (suwak + pole), zakres, dodatki {{tylko oferowane}}.
- Wyjście: widełki „od–do”, zawartość zakresu, CTA „Zarezerwuj termin projektu” → formularz z przeniesionym wyborem.
- Formuła w `src/data/pricing.ts`. Build produkcyjny kończy się błędem, gdy są tam placeholdery.
- Dopisek: cena ostateczna po konsultacji.

### M4. Suwak przed/po (P0) [E7]
Web component bez frameworka. Klawiatura (strzałki, Home/End), dotyk, `role="slider"` z `aria-valuenow`. Oba zdjęcia w tym samym kadrze i proporcjach.

### M5. Galeria realizacji (P0) [E5]
Siatka z filtrem: styl, typ, metraż. Bez JS widać wszystkie realizacje (progresywne ulepszenie). Powiększenie przez natywny `<dialog>`.

### M6. Opinie (P0) [E10]
- Źródło: Google Business Profile, przepisywane do CMS z datą i linkiem do oryginału.
- Średnia i liczba opinii w ustawieniach CMS (P2: automatycznie przez Places API).
- Nigdy nie wymyślaj, nie skracaj ze zmianą sensu i nie filtruj opinii. Bez znaczników `AggregateRating` dla własnej firmy.

### M7. Pasek mobilny (P0) — opis w §8.

### M8. Rezerwacja rozmowy (P0) [E9]
Cal.com (plan darmowy), wydarzenie „Bezpłatna rozmowa o ogrodzie, 15 min”. Link na `/dziekujemy/` i w e-mailu. Bez przekazywania danych osobowych w parametrach URL. Widżet ładowany dopiero po kliknięciu.

### M9. Powiadomienia speed-to-lead (P0) [E9]
- SMS do właścicielki przez SMSAPI.pl z `normalize=1` (polskie znaki wymuszają kodowanie Unicode i skracają SMS do 70 znaków na część).
- E-mail do właścicielki: pełne dane, linki do zdjęć (podpisane, ważne 7 dni).
- E-mail do klienta: podsumowanie, uczciwy termin kontaktu zależny od godziny i dnia, link do rozmowy, co przygotować.

### M10. Panel leadów (P1)
`/panel/` za Cloudflare Access (logowanie kodem e-mail). Worker dodatkowo weryfikuje JWT z nagłówka `Cf-Access-Jwt-Assertion`. Lista, szczegóły ze zdjęciami, statusy (`new`, `contacted`, `consultation`, `offer`, `won`, `lost` + powód), notatki, automatyczny `first_contact_at`, lejek zdarzeń z 7 i 30 dni, mediana czasu do kontaktu, eksport CSV.

### M11. Prośba o opinię (P1) [E10]
Status `won` + data zakończenia realizacji → e-mail po 7 dniach z bezpośrednim linkiem do wystawienia opinii w Google; jedno przypomnienie po 14 dniach. Żadnych nagród za opinię.

### M12. Analityka bez ciasteczek (P0)
- Cloudflare Web Analytics (bez cookies).
- `POST /api/e`: tylko nazwy zdarzeń z białej listy, bez IP, bez identyfikatorów, bez danych osobowych, `navigator.sendBeacon`.
- P1: GA4 + Google Ads z Consent Mode v2 i banerem zgód, dopiero gdy ruszą płatne kampanie.

### P2 (później)
Moodboard AI z zastrzeżeniem, porównywarka roślin, opinie na żywo przez Places API, portal klienta z akceptacją projektu i poprawkami (jak Yardzen), wersja EN.

---

## 11. Architektura techniczna

| Warstwa | Wybór | Uzasadnienie |
|---|---|---|
| Framework | Astro 6, TypeScript strict | statyczny HTML, JS tylko w wyspach, Fonts API, CSP API [E3, E11] |
| Style | Tailwind CSS v4 (`@tailwindcss/vite`) + tokeny CSS | mały CSS, spójne tokeny z `02-DESIGN.md` |
| Interaktywność | React tylko w `src/islands/` (quiz, formularz, kalkulator); web components dla suwaka i filtrów | minimum JS |
| CMS | Sanity (Studio hostowane na `*.sanity.studio`), `@sanity/astro`, `sanity typegen` | wygodna edycja realizacji ze zdjęciami, CDN obrazów z LQIP i wymiarami |
| Build po zmianie treści | webhook Sanity → GitHub Actions (`repository_dispatch`) → `astro build` → `wrangler deploy` | przewidywalny, darmowy |
| Hosting | Cloudflare Workers (static assets + trasy on-demand) | edge, adapter Astro |
| Baza | Cloudflare D1 (location hint Europa; jurysdykcja EU, jeśli dostępna) | leady, zdarzenia |
| Pliki klientów | Cloudflare R2, bucket prywatny | zdjęcia działek |
| Antyspam | Cloudflare Turnstile | bez zagadek dla klienta |
| E-mail | Resend (domena `formazieleni.pl`, SPF/DKIM) | transakcyjne |
| Powiadomienia właściciela | Telegram albo ntfy (0 zł); SMSAPI tylko jako opcja | koszt zerowy, ta sama szybkość reakcji |
| Kalendarz | Cal.com | samodzielna rezerwacja |
| Panel | Cloudflare Access + Worker | darmowe logowanie kodem |
| Retencja i automatyzacje | osobny Worker `workers/retention` (F4), w F10 przemianowany na `workers/automation`, z Cron Trigger | retencja, sekwencje, przypomnienia, newsletter |
| Testy | Vitest, Playwright + `@axe-core/playwright`, Lighthouse CI, linkinator | jakość i budżety w CI |

### Przepływ

```
Przeglądarka ──HTML/CSS (edge cache)──> Cloudflare Workers (static assets)
     │
     ├─ POST /api/upload ──> Worker ──> R2 (prywatny)
     ├─ POST /api/lead ───> Worker ──> Turnstile verify ──> D1.leads
     │                                 ├─> Resend (e-mail klient + właścicielka)
     │                                 └─> SMSAPI (SMS właścicielka)
     └─ POST /api/e ──────> Worker ──> D1.events (bez PII)

Sanity (treści) ──webhook──> GitHub Actions ──build+deploy──> Workers
Cron (retention Worker) ──> D1 + R2 (usuwanie po delete_after)
/panel/ ──Cloudflare Access──> Worker ──> D1 (odczyt, statusy)
```

### Struktura repozytorium

```
.cursor/rules/formazieleni.mdc
docs/                 01-SPEC 02-DESIGN 03-COPY 04-PROMPTS redirects.csv
db/schema.sql
public/robots.txt  public/llms.txt
scripts/check-placeholders.mjs
sanity/               schematy Studio
src/
  components/         Astro (Photo, Button, PlantLabel, BeforeAfter, seo/…)
  islands/            React (Quiz, LeadForm, PriceCalculator)
  layouts/
  lib/                sanity/, validation/, notify/, pricing/, track.ts
  data/               quiz.json, pricing.ts
  pages/              trasy + api/
  styles/tokens.css
tests/                e2e/, unit/
workers/retention/    cron
```

### Zmienne środowiskowe

`SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_READ_TOKEN` (jeśli dataset prywatny), `PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET`, `RESEND_API_KEY`, `SMSAPI_TOKEN`, `SMSAPI_SENDER`, `NOTIFY_PHONE`, `NOTIFY_EMAIL`, `PUBLIC_CAL_LINK`, `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`. Bindingi: `DB` (D1), `UPLOADS` (R2). Sekrety wyłącznie przez `wrangler secret put`.

### Nagłówki bezpieczeństwa
CSP przez CSP API Astro 6 (dozwolone: `challenges.cloudflare.com`, `cdn.sanity.io`, `static.cloudflareinsights.com`, `app.cal.com`; widżet Cal.com ładowany dopiero po kliknięciu), HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` bez kamery, mikrofonu i geolokalizacji.

---

## 12. Budżety wydajności [E3]

Build w CI nie przechodzi, gdy budżet jest przekroczony.

| Budżet | Wartość |
|---|---|
| LCP p75 mobile | ≤ 1,8 s (próg „dobry” Google to 2,5 s) |
| INP p75 | ≤ 200 ms |
| CLS p75 | ≤ 0,05 |
| JS na stronie głównej (gzip, bez wysp ładowanych na interakcję) | ≤ 50 KB |
| CSS (gzip) | ≤ 30 KB |
| Obraz hero | ≤ 180 KB, `srcset` 480–2400 px, `auto=format` |
| Fonty | 2 rodziny, ≤ 4 pliki woff2, subset latin-ext, preload 1 pliku |
| Elementy DOM na stronie głównej | ≤ 1000 (v3; średnia z WebAIM 2026 to 1 437) [E23] |
| Lighthouse mobile | Performance ≥ 95, Accessibility 100, Best Practices 100, SEO 100 |
| Skrypty zewnętrzne przed interakcją | tylko Turnstile na stronach z formularzem i beacon Web Analytics |

Techniki: prerender wszystkich stron treści, `width`/`height` na każdym obrazie, LQIP z metadanych Sanity jako tło, `loading="lazy"` i `decoding="async"` poza hero, natywne CSS View Transitions (`@view-transition { navigation: auto; }`) zamiast routera JS, prefetch linków przy najechaniu.

---

## 13. SEO lokalne i widoczność w AI

- **Na każdej stronie:** unikalny title ≤ 60 znaków, description ≤ 155 znaków, jeden H1, canonical, obraz OG 1200×630 ze zdjęcia realizacji.
- **Mapowanie fraz** (jedna fraza główna na URL): „projekt ogrodu {{miasto}}” → `/uslugi/projekt-ogrodu/`; „projektowanie ogrodów {{region}}” → `/`; „projekt balkonu”, „projekt tarasu” → `/uslugi/balkony-i-tarasy/`; „ile kosztuje projekt ogrodu” → artykuł + `/cennik/`.
- **JSON-LD:** `LocalBusiness` + `ProfessionalService` (NAP, `areaServed`, `openingHoursSpecification`, `sameAs`), `Service` z `Offer` i `priceSpecification.minPrice` dla pakietów, `Article`, `BreadcrumbList`, `FAQPage` (dla maszynowej czytelności; Google pokazuje wyniki rozszerzone FAQ tylko wybranym witrynom). Bez `AggregateRating` dla własnej firmy.
- **Crawlery:** treść renderowana w HTML bez JS. `robots.txt` nie blokuje wyszukiwarek ani asystentów AI. Strony `/dziekujemy/` i `/quiz/wynik/` mają `noindex` w meta (nie blokada w robots.txt).
- **`llms.txt`:** opis firmy, usługi, obszar, ceny „od”, kontakt. Wyłącznie potwierdzone fakty.
- **Google Business Profile:** kategoria główna zgodna z usługą, usługi z cenami, regularnie nowe zdjęcia realizacji, link do strony z `utm_source=google&utm_medium=organic&utm_campaign=gbp`.
- **Spójność NAP:** strona, GBP, Facebook i katalogi firm z identyczną nazwą, adresem i telefonem.
- **Treści:** 12 artykułów startowych (lista w `03-COPY.md`), każdy z kontekstowym CTA.
- **Migracja:** `scripts/import-wordpress.mjs` (WXR → Sanity NDJSON + `import/redirects.csv`). Stare artykuły mają adresy z datą (`/RRRR/MM/DD/slug/`), więc każdy dostaje 301 na `/artykuly/slug/` (Cloudflare Bulk Redirects). Nowa sitemapa w Search Console, monitoring 404 przez 60 dni.
- **Nigdy:** ukryty tekst, strony-wydmuszki dla miast, fałszywe opinie, instrukcje dla AI w treści strony.

---

## 14. Pomiar, eksperymenty, rytm optymalizacji

### Zdarzenia (biała lista)
`cta_click{id}`, `quiz_start`, `quiz_step{n}`, `quiz_complete{style}`, `form_step{n}`, `form_error{field}`, `lead_submit{source}`, `call_click`, `sms_click`, `booking_click`, `calc_use`, `filter_use{type}`, `before_after_use`. v2: `search_use`, `plant_filter`, `moodboard_save`, `moodboard_send`, `scope_complete`, `microretention_check`, `newsletter_signup`, `consultation_checkout`, `voucher_checkout`, `portal_login`, `comment_add`, `approval`, `assistant_question`.

### Rytm
- Tygodnie 1–4: tylko naprawy błędów i największych odpadów w lejku.
- Co 2 tygodnie: przegląd lejka w panelu (quiz, formularz, czas do kontaktu).
- Testy A/B dopiero po zebraniu baseline.

### Hipotezy do testów (kolejność = priorytet)

| ID | Zmiana | Metryka |
|---|---|---|
| H1 | Główne CTA w hero: quiz vs formularz | leady / sesje |
| H2 | Ceny „od” widoczne vs „wycena indywidualna” | leady zakwalifikowane |
| H3 | Formularz 3 kroki vs 1 krok | ukończenie formularza |
| H4 | Zdjęcie hero A vs B | kliknięcia CTA hero |
| H5 | Wynik quizu bez bramki vs pełny wynik po podaniu telefonu | leady z quizu |

Przy małym ruchu testuj duże zmiany, nie kolory przycisków. Test z losowym przydziałem zapamiętanym w cookie wymaga oceny, czy potrzebna jest zgoda. Alternatywa bez cookie: przydział zależny od dnia tygodnia albo testy sekwencyjne w porównywalnych okresach.

---

## 15. Prawo i RODO

To wytyczne techniczne, nie porada prawna. Przed startem zweryfikuj z prawnikiem.

- **Administrator danych:** {{pełna nazwa firmy, NIP, adres}}.
- **Podstawa przetwarzania zgłoszeń:** działania na żądanie osoby przed zawarciem umowy (art. 6 ust. 1 lit. b RODO). Checkbox „zapoznałem/-am się z informacją” zamiast „zgody”. Zgoda marketingowa osobno i opcjonalnie.
- **Retencja:** leady bez umowy usuwane po {{12}} miesiącach razem ze zdjęciami (cron). Zdarzenia analityczne: 13 miesięcy.
- **Podmioty przetwarzające:** Cloudflare, Resend, SMSAPI, Cal.com. Sanity przechowuje wyłącznie treści publiczne. Zawrzeć umowy powierzenia / DPA.
- **Cookies:** domyślnie brak cookies analitycznych i marketingowych, więc bez banera. Baner zgód dopiero z GA4/Ads (Consent Mode v2). Osadzenia zewnętrzne ładowane po kliknięciu. Ciasteczko sesji portalu i strefy partnera jest niezbędne (bez zgody). „Mój ogród” zapisuje dane w przeglądarce tylko po kliknięciu „Zapisz”. Płatność odbywa się na stronie Stripe.
- **Opinie:** imię + inicjał, link do źródła.
- **Zdjęcia realizacji:** pisemna zgoda właściciela posesji; bez numerów domów, tablic rejestracyjnych i rozpoznawalnych twarzy bez zgody.

---

## 16. Materiały od właściciela (blokujące)

- [x] Obszar działania: Trójmiasto i pomorskie, etap 2 kujawsko-pomorskie (`00-DANE.md`)
- [ ] Zakres oferty: tylko projekt czy także realizacja, nadzór, pielęgnacja
- [ ] Pakiety: nazwy, ceny „od”, zawartość, czas realizacji, liczba rund poprawek (znane: projekty 2500–25 000 zł, największe do 50 000 zł)
- [ ] 8–12 realizacji: zdjęcia (min. 2400 px dłuższy bok), przed/po z tej samej perspektywy, plany i wizualizacje, lista roślin, zgoda właściciela
- [ ] Profesjonalne zdjęcie portretowe projektantki w ogrodzie
- [~] Wykształcenie: inż. arch. kraj. Agnieszka Pupiało (z /o-nas/). Uprawnienia, członkostwa, wyróżnienia: do uzupełnienia
- [~] Liczba zaprojektowanych ogrodów i rok startu (na stronie tylko „od prawie 10 lat”)
- [ ] Dostęp do Google Business Profile i obecne opinie
- [ ] Dane rejestrowe firmy (stopka, polityka prywatności)
- [ ] Godziny kontaktu (SLA i treść e-maili)
- [ ] Logo w SVG i decyzja: zostaje czy odświeżenie
- [ ] Dostęp do WordPressa: eksport treści (WXR) i sitemapa URL-i
- [x] Forma narracji: „my”, jak na obecnej stronie

## 17. Otwarte pytania

| Pytanie | Kto | Blokuje |
|---|---|---|
| Ceny i zawartość pakietów | właściciel | tak (M3, S7) |
| Obszar działania | właściciel | tak (SEO, copy) |
| Czy pracownia realizuje ogrody, czy tylko projektuje | właściciel | tak (proces, FAQ) |
| Priorytet ścieżki dla firm i samorządów | właściciel | nie |
| Budżet na fotografa | właściciel | nie, ale bez zdjęć strona nie spełni E1 |

## 18. Fazy (szacunek pracy z Cursorem)

| Faza | Zakres | Szacunek |
|---|---|---|
| F0 | fundament repo, CI, budżety | 0,5 dnia |
| F1 | system wizualny, komponenty, styleguide | 1–2 dni |
| F2 | Sanity: schematy, zapytania, obrazy, webhook | 1 dzień |
| F3 | strony i szablony | 3–4 dni |
| F4 | silnik leadów: API, upload, powiadomienia, formularz | 2 dni |
| F5 | quiz i kalkulator | 2 dni |
| F6 | analityka i panel | 1–2 dni |
| F7 | SEO, AI, migracja WordPress | 1 dzień |
| F8 | QA: wydajność, dostępność, e2e | 1–2 dni |
| F9 | start i monitoring | 0,5 dnia |
| F10 | CRM, sekwencje, polecenia, przetargi, raporty (`05-MARKETING.md`, `db/0002`) | 2–3 dni |
| F11 | baner zgód, tagi reklamowe, strony docelowe `/lp/` | 1–2 dni |
| F12 | wyszukiwarka, atlas roślin, mój ogród, Mikroretencja | 2–3 dni |
| F13 | kreator zakresu, kalendarz, newsletter | 2 dni |
| F14 | portal klienta, wideo-opinie | 4–5 dni |
| F15 | płatności, bony, strefa partnera | 3 dni |
| F16 | mapa realizacji, asystent AI | 2–3 dni |
| F17 | UX v3: test 5 sekund, formularz H6, szybka ścieżka, dostępność | 2 dni |
| F18 | automatyzacje A3–A22, telefonia, ankiety, raport tygodniowy | 3–4 dni |
| F19 | AI podgląd stylu, centrum wiedzy | 3 dni |
| F20 | wykonawcy, lista zakupów, oferta online, dziennik, opieka | 3–4 dni |
| F21 | platformy: profile, kontakty, alert A23, raport | 1–2 dni |
| F22 | zgodność 2026 i warstwa dla agentów AI | 2–3 dni |
| F23 | wariant darmowy: powiadomienia push, Fakturownia, liczniki limitów | 1–2 dni |

Szacunek nie obejmuje zbierania materiałów z §16.

## 19. Bibliografia

- Lindgaard, G., Fernandes, G., Dudek, C., Brown, J. (2006). Attention web designers: You have 50 milliseconds to make a good first impression! *Behaviour & Information Technology*, 25(2), 115–126. https://doi.org/10.1080/01449290500330448
- Fogg, B. J. i in. (2003). How do users evaluate the credibility of Web sites? *DUX '03*. https://doi.org/10.1145/997078.997097
- Google/SOASTA (2017). Mobile page speed benchmarks. https://business.google.com/ca-en/think/marketing-strategies/mobile-page-speed-new-industry-benchmarks/ oraz „Milliseconds Make Millions”: https://www.thinkwithgoogle.com/_qs/documents/9757/Milliseconds_Make_Millions_report_hQYAbZJ.pdf
- Yardzen, How It Works: https://yardzen.com/how-it-works; recenzje procesu i pakietów: https://www.thequalityedit.com/articles/yardzen-landscape-design-review, https://yardzen.myprosandcons.com/
- Green Valley Hardscapes (2026). Cool Landscaping Websites: 2026 Design Examples: https://greenvalleyhardscapes.com/cool-landscaping-websites-2026-design-examples-ideas-what-really-works/
- ThemeMasterly (2026). Best Landscaping Website Design Examples: https://thememasterly.com/landscaping-website-design/
- propertydesign.pl (2026). Mistrzowie krajobrazu: https://www.propertydesign.pl/architektura/104/mistrzowie_krajobrazu_to_oni_projektuja_najlepsze_parki_i_przestrzenie_publiczne_w_polsce,53477.html
- Sztuka Architektury (2026). Plebiscyt Polska Architektura XXL 2025: https://sztuka-architektury.pl/article/18937/
- Buell, R. W., Norton, M. I. (2011). The Labor Illusion: How Operational Transparency Increases Perceived Value. *Management Science*, 57(9), 1564–1579. https://doi.org/10.1287/mnsc.1110.1376
- Simonson, I. (1989). Choice Based on Reasons: The Case of Attraction and Compromise Effects. *Journal of Consumer Research*, 16(2), 158–174. https://doi.org/10.1086/209205
- Oldroyd, J. B., McElheran, K., Elkington, D. (2011). The Short Life of Online Sales Leads. *Harvard Business Review*, marzec 2011. https://hbr.org/2011/03/the-short-life-of-online-sales-leads
- Spiegel Research Center (2017). How Online Reviews Influence Sales. https://spiegel.medill.northwestern.edu/how-online-reviews-influence-sales/
- Cloudflare (2026). Cloudflare Acquires Astro: https://www.cloudflare.com/press/press-releases/2026/cloudflare-acquires-astro-to-accelerate-the-future-of-high-performance-web-development/; Astro 6.0: https://alternativeto.net/software/astro-web-framework/news
