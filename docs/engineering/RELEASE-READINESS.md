# Release readiness

Status: CURRENT for the local tree. Production deploy is not authorized.
Hosting is OWNER-GATED and undecided. This page is not a deploy runbook.

## What is true now

The tree typechecks, tests, and records checksums with `pnpm repo:check`.
Migrations live in `apps/api/src/db.ts` and include a down path. Health
and readiness are separate HTTP routes. Backup direction is restic, with
pgBackRest only when PostgreSQL is on a remote stage. Neither is a
claim that a production restore has been run.

A release artifact, an SBOM, and a deploy pipeline are not built. Add
them when a hosting target exists. Do not add Kubernetes or cloud
tooling for the word "platform".

## When hosting is evaluated

Compare self-service, reproducibility, recovery, cost, observability,
backup, private-origin compatibility, reversibility, and the preference
for about 0 PLN at the start. Do not choose a cloud because it is a
cloud. The decision stays with the Owner.

## Alerts

No production SLO and no alert threshold is set. When production exists,
an alert needs an owner, a symptom, and a next diagnostic step. An alert
with no decision should be removed. Inventing a threshold now would be
a fake baseline.

## Value stream

The intended line is: Owner need, requirement, READY slice, implementation,
verification, commit, release, user effect, business outcome, learning.
Commit time can be read from git. Release, user effect, and business
outcome are NOT MEASURABLE. There is no production deployment series.
Wait time, review time, and rework time are not collected. Do not fill
them with estimates.
