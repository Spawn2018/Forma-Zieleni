# FZ-SIGN-1 Owner research packet — signing engine

Status: **OPEN / LATER**. Not a Gate A packet. FZ-A1–A7 stay OPEN.
**No engine is selected.**

Canonical lifecycle: [`FZ-SIGN-1-CONTRACT-LIFECYCLE.md`](./FZ-SIGN-1-CONTRACT-LIFECYCLE.md).

Evidence date: 2026-09-21. Official docs and GitHub LICENSE files only.
A cell is **UNKNOWN** when the official page did not state it. Third-party
pricing blogs were not used. No ranking.

## Economic screen

Forma Zieleni’s ordinary path wants a maintained self-host engine with
no software-license fee and no per-signature or forced API/embedding fee.
Infrastructure is separate. QES/TSP may be paid later, OWNER-ONLY.

The production integration Forma Zieleni needs is an **API or embedding
adapter** behind Core API, plus independent possession of the signed
bytes. A free web UI that cannot be called from Core API without a paid
key does not meet the zero-API-fee target by itself.

## Candidates read

| Engine | Official sources read |
|---|---|
| Documenso | [licenses](https://docs.documenso.com/docs/policies/licenses), [community](https://docs.documenso.com/docs/policies/community-edition), [self-hosting](https://docs.documenso.com/docs/self-hosting), [GitHub LICENSE](https://github.com/documenso/documenso/blob/main/LICENSE) |
| DocuSeal | [signing API](https://www.docuseal.com/signing-api), [GitHub LICENSE](https://github.com/docusealco/docuseal/blob/master/LICENSE) |
| OpenSign | [API token docs](https://docs.opensignlabs.com/docs/help/Settings/APIToken/), [GitHub LICENSE](https://github.com/OpenSignLabs/OpenSign/blob/main/LICENSE) |

## What official text actually says

### Documenso

- Community Edition is **AGPL-3.0**. GitHub `LICENSE` is the AGPL-3.0 text. Self-host is allowed, including commercial use, with AGPL network-source obligations.
- Enterprise Edition is a **commercial** license. Official self-host page: core functionality is AGPL; **SSO, embed-editor white label and 21 CFR Part 11** need a license key (**ENTERPRISE**).
- Official deploy paths: Docker, Docker Compose, Railway, Kubernetes. PostgreSQL and S3-compatible storage are named configuration topics. A signing certificate must be generated; the app starts without one but signing fails. That certificate is **not** documented as an EU QES.
- Community docs include an **API Access** heading under included features. The extracted body did not state whether that API is metered. API commercial-license FAQ exists; the answer body was not in the extract. **API metering = UNKNOWN.**
- Windows-native DX, PAdES/CAdES/XAdES, LTV, EU QTSP/QES: **UNKNOWN**.
- Outbound webhook SSRF checks are documented as best-effort and fail-open. Network egress is the operator’s job.

### DocuSeal

- GitHub `LICENSE` is **AGPL-3.0** (software license of the published repo: **FREE OSS**).
- Official API page: API and embedding license keys require **at least one Pro seat at $20/month**. Production API or embedding is **$0.20 per document signed**. The same per-document fees apply to **Pro On-Premises and Pro Cloud**. Sandbox API/embedding is **$0** and unlimited for testing.
- Official events named: `form.viewed`, `form.started`, `form.completed`. Templates, submissions and multi-party completion (multiple files/parties count as one document completion) are described.
- Therefore the **Core API adapter path is PAID**, even when the AGPL app is self-hosted. The unpaid AGPL UI path was not shown to include production API keys.
- PostgreSQL, object storage, Windows DX, Docker-only vs native, SSO, PAdES, QES, HA: **UNKNOWN** on the pages read this pass.

### OpenSign

- GitHub `LICENSE`: content is **AGPL-3.0** except `apps/OpenSignServer/cloud/customRoute` (separately licensed if present) and third-party components. That is an open-core split, not “the whole repo is one free production path”.
- Official API docs: a **Live** API token requires a **paid** Professional or Teams plan. **Free self-hosted does not support API token generation.** Paid self-hosted is required for self-hosted APIs.
- Sandbox API tokens are available on all plans, including free. Do not put confidential documents in sandbox.
- Embedded signing, API signature, bulk send, public-template signing and kiosk mode **consume premium credits (PAID)**. Ordinary in-app “Request Signature” / “Sign Yourself” / single template send **do not** consume those credits, per the same official FAQ.
- PostgreSQL, object storage, Windows DX, Docker, PAdES, QES, EU TSP: **UNKNOWN** this pass.

## Capability matrix

Marks: **FREE OSS** / **PAID** / **CLOUD-ONLY** / **ENTERPRISE** / **UNKNOWN**.

| Capability | Documenso | DocuSeal | OpenSign |
|---|---|---|---|
| Repo license | FREE OSS (AGPL-3.0) | FREE OSS (AGPL-3.0) | FREE OSS (AGPL-3.0) plus separately licensed `cloud/customRoute` |
| Production self-host of the app | FREE OSS (AGPL duties) | FREE OSS for the AGPL app | FREE OSS for the AGPL app |
| True free production API/embedding for Core API | UNKNOWN | **PAID** ($20/mo seat + $0.20/document, including on-prem) | **PAID** (no API token on free self-host; embedded signing uses credits) |
| Webhooks | UNKNOWN (SSRF note only) | FREE OSS **not shown**; events documented on the paid API page | UNKNOWN |
| Templates | heading on Community page; body UNKNOWN | described on API page (**PAID** API path) | in-app template send without credits; API template path **PAID** |
| Multiple signers / ordering | UNKNOWN | multi-party completion described; ordering UNKNOWN | UNKNOWN |
| Reminders | UNKNOWN | UNKNOWN | UNKNOWN |
| Reject / withdraw | UNKNOWN | UNKNOWN | UNKNOWN |
| Audit / evidence artifact | UNKNOWN | UNKNOWN | UNKNOWN |
| Branding / white label | white-label embed editor **ENTERPRISE** | UNKNOWN | UNKNOWN |
| PostgreSQL | named in self-host docs | UNKNOWN | UNKNOWN |
| S3-compatible storage | named in self-host docs | UNKNOWN | UNKNOWN |
| Windows dev DX | UNKNOWN | UNKNOWN | UNKNOWN |
| Linux deploy | Docker/Compose documented | UNKNOWN | UNKNOWN |
| Docker required | Docker is the documented quick start; non-Docker **UNKNOWN** | UNKNOWN | UNKNOWN |
| SSO | **ENTERPRISE** | UNKNOWN | UNKNOWN |
| Export / keep signed files without the vendor | UNKNOWN (FZ must still copy bytes into private storage) | API can download signed docs on the **PAID** path; independent archive still required | UNKNOWN |
| Backup / restore of the engine | backups are a documented self-host topic; restore test not evidenced | UNKNOWN | UNKNOWN |
| HA | Kubernetes mentioned | UNKNOWN | UNKNOWN |
| Telemetry | UNKNOWN | UNKNOWN | UNKNOWN |
| PAdES / CAdES / XAdES | UNKNOWN | UNKNOWN | UNKNOWN |
| Timestamp / LTV | UNKNOWN | UNKNOWN | UNKNOWN |
| EU QES / QTSP | **not claimed**; certificate is operator-supplied | UNKNOWN | UNKNOWN |
| Per-signature fee on the API path | UNKNOWN | **PAID** $0.20/document | **PAID** credits for API/embed |

Infrastructure cost is separate for every row. AGPL compliance (source offer if you modify and expose the network service) is a legal review, not a feature checkbox.

## Excluded this pass

| Candidate | Reason |
|---|---|
| DocuSign, PandaDoc, Adobe Sign | Proprietary SaaS. Not a zero-license self-host path. Not evaluated as winners. |
| Autenti | Commercial trust/signing service. Not an OSS self-host engine. Not implemented. Possible later QES/TSP class only, and only with a separate OWNER-ONLY packet. |
| LibreSign and other names seen only in third-party roundups | Not added. This pass did not read official docs showing a stronger maintained OSS adapter (API, webhooks, independent archive) than the three above. |
| EU DSS / SignServer-class libraries | Signature-validation or PKI components, not a contract-lifecycle product. Not a substitute for Core API state. |

No stronger maintained OSS self-host candidate was added, because none was evidenced from official sources as materially better for the Core API adapter requirement.

## Decision still required later

Before the first production signing vertical, Owner replies to a future
`DECISION FZ-SIGN-1` after any gaps marked UNKNOWN are re-read from
official docs. Until then, only provider-neutral contract design is in
scope.

This packet does not choose Documenso, DocuSeal, OpenSign, Autenti or
“no engine”.
