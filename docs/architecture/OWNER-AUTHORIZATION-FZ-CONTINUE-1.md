# Owner authorization — FZ-CONTINUE-1

Status: **AUTHORIZED** — 2026-09-24.

## Owner statement

Owner authorizes further AUTO/REVIEW product depth **without waiting**
for the still-open Owner decisions listed below. Those decisions will be
taken later. This authorization does **not** select any provider, does
**not** approve production mutation, and does **not** lower DANGEROUS
or OWNER-ONLY gates.

## Still open after ADR-016

Item 26 authorized work while the rows below were open. ADR-016
(2026-10-02) decided crawl policy, the payment provider name, and the
hosting direction. This authorization did not itself select them.

| Item | Gate | Effect after ADR-016 |
|---|---|---|
| FZ-SIGN-1 signing provider | OWNER-DECISION | Remains UNDECIDED. Safe work uses provider-neutral lifecycle only. |
| Payment provider | DECIDED | Przelewy24. No real transactions in that decision. |
| FZ-SEARCH-CRAWL-1 | DECIDED | OPTION A in generated production robots. Live zone unchanged. |
| Production hosting | DECIDED | One Hetzner CX23 at cutover. No purchase and no deploy in that decision. |
| Cloudflare / DNS / Tunnel | DANGEROUS | Unchanged. Explicit approval still required immediately before action. |
| Secrets, live credentials, real customer data, spend | OWNER-ONLY / DANGEROUS | Unchanged. |
| CMS-ACCEPT / SEARCH-ACCEPT / Lead security-accept | report / deferred | Stay report-only. Do not claim accepted. |

## What this unlocks

Authorized execution graph continues in
[`NEXT-SLICES-MAIN.md`](./NEXT-SLICES-MAIN.md) under the wave labeled
**FZ-CONTINUE-1**. `/noc` may select those AUTO/REVIEW slices.

## Response format recorded

`AUTHORIZE FZ-CONTINUE-1: DEFER-OWNER-GATES`

Binding ledger: [`../knowledge/POST-V2-DECISIONS.md`](../knowledge/POST-V2-DECISIONS.md) item 26.
