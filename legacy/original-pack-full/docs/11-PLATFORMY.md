# Platformy ogłoszeniowe: Oferteo, Facebook i inne

Uzupełnia `05-MARKETING.md` i `06-REKLAMY-DIY.md`. Dowody E28–E31 dopisane do `01-SPEC.md` §4. Źródła: `docs/_research-platformy-2026-09-17.md`. **[wiedza]** = fakt z wiedzy modelu, niesprawdzony wyszukiwaniem w tym czacie; zweryfikuj przed użyciem.

## 0. Wnioski

1. **Facebook Marketplace: nie.** Zasady Meta zakazują na Marketplace przedmiotów niefizycznych, w tym usług. Firmy z EOG działające zarobkowo mogą stracić dostęp do Marketplace i ogłoszenia [E30]. Obejście zasad (np. „sprzedam projekt” jako przedmiot) grozi blokadami, które mogą utrudnić też działanie strony firmowej i reklam [wiedza]. Zamienniki są w §3.
2. **Oferteo: tak, jako test z twardym limitem.** Płacisz punktami za kontakt, ten sam kontakt kupuje zwykle kilka firm, a klienci często porównują ceny [E28]. Przy cenie premium to kanał do sprawdzenia liczbami, nie filar.
3. **Fixly: dopiero po Oferteo.** Podobny model: wykonawca płaci punktami za wysłaną ofertę [E29]. Test tylko wtedy, gdy Oferteo przyniesie umowy.
4. **Houzz: pomijamy w Polsce.** Na houzz.com nie ma polskiej wersji rynku [E31].
5. **Darmowe wizytówki z identycznymi danymi** mają pierwszeństwo przed płatnymi platformami. Cytowania w katalogach to 13% wagi w widoczności w AI [E14].

## 1. Budżet: platformy mieszczą się w tych samych 300 zł

Limit 300 zł miesięcznie obejmuje Google Ads, Meta i punkty na platformach.

**Ile maksymalnie zapłacić za kontakt** (wzór z `06-REKLAMY-DIY.md` §1, próg 10% marży na pozyskanie):

| Szacowana wartość zlecenia | Maks. koszt pozyskania umowy | Maks. koszt kontaktu przy 10% kontaktów → umowa | przy 20% |
|---|---|---|---|
| 8 000 zł | 760 zł | 76 zł | 152 zł |
| 15 000 zł | 1 425 zł | 143 zł | 285 zł |
| 25 000 zł | 2 375 zł | 238 zł | 475 zł |

Konwersja 10–20% to hipoteza startowa, nie dane. Rzeczywistą wartość pokaże widok `v_platform_economics` po pierwszych kontaktach.

**Kupuj kontakt tylko wtedy, gdy spełnione są wszystkie warunki:**
1. Lokalizacja w obszarze z `00-DANE.md`.
2. Zakres to projekt (nie samo koszenie ani sama budowa, jeśli pracownia nie buduje).
3. Opis sugeruje zlecenie warte co najmniej `{{MIN_WARTOSC_ZLECENIA}}` zł (metraż, zakres, budżet).
4. Zapytanie jest świeże i możesz odpowiedzieć w ciągu 60 minut [E9].
5. Klient opisał potrzebę konkretnie (a nie „ile kosztuje ogród”).

**Wariant budżetu z Oferteo (III–V):** Google Ads 200 zł + punkty Oferteo 100 zł. Jeśli najmniejszy pakiet punktów kosztuje więcej niż 100 zł (źródło zewnętrzne podaje ok. 207 zł netto za 25 punktów [E29]), kup go raz na sezon i rozłóż na 2–3 miesiące, zmniejszając w tym czasie Meta do zera. Przed zakupem sprawdź ważność punktów.

**Ocena testu co 10 kupionych kontaktów:**
- 0 rozmów → stop i zmiana filtra albo wiadomości;
- co najmniej 1 umowa → kontynuacja;
- rozmowy są, ale umów brak → popraw pierwszą wiadomość i ofertę, potem kolejne 10.

