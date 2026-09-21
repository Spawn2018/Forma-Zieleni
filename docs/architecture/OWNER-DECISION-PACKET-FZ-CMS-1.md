# FZ-CMS-1 — Content, media and visual publishing

Status: OPEN — OWNER-DECISION. Research date **2026-09-21**. Finalist
validation lab also **2026-09-21**. No option is selected. This packet
does not implement a production CMS, mutate Cloudflare/DNS, authorize
spend, or replace Gate A.

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

The first lab was research plus a Native + Puck-shaped PoC. This
validation lab added executed media bytes, last-known-good, React
gallery/before-after prototypes, and isolated vendor API attempts. It
is still **not** a selection.

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
Evidence did **not** silently replace the shortlist.

| Option | Product | Why it is a finalist or not |
|---|---|---|
| A | Payload 3.90.1 (MIT) | Node, PostgreSQL, TypeScript, active 2026 releases. Official self-host is free. Visual editing, SSO and publishing workflows are Enterprise. Admin is Next.js-shaped. Figma acquired Payload; core is still claimed MIT/open source. |
| B | ApostropheCMS 4.32.2 (MIT) | In-context visual editing. Official: PostgreSQL is production-supported from **4.31.0**. Mongo remains supported and is excluded for FZ production. Official unattended starter is an Astro frontend + Apostrophe backend. |
| C | Native FZ Content Core + Puck 0.23 (MIT) | Fits Hono, Kysely, Better Auth, React Router Admin. Lab executed. Engineering cost is real. |
| D | Strapi Community 5.54.0 (MIT) | Node + PostgreSQL, draft/publish, media, webhooks, import/export. Content history, review workflows, live preview and SSO beyond Community are paid. Remains a finalist **and** a paid-feature benchmark. |
| E | Defer CMS | Continue Lead/CRM. No production content store. |
| — | Squidex (MIT) | Researched. .NET + official Docker install. **Documentation-only**; no Docker was installed. Not an executable finalist. |
| — | Directus 12 (MSCL, source-available) | **Not a finalist.** Official 2026-04-22: Innovation Grant under $5M revenue and 50 employees; registration keys; 4-year GPLv3 conversion. Not OSI-permissive. |
| — | Keystone 6 (MIT) | PostgreSQL via **Prisma**. Conflicts with FZ-A3. |
| — | Wagtail / Umbraco | Extra Python or .NET runtime. Not a Windows-native fit. |

## Versions and sources (2026-09-21)

