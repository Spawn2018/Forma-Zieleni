# Refactoring Policy

Refactoring changes structure without intentionally changing externally observable behavior.

## Trigger
Refactor when it reduces demonstrated complexity, duplication, coupling, unsafe change cost, test difficulty or performance bottlenecks. Do not run aesthetic rewrites without value.

## Method
1. Characterize current behavior with tests/observations.
2. Identify smell and desired property.
3. Make the smallest behavior-preserving transformation.
4. Run focused tests after each meaningful step.
5. Keep public contracts stable unless a separately approved contract change exists.
6. Re-measure if the motivation is performance.
7. Remove obsolete code only when references and migration state prove it safe.

## AI-specific guardrail
Agent-generated code receives the same scrutiny as human code. Never add verbose comments, unnecessary wrappers, generic abstractions, excessive defensive checks, duplicated types, placeholder TODOs or stylistic churn merely because an AI generated the change. Do not attempt to conceal authorship; optimize for maintainable professional code.
