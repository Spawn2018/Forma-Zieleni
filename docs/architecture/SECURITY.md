# Security — Forma Zieleni

Wymagania bezpieczeństwa dla platformy. Obowiązują niezależnie od ostatecznego wyboru hostingu.

## Zasady nadrzędne

1. **Autoryzacja zawsze po stronie serwera** — UI, mobile i integracje nie są granicą zaufania.
2. Core API egzekwuje uprawnienia na każdej operacji mutującej i odczytującej dane chronione.
3. Sekrety, tokeny, hasła, klucze prywatne i dane klientów **nie trafiają do repozytorium**.
4. AI nie omija kontroli dostępu ani reguł domenowych.

## Zagrożenia API (OWASP API Top 10 — wybrane)

### AUTH

- silna autentyczność tożsamości (sesja / token) weryfikowana serwerowo,
- rozróżnienie personelu (`admin`) vs klienta (`portal`) vs public (`web`),
- bezpieczne przechowywanie poświadczeń, rotacja, unieważnianie sesji,
- brak zaufania do ról przesłanych wyłącznie z klienta.

### BOLA (Broken Object Level Authorization)

- każdy dostęp do obiektu (`projectId`, `offerId`, `contractId`, `fileId`, …) sprawdzany względem tożsamości i relacji własności/uprawnień,
- zakaz opierania bezpieczeństwa na „ukrytych” ID,
- testy negatywne: użytkownik A nie odczytuje/nie mutuje zasobów użytkownika B.

### BFLA (Broken Function Level Authorization)

- endpointy administracyjne niedostępne dla klientów portalu i anonimów,
- osobne polityki dla funkcji personelu vs klienta,
- deny-by-default dla nowych operacji.

### BOPLA (Broken Object Property Level Authorization)

- response filtering: klient nie dostaje pól, do których nie ma prawa,
- mass-assignment protection: klient nie ustawia pól uprzywilejowanych (`role`, `priceOverride`, `tenantId`, statusów wewnętrznych),
- osobne DTO wejścia/wyjścia per kontekst (web / portal / admin).

## CSRF / CORS / SSRF

### CSRF

- chronić operacje cookie-session (SameSite, anti-CSRF token lub równoważny model),
- nie polegać wyłącznie na „ukryciu” endpointu.

### CORS

- allowlist originów per środowisko,
- brak `Access-Control-Allow-Origin: *` dla credentials,
- osobne reguły dla `web`, `portal`, `admin`.

### SSRF

- serwer nie pobiera dowolnych URL podanych przez użytkownika bez allowlisty / walidacji,
- ostrożność przy webhookach wychodzących, importach URL, podglądach linków i integracjach,
- blokada adresów prywatnych/link-local w resolverach tam, gdzie dotyczy.

## Upload security

- walidacja typu, rozmiaru i zawartości po stronie serwera,
- przechowywanie poza publicznym rootem aplikacji,
- skanowanie / ograniczenia wykonania (brak serwowania uploadów jako aktywnego kodu),
- osobne uprawnienia do odczytu plików (BOLA na `fileId` i na `contractId`),
- preferowane podpisane, czasowo ograniczone URL-e dostępu (to jest kontrola dostępu do bajtów, nie podpis elektroniczny umowy),
- artefakty umów: [`FZ-SIGN-1-CONTRACT-LIFECYCLE.md`](./FZ-SIGN-1-CONTRACT-LIFECYCLE.md). Publiczny URL nie jest autoryzacją. Silnik podpisu nie jest jedynym archiwum.
- public CMS media is not a private business file. FZ-CMS-1 is
  DECIDED and not CMS-ACCEPT
  ([`OWNER-DECISION-PACKET-FZ-CMS-1.md`](./OWNER-DECISION-PACKET-FZ-CMS-1.md)).
  Search connector tokens, imported query strings, and referrers are
  untrusted
  ([`FZ-SEARCH-1.md`](./FZ-SEARCH-1.md)).
  Unpublished content must not leak. A CMS is not CRM authorization.
  Public derivatives must not carry GPS. Private project photos never
  become public without an explicit, authorized, auditable step.

## Webhooki: podpisy, idempotency, replay safety

Wejścia webhook (płatności, faktury, messaging, przyszły silnik podpisu, itd.):

- weryfikacja **podpisu** (HMAC / signature header providera),
- **idempotency keys** — ponowione dostarczenie nie tworzy podwójnego skutku biznesowego,
- **replay safety** — okno czasowe, nonce/timestamp, odrzucanie stale payloads,
- audyt przyjęcia i wyniku przetworzenia,
- szybka ścieżka ACK + asynchroniczne przetwarzanie tam, gdzie potrzeba.

## Izolacja tenantów

- dane zawsze scoped do właściwego kontekstu organizacyjnego / właściciela,
- brak zapytań bez filtra tenanta/własności w warstwie dostępu do danych,
- testy regresji izolacji przy każdej nowej relacji obiektowej.

> Na starcie Forma Zieleni może działać jako jeden tenant operacyjny, ale model dostępu projektujemy tak, by izolacja obiektowa i roli nie wymagała przepisywania systemu.

## Secrets management

- sekrety tylko w env / secret managerze środowiska — nigdy w git,
- `.env.example` wyłącznie z placeholderami,
- rotacja tokenów integracji,
- minimalne uprawnienia kluczy (least privilege).

## Audit logging

- rejestrować istotne zdarzenia bezpieczeństwa i domeny: logowania, zmiany uprawnień, dostęp do wrażliwych zasobów, mutacje finansowe, upload/download, decyzje automatyzacji,
- logi bez sekretów i bez zbędnych PII,
- korelacja `requestId` / `actorId` / `resourceId`.

## Backup i restore testing

- regularne backupy danych kanonicznych, w tym metadanych umowy w Core API i artefaktów w prywatnym storage,
- podpis u dostawcy nie zastępuje kopii off-site ani testu restore ([`FZ-SIGN-1-CONTRACT-LIFECYCLE.md`](./FZ-SIGN-1-CONTRACT-LIFECYCLE.md)),
- okresowe **testy przywracania** (nie tylko „backup istnieje”),
- procedury restore w runbookach — bez sekretów w repo.

## Ingress i origin

### Docelowo

- **Cloudflare jako jedyny publiczny ingress** produkcyjny,
- **origin prywatny** (niedostępny bezpośrednio z internetu).

### Stan obecny (ważne)

- obecna legacy produkcja / infrastruktura **CT8 nie jest jeszcze private origin**,
- ten fundament **nie zmienia** obecnej strony produkcyjnej Forma Zieleni ani infrastruktury CT8,
- przejście na private origin i pełny ruch przez Cloudflare to osobny, zaplanowany etap.

## Checklist dla nowych endpointów

- [ ] autentyczność wymagana (lub świadomie publiczne)
- [ ] autoryzacja obiektu (BOLA)
- [ ] autoryzacja funkcji (BFLA)
- [ ] filtrowanie pól (BOPLA)
- [ ] walidacja wejścia po stronie serwera
- [ ] audyt tam, gdzie mutacja jest wrażliwa
- [ ] idempotency dla operacji finansowych / webhooki
- [ ] brak sekretów w logach i odpowiedziach

## Powiązane dokumenty

- [CURRENT-ARCHITECTURE.md](./CURRENT-ARCHITECTURE.md) — sole binding current architecture
- [DECISIONS.md](./DECISIONS.md) — formal ADR history
- [../knowledge/POST-V2-DECISIONS.md](../knowledge/POST-V2-DECISIONS.md) — current override decision ledger
- [../runbooks/DEVELOPMENT.md](../runbooks/DEVELOPMENT.md)
