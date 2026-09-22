# OWASP ZAP — lab only

Do not install ZAP until a runnable local or lab target exists, unless the Owner asks.

Windows: use the official installer from [zaproxy.org/download](https://www.zaproxy.org/download/). Current Windows packages require a current Java 17+ runtime. Docker is optional and is not a project prerequisite.

## Readiness (machine-detectable)

```bash
node scripts/security/zap-readiness.mjs
```

Current default without a lab listen URL: `ARMED_WAITING_FOR_TARGET`.

Activation requires all of:

1. `tooling/security/zap/automation.yaml` and `contracts/openapi.json`
2. `FZ_ZAP_TARGET_URL` pointing at an isolated localhost/CI lab service
3. Target readiness probe success (`targetReachable`)
4. ZAP runtime (`ZAP_BIN` or authorized CI image)
5. Synthetic/non-sensitive data only
6. Not production, not Cloudflare production ingress, not CT8

`apps/api` currently needs PostgreSQL and secrets to listen, so it is not an automatic free-standing ZAP target. Do not invent an app solely for ZAP.

Scan order after a target exists:

1. Baseline/passive against localhost or designated lab
2. API scan from `contracts/openapi.json`
3. Authenticated lab scan with isolated identities
4. Active/full scan only on designated local/lab/staging

Never active-scan legacy CT8 or live customer environments without explicit Owner approval immediately before the scan.

`automation.yaml` is a placeholder plan without secrets. It is not evidence of a completed scan. A readiness of `ACTIVE_REAL_TARGET` is not a PASS until a real scan artifact exists. Production security acceptance stays OPEN.
