# After FZ-CMS-1 — CMS implementation backlog

Status: READY only after `DECISION FZ-CMS-1: OPTION X` is recorded.
Until then this file is a plan, not authorization.

Do not start these slices before the Owner reply. Do not create an
endless agent loop. One bounded slice at a time. Stop at OWNER-ONLY
or DANGEROUS.

## Shared rules for every slice

- Content ≠ CRM. No CMS write path into lead/customer/contract/payment tables.
- Better Auth remains identity. Core API remains domain authorization.
- Synthetic content only until Owner supplies real copy/photos.
- No Docker merely to develop on Windows.
- No Cloudflare/DNS/production mutation.
- FZ-SIGN-1 stays UNDECIDED.
- Lead security-acceptance gaps stay visible.

Every slice below also carries, unless a row says otherwise:

- Security/privacy: unpublished content stays private; no GPS on public
  derivatives; no private project files; no secrets in logs.
- Tests: contract or store tests for the slice behavior; no fake PASS
  for skipped vendor/ZAP/SCA work.
- Docs: update CURRENT-ARCHITECTURE / API-FIRST / DOMAIN-MAP only when
  the slice changes a binding surface; refresh SHA256SUMS after the
  intended tracked set is known.

## Slices

### CMS-ARCH

Dependencies: FZ-CMS-1 recorded.
Gate: REVIEW.
Autonomous: yes.
Accept: selected engine isolated from Core API; published-projection rule written; last-known-good WWW strategy written.
Tests: architecture/contract notes; no runtime CMS install unless the option requires a local engine already allowed by FZ-A1.
Docs: CURRENT-ARCHITECTURE, ADR-015 Accepted, this backlog status.

### CMS-DATA

Dependencies: CMS-ARCH.
Gate: REVIEW.
Autonomous: yes.
Accept: OpenAPI or content-contract for Page, Article, Service, ProjectCaseStudy, MediaAsset, MediaCollection, SiteSettings; Kysely or adapter mapping; no Prisma unless Owner also changed FZ-A3.
Tests: schema/contract tests for the shared types; `businessProjectRef` is opaque.
Docs: API-FIRST, DOMAIN-MAP, inventory.

### CMS-AUTH

Dependencies: CMS-DATA.
Gate: REVIEW.
Autonomous: yes, unless SSO spend appears (OWNER-ONLY).
Accept: editor/publisher/admin/reviewer mapped to `actorId`; unpublished content 401/403; no client-supplied roles.
Tests: anonymous unpublished 401; ungranted 403; no CRM grant implied by a content role.

### CMS-PUBLISH

Dependencies: CMS-AUTH.
Gate: REVIEW.
Autonomous: yes.
Accept: draft isolated; publish deterministic; schedule if selected; revision/rollback; audit; outbox `content.published`.
Tests: draft leak, public stability during edit, rollback, schedule if implemented.

### MEDIA-CORE

Dependencies: CMS-DATA.
Gate: REVIEW.
Autonomous: yes.
Accept: immutable master, checksum, MIME/pixel-bomb, local adapter now, S3/Garage-shaped interface later.
Tests: checksum, denied MIME, storage path not public by default.

### MEDIA-PROCESS

Dependencies: MEDIA-CORE.
Gate: REVIEW.
Autonomous: yes.
Accept: AVIF/WebP/JPEG derivatives, EXIF/GPS strip, CONTAIN/SMART_FILL/ADAPTIVE_LAYOUT, widths from evidence, no silent generative expand.
Tests: GPS absent on public bytes; crop math; master unchanged.

### MEDIA-LIBRARY

Dependencies: MEDIA-PROCESS.
Gate: REVIEW.
Autonomous: yes.
Accept: bulk upload, progress, per-file failure, duplicate checksum, reference-safe delete.
Tests: 30-file batch with one failure isolated; delete blocked when referenced.

### MEDIA-COLLECTIONS

Dependencies: MEDIA-LIBRARY.
Gate: REVIEW.
Autonomous: yes.
Accept: reorder, hero, captions, ALT, focal/safe region, before/after pair, reuse without copying masters.
Tests: reorder persistence; same asset in two collections; one master.

### GALLERY-WWW

