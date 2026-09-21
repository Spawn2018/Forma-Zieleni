# Domain map — Forma Zieleni

Mapa planowanych modułów domenowych. **Moduły nie są jeszcze zaimplementowane.**

Źródło prawdy po wdrożeniu: Core API + baza. Reguły: `packages/domain` + egzekucja w API. AI tylko nad DATA → RULES → DOMAIN.

## Moduły planowane

### Identity / Auth

Tożsamość użytkowników, sesje/tokeny, role (personel vs klient), zaproszenia, odzyskiwanie dostępu.
Wszystkie decyzje authz egzekwowane serwerowo.

### CRM

Leady, kontakty, firmy, interakcje, pipeline relacji przed i po sprzedaży.
Wejście z `web` i kanałów marketingowych; obsługa w `admin`.

Current durable start: `packages/domain` lead rules, `contracts/openapi.json`, and the Hono lead vertical in `apps/api`. Admin UI is later. Production authentication is not complete.

### Sales

Proces sprzedaży, etapy deal’a, handlowe przejścia statusów, powiązanie leada z ofertą i projektem.
Revenue OS jako warstwa operacyjna sprzedaży w panelu admin.

### Capacity

Dostępność zespołu, obciążenie, kalendarz zdolności realizacyjnej.
Ogranicza promesy sprzedażowe i planowanie projektów.

### Projects

Projekty ogrodowe: zakres, statusy, kamienie milowe, przypisania, powiązania z klientem i plikami.
Widoczne odpowiednio w `admin` i `portal`.

### Offers

Oferty: zakres, wyłączenia, cena, ważność, akceptacja, powiązanie z umową.
Powiązane ze Sales, Projects i Payments.
Szczegół cyklu umowy i podpisu: [`../architecture/FZ-SIGN-1-CONTRACT-LIFECYCLE.md`](../architecture/FZ-SIGN-1-CONTRACT-LIFECYCLE.md).
Podpis elektroniczny nie jest tu uznany za prawnie obowiązkowy dla każdej transakcji.

### Contracts

Umowy, wersje, aneksy i change orders. Stan biznesowy, autoryzacja i metadane archiwum należą do Core API.
Silnik podpisu jest adapterem i pozostaje UNDECIDED (FZ-SIGN-1). Nie jest ACL projektu ani jedynym archiwum.

### Payments

Płatności, harmonogramy, statusy transakcji, powiązania z fakturowaniem (integracje).
Wymaga idempotencji, audytu i bezpiecznych webhooków.

### Files

Metadane plików projektowych, uprawnienia dostępu, wersjonowanie logiczne.
Binaria w storage: teraz lokalny prywatny adapter (gitignored); kierunek staging później Garage; produkcyjny magazyn obiektów nie jest trwale wybrany. Autoryzacja odczytu po stronie API (BOLA). Publiczny URL bucketu nie jest autoryzacją.

### Events

Zdarzenia domenowe, outbox, historia istotnych mutacji.
Podstawa automatyzacji i projekcji read-model.

### Automation

Reguły i przepływy automatyzacji (powiadomienia, follow-upy, synchronizacje).
Triggerowane eventami; bez omijania reguł domenowych.

### Site Intelligence

Analiza i wzbogacanie informacji o działce / lokalizacji inwestycji.
AI może asystować; wyniki kanoniczne dopiero po walidacji i regułach.

### Plant Knowledge

Plant Knowledge Graph — wiedza o roślinach, relacjach i ograniczeniach doboru.
Wykorzystywana przez projektowanie i Garden OS; nie zastępuje danych projektowych klienta.

### Garden OS

Warstwa operacyjno-projektowa ogrodu: modele, decyzje projektowe, powiązania z projektami i wiedzą roślinną.
Klienci UI / mobile / SketchUp korzystają przez to samo API.

### Content / public media

Public pages, services, articles, `ProjectCaseStudy`, media library and
editorial workflow. This is not CRM and not a private business Project.
Architecture is DECIDED (ADR-015, option B) and not yet accepted:
[`../architecture/OWNER-DECISION-PACKET-FZ-CMS-1.md`](../architecture/OWNER-DECISION-PACKET-FZ-CMS-1.md).
Search observations are a separate capability, not CMS rows:
[`../architecture/FZ-SEARCH-1.md`](../architecture/FZ-SEARCH-1.md).
A future public case study may store an opaque business-project
reference. Private customer/project files must not become public media
without an explicit, authorized, auditable step.

## Relacje (wysoki poziom)

```text
Identity/Auth
    └── autoryzuje wszystkie moduły

CRM ──► Sales ──► Offers ──► Contracts ──► Payments
              │         (podpis gdy wymagany — FZ-SIGN-1)
              └──► Projects ──► Files
                     │
                     ├── Site Intelligence
                     ├── Plant Knowledge
                     └── Garden OS

Content / public media  (FZ-CMS-1 DECIDED; not CRM; not CMS-ACCEPT)
Search Intelligence     (FZ-SEARCH-1; reads business IDs; does not write CRM)

Events ◄── (mutacje domenowe)
    └──► Automation
```

## Poza zakresem teraz

- implementacja modułów,
- schemat bazy,
- wybór ORM / kolejek,
- szczegółowe bounded context maps (powstaną przy pierwszym module).

## Powiązane dokumenty

- [../architecture/CURRENT-ARCHITECTURE.md](../architecture/CURRENT-ARCHITECTURE.md) — sole binding current architecture
- [../api/API-FIRST.md](../api/API-FIRST.md)