- Payload: official [what-is-payload](https://payloadcms.com/docs/getting-started/what-is-payload) now calls Payload “the Next.js fullstack framework”; [enterprise](https://payloadcms.com/enterprise) still markets Visual Editor, SSO and publishing workflows. GitHub `payloadcms/payload` v3.90.1. Blank lab template also pulled Next **16.3.3** and sharp **0.35.4**.
- Apostrophe: official [deployment](https://apostrophecms.com/guides/deployment-in-apostrophecms) — MongoDB and PostgreSQL are both production-supported; PostgreSQL from **4.31.0**; SQLite is local-dev recommended. Installed starter resolved `apostrophe@4.32.2`.
- Strapi: official [pricing](https://strapi.io/pricing-cms) re-scraped 2026-09-21. Community remains MIT/free with draft/publish, media, webhooks, import/export. Growth **$45/month** includes 3 seats then **$15/seat/month**, Live Preview, Releases, **Content History 14-day retention**. SSO add-on **$150/month + $50/seat**. Review Workflows + Audit Logs are Enterprise.
- Puck: MIT, `@puckeditor/core` **0.23.0** (2026-08-07). Do not use stale `@measured/puck` 0.20.2 or unrelated npm `puck`.
- Lightbox: `yet-another-react-lightbox` **3.32.2** MIT.
- Before/after: `react-compare-slider` **4.0.0** MIT.
- Image processor executed: `sharp` **0.34.5** (Apache-2.0, libvips). npm latest on the research day was 0.35.4.

## What was actually executed vs documentation-only

| Candidate | Executed in this validation lab | Documentation-only / not executed |
|---|---|---|
| A Payload 3.90.1 | Isolated blank template scaffolded on Windows without Docker. Shared collections added in the removable tree. `pnpm install` completed (Next 16.3.3 + Payload). Local API created Service/Page/Article/ProjectCaseStudy. Publish then later draft left the published title unchanged. First harness attempts failed on missing `PAYLOAD_SECRET` load order, then succeeded. | Admin UI, media upload UI, versions UI, export UI, Next `dev` server. Do not call the admin an executed editor PoC. |
| B Apostrophe 4.32.2 | Official unattended `apostrophe-astro-demo` installed. SQLite adapter. Task API created Service, Article and ProjectCaseStudy. | Admin / in-context UI, media upload UI, Astro frontend, PostgreSQL adapter, draft isolation (see below). |
| C Native + Puck | Store, draft/publish/rollback, 30-asset gallery, last-known-good projection, crop math, sharp WebP/AVIF, GPS strip, React gallery + before/after prototypes. | Puck visual chrome in Admin, scheduler process, browser-verified focus trap/swipe/pinch. |
| D Strapi 5.54.0 | Isolated app scaffolded. First `pnpm install` crashed Windows **exit 3221226505** under parallel load; retry succeeded. `better-sqlite3` needed an explicit prebuild because pnpm 10 skipped install scripts. Document Service created Service/Page/Article/ProjectCaseStudy. Publish then later draft left the published title unchanged. | Admin UI, media upload UI, export UI, history UI (paid). |
| Squidex | None | Docs only. No Docker / .NET host. |

Exact vendor evidence files: `labs/fz-cms-1/evidence/*-exercise.json`.

## Option A — Payload

- **Editor experience:** Official admin is a Next.js app. Default Media
  collection is `upload: true` with `read: () => true` in the blank
  template (public-read unless FZ tightens access). Forms/collections
  are the free path. Visual page building is Enterprise.
- **Free vs paid:** Self-host MIT $0. Visual Editor, SSO, publishing
  / approval workflows: Enterprise (no public SKU). Live Preview is
  listed on the OSS getting-started page and Visual Editor is listed on
  the Enterprise page; those are **not collapsed** into one cell.
- **Architecture impact:** Extra Node/Next process beside Hono + three
  React Router apps. Official Postgres adapter uses vendor-internal
  Drizzle and does **not** replace FZ-A3 Kysely for Core API.
- **Identity:** Own users. SSO paid. Better Auth can only front or map
  `payloadUserId → actorId`. Separate editor identities unless a custom
  bridge is built.
- **Media / FZ pipeline:** Official uploads include resizing and
  focal-point cropping. FZ still owns GPS strip, immutable masters,
  Canon fit modes, and public vs business-file isolation.
- **Visual editing:** PAID native visual editor, or CUSTOM FZ Puck in
  front of headless collections.
- **Gallery/lightbox:** Not a Payload built-in public WWW concern. FZ
  React prototype path applies.
- **Publishing/versioning:** Drafts/versions are OSS. Review workflow
  is Enterprise. See matrix below.
- **Automation:** Hooks exist. FZ still owns outbox /
  `content.published` and must not auto-publish CRM completion.
- **Outage:** Needs an FZ published projection. Live admin/DB read on
  every WWW request is not last-known-good.
- **Portability:** Export is CUSTOM FZ unless a later plugin is
  verified. Collections are TypeScript, not opaque, but versions and
  Lexical rich text are vendor-shaped.
- **Security:** 2026 stored XSS history (fixed in 3.78.0+). Blank
  Media `read: () => true` is a lab finding. Next attack surface is
  new versus Gate A.
- **Operational burden:** Payload + Next + SQLite-now/Postgres-later +
  uploads + sharp. Two upgrade clocks (Payload and Next).
- **Custom FZ required:** published projection, Better Auth map, GPS
  pipeline, WWW, Canon blocks, export, outbox. Visual editor unless
  Enterprise.
- **Advantages:** Typed collections, OSS drafts/versions, PostgreSQL,
  active releases, focal helpers.
- **Disadvantages:** Next.js admin beside React Router; Figma
  ownership; paid visual/SSO/workflows; first Local API boot is slow
  and secret-sensitive. Admin UI was not started.
- **Migration/reversibility:** Reversible if FZ owns projection +
  masters. Irreversible if pages live only as Lexical/Next admin
  state.

## Option B — ApostropheCMS on PostgreSQL

- **Editor experience:** Strongest MIT in-context visual editing.
  Official starter also ships Astro, demo widgets including
  `price-card-widget` (Canon-forbidden prices if used as-is), and a
  default Express API key in the starter.
- **Free vs paid:** Self-host MIT $0. Managed hosting unused.
- **Architecture impact:** Apostrophe process + optional Astro
  frontend. Production DB must be PostgreSQL (4.31.0+). Lab executed
  SQLite, not Postgres. Mongo remains a temptation and is excluded.
- **Identity:** `@apostrophecms/user` is separate. SSO not verified as
  free. Better Auth mapping required. In-context sessions stay
  Apostrophe.
- **Media / FZ pipeline:** Official attachments have focal helpers in
  the Astro bridge. FZ still owns GPS strip and Canon derivatives.
- **Visual editing:** FREE OSS in-context.
- **Gallery/lightbox:** WWW still FZ-owned. Starter image widgets are
  not the public gallery contract.
- **Publishing/versioning:** Draft/published locales exist. The lab
  task used `apos.task.getReq()` and inserted `:en:published` ids, so
  a later update changed the published title. That is a **harness
  limitation**, not a verified product defect. Editor-UI draft
  isolation remains NOT TESTED.
- **Automation:** Piece events exist. FZ still owns outbox.
- **Outage:** Needs FZ published projection. Astro SSR talking live to
  Apostrophe is not last-known-good.
- **Portability:** `@apostrophecms/import-export` is in the starter.
  Vendor areas/widgets are opaque. FZ export still required for a
  clean exit.
- **Security:** 2026 stored XSS advisories on URL/SEO-like fields.
  Starter ships a session secret and admin API key in module source
  (lab-only tree; must not be copied to production).
- **Operational burden:** Apostrophe + Vite/assets + (starter) Astro +
  PostgreSQL + uploads. Two frontends if the Astro kit is kept.
- **Custom FZ required:** Postgres wiring, identity map, projection,
  GPS pipeline, Canon blocks replacing demo widgets, XSS hardening.
- **Advantages:** Real visual editing without a paid SKU; PG now
  officially supported; SEO/sitemap/import-export modules exist.
- **Disadvantages:** Extra identity; extra Astro stack in the official
  starter; Mongo gravity; draft isolation not proven in this lab; XSS
  history.
- **Migration/reversibility:** Reversible with FZ projection +
  originals. Widget areas are the lock-in if WWW renders them
  directly.

## Option C — Native FZ + Puck

- **Editor experience:** None until CMS-ADMIN. Lab is a store +
  prototypes, not an Owner-usable admin.
- **Free vs paid:** $0 license. Owner time is the cost.
- **Architecture impact:** Same Hono + PostgreSQL + React Router
  Admin. No extra CMS process.
- **Identity:** Better Auth `actorId` directly. No second user table.
- **Media / FZ pipeline:** Executed in-lab: WebP/AVIF bytes, GPS
  strip, CONTAIN / SMART_FILL / ADAPTIVE_LAYOUT, responsive widths.
- **Visual editing:** Puck 0.23 MIT, Canon blocks only.
- **Gallery/lightbox:** Isolated React prototype +
  `yet-another-react-lightbox` 3.32.2 resolved. Browser swipe/pinch
  DEFERRED.
- **Publishing/versioning:** Lab executed draft isolation, publish,
  later draft, rollback, last-known-good snapshot. Scheduler
  DEFERRED.
- **Automation:** Lab emits `content.published`. Outbox worker remains
  the Lead deferred shape.
- **Outage:** Executed: `publishedProjection(store)` then
  `servePublished(snapshot)` after an empty editorial store still
  served the published Service, not the later draft.
- **Portability:** Native JSON export omits bytes and GPS.
- **Security:** Smallest new vendor surface. Upload/XSS/SVG still
  FZ-owned. No vendor CMS advisories, but we own all bugs.
- **Operational burden:** Lowest new process count; highest FZ code
  ownership.
- **Custom FZ required:** Essentially the entire CMS.
- **Advantages:** Gate A fit; one identity; last-known-good designed
  in; no paid visual-editor tax.
- **Disadvantages:** Months of REVIEW slices; no usable editor today.
- **Migration/reversibility:** Highest. The model is already FZ.

## Option D — Strapi Community

- **Editor experience:** Form-first admin. Community has media
  library, draft/publish, RBAC. History, live preview, releases,
  review, audit, SSO are paid.
- **Free vs paid:** See official 2026-09-21 pricing scrape above.
  Hard requirements that are paid: revision history / rollback,
  review workflow, audit trail, live preview, SSO, Releases
  (scheduled bundles). Those can be rebuilt as CUSTOM FZ, but then
  Community is no longer cheaper than native for those cells.
- **Architecture impact:** Extra Strapi Node process + PostgreSQL.
  Admin is React 18 + Vite, not Next, and not React Router.
- **Identity:** Strapi admin users ≠ users-permissions. SSO is paid.
  Better Auth can only map.
- **Media / FZ pipeline:** Community media library exists. Official
  provider is local uploads. FZ still owns GPS/derivatives.
- **Visual editing:** NOT AVAILABLE in Community. Puck would be
  CUSTOM FZ.
- **Gallery/lightbox:** FZ WWW path.
- **Publishing/versioning:** Draft/publish FREE OSS. History 14 days
  on Growth. Review/audit Enterprise.
- **Automation:** Webhooks FREE OSS. FZ still owns outbox and must
  not treat a webhook as authorization.
- **Outage:** Needs FZ published projection.
- **Portability:** Official Data Import/Export/Transfer is Community.
  Vendor documentIds remain.
- **Security:** GHSA-pcw7-5633-82vv / CVE-2026-22707 upload MIME
  bypass, fixed in 5.33.3; lab target is 5.54.0. Users-permissions is
  a second auth surface.
- **Operational burden:** Strapi + admin build + SQLite-now/Postgres
  + uploads. Isolated install is large (~1200 packages) and crashed
  once on this Windows machine under parallel load.
- **Custom FZ required:** projection, identity map, history/rollback
  if we refuse Growth, Puck, GPS pipeline, WWW.
- **Advantages:** Mature Community draft/publish/media/export;
  PostgreSQL; no Next.js requirement.
- **Disadvantages:** Paid cells for history/preview/SSO/review; form
  first; install/boot weight.
- **Migration/reversibility:** Official export helps. Still need FZ
  projection for a clean exit.
- **Benchmark note:** D stays a finalist. It is materially weaker on
  **free** history/rollback/SSO/review/live preview. That is a
  documented paid boundary, not a silent drop.

## Option E — Defer

Valid. Lead is not security-accepted. Deferring avoids a new control
plane while CRM hardening continues. Cost: WWW still has no content
store; hard-coded copy risk rises.

## Editorial workflow (A–Q)

Labels are only: WORKS IN FREE OSS UI | WORKS THROUGH API/CODE ONLY |
REQUIRES CUSTOM FZ CODE | PAID ONLY | NOT AVAILABLE | NOT TESTED.

No invented click counts.

| Task | Native | Payload | Apostrophe | Strapi Community |
|---|---|---|---|---|
| A Create Service | API/CODE (lab store) | API/CODE | API/CODE (task insert) | API/CODE |
| B Create Page | API/CODE | API/CODE | NOT TESTED (module present; no page insert) | API/CODE |
| C Create Article | API/CODE | API/CODE | API/CODE | API/CODE |
| D Create ProjectCaseStudy | API/CODE | API/CODE | API/CODE | API/CODE |
| E Upload multiple media | API/CODE synthetic | NOT TESTED | NOT TESTED | NOT TESTED |
| F Create/reorder gallery | API/CODE | NOT TESTED | NOT TESTED | NOT TESTED |
| G Select hero | API/CODE | NOT TESTED | NOT TESTED | NOT TESTED |
| H ALT/caption | API/CODE | NOT TESTED | NOT TESTED | NOT TESTED |
| I Focal point | API/CODE math + sharp | NOT TESTED UI; OSS docs claim focal crop | NOT TESTED UI; starter has focal helpers | NOT TESTED |
| J Preview | Markup/proto only | NOT TESTED (OSS vs Enterprise unclear) | NOT TESTED | PAID ONLY (Live Preview) |
| K Publish | API/CODE | API/CODE | API/CODE (`:en:published` ids) | API/CODE |
| L Edit draft without changing public | API/CODE + LKG test | API/CODE | NOT TESTED (task req wrote published) | API/CODE |
| M Revision/history | API/CODE | NOT TESTED UI; OSS versions exist | NOT TESTED | PAID ONLY |
| N Rollback | API/CODE | NOT TESTED UI; OSS versions exist | NOT TESTED | PAID ONLY |
| O Schedule publication | NOT TESTED / DEFERRED | NOT TESTED | NOT TESTED | PAID ONLY (Releases) |
| P SEO fields | API/CODE | NOT TESTED | NOT TESTED (seo module present) | NOT TESTED |
| Q Export content | API/CODE JSON | NOT TESTED | NOT TESTED (import-export module present) | NOT TESTED (Community feature exists) |

## Publishing matrix

Cells use only FREE OSS / CUSTOM FZ / PAID / NOT AVAILABLE / NOT VERIFIED.
Source: `labs/fz-cms-1/evidence/publishing-matrix.json`.

| Capability | A Payload | B Apostrophe | C Native | D Strapi Community |
|---|---|---|---|---|
| draft | FREE OSS | FREE OSS | CUSTOM FZ | FREE OSS |
| preview | NOT VERIFIED | FREE OSS | CUSTOM FZ | PAID |
| publish | FREE OSS | FREE OSS | CUSTOM FZ | FREE OSS |
| unpublish | FREE OSS | FREE OSS | CUSTOM FZ | FREE OSS |
| scheduled publish | NOT VERIFIED | NOT VERIFIED | CUSTOM FZ | PAID |
| revision history | FREE OSS | FREE OSS | CUSTOM FZ | PAID |
| diff | NOT VERIFIED | NOT VERIFIED | CUSTOM FZ | PAID |
| rollback | FREE OSS | NOT VERIFIED | CUSTOM FZ | PAID |
| review workflow | PAID | NOT VERIFIED | CUSTOM FZ | PAID |
| audit trail | NOT VERIFIED | NOT VERIFIED | CUSTOM FZ | PAID |
| visual editing | PAID | FREE OSS | CUSTOM FZ | NOT AVAILABLE |

## Auth / Better Auth

Better Auth remains platform identity. Source:
`labs/fz-cms-1/evidence/auth-matrix.json`.

| | Local CMS users | OIDC/OAuth/SSO | Better Auth integration | Separate editor identities | actorId |
|---|---|---|---|---|---|
| A | FREE OSS | PAID | CUSTOM FZ front/map | yes | map `payloadUserId` |
| B | FREE OSS | NOT VERIFIED | CUSTOM FZ map | yes | map Apostrophe user |
| C | CUSTOM FZ | CUSTOM FZ | same Better Auth | no | session actor |
| D | FREE OSS | PAID | CUSTOM FZ map | yes | map Strapi admin user |

Coherent FZ Admin SSO on A or D requires a **paid** vendor feature or
a custom bridge. Flag those options if the Owner wants one login
without custom identity work.

## Media pipeline — executed

Processor: **sharp 0.34.5** (libvips). Verified by generating bytes,
not by assuming the package name.

Executed evidence (`labs/fz-cms-1/evidence/media-bytes.json`,
`exif-gps.json`):

- High-res synthetic master 3600×2400 JPEG, 68843 bytes.
- Card CONTAIN 400×267: WebP 560 B, AVIF 465 B. Card is not the
  original.
- AVIF files contain the `avif` brand; `sharp.metadata()` reports
  `heif`. Do not treat that metadata string as a wrong MIME on disk.
- Regeneration of the same WebP checksum was deterministic in-lab.
- Orientation defaulted to 1 on the synthetic master.
- No perceptual-quality claim is made from byte size.

Public derivatives **must not** leak GPS. Synthetic JPEG GPS
`12.345678, 98.765432` was present on the master (EXIF + ASCII
markers) and absent on WebP/AVIF/JPEG derivatives. Master bytes are
preserved separately.

Responsive widths remain 400 / 800 / 1200 / 1600 / 2400.

Garage was **not** stood up. FZ-A4 still applies: local adapter now,
S3/Garage later. CMS-native storage must not become the public ACL.

## Smart composition — executed

Geometry still forbids claiming that one source can fill every frame,
show 100%, and add no empty area.

- CONTAIN: landscape, panorama keep full source (`cropped: false`).
- SMART_FILL: landscape 1600×900 → 1:1, focal left/center/right move
  `x` left-to-right; portrait 900×1600 → 1:1 crops height; square
  1200×1200 → 1:1 is not a crop.
- Safe-region constraint shifts the window so the safe box stays
  inside the crop when the crop is wide enough.
- ADAPTIVE_LAYOUT: 2400×600 into a tall 0.6 target keeps the full
  source and sets `layoutAdapts`.
- Subject-aware/AI crop was researched and **not** added.

## Bulk media

Native store: 30 synthetic assets on one ProjectCaseStudy, reorder,
hero, export. That is a store operation, not a vendor picker.

Vendor/editor 30-file picker, progress, per-file failure: **NOT
TESTED**. Reasoning for 100 images: without virtualized lists and
async derivative jobs, an admin table of 100 originals will hitch;
processing must stay off the public request path; FZ should ingest
with per-file isolation and never send 6000 px to a card. Do not
generate a wasteful 100-file fixture to prove that sentence.

## Gallery / lightbox / before-after

Isolated React proto: `labs/fz-cms-1/www-proto`.

- Gallery: carousel region, lazy thumbs except first, derivative
  `w400.webp`.
- Lightbox contract: X, Escape, backdrop, image click does not close,
  prev/next, count, `w1600.webp`, no `master`.
- Library resolved: `yet-another-react-lightbox@3.32.2`. Zoom plugin
  path recorded; pinch/pan **NOT TESTED** in a browser.
- Vanilla `demo.html` implements dialog + focus restore + backdrop +
  image-click isolation. Native `<dialog>` supplies Escape.
- Before/after: labelled `input type="range"` plus
  `react-compare-slider@4.0.0` (docs: keyboard + touch).
- Automated DOM/component: executed. Browser swipe/touch/focus-trap
  depth: **DEFERRED**.

## CMS outage / last-known-good

Executed in native lab: publish Service → snapshot
`publishedProjection` → new empty editorial store cannot read the
draft → `servePublished(snapshot)` still returns the published title.

Smallest architecture-valid mechanism: write a published projection
on `content.published`; WWW reads only that snapshot. No Redis/CDN
platform was introduced.

Packaged CMS options still need this FZ write. A live draft DB is not
an outage design.

## Cost of ownership (relative engineering surface)

Zero license is not zero cost. No PLN rates invented.

| Surface | A Payload | B Apostrophe | C Native | D Strapi |
|---|---|---|---|---|
| Runtime processes | Payload/Next + PG | Apostrophe (+ Astro if starter) + PG | Hono already planned | Strapi + PG |
| Database | PG (vendor Drizzle internally) | PG 4.31+ (lab used SQLite) | Kysely/PG | PG |
| Backup | PG + originals + Next/app | PG + originals + uploads | PG + originals | PG + originals + uploads |
| Upgrade surface | Payload + Next | Apostrophe + Vite/Astro | FZ code only | Strapi major trains |
| Security patches | Vendor + Next + XSS history | Vendor + XSS history | FZ-owned | Vendor + upload advisory history |
| Extra stack | Next 16 admin | Official starter Astro | Puck | Strapi admin Vite |
| Identity burden | map + paid SSO | map | none extra | map + paid SSO |
| Media burden | FZ pipeline still | FZ pipeline still | FZ pipeline (already prototyped) | FZ pipeline still |
| Visual editing burden | paid or Puck | included; harden | Puck + Admin | Puck |
| Maintenance | High vendor+Next | High vendor+optional Astro | High FZ code | High vendor |

## Portability / export

Native export recovers content, slugs, SEO, relationships, media
references, gallery order, revision ids. It omits original bytes
(regenerate from stored masters) and GPS.

Vendor exports were **not** executed (Payload timeout; Apostrophe
module present unused; Strapi install incomplete). Expected vendor
opaque state: Lexical JSON (Payload), widget areas (Apostrophe),
Strapi `documentId` drafts. FZ projection + original files remain the
exit hatch.

## Security / SCA

- Rechecked official pages and known 2026 advisories for the tested
  version lines. A selected engine must start patched.
- `pnpm audit` of the **repo** is part of the final gate. Isolated
  vendor `node_modules` stay gitignored and were not committed.
- ZAP: **DEFERRED** (Java not installed; no public expose). Do not
  install heavyweight DAST solely for this lab.
- Upload/rich-text/preview boundaries: Payload blank Media is
  public-read; Apostrophe starter API key is admin; Strapi
  users-permissions is a second door; preview tokens must never appear
  in public HTML. None of those UIs were attack-tested.
- No customer photographs. No public bind.

## Recurring cost / paid boundaries

No purchase was made.

- Payload self-host: $0. Visual/SSO/publishing workflows: Enterprise.
- Apostrophe self-host: $0.
- Native: $0 license.
- Strapi Community: $0. Growth $45/mo + seats; Content History 14
  days; SSO add-on $150/mo + $50/seat; Review/Audit Enterprise.

## Infrastructure / runtime

NOW: localhost. Existing PostgreSQL binaries at
`D:\OMNIROUTE\tools\pg16` were **not** used for vendor labs (SQLite
only). No Docker installed for this lab. Payload's template
`Dockerfile` / `docker-compose.yml` were not run.

## Visual + media subdecisions

The CMS engine, the visual editor, and the media pipeline are
composable. Prefer not forcing one vendor to own every concern.

If the Owner wants to bind constraints with the engine:

```text
DECISION FZ-CMS-1: OPTION X
VISUAL=puck
MEDIA=fz-pipeline
```

`VISUAL=` values that are valid without a new research round:
`puck` | `vendor-native` | `later`.

`MEDIA=` values: `fz-pipeline` | `vendor-native` | `hybrid`.

Recommended default **if** an engine is chosen: `MEDIA=fz-pipeline`
(GPS, masters, fit modes stay FZ-owned). Use `VISUAL=puck` when the
engine has no Canon-safe free visual editor (A without Enterprise, C,
D). `VISUAL=vendor-native` is only coherent for B, or for A if the
Owner also accepts Enterprise visual editing. These are constraints,
not a hidden winner. Do not invent extra questions.

## After a reply

Cursor must do this without a new ChatGPT prompt. Binding procedure:
[`NEXT-SLICES-CMS.md`](./NEXT-SLICES-CMS.md).

1. Validate `DECISION FZ-CMS-1: OPTION A|B|C|D|E` plus optional
   `VISUAL=` / `MEDIA=`. Silence or two options is invalid.
2. Record this packet Status: DECIDED and POST-V2 item 24.
3. Accept/update ADR-015.
4. Update CURRENT-ARCHITECTURE CMS line. Do not change Gate A,
   FZ-SIGN-1, or Lead security-acceptance.
5. Select first READY slice (`CMS-ARCH`).
6. Execute AUTO/REVIEW slices in order.
7. Stop only at genuine OWNER-DECISION / OWNER-ONLY / DANGEROUS.
8. Continue otherwise through CMS-ACCEPT.
9. `RETURN-ROADMAP` returns to the main execution roadmap.
10. CMS completion does **not** erase deferred Lead security
    obligations.

## Options requiring Owner reply

```text
DECISION FZ-CMS-1: OPTION A
```

or `OPTION B`, `OPTION C`, `OPTION D`, or `OPTION E`.

| Option | Meaning |
|---|---|
| A | Payload as the content engine. FZ owns published projections, media privacy pipeline, and WWW/Puck-or-Enterprise visual rules. |
| B | ApostropheCMS as the content engine on PostgreSQL. Harden XSS fields. Map users to Better Auth later. Do not keep Mongo. |
| C | Native Content Core in Core API + React Router Admin + Puck. No third-party CMS process. |
| D | Strapi Community as the content engine. Accept that history/review/SSO/live preview are paid or must be rebuilt. |
| E | Defer the CMS. Continue Lead/CRM. WWW stays without a production content store. |

Optional constraints:

```text
VISUAL=puck
MEDIA=fz-pipeline
```

## Safe work that can continue without this decision

Lead remaining security work. FZ-SIGN-1 stays undecided. No WWW
marketing pages that invent facts. No CMS production install. No
Cloudflare/DNS change. Isolated lab may stay or be deleted after the
reply.

## Blockers (do not treat as PASS)

- Vendor **admin UIs** not executed (Payload/Strapi Local/Document
  APIs only; Apostrophe task API only).
- Scheduler process not executed.
- Browser-level lightbox swipe/pinch/focus-trap depth DEFERRED.
- ZAP / Dependency-Check of a running CMS admin DEFERRED.
- HEIC, PDF preview, video not executed.
- No Docker, no Cloudflare, no real photos, no purchase.
