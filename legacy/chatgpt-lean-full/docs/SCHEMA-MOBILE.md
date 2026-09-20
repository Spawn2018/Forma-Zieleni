# Schema — Forma Zieleni Mobile (mock)

Stan: **Zustand + localStorage** (`fz-mobile-v7`) + in-memory **`src/api/db.ts`**.  
Warstwa API gotowa do podmiany na REST/D1.

## Encje

### Session (Etap 1)
`token`, `userId`, `email`, `role`, `expiresAt` (ISO, TTL ~7 dni).

### User / Account
`id`, `email`, `name`, `role` (`admin`|`client`|`partner`), opcjonalnie `phone`, `company`.  
**roleOverride** — tylko-demo.

### Lead / Project / Invoice / Care / Notifications / Referrals
Jak w Etapie 0; Invoice + `method`, `paidAt`, `transferIban`, `transferTitle`.  
PartnerReferral + `partnerId`.

### PushPrefs / ConsentPrefs / QueuedMutation
Etapy 3 i 6 — zgody, quiet hours, kolejka offline.

## ACL (API)

| Rola | Leady | Projekty | Referrals | Faktury |
|---|---|---|---|---|
| admin | wszystkie | wszystkie | wszystkie | wszystkie |
| client | własne (e-mail) | `clientId` | — | własne projekty |
| partner | z `partnerId` | — | własne | — |

## Persist

Klucz: `fz-mobile-v7`. Pending magic: `fz-pending-magic`. Kolejka: `fz-mutation-queue`.