## 2. Oferteo: sposób działania krok po kroku

### 2.1 Profil
- **Kategorie:** projektowanie ogrodów, architektura krajobrazu, mała architektura (te, które platforma udostępnia).
- **Obszar:** Trójmiasto i powiaty z `06-REKLAMY-DIY.md` §3; kujawsko-pomorskie dopiero w etapie 2.
- **Opisy:** szablony z §6. **Zdjęcia:** tylko własne realizacje, za zgodą właścicieli.
- **Weryfikacja:** przejdź weryfikację danych firmy, żeby dostać odznakę „Sprawdzona Firma” [E28].
- **Opinie:** po każdym zleceniu z Oferteo prosimy o opinię na Oferteo i w Google. Prosimy wszystkich klientów, niezależnie od wyniku ankiety.
- Sprawdź, czy sama wizytówka jest bezpłatna. Z materiałów Oferteo wynika, że rozbudowana „Strona na Oferteo” jest płatna [E28].

### 2.2 Szybkość
Kilka firm dostaje ten sam kontakt [E28], a szansa na zakwalifikowanie leada spada z każdą godziną [E9]. Cel: pierwsza odpowiedź w ciągu 60 minut w godzinach pracy, najlepiej w ciągu 15.

### 2.3 Automatyzacja A23
Powiadomienia e-mail z Oferteo i Fixly przekierowujesz na adres obsługiwany przez Cloudflare Email Routing. Email Worker wysyła SMS do projektantki z tematem powiadomienia i tworzy zadanie w panelu. Nie pobieramy danych z platform automatycznie przez ich serwis (regulamin) [wiedza: sprawdź regulaminy].

### 2.4 Jak nie przegrać ceną
- Pierwsza wiadomość (§6) mówi o konkretnym projekcie klienta, zawiera 2 pytania, link do podobnej realizacji i cenę „od”.
- Tańszy wstęp to „Konsultacja w ogrodzie”, a koncepcja jest pakietem środkowym [E8].
- Nie obniżaj ceny bez zmiany zakresu. Pokaż różnicę w zakresie (lista roślin, plan nasadzeń, portal, opieka).

### 2.5 Pomiar
- Lead w panelu: `source = 'marketplace'`, `source_detail = 'oferteo:<numer zapytania>'`.
- Każdy kupiony kontakt: tabela `platform_contacts` (koszt w zł, czas pierwszej odpowiedzi, wynik).
- Raport: `v_platform_economics` (koszt kontaktu, odsetek odpowiedzi w 60 min, rozmowy, oferty, umowy, koszt na umowę).

### 2.6 Czego nie robić na Oferteo
- Nie kupować opinii. W sieci są oferty ich sprzedaży [E28]; to ryzyko prawne [wiedza: przepisy o nieuczciwych praktykach rynkowych] i utrata wiarygodności.
- Nie dopisywać klientów z platform do newslettera bez zgody.

## 3. Facebook: co zamiast Marketplace

| Narzędzie | Czy wolno | Jak używamy |
|---|---|---|
| Marketplace | Nie: usługi są zakazane, firmy z EOG podlegają ograniczeniom [E30] | Nie publikujemy |
| Strona firmowa na Facebooku | Tak | Wizytówka z danymi jak w Google, 3 formaty postów z `05-MARKETING.md` §5, przycisk „Wyślij wiadomość” |
| Lokalne grupy (budowa domu, osiedla, gminy Pomorza) | Zależy od regulaminu grupy | Merytoryczne odpowiedzi na pytania o ogrody; ogłoszenia tylko tam, gdzie regulamin pozwala; bez prywatnych wiadomości do osób, które o nie nie prosiły |
| Meta Ads (Wiadomości, Zaangażowanie) | Tak | Według `06-REKLAMY-DIY.md` §7 |
| Instagram | Tak | Rolki przed/po, proces, roślina miesiąca |
| Automatyczne odpowiedzi w Messengerze | Tak [wiedza] | Odpowiedź poza godzinami z terminem kontaktu (§6) |

