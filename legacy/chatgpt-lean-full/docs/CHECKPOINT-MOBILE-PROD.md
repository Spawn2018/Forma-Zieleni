# CHECKPOINT — Mobile produkcja (2026-09-19, Europe/Warsaw)

## Stan

**Status: local production-complete; awaiting external accounts.**

Parity Expo↔Vite w obszarach uproszczonych: **domknięte (bez kont zewnętrznych).**

## Dostarczone

1. **`api/`** — Worker + D1: auth, ACL, projects/pins/stages, invoices (+ pay / webhook), care/weather (+ complete), notifications, consents, webhooks stub, **pliki R2-stub**, **articles**, **visit-slots + POST /visits**, leads PATCH, referrals, handover
2. **`mobile-app/`** — Vite `VITE_API_MODE=auto|mock|live` (mock fallback bez zmian)
3. **`mobile-expo/`** — Expo Router:
   - Login + verify deep link `formazieleni://`
   - Taby client: Start, Projekt, Garden OS, Płatności, Powiad., Profil
   - **Projekt:** etapy z PL statusami + blokada „Oczekuje”, poprawki/pins (GET/POST/resolve) + prosty plan tap %, ukrycie planu/poprawek po `garden_os`/`handoverAt`, pliki + URL stub, handover → Garden OS
   - **Garden OS:** karty pogoda/gleba, zadania z **Wykonano** → `POST /care/tasks/:id/complete`, sekcja „Bieżący miesiąc”
   - **Płatności:** lista + **detail** `/payments/[id]` (przelew / Apple / G Pay / webhook stub)
   - Taby admin (leady + PATCH status) / partner (formularz POST /referrals)
   - Stack: Zapytanie/quiz, Umów wizytę, Artykuły lista+detail, Faktura detail
   - Thin API client + tokeny kolorów + `src/lib/labels.ts` (Lead/Stage/Invoice PL)
   - `eas.json` (development / preview / production)
   - `docs/STORE-LISTING.md`
4. **Tooling** — root `package.json` (`dev:api`, `smoke`, `sync:quiz`, `typecheck`), `scripts/smoke-local.sh`, `scripts/sync-quiz-expo.mjs` (Vite→Expo quiz; bez packages/shared)
5. **Docs** — `mobile-app/docs/PRODUKCJA.md`, `api/README.md`, ten checkpoint

## Jak uruchomić

```bash
# API
cd /workspace/formazieleni/api && npm run db:reset:local && npm run dev
# lub z roota:
cd /workspace/formazieleni && npm run db:reset && npm run dev:api

# Smoke (API musi działać)
npm run smoke

# Vite (mock bez .env; live z .env.local)
cd mobile-app && npm run dev

# Expo
cd mobile-expo && npm install && npx expo start
# Sync quiz z Vite:
npm run sync:quiz
```

Typecheck:

```bash
cd /workspace/formazieleni && npm run typecheck
```

## Deep links (Expo)

| Link | Ekran |
|------|--------|
| `formazieleni://auth/verify?token=…` | verify |
| `formazieleni://inquiry` | quiz / zapytanie |
| `formazieleni://visit` | sloty wizyty |
| `formazieleni://articles` | lista artykułów |
| `formazieleni://articles/<slug>` | detail |
| `formazieleni://payments/<id>` | detail faktury (stack) |

## Parity Expo↔Vite (ten checkpoint)

| Obszar | Vite | Expo |
|--------|------|------|
| Etapy + Oczekuje | StageTimeline | lista + badge PL + blokada |
| Pins/plan | PinPlan full | lista + tekst + prosty plan tap % |
| Ukrycie po handover | tak | tak |
| Garden: pogoda/gleba/zadania | karty + complete | karty + Wykonano API |
| Kalendarz opieki | CareCalendar | sekcja Bieżący miesiąc |
| Faktura pay | InvoiceDetail | `/payments/[id]` stub |

## Wymaga kont (nadal)

Cloudflare (Workers/D1/R2) · Resend · Stripe · Fakturownia · Apple/Google push · EAS / App Store / Play · DNS Universal Links
