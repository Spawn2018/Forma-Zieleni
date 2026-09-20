# v4: zgodność 2026 i gotowość na agentów AI

<!-- FRESET-V2-SYNC-2026-09-20 -->
> **F-RESET v2 — 2026-09-20 · Status: ACTIVE INPUT / DEFERRED PRODUCT SPEC.** Wymagania zachowane, ale implementacja podlega kolejności a→b→c→d i decyzjom kanonicznym. Źródła nadrzędne: `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md`, `30-F-RESET-EXECUTION-2026-09-20.md`, `31-IMPLEMENTATION-STATUS-MATRIX.md` oraz `contracts/openapi.yaml` dla API. Starsze F0–F33 i wskazania konkretnego hostingu są INPUT/LEGACY, nie kolejnością ani wyborem infrastruktury.

<!-- FRESET-SYNC-2026-09-20 -->
> **AKTUALIZACJA F-RESET — 2026-09-20:** MCP rozdzielamy na READ/ACTIONS; least privilege, audit, approval; produkcyjne sekrety/dane poza background agents.  
> W razie konfliktu obowiązują `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md` i `contracts/openapi.yaml`.


Stan na wrzesień 2026. Dowody E32–E36 dopisane do `01-SPEC.md` §4. Źródła: `docs/_research-v4-2026-09-17.md`. **[wiedza]** = fakt z wiedzy modelu, niesprawdzony w tym czacie. To wytyczne techniczne, nie porada prawna.

## 1. AI Act: obowiązki, które już działają [E32]

Od 2 sierpnia 2026 stosuje się art. 50. Od 24 lipca 2026 Digital Omnibus przesunął tylko część dotyczącą systemów wysokiego ryzyka (załącznik III) na 2 grudnia 2027. Nasze moduły nie są wysokiego ryzyka, więc przesunięcie nic tu nie zmienia. Kary za naruszenie przejrzystości sięgają 15 mln EUR lub 3% obrotu.

| Moduł | Obowiązek | Wykonanie |
|---|---|---|
| M26 asystent AI | Użytkownik ma wiedzieć, że rozmawia z AI, najpóźniej przy pierwszym kontakcie, w formie dostępnej | Stała etykieta „Asystent AI” w nagłówku okna, pierwsza wiadomość z informacją, opis w `/dostepnosc/` i w polityce prywatności |
| M27 AI podgląd stylu | Treść wygenerowana przez AI ma być rozpoznawalna, także maszynowo | Widoczny napis na obrazie **oraz** metadane C2PA lub inne znaczniki od dostawcy modelu [wiedza: sprawdź, co udostępnia wybrany dostawca]; plik wynikowy z polem `IPTC DigitalSourceType = trainedAlgorithmicMedia` [wiedza] |
| Teksty pisane z pomocą AI | Obowiązek nie dotyczy treści sprawdzonych przez człowieka, za które ktoś bierze odpowiedzialność redakcyjną | Każdy artykuł ma autora i datę sprawdzenia; brak automatycznej publikacji |
| Realistyczne wizualizacje miejsc | Jeśli mogłyby uchodzić za zdjęcia, to deepfake i wymaga jawnego oznaczenia | Wizualizacje AI zawsze podpisane; nigdy w galerii „Realizacje” |

Rejestr systemów AI (kto dostawca, do czego, jak oznaczone, data przeglądu) trzymamy w `docs/REJESTR-AI.md`, aktualizacja co pół roku.

## 2. Dostępność: prawo a nasz standard [E33]

Polski Akt o Dostępności obowiązuje od 28 czerwca 2025 i obejmuje sprzedaż usług przez stronę, ale **usługi mikroprzedsiębiorców są wyłączone** (poniżej 10 osób i obrót lub suma bilansowa do 2 mln EUR).

