# Orchestration and model routing

## Principle
Use the cheapest/simplest mechanism that can reliably do the job. Model choice is an implementation detail and may change with Cursor availability. Never encode business truth in a model-specific prompt only.

## Routing
- deterministic formatting/checking: tools, not LLMs;
- routine bounded edits: normal coding agent;
- difficult architecture/debugging: strongest appropriate available reasoning/coding model;
- independent review: preferably a different model family/context from the author;
- web/external research: dedicated research agent or Grok Bot, with source provenance;
- long-running multi-slice work: Cursor Project coordinator;
- local-state-dependent testing: local Agent/CLI or My Machines after explicit setup.

## Budget/usage policy
Do not burn premium context on formatting, file enumeration, generated artifacts or mechanical checks. Cache durable conclusions in canonical docs. Keep prompts scoped. Use subagents for isolated context. Compact only after durable decisions have been written to the repo.

## No fake consensus
Two model outputs are not evidence. Conflicts are resolved by contracts, tests, authoritative sources, measurements, or an owner Decision Gate.
