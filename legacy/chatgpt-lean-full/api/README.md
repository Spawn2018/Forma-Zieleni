# Forma Zieleni — API (Cloudflare Worker + D1)

Produkcyjny kształt REST zgodny z kontraktem `mobile-app/src/api/*`.

## Lokalnie

```bash
cd /workspace/formazieleni/api
npm install --legacy-peer-deps
npm run db:reset:local
npm run dev
# → http://127.0.0.1:8787
```

Health: `GET /health`

## Auth (magic link)

```bash
curl -s -X POST http://127.0.0.1:8787/auth/magic-link \
  -H 'content-type: application/json' \
  -d '{"email":"anna.kowalska@email.pl"}'
# EMAIL_MODE=log → token w odpowiedzi + console

curl -s -X POST http://127.0.0.1:8787/auth/verify \
  -H 'content-type: application/json' \
  -d '{"token":"<token>"}'
```

Header: `Authorization: Bearer <session.token>`  
Demo ACL override: `X-Demo-Role: admin|client|partner`

## Demo users (seed)

| Rola | E-mail | ID |
|------|--------|-----|
| admin | agnieszka@formazieleni.pl | u-admin |
| client | anna.kowalska@email.pl | u-client |
| partner | partner@dampspol.pl | u-partner |

## Env / sekrety (opcjonalne)

| Var | Opis |
|-----|------|
| `EMAIL_MODE` | `log` (domyślnie) / `resend` |
| `RESEND_API_KEY` | gdy EMAIL_MODE=resend |
| `NOTIFY_FROM` | nadawca Resend |
| `APP_ORIGIN` | bazowy URL WWW (linki w mailu) |
| `EXPO_SCHEME` | `formazieleni` |
| `STRIPE_WEBHOOK_SECRET` | stub `/webhooks/stripe` |
| `FAKTUROWNIA_DOMAIN` / `FAKTUROWNIA_TOKEN` | stub Fakturowni |

Bez sekretów API działa w trybie log/stub.

## Endpointy (skrót)

- Auth: `/auth/magic-link`, `/auth/verify`, `/auth/logout`, `/auth/me`
- Leads, projects (+ stages/pins/handover), invoices (+ pay)
- Care: tasks, soil, weather/refresh
- Referrals, notifications, push/devices, push/dispatch
- Consents (+ delete-account soft)
- Articles: `/articles`, `/articles/:slug`
- Visits: `/visit-slots`, `/visits` (GET/POST)
- Files stub: `/projects/:id/files` (+ upload URL, content PUT, download URL) — bez R2
- Webhooks: `/webhooks/invoice-paid`, `/webhooks/stripe`, `/webhooks/fakturownia`

## Deploy

Konfiguracja `env.production` zawiera wyłącznie placeholdery. Najpierw utwórz
produkcyjną bazę D1 i wstaw jej ID do `wrangler.toml`; sekrety dodaj przez
Wrangler, nigdy do repozytorium:

```bash
npx wrangler login
# ustaw prawdziwe database_id w wrangler.toml
npx wrangler d1 migrations apply formazieleni-production --remote --env production
npx wrangler d1 execute formazieleni-production --remote --env production --file=./seed.sql
CLOUDFLARE_API_TOKEN=... ./scripts/deploy.sh
```

`api/scripts/deploy.sh` zatrzymuje się z jasnym komunikatem, jeśli token nie
jest ustawiony. Przed realnym deployem ustaw też `RESEND_API_KEY` i pozostałe
sekrety wymagane przez integracje.
