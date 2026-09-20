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

Oferty i umowy: wersje, akceptacje, warunki, ślad decyzji klienta.
Powiązane ze Sales, Projects i Payments.

### Payments

Płatności, harmonogramy, statusy transakcji, powiązania z fakturowaniem (integracje).
Wymaga idempotencji, audytu i bezpiecznych webhooków.

### Files

Metadane plików projektowych, uprawnienia dostępu, wersjonowanie logiczne.
Binaria w storage (provider TBD); autoryzacja odczytu po stronie API (BOLA).

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

## Relacje (wysoki poziom)

```text
Identity/Auth
    └── autoryzuje wszystkie moduły

CRM ──► Sales ──► Offers ──► Payments
              └──► Projects ──► Files
                     │
                     ├── Site Intelligence
                     ├── Plant Knowledge
                     └── Garden OS

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
