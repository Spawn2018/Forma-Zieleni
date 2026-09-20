# Rozbudowa v2: portal klienta i nowe funkcje

Uzupełnia moduły M1–M12 z `01-SPEC.md`. Priorytety: **P0** przed startem, **P1** w ciągu 1–3 miesięcy po starcie, **P2** później. Dowody E1–E20.

## 1. Nowe adresy

```
/szukaj/                         wyszukiwarka treści
/rosliny/  /rosliny/[slug]/      atlas roślin
/moj-ogrod/                      zapisane realizacje i rośliny
/mikroretencja/                  sprawdzarka warunków + ogród deszczowy
/kreator/                        kreator zakresu z widełkami cen
/kalendarz-pielegnacji/          prace w ogrodzie miesiąc po miesiącu
/newsletter/  /newsletter/potwierdz/
/mapa-realizacji/                mapa realizacji z dokładnością do gminy
/konsultacja/                    płatna konsultacja z rezerwacją terminu
/bony/                           bony podarunkowe
/portal/  /portal/projekt/[id]/  portal klienta
/partner/                        strefa partnera
/asystent/                       asystent AI odpowiadający z treści strony
```

Nawigacja główna: dochodzi „Rośliny”. „Portal klienta” trafia do stopki i do e-maili dla klientów.

## 2. Moduły

| ID | Moduł | Po co | Priorytet |
|---|---|---|---|
| M13 | Portal klienta | Pokazanie pracy nad projektem podnosi wartość usługi [E7]. Uwagi i rundy poprawek w portalu to model Yardzen [E4]. | P1 |
| M14 | Atlas roślin | Treść na stronie waży najwięcej w widoczności w AI [E14] i pokazuje wiedzę [E2]. | P0: 30 roślin z realizacji |
| M15 | Mój ogród | Mały krok przed zgłoszeniem [E4]; lista trafia do zapytania. | P0 |
| M16 | Mapa realizacji | Lokalny dowód [E5, E14]. | P1 |
| M17 | Kreator zakresu | Jawne widełki i pakiety [E4, E8]; zastępuje prosty kalkulator M3. | P1 |
| M18 | Sprawdzarka Mikroretencji | Oferta sezonowa [E20]. | P0 w VII–X |
| M19 | Kalendarz pielęgnacji i przypomnienia | Powroty klientów, opinie i polecenia [E10, E12]. | P1 |
| M20 | Newsletter sezonowy | Kontakt z leadami „nie teraz”, wyłącznie za zgodą. | P1 |
| M21 | Płatna konsultacja i zaliczki | Filtr jakości leadów, szybka rezerwacja [E9]. | P1, jeśli w ofercie |
| M22 | Bony podarunkowe | Sezon XI–XII. | P2 |
| M23 | Strefa partnera | Mierzalne polecenia partnerów (`05-MARKETING.md` §9). | P1 |
| M24 | Wideo-opinie | Opinie wideo zyskują na znaczeniu [E12]. | P1 |
| M25 | Wyszukiwarka | Pagefind: statyczna, bez serwera. | P0 |
| M26 | Asystent AI | 45% szuka firm przez AI [E12]; odpowiada tylko z treści strony. | P2 |

## 3. Wymagania i kryteria akceptacji

### M13 Portal klienta (P1)
- **Logowanie linkiem z e-maila.** Token jednorazowy, ważny 15 min, w bazie wyłącznie skrót SHA-256. Sesja w ciasteczku `HttpOnly; Secure; SameSite=Lax`, ważna 30 dni. To ciasteczko niezbędne, nie wymaga zgody.
- **Etapy projektu:** wizyta, koncepcja, projekt szczegółowy, realizacja, odbiór. Każdy z datą planowaną i faktyczną.
- **Pliki w prywatnym R2:** koncepcje, wizualizacje, plany PDF, z numerami wersji. Link do pobrania powstaje dopiero po sprawdzeniu sesji i uprawnień.
- **Uwagi przypięte do wizualizacji:** klient klika miejsce na obrazie (pozycja x/y w %), może odpowiadać w wątku, projektantka oznacza uwagę jako rozwiązaną.
- **Rundy poprawek:** licznik wykorzystanych rund z limitem z pakietu (wartość z CMS); rundę zamyka projektantka.
- **Akceptacja wersji:** zapisuje datę, wersję pliku i wersję treści oświadczenia.
- **Rośliny i pielęgnacja:** lista roślin projektu z linkami do atlasu oraz kalendarz pielęgnacji (M19).
- **Powiadomienia e-mail:** o nowej wersji pliku i o odpowiedzi na uwagę.
- **AC:**
  - klient widzi wyłącznie swoje projekty (testy uprawnień),
  - pobranie pliku bez sesji zwraca 403,
  - portal działa na telefonie i z samej klawiatury,
  - JS portalu ≤ 150 KB gzip.

