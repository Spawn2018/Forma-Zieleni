# FZ-CIS baseline

Status: BASELINE. Date: 2026-09-21. Levels are independent.
0 ABSENT, 1 FOUNDATION, 2 OPERATIONAL, 3 MEASURED, 4 ADAPTIVE,
5 OPTIMIZING.

| Domain | Level | Evidence |
|---|---|---|
| Autonomy | 2 OPERATIONAL | `/noc`, orchestrator, READY selection, repeat-attempt stop. Not measured as a rate. |
| Testing | 2 OPERATIONAL | `pnpm test` covers domain, contracts, noc, and FZ-CIS. Flake rate NOT MEASURABLE YET. |
| Security | 1 FOUNDATION | Gates, secret scan, reviewer role. No production security telemetry. |
| Documentation | 2 OPERATIONAL | Canon order, one architecture entrypoint, checksummed tree. |
| Observability | 0 ABSENT | OpenObserve later. Local structured logs are not a production SLI. |
| Learning | 1 FOUNDATION | This system. Store empty. No promoted control yet. |
| Toil | 1 FOUNDATION | Defined. Not counted. |
| Review | 1 FOUNDATION | Roles exist. Unique-finding rate NOT MEASURABLE YET. |
| Knowledge freshness | 1 FOUNDATION | Classifier and research date on DORA. |
| Owner intervention | 1 FOUNDATION | Classes defined. Counts NOT MEASURABLE YET. |
| Architecture fitness | 2 OPERATIONAL | Integrity checks plus three FZ-CIS fitness functions. |
| Incident readiness | 1 FOUNDATION | Templates only. No production incident. |

DORA capabilities, same date. Delivery metrics themselves are
NOT MEASURABLE. See [`DORA-MEASUREMENT.md`](./DORA-MEASUREMENT.md).

| Capability | Level | Class |
|---|---|---|
| Version control | OPERATIONAL | MEASURED (git history exists) |
| Trunk-based / direct main | PARTIAL | INFERRED (local `main`; origin was 21 behind the workstation at baseline, so integration is not continuous yet) |
| Small batches | PARTIAL | INFERRED (slice graph) |
| Continuous integration | OPERATIONAL | MEASURED (GitHub Actions `CI` on `main`; run 35747728773 green for 444e98a) |
| Continuous delivery | NOT STARTED | NOT APPLICABLE YET |
| Test automation | PARTIAL | MEASURED for the suites that run; not the whole product |
| Test data management | FOUNDATION | INFERRED (synthetic fixtures; no production data) |
| Monitoring | NOT STARTED | NOT APPLICABLE YET |
| Reliability / SLO | FOUNDATION | Design only. Numbers NOT SET. |
| Pervasive security | FOUNDATION | INFERRED |
| Code maintainability | PARTIAL | INFERRED |
| Documentation quality | PARTIAL | INFERRED |
| Learning culture | FOUNDATION | This baseline |
| WIP limits | PARTIAL | INFERRED (one writer) |
| Customer feedback | NOT STARTED | NOT APPLICABLE YET |
| Experimentation | FOUNDATION | Contract only |
| AI capabilities | FOUNDATION to OPERATIONAL | Table in the DORA file |

Deferred on purpose:

- WHEN PRODUCT EXISTS: deployment events, field performance, search
  outcome learning, UX friction events.
- PRODUCTION LATER: live SLOs, error-budget enforcement, incident
  paging, customer conversion learning.

Next product READY stays on the CMS graph. This baseline does not
select it.