Dependencies: MEDIA-COLLECTIONS.
Gate: REVIEW + visual/UX.
Autonomous: yes.
Accept: React Router carousel + lightbox (keyboard, Escape, backdrop, focus trap/restore, reduced motion, derivatives not masters). Prefer MIT `yet-another-react-lightbox` unless a later review rejects it.
Tests: keyboard/focus contract; no original on thumbs.

### BEFORE-AFTER

Dependencies: GALLERY-WWW.
Gate: REVIEW + a11y.
Autonomous: yes.
Accept: mouse/touch/keyboard, labels, matching frame, no pointer-only control.
Tests: keyboard equivalent; matching crop mode.

### CMS-SEO

Dependencies: CMS-PUBLISH.
Gate: REVIEW.
Autonomous: yes.
Accept: title, description, canonical, robots, OG, sitemap, redirects, JSON-LD without invented facts.
Tests: slug change writes redirect; JSON-LD has no placeholder prices.

### CMS-EVENTS

Dependencies: CMS-PUBLISH.
Gate: REVIEW.
Autonomous: yes.
Accept: transactional outbox; webhook signing later; no auto-publish from business Project COMPLETED.
Tests: outbox row with the content write; COMPLETED does not publish.

### CMS-ADMIN

Dependencies: CMS-PUBLISH, MEDIA-LIBRARY.
Gate: REVIEW + UX.
Autonomous: yes if Puck/native or selected admin; stop if a paid visual editor is required (OWNER-ONLY).
Accept: Owner can create a Service and a ProjectCaseStudy without source edits.
Tests: editorial happy path on synthetic data; visual/UX review when UI exists.

### CMS-WWW

Dependencies: CMS-PUBLISH, GALLERY-WWW, CMS-SEO.
Gate: REVIEW + visual/content.
Autonomous: yes.
Accept: WWW reads published projections only; no hard-coded marketing facts; last published snapshot survives editorial outage.
Tests: WWW still renders last snapshot when the editorial store is stopped in lab.

### CMS-HARDEN

Dependencies: CMS-WWW.
Gate: REVIEW.
Autonomous: yes where tools exist.
Accept: XSS/SVG/SSRF/upload tests; ZAP localhost if Java exists else DEFERRED; SCA; log redaction.
Tests: SVG denied or sanitized; unpublished token not in public HTML.

### CMS-PERF

Dependencies: CMS-WWW.
Gate: REVIEW.
Autonomous: yes.
Accept: no original on cards; lazy thumbs; LCP/CLS notes; gallery of 30+ images.
Tests: card src is a derivative width; CLS width/height present.

### CMS-RESTORE

Dependencies: MEDIA-CORE, CMS-DATA.
Gate: REVIEW.
Autonomous: yes on local PostgreSQL.
Accept: DB + media restore of synthetic data. restic/pgBackRest remain later horizons.
Tests: restore read-back of one published case study and its masters.

### CMS-EXPORT

Dependencies: CMS-DATA, MEDIA-CORE.
Gate: REVIEW.
Autonomous: yes.
Accept: structured export of content, slugs, SEO, relations, originals, regeneration rules.
Tests: export omits private GPS; re-import or documented remap.

### CMS-ACCEPT

Dependencies: previous slices.
Gate: REVIEW.
Autonomous: report only.
Accept: checklist below. Do not mark security-accepted if ZAP/SCA/ingress remain deferred.

### RETURN-ROADMAP

Dependencies: CMS-ACCEPT.
Gate: AUTO.
Autonomous: yes.
Accept: resume Lead remaining security work and the next product vertical. WWW/Admin content rules stay binding.

## Acceptance checklist (later production)

Content: drafts do not leak; publish deterministic; rollback; schedule; slug/redirect; audit.
Media: master preserved; derivatives reproducible; no GPS; no distortion; focal/safe crop; bulk failure isolation; broken references handled.
Gallery: desktop/mobile, touch/mouse/keyboard, lightbox X/backdrop/Escape, focus, reduced motion, SR labels.
Security: authz, unpublished, upload, XSS, SVG, SSRF, webhook auth, CSRF/CORS, SCA, secrets, logs.
Performance: responsive images, no original overdelivery, lazy, LCP, CLS, cache.
Recovery: DB restore, media restore, export, last-known-good published content.
