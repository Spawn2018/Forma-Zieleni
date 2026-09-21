# FZ-CMS-1 — Content, media and visual publishing

Status: OPEN — OWNER-DECISION. Research date **2026-09-21**. No option
is selected. This packet does not implement a production CMS, mutate
Cloudflare/DNS, authorize spend, or replace Gate A.

Silence is not a decision.

## Decision statement

Choose the long-term Content / Media / Visual Publishing architecture
for Forma Zieleni so later AUTO/REVIEW slices can implement it without
another ChatGPT prompt.

## Why this decision is required

WWW must be editorially managed without source edits and without Cursor
for routine publishing. CMS is still undecided in
[`CURRENT-ARCHITECTURE.md`](./CURRENT-ARCHITECTURE.md). Selecting it
after marketing pages are hard-coded would freeze invented copy into
React Router.

The Owner also needs a media pipeline that preserves originals, strips
GPS, and delivers responsive derivatives. That pipeline is independent
enough that a weak bundled carousel must not veto an otherwise strong
engine.

## Current architecture constraints

Gate A (ADR-014) stays in force:

- FZ-A1: local Windows now; Linux Docker Compose later; no Docker for
  local development; production host undecided.
- FZ-A2: Core API = Hono / Node 24; WWW, Portal, Admin = React Router
  Framework Mode; loaders/actions are BFF adapters.
- FZ-A3: PostgreSQL + Kysely; transactional outbox; no Prisma/Drizzle.
- FZ-A4: local gitignored private storage now; Garage later staging
  direction; public bucket URLs are not authorization.
- FZ-A5: Better Auth now; stable `actorId`; domain BOLA/BFLA/BOPLA in
  Core API only.
- FZ-A6: OpenObserve later; SOPS+age; restic; pgBackRest later; no
  unnecessary local infrastructure.
- FZ-A7: localhost now; Cloudflare later; no Cloudflare/DNS mutation.

FZ-SIGN-1 remains UNDECIDED. The Lead vertical is **not**
security-accepted. Deferred controls stay visible: production ingress,
production secrets, off-site backup, supervised outbox worker, ZAP and
Dependency-Check where unavailable.

Content is not CRM. A CMS must not authorize leads, customers,
contracts, payments or private project files. A public
`ProjectCaseStudy` may hold an opaque `businessProjectRef` only.
Private project/customer media never becomes public automatically.

Target: about 0 PLN/month software licensing for ordinary self-host.
No per-editor, per-entry, per-page or per-transform fee for required
functionality.

## Shared content model (all options)

Canonical lab types: Page, Article, Service, ProjectCaseStudy,
MediaAsset, MediaCollection, SiteSettings. Lifecycle: draft → ready →
scheduled → published → archived. Public revision stays stable while a
new draft is edited. Fit modes: CONTAIN, SMART_FILL, ADAPTIVE_LAYOUT.

Blocks remain design-system components (Hero, Text, TextImage,
ServicesGrid, ProjectGrid, ProjectGallery, BeforeAfter, ArticleGrid,
FAQ, CTA, Contact, MediaGallery). Editors must not inject arbitrary
HTML that breaks accessibility, responsiveness or visual Canon.
Testimonials/awards/prices stay forbidden unless verified.

Exit format: `labs/fz-cms-1/content-model.json` plus original files and
derivative regeneration rules.

## Finalists

The prompt named Payload, Apostrophe, Squidex and native FZ + Puck.
Evidence changed the executable set:

| Option | Product | Why it is a finalist or not |
|---|---|---|
| A | Payload 3.90.1 (MIT) | Node, PostgreSQL, TypeScript, active 2026 releases. Official self-host is free. Visual editing, SSO and publishing workflows are Enterprise. Admin is Next.js-shaped. Figma acquired Payload; core is still claimed MIT/open source. |
| B | ApostropheCMS 4.x (MIT) | In-context visual editing. Official: PostgreSQL is production-supported from **4.31.0**. Mongo remains the older default (SSPL database). Separate identity store. |
| C | Native FZ Content Core + Puck 0.23 (MIT) | Fits Hono, Kysely, Better Auth, React Router Admin. Lab executed. Engineering cost is real. |
| D | Strapi Community 5.x (MIT) | Node + PostgreSQL, draft/publish, media, webhooks, import/export. Content history, review workflows, SSO and live preview beyond community are paid (`$45/mo` Growth starting point on the official 2026 pricing page; SSO add-on listed). |
| E | Defer CMS | Continue Lead/CRM. No production content store. |
| — | Squidex (MIT) | Researched. .NET + official Docker install. SQL/Postgres is early (7.18, Q1 2025). **Documentation-only** here; no Docker was installed. Not an executable finalist. |
| — | Directus 12 (MSCL, source-available) | **Not a finalist.** Official 2026-04-22: Innovation Grant under $5M revenue and 50 employees; registration keys; 4-year GPLv3 conversion. Not OSI-permissive. |
| — | Keystone 6 (MIT) | PostgreSQL via **Prisma**. Conflicts with FZ-A3. |
| — | Wagtail / Umbraco | Extra Python or .NET runtime. Not a Windows-native fit. |

