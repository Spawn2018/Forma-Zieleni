# docs/architecture

Architecture documentation for Forma Zieleni.

## Binding current architecture

| File | Role |
|------|------|
| [`CURRENT-ARCHITECTURE.md`](./CURRENT-ARCHITECTURE.md) | **Sole CURRENT / BINDING architecture entrypoint** |

All active documents and agents must link here for “current architecture”.

## Supporting current documents

| File | Role |
|------|------|
| [`SECURITY.md`](./SECURITY.md) | Binding security requirements, threat baselines, ingress/origin notes |
| [`DECISIONS.md`](./DECISIONS.md) | Formal ADR **history** (not the sole current decision ledger) |
| [`OWNER-DECISION-PACKETS-GATE-A.md`](./OWNER-DECISION-PACKETS-GATE-A.md) | Recorded FZ-A1–A7 decisions. Research retained. |
| [`GATE-IMPLEMENTATION-CHECKPOINT.md`](./GATE-IMPLEMENTATION-CHECKPOINT.md) | Architecture decided versus implementation not done. |
| [`NEXT-SLICE-LEAD-VERTICAL.md`](./NEXT-SLICE-LEAD-VERTICAL.md) | Lead Core API vertical. Implemented, not security-accepted. |
| [`OWNER-DECISION-PACKET-FZ-CMS-1.md`](./OWNER-DECISION-PACKET-FZ-CMS-1.md) | CMS / media / visual publishing. DECIDED: option B, vendor-native visual editing, FZ media pipeline. Not CMS-ACCEPT. |
| [`NEXT-SLICES-CMS.md`](./NEXT-SLICES-CMS.md) | CMS and Search Intelligence execution graph. |
| [`FZ-SEARCH-1.md`](./FZ-SEARCH-1.md) | Binding Search Intelligence architecture: SEO contract, crawlers, attribution, data model, Admin IA. |
| [`OWNER-DECISION-PACKET-FZ-SEARCH-CRAWL-1.md`](./OWNER-DECISION-PACKET-FZ-SEARCH-CRAWL-1.md) | Production training-crawler policy. OPEN. |
| [`FZ-SIGN-1-CONTRACT-LIFECYCLE.md`](./FZ-SIGN-1-CONTRACT-LIFECYCLE.md) | Binding contract lifecycle and e-signature boundary. Provider undecided. |
| [`OWNER-DECISION-PACKET-FZ-SIGN-1.md`](./OWNER-DECISION-PACKET-FZ-SIGN-1.md) | Later research packet. No engine selected. |

Current override decisions after F-RESET v2 live in [`../knowledge/POST-V2-DECISIONS.md`](../knowledge/POST-V2-DECISIONS.md).  
Rule: **latest explicit owner decision wins; history remains traceable.**

## Historical / redirect

| File | Role |
|------|------|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | **SUPERSEDED** as binding entrypoint — redirect + provenance only |

Do not maintain parallel architecture truth in `ARCHITECTURE.md`.
