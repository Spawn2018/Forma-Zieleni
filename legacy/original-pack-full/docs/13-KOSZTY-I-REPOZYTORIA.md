# v5: wariant darmowy i przydatne repozytoria

Cel: całe rozwiązanie w okolicach 0 zł miesięcznie, poza domeną, Fakturownią i budżetem reklam (300 zł). Źródła: `docs/_research-koszty-2026-09-17.md`. **[wiedza]** = do potwierdzenia w cenniku dostawcy.

## 1. Co kosztuje, a co nie

| Element | Wybór darmowy | Limit darmowego planu | Kiedy zaczyna kosztować |
|---|---|---|---|
| Hosting i CDN | Cloudflare Workers, plan Free | 100 000 żądań dziennie [E37] | Powyżej limitu: plan Workers Paid, od ok. 5 USD/mies. [wiedza] |
| Baza | Cloudflare D1, plan Free | limity odczytów i zapisu [wiedza] | Przy dużym ruchu w portalu |
| Pliki klientów | Cloudflare R2 | 10 GB, 1 mln operacji A i 10 mln B miesięcznie, bez opłat za ruch [E37] | Powyżej 10 GB: ok. 0,015 USD za GB [wiedza] |
| Antyspam | Turnstile | plan darmowy [wiedza] | praktycznie nigdy |
| Analityka | Cloudflare Web Analytics | bez opłat [wiedza] | nie dotyczy |
| CMS | Sanity, plan Free | limity użytkowników i transferu [wiedza] | Alternatywa bez kosztu: Keystatic lub Decap (treść w repozytorium) |
| Wyszukiwarka | Pagefind | statyczna, bez serwera | nie dotyczy |
| Baner zgód | vanilla-cookieconsent | open source | nie dotyczy |
| Poczta transakcyjna | Resend, plan darmowy [wiedza: ok. 3 000 wiadomości miesięcznie, 100 dziennie] | limit miesięczny | Newsletter powyżej limitu: tańsza jest zmiana dostawcy niż pakiet |
| Powiadomienia o leadzie | **Telegram albo ntfy zamiast SMS** | bez opłat | SMS przez SMSAPI: koszt za każdą wiadomość [wiedza] |
| Kalendarz rozmów | Cal.com, plan darmowy [wiedza] | 1 użytkownik | Płatne dopiero przy zespole |
| Płatności | na start przelew i faktura | 0 zł | Stripe: prowizja od transakcji [wiedza], bez abonamentu |
| Faktury | Fakturownia (już opłacana) | integracja z KSeF bezpłatna w każdym abonamencie [E38] | brak dodatkowego kosztu |
| Repozytorium i CI | GitHub, plan darmowy | minuty Actions [wiedza] | Przy bardzo częstych buildach |
| Monitoring dostępności | alerty Cloudflare albo Uptime Kuma | bez opłat | nie dotyczy |
| AI podgląd stylu (M27) | brak wersji darmowej | — | Koszt za obraz; moduł ma limit `{{BUDZET_AI}}` i można go nie włączać |

**Suma stała: 0 zł miesięcznie** poza domeną, Fakturownią i reklamami. Jedyne moduły, które generują koszt, to AI podgląd stylu, SMS i płatności online, a każdy z nich jest opcjonalny.

## 2. Trzy decyzje, które najbardziej obniżają koszt

1. **SMS zamieniamy na powiadomienie w telefonie.** Bot Telegrama albo ntfy daje natychmiastowy alert o leadzie za darmo. Szybkość reakcji zostaje ta sama [E9], koszt znika. SMS zostawiamy tylko do klienta, gdy sam wybierze taki kontakt.
2. **Płatności online włączamy dopiero, gdy będą potrzebne.** Na start: faktura lub proforma z Fakturowni i przelew. Stripe dokładamy przy płatnych konsultacjach i bonach.
3. **Wersja treści bez zewnętrznego CMS.** Jeśli limity Sanity kiedykolwiek zaczną kosztować, przechodzimy na Keystatic (treść i zdjęcia w repozytorium, edycja przez przeglądarkę). Struktura pól jest już opisana w `sanity/schema.ts`.

## 3. Fakturownia zamiast ręcznych zadań [E38]

Zmiana wobec `12-ZGODNOSC-I-AGENCI.md` §3: strona nadal nie wystawia faktur, ale tworzy je w Fakturowni przez API, a wystawienie i wysyłkę do KSeF obsługuje Fakturownia.

- **Token:** „Ustawienia → Ustawienia konta → Integracja → Kod autoryzacyjny API”, trzymany jako sekret `FAKTUROWNIA_TOKEN`; domena konta w `FAKTUROWNIA_DOMAIN`.
- **Po opłaconej płatności** (konsultacja, zaliczka, bon) Worker wywołuje `POST /invoices.json`:
  - `oid` = identyfikator płatności, dzięki czemu nigdy nie powstanie duplikat (przed utworzeniem sprawdzamy `GET /invoices.json?oid=...`),
  - `kind` = `proforma` przy zaliczce przed umową, `vat` po wykonaniu usługi,
  - dane nabywcy: przy B2C imię i e-mail, przy B2B nazwa i NIP,
  - pozycje z nazwą pakietu i kwotą brutto.