**Wybór grup, bez zgadywania nazw.** Szukaj po frazach: nazwa gminy + „mieszkańcy”, „budujemy dom” + województwo, nazwa nowego osiedla. Kryteria: aktywność w ostatnim tygodniu, regulamin dopuszcza pytania i odpowiedzi specjalistów, członkowie z Twojego obszaru. Rytm: 2 merytoryczne odpowiedzi tygodniowo, bez linków sprzedażowych, jeśli regulamin ich nie dopuszcza.

## 4. Inne platformy

| # | Platforma | Typ | Koszt | Rola | Priorytet | Uwagi |
|---|---|---|---|---|---|---|
| 1 | Google Business Profile | wizytówka i mapy | 0 | lokalna intencja, opinie | P0 | [E12], [E14] |
| 2 | Własna strona | – | 0 | treści ważą najwięcej w widoczności w AI | P0 | [E14] |
| 3 | Instagram | social | 0 | dowód wizualny, proces | P0 | [E1], [E7] |
| 4 | Strona firmowa na Facebooku i lokalne grupy | social | 0 | zaufanie, społeczność | P0 | §3 |
| 5 | Bing Places | wizytówka | 0 | spójne dane, wyszukiwarka Bing | P1 | [wiedza] |
| 6 | Apple Business Connect (Mapy Apple) | wizytówka | 0 | użytkownicy iPhone'ów | P1 | [wiedza: sprawdź dostępność w Polsce] |
| 7 | Darmowe wpisy w katalogach (np. Panorama Firm, pkt.pl) | katalog | 0 w wersji podstawowej | cytowania z identycznymi danymi | P1 | [wiedza: sprawdź, co jest bezpłatne]; nie kupuj pakietów przy budżecie 300 zł |
| 8 | Oferteo | platforma zapytań | punkty | leady z intencją | P1, test | §2, [E28] |
| 9 | LinkedIn | B2B | 0 | deweloperzy, zarządcy, samorządy | P1 | `05-MARKETING.md` §10 |
| 10 | Plebiscyt Polska Architektura XXL i media branżowe | PR | wg regulaminów | autorytet | P1 | [E6] |
| 11 | e-Zamówienia i BZP | przetargi | 0 | kontrakty publiczne | P1 | `05-MARKETING.md` §10 |
| 12 | Fixly | platforma zapytań | punkty za ofertę | leady | P2, test po Oferteo | [E29] |
| 13 | LocaYo, Oferia | platformy zapytań | LocaYo: darmowa odpowiedź, płatne wyróżnienia | test bez kosztu | P2 | [E29], źródła konkurencyjne |
| 14 | Pinterest | wyszukiwarka wizualna | 0 | długie życie treści, ruch do artykułów | P2 | [wiedza] |
| 15 | YouTube (Shorts) | wideo | 0 | proces, przed/po, wideo-opinie | P2 | trend wideo w opiniach [E12] |
| 16 | OLX (ogłoszenia usług) | ogłoszenia | [wiedza: sprawdź koszty dla firm] | lokalny zasięg | P2 | tylko jeśli koszt mieści się w §1 |
| 17 | Houzz | globalny katalog | – | brak rynku PL | pominąć | [E31] |
| 18 | Facebook Marketplace | ogłoszenia C2C | – | niedozwolone dla usług | pominąć | [E30] |

## 5. Jedno źródło danych firmy

Identyczne na wszystkich platformach: nazwa, obszar, telefon, e-mail, adres strony, godziny, kategorie, krótki opis (§6), długi opis (§6), 10 zdjęć realizacji, logo. Lista profili z datą ostatniej kontroli jest w tabeli `listings` (`db/0005_platforms.sql`). Kontrola raz na kwartał i po każdej zmianie danych.

## 6. Szablony tekstów

