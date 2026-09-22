# SketchUp adapter boundary

Status: contracted for `SKETCHUP-ADAPTER-BOUNDARY` / `FZ-REQ-SKETCHUP-001`.

## Boundary

- Stable project identifiers and commercial truth live in Core API.
- SketchUp is an adapter surface, not business truth.
- No local business ACL in a plugin.

## Out of scope

- Plugin runtime install or store distribution.
- Plugin-owned commercial identifiers.

Machine checks: `sketchUpAdapterBoundary()` in `@forma-zieleni/domain`.
