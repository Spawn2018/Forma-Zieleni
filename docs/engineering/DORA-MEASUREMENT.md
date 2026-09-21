# DORA measurement

Status: CURRENT specification. Baseline date: 2026-09-21.
Production deployment metrics: NOT MEASURABLE.

Forma Zieleni does not claim a DORA certification. The goal is
DORA-aligned delivery with auditable events. This file is subordinate
to [`../architecture/FZ-CONTINUOUS-IMPROVEMENT.md`](../architecture/FZ-CONTINUOUS-IMPROVEMENT.md).

## Sources checked 2026-09-21

- DORA, “DORA’s software delivery performance metrics”,
  <https://dora.dev/guides/dora-metrics/>. Five metrics. Throughput:
  change lead time, deployment frequency, failed deployment recovery
  time. Instability: change fail rate, deployment rework rate.
- DORA, “State of AI-assisted Software Development 2025”,
  <https://dora.dev/research/2025/dora-report/>. AI is an amplifier.
  The 2025 report discusses archetypes. Those archetypes are research
  context, not an FZ score.
- DORA AI Capabilities Model, v2025.1. Seven capabilities: clear and
  communicated AI stance, AI-accessible internal data, user-centric
  focus, healthy data ecosystems, working in small batches, quality
  internal platforms, strong version control practices.
- DORA capability catalog, <https://dora.dev/capabilities/>, including
  version control, continuous delivery, continuous integration,
  trunk-based development, and working in small batches.
- CDF note on the fifth metric is secondary. It does not override
  dora.dev.

Historical performance bands are not thresholds. Re-check
`dora-definition` before the next binding revision
(SLOW-CHANGING).

## Metric semantics

Calculated only from [`../../contracts/dora-event.schema.json`](../../contracts/dora-event.schema.json)
events, per `service` when more than one service deploys.

| Metric | From events | If events are missing |
|---|---|---|
| Change lead time | Median of deployment `at` minus `commitAt` | NOT MEASURABLE |
| Deployment frequency | Deployment count in the observed window | NOT MEASURABLE / NOT APPLICABLE YET |
| Failed deployment recovery time | Median `durationMs` on `recovery_completed` | NOT MEASURABLE |
| Change fail rate | Deployments with `failed: true` / deployments | NOT MEASURABLE |
| Deployment rework rate | Deployments with `unplanned: true` / deployments | NOT MEASURABLE |

A missing timestamp does not become zero. A local commit is not a
production deployment. Push is not deploy. Deploy is not cutover.

Do not optimize for more commits, more deploys, smaller empty
changes, hidden incidents, or relabeled rework.

## Capabilities

Levels: NOT STARTED, FOUNDATION, PARTIAL, OPERATIONAL, MEASURED,
OPTIMIZING. Evidence class: MEASURED, INFERRED, NOT MEASURABLE, or
NOT APPLICABLE YET. The assessed table is
[`FZ-CIS-BASELINE.md`](./FZ-CIS-BASELINE.md).

## AI capabilities in this repo

| DORA AI capability | FZ evidence | Level |
|---|---|---|
| Clear and communicated AI stance | Constitution, decision gates, Cursor OS, this system | FOUNDATION |
| AI-accessible internal data | START-HERE, Canon order, execution graph. No customer corpus. | FOUNDATION |
| User-centric focus | Product, UX, visual, and content canons. No live UX telemetry. | FOUNDATION |
| Healthy data ecosystems | Core API contracts and domain types for the slices that exist | PARTIAL |
| Working in small batches | Slice graph, one writer, learning check after complete | PARTIAL |
| Quality internal platforms | Local pnpm gates, integrity manifest, `/noc` policy. No deploy platform. | FOUNDATION |
| Strong version control | Git on `main`, checksum manifest, direct-main decision | OPERATIONAL |

## Current delivery baseline

Repository on 2026-09-21 before this slice: 28 commits, HEAD
`c300d31d7d55f2452e926aaa1c53bf638b1f613a`, 21 commits ahead of
`origin/main`, 0 behind. No production deployment events are stored.

All five DORA metrics: NOT MEASURABLE. Deployment frequency is also
NOT APPLICABLE YET. `node scripts/fz-cis/cli.mjs dora --json <events>`
returns that state for an empty list. It does not invent a rate.