- Dopóki firma jest mikroprzedsiębiorstwem, obowiązek ustawowy nie powstaje. Utrzymujemy WCAG 2.2 AA jako własny standard, bo to przewaga [E23] i warunek jakości.
- Jeśli firma przekroczy próg mikroprzedsiębiorstwa albo sprzedaż online stanie się istotną częścią działalności, wymagania stają się obowiązkiem. Wtedy potrzebne są też informacje o dostępności w opisie usługi.
- Warunek do śledzenia w `00-DANE.md`: liczba osób i obrót.

## 3. Faktury i KSeF [E34]

- Od 1 lutego 2026 każdy czynny podatnik VAT musi **odbierać** faktury z KSeF. Wystawianie: od 1 lutego 2026 dla firm ze sprzedażą powyżej 200 mln zł w 2024 r., od 1 kwietnia 2026 dla pozostałych. Najmniejsi (faktura do 450 zł brutto i sprzedaż do 10 tys. zł brutto miesięcznie) mają czas do 1 stycznia 2027. Kary dopiero od 1 stycznia 2027.
- **Faktury dla konsumentów zostają poza KSeF.** Konsultacje, zaliczki i bony dla osób prywatnych rozliczasz jak dotychczas.
- **Strona nie wystawia faktur samodzielnie.** Tworzy je w Fakturowni przez API (`13-KOSZTY-I-REPOZYTORIA.md` §3), a wysyłkę do KSeF robi Fakturownia (bezpłatnie w każdym abonamencie).
- **Wersja ręczna (jeśli API wyłączone).** Po opłaceniu (M21, M22) automatyzacja tworzy zadanie „wystaw fakturę” z danymi płatności i typem odbiorcy (B2C albo B2B). Tabela `invoice_tasks` pilnuje, żeby żadna płatność nie została bez faktury.
- Dla klientów firmowych (deweloperzy, wspólnoty, gminy) faktura musi trafić do KSeF, więc formularz B2B zbiera NIP.

## 4. Poczta: dostarczalność jako warunek automatyzacji [E35]

Nasze automatyzacje (potwierdzenia, sekwencje, newsletter, przypomnienia) działają tylko wtedy, gdy poczta dociera.

Wymagania do wdrożenia przed pierwszą wysyłką:
1. SPF, DKIM i DMARC dla `formazieleni.pl`; DMARC minimum `p=none`, docelowo `p=quarantine`.
2. Zgodność (alignment) adresu nadawcy z SPF lub DKIM.
3. Jedno kliknięcie wypisania zgodne z RFC 8058 (nagłówek `List-Unsubscribe` i `List-Unsubscribe-Post`), obsłużone w 2 dni; u nas natychmiast.
4. Odsetek zgłoszeń spamu poniżej 0,1%, twarda granica 0,3%.
5. Google Postmaster Tools v2 z panelem zgodności; przegląd co miesiąc.
6. Rozdzielenie strumieni: subdomena transakcyjna (potwierdzenia, portal) i marketingowa (newsletter), żeby newsletter nie psuł reputacji potwierdzeń [wiedza].
7. Twarde odbicia i skargi trafiają do tabeli `email_events`; adres z twardym odbiciem albo skargą jest natychmiast wyłączany z wysyłek.

## 5. Gotowość na agentów AI [E36]

Kontekst: protokoły MCP, WebMCP, UCP (Google i Shopify, styczeń 2026), ACP (OpenAI i Stripe). Shopify od marca 2026 domyślnie otworzył część sklepów dla agentów. Ruch z AI rośnie i konwertuje dobrze, ale zakupy realizowane w samym czacie konwertowały u Walmartu na poziomie około jednej trzeciej zakupów na stronie. Wniosek dla pracowni: **udostępniamy dane maszynowo, ale nie przenosimy sprzedaży do czatu.**

Trzy poziomy, po kolei i tanio:

