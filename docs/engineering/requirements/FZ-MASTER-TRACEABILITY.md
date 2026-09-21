# FZ master traceability

Status: CURRENT registry for the master-audit foundation.
Machine source: `scripts/requirements/registry.mjs`.
This is not a second roadmap. Product execution stays in `docs/architecture/NEXT-SLICES-CMS.md`.

Depth is the highest honest depth of that row. A blocked row is not a shell when the maximum possible depth is the same as the actual depth.

| ID | Status | Actual | Max | Requirement | Evidence | Gate | Gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FZ-REQ-CONNECT-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | One canonical owner. A projection cannot own a fact. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-CONNECT-002 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Typed relations are stored once and the inverse is derived. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-CONNECT-003 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Provenance, value class and human lock are carried on fields. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-CONNECT-004 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Private customer scope is not traversable by another customer or the public. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-CONNECT-005 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Concept and illustrative projects cannot be projected as realizations. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-CONNECT-006 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Connectivity inventory has a state and a reason for every listed surface. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-APPROVAL-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Agnieszka can edit, partially approve, approve, reject and defer. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-APPROVAL-002 | DONE_AT_MAX_DEPTH | TESTED | TESTED | AI cannot overwrite a human-locked semantic field. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-APPROVAL-003 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Stale proposals and conflicting proposals do not apply. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-APPROVAL-004 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Impact preview lists affected entities and surfaces before apply. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-APPROVAL-005 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Deterministic approval updates the owner. Semantic prose stays a proposal. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-APPROVAL-006 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Outbox delivery is idempotent and a causation cycle is refused. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-APPROVAL-007 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Agnieszka cannot override Owner, dangerous, spend, price or live publication gates. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-APPROVAL-008 | DONE_AT_MAX_DEPTH | TESTED | TESTED | A reviewer correction becomes a learning signal and does not remove future review. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-APPROVAL-009 | DONE_AT_MAX_DEPTH | TESTED | TESTED | External text cannot write Canon or become a command. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-PROJECT-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | REAL, CONCEPT and ILLUSTRATIVE projects are distinct machine classes. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-PROJECTGROWTH-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | A verified real project proposes content candidates and does not publish them. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-PROJECTGROWTH-002 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Private facts and missing rights do not become marketing content. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-PROJECTGROWTH-003 | DONE_AT_MAX_DEPTH | TESTED | TESTED | The system rejects an invented or private project fact on the public path. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-ATLAS-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Botanical sources are taxonomic authorities, not horticultural proof. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-GROWTH-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Goal, budget ceiling and horizon compile a versioned synthetic plan. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-GROWTH-002 | DONE_AT_MAX_DEPTH | TESTED | TESTED | The plan includes articles, prompts, a concept brief, channels, an experiment and measurement. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-GROWTH-003 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Budget allocations sum to the ceiling and do not authorize spend. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-GROWTH-004 | DONE_AT_MAX_DEPTH | TESTED | TESTED | The simulator returns NOT_ENOUGH_DATA and no point forecast. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-GROWTH-005 | DONE_AT_MAX_DEPTH | TESTED | TESTED | The plan route is capability-gated and refuses a spend flag. | apps/api/src/http.test.mjs | NONE |  |
| FZ-REQ-MKTEXEC-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | An approved plan compiles a work graph with real dependencies. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-MKTEXEC-002 | DONE_AT_MAX_DEPTH | TESTED | TESTED | A downstream task cannot become ready before its blocking dependency. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-MKTEXEC-003 | DONE_AT_MAX_DEPTH | TESTED | TESTED | The graph coordinates article, prompt, Agnieszka approval, palette, Atlas, visualization, portfolio, creative, social, landing, experiment and measurement. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-MKTEXEC-004 | DONE_AT_MAX_DEPTH | TESTED | TESTED | A marketing plan does not authorize publication or spend. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-MARKETING-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Channel evaluation may return DO_NOT_USE, including paid media. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-MARKETING-002 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Brand and activation are both present without a fixed 60/40 rule. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-CONTENT-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Article length is a range from character and evidence burden, not a magic word count. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-CONTENT-002 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Same-topic overlap updates. Date-only freshness is rejected. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-PERPLEXITY-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | An article character produces a prompt that forbids invented sources. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-PERPLEXITY-002 | DONE_AT_MAX_DEPTH | TESTED | TESTED | A claim without a source stays UNCERTAIN. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-CREATIVE-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Platform specs stay UNVERIFIED until a dated official source exists. Fatigue has no universal threshold. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-EXPERIENCE-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Behavior events reject name, email, phone, address and message. They are not conclusions. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-EXPERIENCE-002 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Session replay is off and cannot be enabled by this module. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-CRM-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Qualified path outranks raw lead volume when both numbers exist. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-OFFERINTEL-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Marketing code cannot change price or commercial terms. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-OFFERLEARN-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | A rejected offer records hypotheses, including price, and does not change the price. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-INTEGRATION-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | The integration registry refuses live mutation. Providers stay discovered or planned. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-OPS-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Operations domains are not DORA metrics and are not measured yet. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-DORA-001 | DONE_AT_MAX_DEPTH | DOCUMENTED | DOCUMENTED | DORA stays five software-delivery metrics. No score and no certification. | docs/engineering/DORA-MEASUREMENT.md | NONE | No production series. Numbers stay NOT MEASURABLE. |
| FZ-REQ-DORA-002 | NOT_MEASURABLE_YET | DOCUMENTED | DOCUMENTED | Production DORA numbers are not measurable until deployment events exist. | docs/engineering/DORA-MEASUREMENT.md | NONE | NOT MEASURABLE |
| FZ-REQ-CIS-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | FZ-CIS remains the only learning system. External text cannot edit Canon. | scripts/fz-cis/policy.test.mjs | NONE |  |
| FZ-REQ-CIS-002 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Reviewer corrections are signals. They do not auto-promote or remove review. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-AUTO-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | /noc uses the next Europe/Warsaw hour. 9 means 09:00. | scripts/fz-noc/policy.test.mjs | NONE |  |
| FZ-REQ-AUTO-002 | DONE_AT_MAX_DEPTH | DOCUMENTED | DOCUMENTED | The orchestrator uses one execution loop and does not resolve Owner gates. | .cursor/agents/fz-orchestrator.md | NONE | Agent text is the control. No second loop was added. |
| FZ-REQ-GOV-001 | DONE_AT_MAX_DEPTH | DOCUMENTED | DOCUMENTED | Owner authority stays above Canon, the orchestrator and tools. | docs/workflows/DECISION-GATES.md | NONE |  |
| FZ-REQ-GOV-002 | OWNER_GATED | DOCUMENTED | DOCUMENTED | FZ-SIGN-1 provider remains undecided. | docs/architecture/OWNER-DECISION-PACKET-FZ-SIGN-1.md | OWNER-DECISION | UNDECIDED |
| FZ-REQ-SEARCH-001 | DONE_AT_MAX_DEPTH | DOCUMENTED | DOCUMENTED | FZ-SEARCH-1 remains the search architecture. No universal AI rank or GEO score. | contracts/content-contract.test.mjs | NONE | Connector runtime is a later slice, not this foundation. |
| FZ-REQ-SEARCH-002 | OWNER_GATED | DOCUMENTED | DOCUMENTED | FZ-SEARCH-CRAWL-1 training-crawler policy stays open. | docs/architecture/OWNER-DECISION-PACKET-FZ-SEARCH-CRAWL-1.md | OWNER-DECISION | OPEN |
| FZ-REQ-CMS-001 | BLOCKED_BY_DEPENDENCY | DOCUMENTED | DOCUMENTED | Apostrophe, vendor-native editing and the FZ media pipeline stay the CMS decision. CMS-ACCEPT stays open. | scripts/cms-lab-gate.mjs | REVIEW | CMS-ACCEPT OPEN |
| FZ-REQ-CMS-002 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Published content stays a projection. Drafts stay private. | packages/domain/content-publish.test.mjs | NONE |  |
| FZ-REQ-MEDIA-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Private checksummed masters and public derivatives without GPS stay the media contract. | packages/media/derivatives.test.mjs | NONE | Gallery UI remains the next ordinary slice. |
| FZ-REQ-ARCH-001 | DONE_AT_MAX_DEPTH | DOCUMENTED | DOCUMENTED | Gate A stays Hono, PostgreSQL, Kysely, outbox, Better Auth, local files, later Garage, OpenObserve, SOPS+age, restic, pgBackRest, Cloudflare Tunnel, Compose later, no overlay. | docs/architecture/CURRENT-ARCHITECTURE.md | NONE | Production hosting and object storage remain undecided. |
| FZ-REQ-ARCH-002 | DONE_AT_MAX_DEPTH | TESTED | TESTED | No graph database, Prisma, Drizzle or Kafka is introduced by this foundation. | scripts/requirements/registry.test.mjs | NONE |  |
| FZ-REQ-API-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Core API remains the business authority. | apps/api/src/http.test.mjs | NONE |  |
| FZ-REQ-DATA-001 | DONE_AT_MAX_DEPTH | DOCUMENTED | DOCUMENTED | PostgreSQL and Kysely remain persistence. New unused tables were not added. | apps/api/src/postgres.integration.test.mjs | NONE | Domain contract is in memory, matching the content-publish precedent. |
| FZ-REQ-SEC-001 | BLOCKED_BY_DEPENDENCY | TESTED | TESTED | The lead vertical is implemented and is not security-accepted. | packages/domain/lead.test.mjs | REVIEW | Do not mark security-accepted. |
| FZ-REQ-PRIV-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | No live customer tracking, session replay or analytics ingestion is activated. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-WWW-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | WWW reads a published projection and must not invent business facts. | packages/domain/content-publish.test.mjs | NONE | The public site application is not built yet. |
| FZ-REQ-PORTAL-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Portal customer isolation is enforced in the domain contract. | packages/domain/ecosystem.test.mjs | NONE | No portal UI. |
| FZ-REQ-ADMIN-001 | BLOCKED_BY_DEPENDENCY | CONTRACTED | CONTRACTED | Agnieszka approval UI waits until apps/admin is a real application. | packages/domain/ecosystem.test.mjs | NONE | Domain actions exist. No fake admin screen. |
| FZ-REQ-MOBILE-001 | BLOCKED_BY_DEPENDENCY | DOCUMENTED | DOCUMENTED | Android and iOS have no separate business truth. | docs/architecture/CURRENT-ARCHITECTURE.md | NONE |  |
| FZ-REQ-SITEINTEL-001 | DONE_AT_MAX_DEPTH | DOCUMENTED | DOCUMENTED | Site Intelligence stays DATA, then RULES, then DOMAIN, then AI. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-GARDENOS-001 | BLOCKED_BY_DEPENDENCY | DOCUMENTED | DOCUMENTED | Garden OS is a future relation, not a digital-twin runtime. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-SKETCHUP-001 | BLOCKED_BY_DEPENDENCY | DOCUMENTED | DOCUMENTED | SketchUp is not the source of business truth. | packages/domain/ecosystem.test.mjs | NONE |  |
| FZ-REQ-PAY-001 | OWNER_GATED | DOCUMENTED | DOCUMENTED | Payment provider remains undecided. No transaction is started. | docs/architecture/CURRENT-ARCHITECTURE.md | OWNER-DECISION | UNDECIDED |
| FZ-REQ-HOST-001 | OWNER_GATED | DOCUMENTED | DOCUMENTED | Production hosting remains undecided. No deploy, DNS or Cloudflare mutation. | docs/architecture/CURRENT-ARCHITECTURE.md | OWNER-DECISION | UNDECIDED |
| FZ-REQ-GOV-003 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Project code stays all rights reserved. No repository OSS license is added. | scripts/requirements/registry.test.mjs | NONE |  |
| FZ-REQ-GOV-004 | DONE_AT_MAX_DEPTH | DOCUMENTED | DOCUMENTED | Legal facts, font files and the legacy CT8 site are not changed or invented here. | docs/engineering/requirements/RESEARCH-2026-09-21.md | NONE | NIP and font delivery were not re-fetched. |
| FZ-REQ-EXECINTEGRITY-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | Material claims in this registry name an artifact. Synthetic plans are labeled synthetic. | scripts/requirements/registry.test.mjs | NONE |  |
| FZ-REQ-CONTEXT-001 | DONE_AT_MAX_DEPTH | DOCUMENTED | DOCUMENTED | Recovery reads the journal, traceability and Canon without chat history. | scripts/requirements/registry.test.mjs | NONE |  |
| FZ-REQ-EVIDENCE-001 | DONE_AT_MAX_DEPTH | DOCUMENTED | DOCUMENTED | Research limits are dated. Unfetched platform specs stay unverified. | docs/engineering/requirements/RESEARCH-2026-09-21.md | NONE |  |
| FZ-REQ-COMPLETION-001 | DONE_AT_MAX_DEPTH | TESTED | TESTED | The registry rejects a duplicate id, a missing prefix, or an actual depth below the recorded maximum. | scripts/requirements/registry.test.mjs | NONE |  |
