# Local ZAP procedure — lead API

Status: DEFERRED on 2026-09-22 for `LEAD-ZAP-BASELINE`. Readiness
command `node scripts/security/zap-readiness.mjs` returned
`ARMED_WAITING_FOR_TARGET` (`reason: no_lab_target_url`). `java`,
`zap.bat`, and `zap-cli` were not on PATH. `ZAP_BIN` and
`FZ_ZAP_TARGET_URL` were unset. Evidence:
[`ZAP-LEAD-BASELINE-DEFERRED-2026-09-22.json`](./ZAP-LEAD-BASELINE-DEFERRED-2026-09-22.json).
This is not a PASS and not Lead security acceptance.

Earlier note (2026-09-21): Docker was not installed for this scan. No
target was contacted.

When Java 17+ and the official OWASP ZAP Windows installer are present,
and a loopback synthetic API listens, run only against the local
synthetic API:

1. Start PostgreSQL and `apps/api` on `127.0.0.1` with synthetic data.
   Do not point this at CT8, production, Cloudflare, or any public host.
2. Set `FZ_ZAP_TARGET_URL=http://127.0.0.1:3000/v1/health`,
   `FZ_ZAP_SYNTHETIC=1`, and `ZAP_BIN` to the ZAP launcher.
3. Confirm readiness is no longer `ARMED_WAITING_FOR_TARGET`.
4. Passive baseline via Automation Framework:

```text
"%ZAP_BIN%" -cmd -autorun tooling/security/zap/automation.yaml
```

The automation file scopes include paths to
`http://127.0.0.1:3000/v1.*` and runs OpenAPI import plus passive wait.
Active scan jobs stay absent until a designated lab target exists.

5. Optional API scan from the canonical contract:

```text
"%ZAP_BIN%" -cmd -openapifile contracts/openapi.json -openapitargeturl http://127.0.0.1:3000/v1
```

Record the report path, findings, and fixes in `docs/security/`. A
missing tool is not a pass.