### M14 Atlas roślin (P0)
- **Dokument `plant` w Sanity:**
  - nazwa łacińska i polska, własne zdjęcia,
  - stanowisko, gleba, wilgotność, odporność na suszę, mrozoodporność,
  - wysokość i szerokość, miesiące kwitnienia,
  - czy jest przyjazna zapylaczom, uwagi o toksyczności (tylko potwierdzone),
  - realizacje, w których roślina wystąpiła.
- **Filtry** działają jako progresywne ulepszenie; strony są statyczne.
- **Źródło danych:** parametry wpisuje projektantka. Nie kopiujemy opisów z katalogów szkółek i nie generujemy parametrów automatycznie.
- **CTA:** „Dodaj do mojego ogrodu” i „Zaprojektuj rabatę z tą rośliną”.

### M15 Mój ogród (P0)
- Przycisk „Zapisz” przy realizacji i roślinie zapisuje identyfikator w pamięci przeglądarki. To funkcja wprost zamówiona przez użytkownika, jak koszyk w sklepie, więc nie wymaga zgody; potwierdź to z prawnikiem.
- `/moj-ogrod/` pokazuje zapisane elementy, link do udostępnienia (`?r=…&p=…`) i przycisk „Wyślij z zapytaniem” (lista trafia do `source_detail`).
- **AC:**
  - maksymalnie 20 elementów,
  - nieistniejące identyfikatory są pomijane,
  - przycisk „Wyczyść listę” usuwa wszystko z pamięci przeglądarki.

### M16 Mapa realizacji (P1)
- Mapa SVG województw pomorskiego i kujawsko-pomorskiego, wygenerowana z otwartych danych PRG (GUGiK) i uproszczona.
- Punkty z dokładnością do gminy, bez adresów. Kliknięcie punktu pokazuje realizacje w tej gminie.
- **AC:** bez bibliotek map, ≤ 60 KB SVG, działa z klawiatury.

### M17 Kreator zakresu (P1)
- **Krok 1:** typ przestrzeni i powierzchnia.
- **Krok 2:** strefy: taras, trawnik, rabaty, warzywnik, miejsce zabaw, oczko lub ogród deszczowy, prywatność, oświetlenie, nawadnianie. Tylko te, które pracownia projektuje.
- **Krok 3:** zakres dokumentacji.
- **Wynik:** widełki z `pricing.ts` w granicach z `00-DANE.md`, rekomendowany pakiet, wybrane strefy, przycisk „Wyślij zakres i umów rozmowę”.
- **AC:** wynik jest opisany jako widełki, nie oferta; wybór przechodzi do formularza.

### M18 Sprawdzarka Mikroretencji (P0 w sezonie)
- **Pytania:** czy to dom jednorodzinny, czy zbiorniki mają ≥ 2 m³, czy powierzchnia, z której zbierasz wodę, ma ≥ 50 m², czy koszty to ≥ 2 000 zł.
- **Informacje stałe:** wniosek składa się po zakończeniu prac, koszty kwalifikowane od 1.07.2024 do 31.12.2027, dofinansowanie do 8 000 zł.
- **Wynik:** „Wygląda na to, że spełniasz podstawowe warunki” albo „Sprawdź warunek: …”, linki do WFOŚiGW w Gdańsku i w Toruniu, CTA „Zaprojektuj ogród deszczowy”.
- **Treść w CMS** z datą weryfikacji warunków widoczną na stronie.
- **AC:** strona nigdy nie obiecuje dotacji i zawsze linkuje do źródła.

### M19 Kalendarz pielęgnacji (P1)
- **Publiczny:** 12 miesięcy ogólnych prac, treść z CMS.
- **W portalu:** prace dla roślin z projektu klienta.
- **Przypomnienia:** e-mail raz w miesiącu, wyłącznie po zgodzie; wypisanie jednym kliknięciem.
- **Prośba o opinię i polecenie:** najwyżej 2 razy w roku.

### M20 Newsletter (P1)
- Podwójne potwierdzenie zapisu; dowód zgody w `consent_log`.
- Jeden e-mail w miesiącu: co teraz w ogrodzie, 1 realizacja, 1 roślina. Link wypisania w każdym e-mailu.
- Wysyłka przez Resend Broadcasts lub odpowiednik; źródłem prawdy o subskrybentach jest tabela `subscribers`.

### M21 Płatna konsultacja i zaliczki (P1, jeśli w ofercie)
- Stripe Checkout z BLIK-iem, Przelewy24 i kartą. Cena z CMS. {{OPCJA: Kwota zaliczana na poczet projektu.}}
- Po płatności: wybór terminu i e-mail z potwierdzeniem.
- **Webhook:** weryfikacja podpisu, idempotencja po `event.id`, zapis w tabeli `payments`.
- Faktury wystawia obecny system księgowy zgodny z KSeF; strona tylko zapisuje płatność.