## Versions and sources (2026-09-21)

- Payload: official [get-started](https://payloadcms.com/get-started) (MIT, Node 20.9+, Mongo/Postgres/SQLite); [Figma announcement](https://www.figma.com/blog/payload-joins-figma/); GitHub `payloadcms/payload` v3.90.0/v3.90.1 on 2026-09-18 (3.90.0 notes critical security fixes). GHSA-mmxc-95ch-2j7c / CVE-2026-34748 stored XSS, fixed in 3.78.0.
- Apostrophe: official [deployment](https://apostrophecms.com/guides/deployment-in-apostrophecms) (Postgres from 4.31.0); GHSA-5f64-7vfc-rcx6 (CVE-2026-45011) and GHSA-wf43-fpp3-cf65 (CVE-2026-53608) stored XSS in 2026.
- Strapi: official [pricing](https://strapi.io/pricing-cms) and [self-host](https://strapi.io/hosting); GHSA-pcw7-5633-82vv / CVE-2026-22707 upload MIME bypass, fixed in 5.33.3.
- Directus: official [v12 license](https://directus.com/resources/directus-v12-license-change) (2026-04-22).
- Squidex: official [pricing](https://squidex.io/pricing) MIT self-host; [Q1 2025 SQL](https://www.squidex.io/post/squidex-update-2025-q1).
- Puck: MIT, [0.23](https://puckeditor.com/blog/puck-023) 2026-08-07.
- Lightbox candidate: `yet-another-react-lightbox` 3.32.2 MIT (2026-07-30).

## Recurring cost / paid boundaries

No purchase was made. Official pages:

- Payload self-host: $0 license. Visual editing, SSO, publishing
  workflows: Enterprise / sales, not a public SKU. Self-host remains
  functional without those.
- Apostrophe self-host: $0 license. Managed hosting exists; unused.
- Native: $0 license. Owner time and engineering.
- Strapi Community: $0 license. Growth **$45/month** includes 3 seats
  then **$15/seat/month**. History, review workflows, SSO and live
  preview beyond Community are paid or must be rebuilt.
- Directus: free only inside Innovation Grant / Core limits. Rejected.

Vendor lock-in risk is highest where visual editing or history is
paywalled (Payload Enterprise, Strapi Growth) or where Mongo remains
the operational default (older Apostrophe). Native lock-in is our own
code.

## Infrastructure / runtime

NOW: localhost, existing PostgreSQL binaries if a selected engine needs
them. No Docker installed for this lab. Later Compose staging can host
a CMS process; the origin still sits behind Cloudflare.

| Option | Extra runtime | Windows-local now | RAM/CPU (docs, not measured) |
|---|---|---|---|
| A Payload | Node process + PostgreSQL | Possible without Docker; Next-shaped admin | Typical Node CMS; image work extra |
| B Apostrophe | Node process + PostgreSQL (or Mongo) | Possible; Mongo would add SSPL DB | Typical Node CMS |
| C Native | Same Hono + PostgreSQL as Core API | Lab executed, no extra process | Lowest new process count |
| D Strapi | Node process + PostgreSQL | Possible without Docker | Typical Node CMS |
| E Defer | None | — | — |
| Squidex | .NET + official Docker | Docs-only | Not measured |

## Architecture fit

Core API remains business truth. WWW loaders fetch **published
projections** only. Admin may embed or deep-link an editor. Domain
BOLA stays in Core API.

Preferred isolation: editorial control-plane failure must not take
down the last published WWW snapshot. That means a publication
projection or last-known-good snapshot, not a live draft query on
every public request.

A packaged CMS that stores drafts and published rows in one database
can still satisfy this if WWW reads only a published snapshot written
by FZ on `content.published`.

## PostgreSQL / data

- Payload and Strapi: official PostgreSQL support.
- Apostrophe: PostgreSQL production-supported from 4.31.0; do not
  accept Mongo as the FZ production content store.
- Native: Kysely tables beside, not inside, CRM schemas.
- Keystone rejected for Prisma.
- No CMS table may become the lead/customer/contract ACL.

## Auth / authz

Better Auth stays the platform identity. A CMS with its own users is
acceptable only if editor identities map to a stable `actorId` and
never become CRM ACL.

Payload / Strapi / Apostrophe default to their own user tables. SSO is
paid on Payload Enterprise and Strapi Growth/Enterprise. Native can
reuse Better Auth and Core API grants (`content:edit`,
`content:publish`, `content:review`).

Roles to map later: editor, publisher, admin, optional reviewer.
Client-supplied roles remain forbidden.

A separate CMS admin is operationally acceptable if FZ Admin later
presents a coherent entry point. It is not authorization for CRM.

## Editorial UX

Required Owner tasks (create Service, 30-image ProjectCaseStudy,
reorder, hero/focal, preview, publish, edit without changing public,
rollback, schedule, export):

| Task | Native lab | Payload / Apostrophe / Strapi UIs |
|---|---|---|
| A Create service | Executed in store API | Not started (no vendor install) |
| B 30-image case study | Executed | Not started |
| C Reorder gallery | Executed | Not started |
| D Hero + focal | Focal math executed | UI not started |
| E Desktop/mobile preview | Markup only | Not started |
| F Publish | Executed | Docs: all three have publish |
| G Draft without public change | Executed | Docs: draft/publish exists |
| H Rollback | Executed | Payload versions yes; Strapi history paid; Apostrophe history exists |
| I Schedule | **DEFERRED** in lab | Vendor-dependent; not executed |
| J Export | JSON without bytes | Strapi Community import/export; others need FZ export |

Inference from official docs, not click counts:

- Payload: strong typed collections; visual page building and
  workflows are Enterprise.
- Apostrophe: strongest in-context visual edit; 2026 XSS advisories
  on URL/SEO-like fields.
- Strapi: form-first; history/review paid.
- Native + Puck: controlled blocks. Owner can operate it only after
  FZ builds Admin chrome. Custom code is not “free”.

## Visual editing

Puck 0.23 (MIT, 2026-08-07) is the verified React visual-composition
candidate. It can sit on native Admin or in front of a headless CMS.
It must only expose Canon blocks. Arbitrary HTML is out.

Payload visual editing is Enterprise. Apostrophe is in-context by
default. Strapi is not a visual page builder in Community.

## Structured content

Do not flatten everything to posts. `ProjectCaseStudy` is first-class.
Public locality only. No customer names, private addresses, invoices
or source-project ACLs. `businessProjectRef` is opaque.

Source-level sketches: `labs/fz-cms-1/schemas/`.

## Publishing / versioning

Required: current public revision stable; safe preview; history;
rollback; actor/time audit; publication events; slug/redirects; no
accidental draft publication.

Lab: draft isolation, publish, later draft, rollback, `content.published`
event. Scheduler process **DEFERRED**.

Vendor: all finalists have draft/publish. History/review workflows are
paid on Strapi. Payload publishing workflows are Enterprise. FZ still
owns the published-projection write.

## SEO / discovery

WWW must emit title, description, canonical, robots, OG/Twitter,
sitemap, redirects, JSON-LD without invented facts. Image width/height
and ALT come from MediaAsset. CMS convenience must not disable React
Router SSR.

## Automation / AI-readiness

Preferred flow: content transaction → outbox → revalidation / index /
notify. Business `Project COMPLETED` may request a
`ProjectCaseStudy` **DRAFT** after authorization. It must never
auto-publish customer/private data.

AI may later suggest title, summary, ALT, SEO, tags, gallery order,
focal point. Output is SUGGESTION / DRAFT. Human approval stays the
default. No paid AI API in this slice. MCP is not required to select
a CMS.

## Media pipeline

Required for every option (FZ-owned even if a CMS has transforms):

- Immutable master, checksum, MIME verification, pixel-bomb limit,
  safe storage id, upload actor/time.
- Public derivatives: AVIF/WebP/JPEG fallback, widths 400 / 800 /
  1200 / 1600 / 2400 unless design evidence later changes them.
- EXIF/GPS stripped on public derivatives. Originals not overwritten.
- `picture` / `srcset` / `sizes` / width+height to limit CLS.
- SVG denied until a sanitizer policy exists. HEIC/PDF/video later.

Lab executed crop math and upload denial. AVIF/WebP **byte encoding
DEFERRED**.

## Smart crop / focal / safe region

Geometry: one source cannot fill every frame, show 100% and add no
empty area. Modes:

- CONTAIN: show 100%, no crop.
- SMART_FILL: fill frame from focal point, no distortion.
- ADAPTIVE_LAYOUT: if crop would destroy the composition, layout
  adapts.

Lab: landscape → 1:1 SMART_FILL with focal x=0.2 clamps to the left
edge; focal x=0.8 moves the window right. Equal 16:9 SMART_FILL is
not recorded as a crop. Panorama →
tall frame ADAPTIVE_LAYOUT keeps the full source. AI may suggest
focal points later; it must not silently inpaint or extend.

## Bulk upload / galleries

Lab: 30 synthetic assets on one ProjectCaseStudy, reorder, hero,
export. Vendor multi-select UIs were not started.

MediaCollection reuses MediaAsset ids. Do not duplicate masters.
Variants: carousel, grid, featured+thumbs, before/after, page-builder
gallery block.

## Carousel / lightbox / before-after

Public React components are FZ-owned. A weak CMS carousel is not a
veto. Lab markup: carousel region, dialog, X, prev/next, lazy thumbs,
focus-trap/restore and derivative-not-master contract.

Preferred later library: `yet-another-react-lightbox` 3.32.2 MIT,
subject to a later a11y/bundle review. Before/after is a later REVIEW
slice; no inaccessible pointer-only control.

## Storage / Garage / portability

FZ-A4 stays: local adapter now, S3-compatible / Garage later. CMS
must not bind us to a proprietary media cloud.

Separate buckets/prefixes:

- BUSINESS FILES: contracts, invoices, private customer/project files.
- CONTENT MEDIA: approved public photos, article images, public
  downloads.

If the CMS is removed in three years: recover structured JSON, slugs,
SEO, relationships, originals, regeneration rules, gallery order,
redirects. Lab export omits bytes and records `gpsStripped: true`.

## Security / privacy

Rich text, SVG, preview tokens and unpublished APIs are the main CMS
risks. 2026 advisories exist for Payload, Apostrophe and Strapi. A
selected engine must start on a patched version.

Do not call a candidate “secure” because it is popular. ZAP of a CMS
admin did not run. Lead-slice deferred controls remain deferred.

Private GPS must not appear on public derivatives. Private project
photos never auto-publish.

## Performance / reliability / last-known-good

Critical test: if the editorial CMS is down, WWW must still serve the
last safely published snapshot. Strongly prefer a projection written
on publish, not a live draft-store read.

Image processing cost sits off the public request path. Derivative
generation is a job, not an on-the-fly 6000px resize for a 400px card.

Backup: PostgreSQL + original media. Derivatives are reproducible.
restic / pgBackRest remain later horizons. Lab did not stand them up.

## Native FZ + Puck baseline (not “free”)

`labs/fz-cms-1/native` is the fair comparison, not an imaginary
custom system. Dependency-free. No `sharp`. Not production.

FZ would still have to build: revisions, draft/publish, scheduler,
preview tokens, media library, transforms, focal/safe region,
galleries, redirects, SEO, Admin UX, audit, permissions, search,
export, outbox, last-known-good snapshot.

Strength: one identity, one PostgreSQL, one authorization model, no
paid visual-editor tax, no Next.js CMS admin beside React Router.
Cost: months of REVIEW slices and ongoing maintenance. That cost is
why OPTION C is not automatically cheaper than A/B/D.

## PoCs actually executed vs documentation-only

| Candidate | PoC kind |
|---|---|
| Native Content Core | Executed: store, 30 images, crop math, gallery contract, export |
| Payload | Source-level collections only |
| Apostrophe | Source-level modules only |
| Strapi | Source-level content-types only |
| Squidex | Docs/research only (no Docker / .NET host) |

## Comparison (evidence, not a selection)

| Criterion | A Payload | B Apostrophe | C Native+Puck | D Strapi Community |
|---|---|---|---|---|
| Architecture fit | Headless + extra admin | In-context CMS | Same process as Core API | Headless + extra admin |
| Editor UX | Strong forms; visual paid | Strong visual | Must be built | Forms; history paid |
| Structured types | Excellent | Good | Excellent if we build them | Good |
| Media intelligence | Partial; FZ pipeline still required | Partial; FZ pipeline still required | Lab math only | Partial; FZ pipeline still required |
| Versions | Yes | Yes | Lab yes | History paid |
| Scheduling | Needs FZ or plugin | Needs verification | Must build | Plugin/paid |
| Auth | Own users; SSO paid | Own users | Better Auth | Own users; SSO paid |
| PostgreSQL | Yes | Yes from 4.31.0 | Kysely | Yes |
| License | MIT | MIT | MIT | MIT Community |
| Recurring $ | $0 self-host | $0 self-host | $0 license | $0 or $45+ |
| Exit | JSON + files + FZ export | JSON + files + FZ export | Native export | Official export + FZ |
| Last-known-good | Needs FZ projection | Needs FZ projection | Designed in | Needs FZ projection |
| Maintenance | Vendor + Figma ownership | Vendor | FZ owns all | Vendor |

## Advantages / disadvantages / risks

**A Payload.** Advantage: TypeScript collections, PostgreSQL, active
releases. Disadvantage: Next-shaped admin beside React Router;
visual/SSO/workflows Enterprise; Figma ownership is a long-term
governance question even while MIT is claimed. Risk: paid features
creep; XSS history requires patched versions.

**B Apostrophe.** Advantage: real in-context visual editing on MIT.
Disadvantage: separate identity; Mongo temptation; 2026 stored XSS.
Risk: editors publishing unsafe URL/SEO fields.

**C Native.** Advantage: Gate A fit, Better Auth, one Admin later.
Disadvantage: we build the CMS. Risk: underestimating editor UX and
media work; delayed WWW.

**D Strapi.** Advantage: mature Community draft/publish/media/webhooks.
Disadvantage: history/review/SSO paid; form-first. Risk: Owner later
needs paid Growth for ordinary editorial workflow.

**E Defer.** Advantage: no new surface while Lead security is open.
Disadvantage: WWW stays without a content store; hard-coded copy risk
rises.

## Reversibility / migration

Reversible if FZ owns the published projection and original files.
Irreversible if public pages are authored only inside a vendor format
with no export. First implementation slice must write the shared
model, not vendor-only documents.

Migration path after a later change: export JSON + masters →
regenerate derivatives → remap slugs/redirects → cut WWW to the new
projection.

## Blockers (do not treat as PASS)

- Vendor admin UIs not executed.
- AVIF/WebP encoding not executed.
- HEIC, PDF preview, video not executed.
- Scheduler process not executed.
- ZAP / Dependency-Check of a CMS not executed.
- No Docker, no Cloudflare, no real photos, no purchase.

## Safe work that can continue without this decision

Lead remaining security work. FZ-SIGN-1 stays undecided. No WWW
marketing pages that invent facts. No CMS production install. No
Cloudflare/DNS change. Isolated lab may stay or be deleted after the
reply.

## After a reply

1. Record the decision in this file and ADR-015 (Proposed → Accepted).
2. Update Canon/architecture maps. CMS stays distinct from CRM.
3. Execute [`NEXT-SLICES-CMS.md`](./NEXT-SLICES-CMS.md) in order.
4. Stop only at a genuine OWNER-ONLY / DANGEROUS gate.
5. After CMS-ACCEPT, return to the main product roadmap.

## Options requiring Owner reply

```text
DECISION FZ-CMS-1: OPTION A
```

or `OPTION B`, `OPTION C`, `OPTION D`, or `OPTION E`.

| Option | Meaning |
|---|---|
| A | Payload as the content engine. FZ owns published projections, media privacy pipeline, and WWW/Puck-or-Enterprise visual rules. |
| B | ApostropheCMS as the content engine on PostgreSQL. Harden XSS fields. Map users to Better Auth later. |
| C | Native Content Core in Core API + React Router Admin + Puck. No third-party CMS process. |
| D | Strapi Community as the content engine. Accept that history/review/SSO are paid or must be rebuilt. |
| E | Defer the CMS. Continue Lead/CRM. WWW stays without a production content store. |

Optional one-line constraint, if needed:

```text
VISUAL=puck
MEDIA=fz-pipeline
```

Recommended default if an option is chosen: `MEDIA=fz-pipeline` so
GPS strip, masters and fit modes stay FZ-owned. `VISUAL=puck` if the
selected engine does not already provide a Canon-safe visual editor.
These are constraints, not a hidden winner.
