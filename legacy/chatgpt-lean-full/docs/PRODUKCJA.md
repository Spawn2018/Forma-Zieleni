# Produkcja — mapa (Vite + API + Expo)

Status: **prototype done → production in progress** (2026-09-19).

## Mapa katalogów

| Ścieżka | Rola |
|---------|------|
| `mobile-app/` | Vite PWA / prototyp UI (Etapy 0–6 mock) |
| `api/` | Cloudflare Worker + D1 — REST produkcyjny |
| `mobile-expo/` | Expo Router: taby client/admin/partner, quiz, wizyty, artykuły, Garden OS, płatności, stub plików |
| `formazieleni-pack/` | Pack WWW (SQL źródłowe, fakturownia.ts, notify.ts) |

## Env

### Vite (`mobile-app`)

```bash
VITE_API_URL=http://127.0.0.1:8787
VITE_API_MODE=auto   # auto | mock | live
```

- **mock** — wyłącznie in-memory (`src/api/db.ts`), offline demo bez zmian.
- **auto** — live HTTP; przy down → fallback mock.
- **live** — tylko HTTP (błąd gdy API niedostępne).

### API (`api/wrangler.toml` + secrets)

Patrz `api/README.md`. Lokalnie `EMAIL_MODE=log`.

### Expo (`mobile-expo`)

```bash
EXPO_PUBLIC_API_URL=http://127.0.0.1:8787
```

Scheme: `formazieleni://auth/verify?token=…`  
Listing sklepów: `mobile-expo/docs/STORE-LISTING.md` · EAS: `mobile-expo/eas.json`

## Jak odpalić lokalnie (pełny stack)

```bash
# 1) API
cd /workspace/formazieleni/api && npm run db:reset:local && npm run dev

# 2) Vite
cd /workspace/formazieleni/mobile-app
echo 'VITE_API_URL=http://127.0.0.1:8787' > .env.local
echo 'VITE_API_MODE=auto' >> .env.local
npm run dev

# 3) Expo (opcjonalnie)
cd /workspace/formazieleni/mobile-expo && npm install && npx expo start
```

## Co działa lokalnie

- Auth magic-link (token w logu / odpowiedzi)
- ACL admin/client/partner na leads/projects/invoices/referrals
- CRUD/akcje: pins, stages, care, notifications, consents
- Webhook stubs Stripe/Fakturownia/invoice-paid
- Push: rejestracja device token + dispatch stub
- Articles + visit booking (API)
- Expo: quiz, wizyta, artykuły, admin leady, partner referrals
- Vite offline demo bez `.env` (mock)

## Co wymaga kont zewnętrznych

| Usługa | Potrzebne do |
|--------|----------------|
| Cloudflare (Workers + D1 + R2) | Deploy API, pliki |
| Resend (lub SMTP) | Prawdziwy e-mail magic-link |
| Stripe | Checkout / webhook płatności |
| Fakturownia | Faktury VAT / KSeF |
| Apple Developer + APNs | Push iOS, TestFlight, App Store |
| Google Play + FCM | Push Android, listing |
| Expo EAS | Buildy natywne (`eas build`) |
| Domeny / DNS | Universal Links / App Links |

## RODO

- Tabele `consents` + endpointy `/consents`, `/consents/delete-account`
- UI Vite: `/app/prywatnosc` (zgody lokalne + sync gdy live)
- Soft-delete konta (disabled_at + revoke sessions); pełne purge — TODO prawny/DPA

## Push

1. Klient rejestruje token: `POST /push/devices`
2. Dispatch stub: `POST /push/dispatch` (zapis do notifications + log)
3. Produkcja: FCM (Android) + APNs (iOS) — klucze w secrets Workera, worker wysyła przez HTTP API dostawcy


## Pliki (R2 stub)

Bez bucketa R2 API serwuje:

- `GET /projects/:id/files` — lista (D1 `files_json`)
- `POST /projects/:id/files` — metadane + **signed upload URL** (stub)
- `PUT .../files/:fileId/content` — zapis w pamięci Worker + meta local path
- `GET .../files/:fileId/url` — signed download URL (stub)

Produkcja: podłączyć R2 binding + prawdziwe presigned URL.

## Nowe endpointy (2026-09-19)

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/articles` | Lista artykułów (seed, bez auth) |
| GET | `/articles/:slug` | Detail (lead jako bodyMd skrót) |
| GET | `/visit-slots` | Wolne/zajęte sloty wizyty |
| GET | `/visits` | Rezerwacje (auth) |
| POST | `/visits` | Book `{ slotId }` (auth) |
| GET/POST | `/leads`, `PATCH /leads/:id` | CRM |
| GET/POST | `/referrals` | Partner |

## Tooling lokalne

```bash
# z /workspace/formazieleni
npm run dev:api      # wrangler local :8787
npm run smoke        # health + magic-link + me + projects (+ articles/slots)
npm run sync:quiz    # mobile-app quiz → mobile-expo
npm run typecheck
```

Skrypt: `scripts/smoke-local.sh` (wymaga działającego API).

