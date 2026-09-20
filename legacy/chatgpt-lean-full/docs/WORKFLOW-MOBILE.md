# Workflow — ścieżki prototypu mobilnego

> **Etap 0:** [Checklista](./ETAP-0-CHECKLISTA.md) · [Luki](./ETAP-0-LUKI.md) (ZAMKNIĘTY)  
> **Etapy 1–6:** checklisty/plany `ETAP-N-*.md` · Expo: [ETAP-5-EXPO.md](./ETAP-5-EXPO.md)

## Logowanie (magic link mock → Etap 1)

1. `/login` → e-mail lub konto demo → `requestMagicLink` (pending w `fz-pending-magic`).
2. „Otwórz link” → `/auth/verify?token=…` → sesja `{ token, userId, email, role, expiresAt }` (7 dni).
3. Konta:
   - `agnieszka@formazieleni.pl` → admin
   - `anna.kowalska@email.pl` → klient
   - `partner@dampspol.pl` → partner DAMPS
4. Persist: `fz-mobile-v7`. Wylogowanie czyści sesję + token.

Przełącznik ról: **Profil → Przełącz rolę (tylko-demo)** — nie do produkcji.

## Warstwa API

`src/api/` — `client` (delay, 401), `db` (in-memory), domena: auth, leads, projects, care, referrals, invoices, articles, notifications, sync, queue.  
ACL przy odczytach. Profil → **Odśwież z serwera**.

---

## Ścieżka klienta (E2E)

```
Lead → Wizyta → Etapy projektu → Płatności → Odbiór → Garden OS
```

Płatności: lista → szczegóły faktury (przelew / Apple / G Pay / webhook).  
Powiadomienia: filtry, quiet hours, deep link do zadań.  
Offline: banner + kolejka mutacji. RODO: `/app/prywatnosc`.

---

## Garden OS / Admin / Partner

Bez zmian ścieżek Etapu 0; mutacje pin/stage/care/referral przez API.

## OS hooks

`src/hooks/useOsHooks.ts` — adaptery `web` | `native` (Expo-ready).
