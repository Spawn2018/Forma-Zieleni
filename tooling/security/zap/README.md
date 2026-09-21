# OWASP ZAP — lab only

Do not install ZAP until a runnable local or lab target exists, unless the Owner asks.

Windows: use the official installer from [zaproxy.org/download](https://www.zaproxy.org/download/). Current Windows packages require a current Java 17+ runtime. Docker is optional and is not a project prerequisite.

Scan order after a target exists:

1. Baseline/passive against localhost or designated lab
2. API scan from `contracts/openapi.json`
3. Authenticated lab scan with isolated identities
4. Active/full scan only on designated local/lab/staging

Never active-scan legacy CT8 or live customer environments without explicit Owner approval immediately before the scan.

`automation.yaml` is a placeholder plan without secrets. It is not evidence of a completed scan.