**Opis krótki (≤ 160 znaków):**
Projekty ogrodów, balkonów i tarasów w Trójmieście i na Pomorzu. Główny projektant: inż. arch. kraj. Agnieszka Pupiało. Projekty od 2500 zł.

**Opis długi (≤ 750 znaków):**
Forma Zieleni od prawie 10 lat projektuje zieleń w Trójmieście i na Pomorzu. Projektujemy małe ogrody przy szeregowcach i dużych domach, balkony, tarasy, rabaty kwietne, małą architekturę i wzory kostki brukowej, a także parki osiedlowe i zieleń przy ciągach pieszych. Rośliny dobieramy do gleby, klimatu, pór roku i miejskich warunków. Główny projektant: inż. arch. kraj. Agnieszka Pupiało. Projekty od 2500 zł. Zobacz realizacje i zacznij projekt na formazieleni.pl.

**Pierwsza odpowiedź na zapytanie (Oferteo, Fixly):**
Dzień dobry, {{Imię}}. Dziękuję za zapytanie o {{zakres}} w {{miejscowość}}. Żeby przygotować sensowną propozycję, mam dwa pytania: jaka jest orientacyjna powierzchnia i co jest dla Państwa najważniejsze w ogrodzie? Tak wyglądał podobny projekt: {{link do realizacji}}. Projekty zaczynamy od 2500 zł, a dokładną cenę podam po krótkiej rozmowie. Czy mogę zadzwonić dziś o {{godzina}}? {{Imię}}, Forma Zieleni, 514 220 155

**Przypomnienie po 2 dniach bez odpowiedzi:**
Dzień dobry, {{Imię}}. Czy temat projektu {{zakres}} jest nadal aktualny? Jeśli tak, wystarczy odpisać „tak”, a zadzwonię w dogodnym dla Państwa terminie.

**Odpowiedź w lokalnej grupie (merytoryczna, bez sprzedaży):**
Przy {{problem z pytania}} najczęściej sprawdza się {{konkretna rada}}. Warto najpierw sprawdzić {{warunek, np. nasłonecznienie lub odpływ wody}}. Jeśli pomoże, chętnie podpowiem więcej. (Podpis z nazwą firmy tylko tam, gdzie regulamin grupy na to pozwala.)

**Automatyczna odpowiedź w Messengerze poza godzinami:**
Dziękujemy za wiadomość. Odpisujemy w dni robocze w godz. {{GODZINY}}. Jeśli chodzi o projekt ogrodu, zostaw krótki opis i numer telefonu, a oddzwonimy w najbliższym dniu roboczym do {{godzina}}.

## 7. Kalendarz platform (dopisek do `05-MARKETING.md` §4)

| Miesiące | Platformy |
|---|---|
| I–II | Profile i weryfikacja: GBP, Facebook, Instagram, Bing, Apple, darmowe katalogi, Oferteo (profil i weryfikacja); tabela `listings` |
| III–V | Test Oferteo (10 kontaktów wg §1); grupy lokalne 2 odpowiedzi tygodniowo; zdjęcia realizacji na wszystkich profilach |
| VI–VIII | Instagram i Facebook: balkony i tarasy; decyzja o Fixly tylko po pozytywnym wyniku Oferteo |
| IX–X | Ocena kwartału w `v_platform_economics`; Pinterest z artykułami |
| XI–XII | Aktualizacja danych na wszystkich profilach, zdjęcia z sezonu, opinie od klientów z sezonu |

## 8. Czego nie robić

- Nie ogłaszać usług na Facebook Marketplace [E30].
- Nie kupować ani nie wymieniać się opiniami.
- Nie używać zdjęć cudzych realizacji ani stocków udających realizacje.
- Nie wysyłać ofert w prywatnych wiadomościach do członków grup bez ich prośby.
- Nie dopisywać kontaktów z platform do newslettera bez zgody.
- Nie obniżać ceny bez zmiany zakresu.
- Nie przekraczać limitu 300 zł łącznie dla wszystkich kanałów płatnych.