| Poziom | Co robimy | Koszt | Priorytet |
|---|---|---|---|
| 1. Czytelność | Treść w HTML bez JS, schema.org, `llms.txt`, odpowiedź w pierwszym akapicie, spójne dane w katalogach | zrobione w v1–v3 | P0 |
| 2. Dane w formacie maszynowym | `/api/public/oferta.json` (usługi, ceny „od”, obszar, terminy, godziny kontaktu), `/api/public/faq.json`, `/api/public/realizacje.json` (bez danych osobowych, z licencją i limitem zapytań), link do nich z `llms.txt` | 1 dzień pracy | P1 |
| 3. Narzędzia dla agentów | Serwer MCP (`/mcp`) z trzema narzędziami: `sprawdz_oferte`, `sprawdz_dostepnosc_konsultacji`, `zloz_zapytanie` (tworzy lead ze `source='assistant'`, wymaga zgody i potwierdzenia e-mail) | 2–3 dni | P2 |

Zasady bezpieczeństwa dla poziomu 3:
- agent nie może niczego kupić ani zarezerwować bez potwierdzenia przez człowieka (link potwierdzający wysyłany na podany adres),
- limit zapytań i logowanie w `agent_hits` bez danych osobowych,
- dane osobowe wyłącznie przez `zloz_zapytanie`, z tą samą informacją RODO co formularz,
- `robots.txt` dalej wpuszcza wyszukiwarki i asystentów do treści publicznych, ale `/api/public/*` ma własny limit,
- pomiar: udział leadów i sesji z odesłań AI w raporcie miesięcznym.

## 6. Nowe moduły i automatyzacje

| ID | Element | Opis | Priorytet |
|---|---|---|---|
| M37 | Rejestr systemów AI | `docs/REJESTR-AI.md`: dostawca, zastosowanie, sposób oznaczania, data przeglądu | P0 |
| M38 | Oznaczanie treści AI | Napis na obrazie plus metadane maszynowe; blokada publikacji obrazu AI bez oznaczenia | P1 |
| M39 | Panel dostarczalności | `email_events` i widok `v_email_health` w panelu: wysyłki, odbicia, skargi, wypisania | P1 |
| M40 | Publiczne dane maszynowe | trzy pliki JSON z §5 i wpis w `llms.txt` | P1 |
| M41 | Serwer MCP pracowni | trzy narzędzia z §5, z potwierdzeniem przez człowieka | P2 |
| M42 | Zadania fakturowe | `invoice_tasks`: każda opłacona płatność ma zadanie „wystaw fakturę”, z oznaczeniem B2C albo B2B (KSeF) | P1 |

| ID | Automatyzacja | Wyzwalacz i działanie |
|---|---|---|
| A24 | Kontrola dostarczalności | Raz w tygodniu: odsetek skarg i odbić z `v_email_health`; powyżej 0,1% alert, powyżej 0,3% wstrzymanie wysyłek marketingowych |
| A25 | Higiena listy | Twarde odbicie lub skarga → natychmiastowe wyłączenie adresu ze wszystkich wysyłek |
| A26 | Faktura po płatności | Płatność `paid` → zadanie „wystaw fakturę” z typem odbiorcy i terminem |
| A27 | Przegląd rejestru AI | Co pół roku zadanie „sprawdź rejestr systemów AI i oznaczenia” |
| A28 | Ruch od agentów | Miesięcznie: liczba wywołań `/api/public/*` i `/mcp` oraz leady ze `source='assistant'` w raporcie |

## 7. KPI v4

| KPI | Cel |
|---|---|
| Odsetek skarg na spam | poniżej 0,1% |
| Twarde odbicia | poniżej 1% wysyłek |
| Płatności bez faktury | 0 |
| Obrazy AI bez oznaczenia | 0 |
| Leady z odesłań AI i od agentów | pomiar od pierwszego miesiąca, potem cel względny |

## 8. Czego nie robić

- Nie udawać człowieka w asystencie [E32].
- Nie publikować obrazów AI bez oznaczenia i nie wstawiać ich do galerii realizacji.
- Nie przenosić sprzedaży do czatu agenta [E36].
- Nie wysyłać newslettera z tej samej subdomeny co potwierdzenia zgłoszeń.
- Nie zakładać, że ustawa o dostępności nigdy nie obejmie firmy: próg mikroprzedsiębiorstwa trzeba pilnować [E33].
- Nie wystawiać faktur ze strony.
