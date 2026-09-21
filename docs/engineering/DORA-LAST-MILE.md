# DORA last-mile audit

Status: CURRENT. Retrieved 2026-09-22. Five delivery metrics remain the only DORA metrics. This page is the DL1–DL20 audit. It is not a score.

## DL1

The internal platform is Cursor OS, the orchestrator, `/noc`, skills, hooks, `pnpm test`, `pnpm repo:check`, `pnpm docs:check`, contracts, the context map, and FZ-CIS. Golden paths are `docs/engineering/GOLDEN-PATHS.md`. There is no Backstage app. UI golden path waits until a UI exists.

## DL2

`docs/engineering/VALUE-STREAM.md`. Flow is explicit. Durations are NOT MEASURABLE YET.

## DL3

One mutating writer. Read-only research may run beside that writer. No numeric WIP target.

## DL4

`docs/engineering/FZ-AI-USAGE-POLICY.md` classifies Cursor, the main model, Grok Bot, CodeRabbit, Perplexity, and a future runtime model by data class. Customer data and secrets are PROHIBITED in external tools. Vendor privacy claims stay UNVERIFIED.

## DL5

`docs/engineering/HEALTHY-DATA.md`. Owners, contracts, and visibility are named. No data-quality score.

## DL6

`docs/engineering/RELEASE-READINESS.md`. Tests, typecheck, and migrations exist. Deploy is not authorized. Continuous delivery is not automatic production deployment.

## DL7

`docs/engineering/TEST-DATA-POLICY.md` and `scripts/docs/test-data.mjs`. Synthetic plans are labeled. A customer-database copy is rejected by the checker.

## DL8

`docs/engineering/FAILURE-ALERTS.md`. No numeric threshold and no pager.

## DL9

AUTO and REVIEW use tests. OWNER-DECISION, OWNER-ONLY, and DANGEROUS stay in `docs/workflows/DECISION-GATES.md`. Ordinary code is not an Owner queue.

## DL10

Hosting criteria are in the release-readiness page: cost near 0 PLN, recovery, reproducibility, observability, backup, private origin, reversibility, lock-in. No host is selected.

## DL11

Maintainability rules are `docs/engineering/ENGINEERING-STANDARD.md`, typecheck, and tests. There is no maintainability score.

## DL12

`pnpm-lock.yaml` is the lockfile. `pnpm audit --audit-level=moderate` is the vulnerability check. No extra supply-chain product was added. An SBOM waits until a release artifact exists.

## DL13

Token count, prompt count, and generated lines are not productivity. The AI policy says so. Cost per change is NOT MEASURABLE YET.

## DL14

Critical behavior is expected to have a contract, a test, and a Canon pointer. A passing test does not excuse an unexplained rule.

## DL15

Do not move toil onto the Owner or Agnieszka. No individual score. Tool sprawl is a reason not to add Backstage or Storybook yet.

## DL16

`docs/engineering/FAILURE-ALERTS.md` requires a decision before a metric becomes an alert. Health and business outcome stay different.

## DL17

`docs/engineering/DORA-CAPABILITY-COVERAGE.md` lists catalog capabilities, including platform engineering, trunk-based development, and monitoring for decisions. No combined score.

## DL18

Metrics page and history page were retrieved 2026-09-22. The fifth metric is deployment rework rate. An older four-metric figure is not evidence that rework rate was removed.

## DL19

DL rows are requirement `FZ-REQ-DORA-003` through `FZ-REQ-DORA-010` and `FZ-REQ-PLATFORM-001`. This page is the evidence index.

## DL20

This audit does not authorize push, deploy, hosting selection, spend, or live tracking.
