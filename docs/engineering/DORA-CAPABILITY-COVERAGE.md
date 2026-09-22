# DORA capability coverage

Status: CURRENT. Retrieved 2026-09-22 from
https://dora.dev/guides/dora-metrics/ ,
https://dora.dev/insights/dora-metrics-history/ ,
and https://dora.dev/capabilities/ .

There is no DORA score and no certification. Levels mean evidence in
this repository, not a survey band.

| Capability | Level | Evidence |
| --- | --- | --- |
| Documentation quality | FOUNDATION | Documentation OS, map, baseline, and `pnpm docs:check` |
| Code maintainability | FOUNDATION | `docs/engineering/ENGINEERING-STANDARD.md` |
| Version control | OPERATIONAL | Git on `main`. The remote is public. |
| Working in small batches | FOUNDATION | One writer and slice commits. Not measured as lead time. |
| Continuous integration | FOUNDATION | `.github/workflows/ci.yml` verifies a push to `main`. It does not deploy. |
| Continuous delivery | FOUNDATION | Release readiness page. Deploy is gated. |
| Deployment automation | NOT_APPLICABLE | No hosting decision and no production deploy. |
| Database change management | FOUNDATION | Kysely migrations with down paths. |
| Test automation | OPERATIONAL | `pnpm test` runs domain, API, contract, and lab checks. |
| Test data management | FOUNDATION | `docs/engineering/TEST-DATA-POLICY.md` |
| Monitoring and observability | FOUNDATION | Health, readiness, and structured logs. OpenObserve is later. |
| Proactive failure notification | DESIGNED | No thresholds until a baseline exists. |
| Reliability engineering | FOUNDATION | `docs/engineering/RELIABILITY.md`. No production SLO. |
| Pervasive security | FOUNDATION | Lead vertical is tested and not security-accepted. |
| Flexible infrastructure | DESIGNED | Criteria are listed. Hosting is undecided. |
| Loosely coupled architecture | FOUNDATION | Modular monolith. CMS is not the business owner. |
| Streamlined change approval | OPERATIONAL | AUTO, REVIEW, OWNER, and DANGEROUS in `docs/workflows/DECISION-GATES.md` |
| Customer feedback | NOT_MEASURABLE | No live customer channel is connected. |
| User-centric focus | FOUNDATION | UX Canon exists. Portal and WWW apps do not. |
| Team experimentation | FOUNDATION | Experiment records exist in FZ-CIS. No live experiment. |
| Value stream visibility | DESIGNED | `docs/engineering/VALUE-STREAM.md`. Times are not measured. |
| WIP limits | OPERATIONAL | One writer. Read-only work may sit beside it. |
| Learning culture | FOUNDATION | FZ-CIS. Production learning is not measurable yet. |
| Quality internal platform | FOUNDATION | `docs/engineering/GOLDEN-PATHS.md` |
| Platform engineering | FOUNDATION | The same golden paths. No Backstage portal. |
| Empowering teams to choose tools | FOUNDATION | Gate A and Owner gates choose tools. Agents do not add a framework ad hoc. |
| Trunk-based development | OPERATIONAL | Direct `main`. One writer. |
| Monitoring systems to inform business decisions | DESIGNED | `docs/engineering/FAILURE-ALERTS.md`. No metric without a decision. |
| AI-accessible internal data | FOUNDATION | Context map of pointers. Not a dump of the tree. |
| Healthy data ecosystem | FOUNDATION | `docs/engineering/HEALTHY-DATA.md` and the connected fabric. No data-quality score. |
| Clear and communicated AI stance | FOUNDATION | `docs/engineering/FZ-AI-USAGE-POLICY.md` |

Data domains that exist have an owner in code: leads in the Core API,
editorial prose in the content model, plant names in the plant domain,
plans in Growth OS. A bad relation that would mislead a reader is a
data incident candidate for FZ-CIS. No such production incident is recorded.