### M22 Bony podarunkowe (P2)
- Zakup przez Stripe Checkout; po płatności PDF z kodem (w bazie tylko skrót kodu), ważność {{12}} miesięcy.
- Kod realizowany w formularzu zgłoszenia i w panelu.

### M23 Strefa partnera (P1)
- Logowanie linkiem, tak jak w portalu klienta.
- Partner widzi swoje polecenia, ich statusy i nagrody.
- Formularz „Poleć klienta” z obowiązkowym potwierdzeniem, że klient zgodził się na kontakt.
- Materiały do pobrania: portfolio PDF i ulotka z kodem QR prowadzącym do adresu z parametrem `ref`.

### M24 Wideo-opinie (P1)
- Dostępne w portalu po odbiorze projektu: nagranie do 60 s albo przesłany plik.
- Zgoda na publikację z wersją treści zgody; moderacja w panelu; publikacja na stronie, a za osobną zgodą także w mediach społecznościowych.
- Przechowywanie w R2; transkodowanie przez Cloudflare Stream (P2). Odtwarzacz ładuje się dopiero po kliknięciu.

### M25 Wyszukiwarka (P0)
- Indeks Pagefind budowany razem ze stroną: realizacje, usługi, artykuły, rośliny.
- Skrypt ładowany dopiero po otwarciu wyszukiwarki.

### M26 Asystent AI (P2)
- Odpowiada wyłącznie z treści strony (usługi, ceny „od”, FAQ, proces, atlas) przez wyszukiwanie wektorowe (Cloudflare Vectorize z Workers AI albo API modelu). Każda odpowiedź zawiera linki do źródeł.
- Jeśli treści nie zawierają odpowiedzi, asystent kieruje do formularza.
- Nie podaje cen spoza CMS, nie obiecuje terminów, nie doradza poza treściami strony.
- Użytkownik wie, że rozmawia z AI (obowiązek przejrzystości z AI Act od 2.08.2026).
- Pytania przechowywane 90 dni, po usunięciu e-maili i numerów telefonów, bez IP.

## 4. Bezpieczeństwo v2

- Maksymalnie 5 linków logowania na godzinę na adres e-mail i na IP. Komunikat po wysłaniu jest zawsze taki sam, więc nie zdradza, czy konto istnieje.
- Każde żądanie POST: kontrola nagłówka `Origin` i ciasteczka z `SameSite`.
- Uprawnienia sprawdzane w Workerze przy każdym żądaniu (konto → projekt).
- Pliki projektu przechowywane przez {{okres}} po zakończeniu umowy, potem usuwane przez cron.
- Strony publiczne trzymają się budżetów z `01-SPEC.md` §12. Portal i strefa partnera mają limit JS ≤ 150 KB gzip.

## 5. Teksty interfejsu

| Miejsce | Tekst |
|---|---|
| Logowanie | „Zaloguj się do portalu” / „Wpisz e-mail, a wyślemy link do logowania. Link działa 15 minut.” / przycisk „Wyślij link” |
| Po wysłaniu | „Jeśli ten adres jest w naszym systemie, wysłaliśmy link. Sprawdź też folder spam.” |
| Link wygasł | „Link wygasł albo został już użyty. Wyślij nowy.” |
| Pliki, pusty stan | „Nie ma jeszcze plików. Pierwsza wersja koncepcji pojawi się tutaj {{termin}}.” |
| Uwagi | „Kliknij miejsce na wizualizacji i dodaj uwagę.” / przycisk „Dodaj uwagę” |
| Akceptacja | Okno: „Zaakceptować koncepcję w wersji {{n}}? Po akceptacji zaczynamy projekt szczegółowy.” / „Akceptuję koncepcję” / „Wracam do uwag” |
| Rundy | „Wykorzystane rundy poprawek: {{x}} z {{limit}}” |
| Mój ogród | „Zapisuj realizacje i rośliny, które Ci się podobają, i wyślij je z zapytaniem.” / „Zapisz” / „Zapisano” / „Wyczyść listę” |
| Newsletter | „Sprawdź skrzynkę i potwierdź zapis.” / „Zapis potwierdzony. Pierwszy e-mail wyślemy na początku miesiąca.” |
| Asystent | „Asystent AI Forma Zieleni. Odpowiadam na podstawie treści tej strony.” / „Nie mam tej informacji. Zapytaj projektantkę:” + przycisk „Zadaj pytanie” |
| Mikroretencja | „Warunki programu sprawdzone: {{data}}. Źródło: WFOŚiGW.” |

## 6. Kolejność wdrożenia

| Faza | Moduły |
|---|---|
| F12 | M25 wyszukiwarka, M14 atlas, M15 mój ogród, M18 Mikroretencja |
| F13 | M17 kreator, M19 kalendarz, M20 newsletter |
| F14 | M13 portal klienta, M24 wideo-opinie |
| F15 | M21 płatności, M22 bony, M23 strefa partnera |
| F16 | M16 mapa realizacji, M26 asystent AI |
