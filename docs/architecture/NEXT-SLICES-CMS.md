# After FZ-CMS-1 — CMS implementation backlog

Status: READY only after `DECISION FZ-CMS-1: OPTION X` is recorded.
Until then this file is a plan, not authorization.

Do not start these slices before the Owner reply. Do not create an
endless agent loop. One bounded slice at a time. Stop at OWNER-ONLY
or DANGEROUS.

## After the Owner reply

Cursor must do this without a new ChatGPT prompt:

1. Validate `DECISION FZ-CMS-1: OPTION A|B|C|D|E` plus optional
   `VISUAL=` / `MEDIA=` against
   [`OWNER-DECISION-PACKET-FZ-CMS-1.md`](./OWNER-DECISION-PACKET-FZ-CMS-1.md).
   Silence or a second option is invalid.
2. Record the reply in the packet (Status: DECIDED) and POST-V2 item 24.
3. Set ADR-015 to Accepted with the chosen option and constraints.
4. Update CURRENT-ARCHITECTURE CMS line from OPEN to the recorded option.
   Do not change Gate A, FZ-SIGN-1, or Lead security-acceptance.
5. Start CMS-ARCH. Then execute AUTO/REVIEW slices in order.
6. Stop only at a genuine OWNER-DECISION / OWNER-ONLY / DANGEROUS gate.
7. After CMS-ACCEPT, execute RETURN-ROADMAP. Lead deferred controls stay
   visible.

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
Entry: packet Status is DECIDED; ADR-015 still Proposed until this slice records it.
Accept: selected engine isolated from Core API; published-projection rule written; last-known-good WWW strategy written.
Tests: architecture/contract notes; no runtime CMS install unless the option requires a local engine already allowed by FZ-A1.
Docs: CURRENT-ARCHITECTURE, ADR-015 Accepted, this backlog status.
Next: CMS-DATA.

### CMS-DATA

Dependencies: CMS-ARCH.
Gate: REVIEW.
Autonomous: yes.
Entry: CMS-ARCH recorded.
Accept: OpenAPI or content-contract for Page, Article, Service, ProjectCaseStudy, MediaAsset, MediaCollection, SiteSettings; Kysely or adapter mapping; no Prisma unless Owner also changed FZ-A3.
Tests: schema/contract tests for the shared types; `businessProjectRef` is opaque.
Docs: API-FIRST, DOMAIN-MAP, inventory.
Next: CMS-AUTH and MEDIA-CORE may start after this.

### CMS-AUTH

Dependencies: CMS-DATA.
Gate: REVIEW.
Autonomous: yes, unless SSO spend appears (OWNER-ONLY).
Entry: CMS-DATA recorded.
Accept: editor/publisher/admin/reviewer mapped to `actorId`; unpublished content 401/403; no client-supplied roles.
Tests: anonymous unpublished 401; ungranted 403; no CRM grant implied by a content role.
Next: CMS-PUBLISH. Stop if the recorded option requires paid SSO (OWNER-ONLY).

### CMS-PUBLISH

Dependencies: CMS-AUTH.
Gate: REVIEW.
Autonomous: yes.
Entry: CMS-AUTH recorded.
Accept: draft isolated; publish deterministic; schedule if selected; revision/rollback; audit; outbox `content.published`.
Tests: draft leak, public stability during edit, rollback, schedule if implemented.
Next: CMS-SEO, CMS-EVENTS, CMS-ADMIN.

### MEDIA-CORE

Dependencies: CMS-DATA.
Gate: REVIEW.
Autonomous: yes.
Entry: CMS-DATA recorded.
Accept: immutable master, checksum, MIME/pixel-bomb, local adapter now, S3/Garage-shaped interface later.
Tests: checksum, denied MIME, storage path not public by default.
Next: MEDIA-PROCESS.

### MEDIA-PROCESS

Dependencies: MEDIA-CORE.
Gate: REVIEW.
Autonomous: yes.
Entry: MEDIA-CORE recorded.
Accept: AVIF/WebP/JPEG derivatives, EXIF/GPS strip, CONTAIN/SMART_FILL/ADAPTIVE_LAYOUT, widths from evidence, no silent generative expand.
Tests: GPS absent on public bytes; crop math; master unchanged.
Next: MEDIA-LIBRARY.

### MEDIA-LIBRARY

Dependencies: MEDIA-PROCESS.
Gate: REVIEW.
Autonomous: yes.
Entry: MEDIA-PROCESS recorded.
Accept: bulk upload, progress, per-file failure, duplicate checksum, reference-safe delete.
Tests: 30-file batch with one failure isolated; delete blocked when referenced.
Next: MEDIA-COLLECTIONS.

### MEDIA-COLLECTIONS

Dependencies: MEDIA-LIBRARY.
Gate: REVIEW.
Autonomous: yes.
Entry: MEDIA-LIBRARY recorded.
Accept: reorder, hero, captions, ALT, focal/safe region, before/after pair, reuse without copying masters.
Tests: reorder persistence; same asset in two collections; one master.
Next: GALLERY-WWW.

### GALLERY-WWW

Dependencies: MEDIA-COLLECTIONS.
Gate: REVIEW + visual/UX.
Autonomous: yes.
Entry: MEDIA-COLLECTIONS recorded.
Accept: React Router carousel + lightbox (keyboard, Escape, backdrop, focus trap/restore, reduced motion, derivatives not masters). Prefer MIT `yet-another-react-lightbox` unless a later review rejects it.
Tests: keyboard/focus contract; no original on thumbs.
Next: BEFORE-AFTER.

