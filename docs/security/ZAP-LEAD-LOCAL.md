# Local ZAP procedure — lead API

Status: DEFERRED on 2026-09-21. `java`, `zap.bat`, and `zap-cli` were not on PATH. Docker was not installed for this scan. No target was contacted.

When Java 17+ and the official OWASP ZAP Windows installer are present, run only against the local synthetic API:

1. Start PostgreSQL and `apps/api` on `127.0.0.1` with synthetic data. Do not point this at CT8, production, Cloudflare, or any public host.
2. Passive baseline, Automation Framework:

```text
zap.bat -cmd -autorun docs/security/zap/lead-baseline.yaml
```

The automation file is not in the repo yet. The first file should set the context include to `http://127.0.0.1:3000/v1/.*` and run the spider plus passive scan only.

3. API scan from the canonical contract:

```text
zap.bat -cmd -openapifile contracts/openapi.json -openapitargeturl http://127.0.0.1:3000/v1
```

Record the report path, findings, and fixes in `docs/security/`. A missing tool is not a pass.
