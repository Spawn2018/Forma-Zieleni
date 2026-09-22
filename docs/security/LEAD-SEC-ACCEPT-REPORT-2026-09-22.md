# Lead security acceptance checklist — 2026-09-22

Status: **REPORT ONLY**. Lead is **not** security-accepted.

This closes `LEAD-SEC-ACCEPT` as a checklist report after
`LEAD-ZAP-BASELINE`. It does not authorize production, Cloudflare, DNS,
or live customer scans.

## Required evidence

| Item | State | Note |
|---|---|---|
| Staff session logout invalidation | RECORDED | `LEAD-SEC-SESSION` / postgres logout HTTP test |
| Local supervised outbox loop | RECORDED | `LEAD-OUTBOX-SUPERVISOR` / `dispatch-supervisor.ts` |
| OWASP ZAP baseline/passive on loopback | DEFERRED | `docs/security/ZAP-LEAD-BASELINE-DEFERRED-2026-09-22.json` (`ARMED_WAITING_FOR_TARGET`; no Java/ZAP) |
| OWASP Dependency-Check SCA | DEFERRED | `pnpm audit` covers npm today; Java/NVD install not justified solely to invent PASS |
| Off-site backup / restic-pgBackRest | UNMET | Local dump/restore exists; off-site not done |
| Supervised production worker | UNMET | Local supervisor only; no production worker |
| Private-origin / Cloudflare Tunnel validation | UNMET | DANGEROUS / Owner approval required |

## Explicit non-claims

- Lead security acceptance: **OPEN**
- CMS-ACCEPT / SEARCH-ACCEPT: unchanged, report-only elsewhere
- FZ-SIGN-1 provider: UNDECIDED
- No CT8, production, or live customer host was scanned

## Next

Owner may install Java + ZAP and provide a loopback synthetic target to
re-run `LEAD-ZAP-BASELINE` as a real scan. Until deferred and unmet rows
above are closed, do not mark Lead security-accepted.