### BEFORE-AFTER

Dependencies: GALLERY-WWW.
Gate: REVIEW + a11y.
Autonomous: yes.
Entry: GALLERY-WWW recorded.
Accept: mouse/touch/keyboard, labels, matching frame, no pointer-only control.
Tests: keyboard equivalent; matching crop mode.
Next: CMS-WWW (with CMS-PUBLISH + CMS-SEO).

### CMS-SEO

Dependencies: CMS-PUBLISH.
Gate: REVIEW.
Autonomous: yes.
Entry: CMS-PUBLISH recorded.
Accept: title, description, canonical, robots, OG, sitemap, redirects, JSON-LD without invented facts.
Tests: slug change writes redirect; JSON-LD has no placeholder prices.
Next: CMS-WWW.

### CMS-EVENTS

Dependencies: CMS-PUBLISH.
Gate: REVIEW.
Autonomous: yes.
Entry: CMS-PUBLISH recorded.
Accept: transactional outbox; webhook signing later; no auto-publish from business Project COMPLETED.
Tests: outbox row with the content write; COMPLETED does not publish.
Next: CMS-WWW.

### CMS-ADMIN

Dependencies: CMS-PUBLISH, MEDIA-LIBRARY.
Gate: REVIEW + UX.
Autonomous: yes if Puck/native or selected admin; stop if a paid visual editor is required (OWNER-ONLY).
Entry: CMS-PUBLISH and MEDIA-LIBRARY recorded.
Accept: Owner can create a Service and a ProjectCaseStudy without source edits.
Tests: editorial happy path on synthetic data; visual/UX review when UI exists.
Next: CMS-ACCEPT after CMS-WWW/HARDEN/PERF.

### CMS-WWW

Dependencies: CMS-PUBLISH, GALLERY-WWW, CMS-SEO.
Gate: REVIEW + visual/content.
Autonomous: yes.
Entry: CMS-PUBLISH, GALLERY-WWW, CMS-SEO recorded.
Accept: WWW reads published projections only; no hard-coded marketing facts; last published snapshot survives editorial outage.
Tests: WWW still renders last snapshot when the editorial store is stopped in lab.
Next: CMS-HARDEN and CMS-PERF.

### CMS-HARDEN

Dependencies: CMS-WWW.
Gate: REVIEW.
Autonomous: yes where tools exist.
Entry: CMS-WWW recorded.
Accept: XSS/SVG/SSRF/upload tests; ZAP localhost if Java exists else DEFERRED; SCA; log redaction.
Tests: SVG denied or sanitized; unpublished token not in public HTML.
Next: CMS-ACCEPT (after CMS-PERF/RESTORE/EXPORT).

### CMS-PERF

Dependencies: CMS-WWW.
Gate: REVIEW.
Autonomous: yes.
Entry: CMS-WWW recorded.
Accept: no original on cards; lazy thumbs; LCP/CLS notes; gallery of 30+ images.
Tests: card src is a derivative width; CLS width/height present.
Next: CMS-ACCEPT.

### CMS-RESTORE

Dependencies: MEDIA-CORE, CMS-DATA.
Gate: REVIEW.
Autonomous: yes on local PostgreSQL.
Entry: MEDIA-CORE and CMS-DATA recorded.
Accept: DB + media restore of synthetic data. restic/pgBackRest remain later horizons.
Tests: restore read-back of one published case study and its masters.
Next: CMS-ACCEPT.

### CMS-EXPORT

Dependencies: CMS-DATA, MEDIA-CORE.
Gate: REVIEW.
Autonomous: yes.
Entry: CMS-DATA and MEDIA-CORE recorded.
Accept: structured export of content, slugs, SEO, relations, originals, regeneration rules.
Tests: export omits private GPS; re-import or documented remap.
Next: CMS-ACCEPT.

### CMS-ACCEPT

Dependencies: previous slices.
Gate: REVIEW.
Autonomous: report only.
Entry: previous CMS/media slices recorded.
Accept: checklist below. Do not mark security-accepted if ZAP/SCA/ingress remain deferred.
Next: RETURN-ROADMAP.

### RETURN-ROADMAP

Dependencies: CMS-ACCEPT.
Gate: AUTO.
Autonomous: yes.
Entry: CMS-ACCEPT recorded.
Accept: resume Lead remaining security work and the next product vertical. WWW/Admin content rules stay binding.
Next: main Forma Zieleni execution roadmap. Lead deferred security stays visible. Do not treat CMS completion as Lead security-acceptance.

## Acceptance checklist (later production)

Content: drafts do not leak; publish deterministic; rollback; schedule; slug/redirect; audit.
Media: master preserved; derivatives reproducible; no GPS; no distortion; focal/safe crop; bulk failure isolation; broken references handled.
Gallery: desktop/mobile, touch/mouse/keyboard, lightbox X/backdrop/Escape, focus, reduced motion, SR labels.
Security: authz, unpublished, upload, XSS, SVG, SSRF, webhook auth, CSRF/CORS, SCA, secrets, logs.
Performance: responsive images, no original overdelivery, lazy, LCP, CLS, cache.
Recovery: DB restore, media restore, export, last-known-good published content.
