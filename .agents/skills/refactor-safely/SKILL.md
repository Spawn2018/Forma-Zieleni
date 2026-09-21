---
name: refactor-safely
description: Use for refactoring, cleanup, technical-debt removal or restructuring without intended behavior changes.
---
# refactor-safely
Follow docs/engineering/REFACTORING-POLICY.md. Establish characterization tests first when behavior is not already protected. Refactor incrementally. Keep behavior/contract changes separate. Run focused tests between transformations and the applicable quality gate at the end.
