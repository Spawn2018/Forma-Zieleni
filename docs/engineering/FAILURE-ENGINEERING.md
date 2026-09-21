# Failure Engineering Standard

Status: CURRENT.

For any workflow with external side effects, customer impact, money, files, integrations, automation or AI, define a Failure Contract before production readiness.

Required fields: normal invariant; known failure modes; timeout/cancellation; bounded retry/backoff; idempotency/deduplication; partial-failure handling; checkpoint/resume; fallback/degraded mode; rollback or compensating action; monitoring/alert; audit evidence; manual recovery; maximum blast radius; test evidence.

Test failures deliberately in dev/staging. A happy-path demo is not production evidence. Backup is incomplete until restore is tested. Webhooks must be signed, idempotent and replay-safe. AI/provider outage must degrade safely rather than block canonical business truth.
