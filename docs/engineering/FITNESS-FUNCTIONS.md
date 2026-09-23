# Architectural fitness functions

Status: CURRENT. These checks are executable properties. They do not
replace `docs/engineering/REPOSITORY-INTEGRITY.md`.

| Id | Property | Reason | Mechanism | Failure means | Owner |
|---|---|---|---|---|---|
| single-cis-canon | One FZ-CIS architecture | Learning policy must have one owner | `scripts/fz-cis/fitness.mjs` | Two policies can diverge | repository integrity |
| learning-store-safe | Records validate and gates stay intact | Evidence is not authority and is not a secret store | same, over `records.json` | Poisoned or secret evidence is tracked | FZ orchestrator |
| execution-loop-unchanged | One execution loop | FZ-CIS must not select product work | CURSOR-OS still says it is the sole binding definition | A second loop appeared | FZ orchestrator |
| proven-requires-effect | PROVEN needs supported VERIFY EFFECT | Status cannot skip effect evidence | same, over PROVEN/PROMOTED rows | PROVEN without effect support | FZ orchestrator |
| promoted-requires-control | PROMOTED needs durable `controlRef` | Promotion means a real control exists | same, over PROMOTED rows | Promotion without a durable artifact | FZ orchestrator |

Already enforced elsewhere, and not copied here: tracked secrets and
forbidden paths, Canon entrypoints, FZ-SIGN-1 still UNDECIDED,
checksums, OpenAPI shape, content-contract behavior, and the `/noc`
READY rule.

`pnpm repo:check` runs the rows above with the integrity checks.