- **Wysyłka do klienta:** `POST /invoices/{id}/send_by_email.json`, PDF pod `GET /invoices/{id}.pdf`.
- **KSeF:** faktury B2B wysyła Fakturownia, bezpłatnie w każdym abonamencie. Faktury B2C zostają poza KSeF.
- **W bazie** (`db/0007_fakturownia.sql`) zapisujemy `fakturownia_invoice_id`, `fakturownia_number`, `sent_to_ksef_at`, żeby panel pokazywał, co jest wystawione.
- **Kontrola:** widok `v_unissued_invoices` ma być pusty; automatyzacja A29 raz dziennie sprawdza płatności bez faktury.
- **Gotowy kod:** `src/lib/fakturownia.ts` (sprawdzenie po `oid`, tworzenie, wysyłka, PDF) i `src/lib/notify.ts` (Telegram, ntfy, e-mail awaryjnie). Oba przechodzą `tsc --strict`.
- **Gotowy kod:** `src/lib/fakturownia.ts` (szukanie po `oid`, tworzenie, wysyłka, PDF) i `src/lib/notify.ts` (Telegram, ntfy, e-mail awaryjnie). Oba przechodzą `tsc --strict`.
- **Bezpieczeństwo:** token tylko po stronie Workera, nigdy w przeglądarce; brak zapisu pełnych danych faktury w D1 (wystarczy numer i identyfikator).

## 4. Repozytoria GitHub, które warto wykorzystać

Licencje sprawdź w repozytorium przed użyciem komercyjnym; poniższe opisy są orientacyjne [wiedza].

**Podstawa projektu**
| Repozytorium | Do czego |
|---|---|
| `withastro/astro` | framework strony; katalog `examples/` to gotowe szkielety |
| `cloudflare/workers-sdk` | Wrangler: lokalne uruchamianie, migracje D1, sekrety |
| `cloudflare/templates` | gotowe szablony Workers, D1 i R2 |
| `honojs/hono` | lekki router do tras API na Workers |
| `colinhacks/zod` | walidacja danych z formularzy i webhooków |

**Treść, wyszukiwanie, zgody**
| Repozytorium | Do czego |
|---|---|
| `sanity-io/sanity` | CMS wybrany w specyfikacji |
| `Thinkmill/keystatic` | zamiennik CMS bez kosztów zewnętrznych (treść w repo) |
| `decaporg/decap-cms` | drugi zamiennik, sprawdzony w małych projektach |
| `CloudCannon/pagefind` | wyszukiwarka statyczna (moduł M25) |
| `orestbida/cookieconsent` | baner zgód do Consent Mode v2 (faza F11) |

**Leady, automatyzacje, komunikacja**
| Repozytorium | Do czego |
|---|---|
| `binwiederhier/ntfy` | darmowe powiadomienia push zamiast SMS (§2) |
| `calcom/cal.com` | rezerwacja rozmów; można używać wersji hostowanej |
| `knadh/listmonk` | newsletter na własnym serwerze, gdy limity dostawcy zaczną kosztować |
| `formbricks/formbricks` | ankiety satysfakcji (moduł M35), jeśli nie chcemy pisać własnych |
| `n8n-io/n8n` | automatyzacje bez kodu; licencja fair-code, sprawdź warunki komercyjne |
| `chatwoot/chatwoot` | jedna skrzynka na wiadomości z Facebooka i strony |
| `resend/resend-node`, `stripe/stripe-node` | oficjalne biblioteki, gdy dojdą płatności |
| `fakturownia/API` | dokumentacja API Fakturowni z przykładami (§3) |

**Jakość, pomiar, agenci**
| Repozytorium | Do czego |
|---|---|
| `GoogleChrome/lighthouse-ci` | budżety wydajności w CI (§12 specyfikacji) |
| `dequelabs/axe-core`, `pa11y/pa11y-ci` | testy dostępności, sześć najczęstszych błędów [E23] |
| `umami-software/umami`, `plausible/analytics` | analityka bez ciasteczek, gdyby Cloudflare przestał wystarczać |
| `louislam/uptime-kuma` | monitoring dostępności strony i webhooków |
| `modelcontextprotocol/typescript-sdk`, `modelcontextprotocol/servers` | serwer MCP dla agentów AI (poziom 3 w `12-ZGODNOSC-I-AGENCI.md`) |
| `lovell/sharp` | przygotowanie zdjęć realizacji przed wgraniem |

Druga lista, przypisana do konkretnych modułów: `14-REPOZYTORIA-PLUS.md`.

**Zasada:** żadnego repozytorium nie kopiujemy do projektu bez sprawdzenia licencji, ostatniego commita i liczby otwartych zgłoszeń bezpieczeństwa. Wszystko, co można zrobić bez dodatkowej biblioteki, robimy bez niej (reguła 3 w `.cursor/rules/formazieleni.mdc`).

## 5. Próg, po którym warto zapłacić

| Sygnał | Decyzja |
|---|---|
| Ponad 100 000 żądań dziennie do Workers | Workers Paid |
| Ponad 10 GB w R2 (zdjęcia z portalu) | Osobny bucket na archiwum i czyszczenie po umowie |
| Newsletter powyżej darmowego limitu dostawcy | Zmiana dostawcy albo Listmonk na własnym serwerze |
| Reklamy dają umowy | Zwiększenie budżetu ponad 300 zł, według `06-REKLAMY-DIY.md` §1 |
| Klienci chcą płacić online | Stripe (prowizja od transakcji, bez abonamentu) |
