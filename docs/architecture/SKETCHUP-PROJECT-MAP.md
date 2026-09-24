# SketchUp project map

Status: contracted for `SKETCHUP-PROJECT-MAP` / `FZ-REQ-SKETCHUP-002`.

## Mapping (binding)

- A SketchUp model reference maps to a Core API project id.
- The adapter does not own price, contract, or customer truth.
- No local business ACL in the mapping.

Prerequisite boundary:
`docs/architecture/SKETCHUP-ADAPTER-BOUNDARY.md`.

## Out of scope

- Plugin runtime install or store distribution.
- Commercial fields on the mapping record.

Machine checks: `mapSketchUpModelToProject()` in `@forma-zieleni/domain`.
