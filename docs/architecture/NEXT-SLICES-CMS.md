# CMS and Search Intelligence execution graph

Status: AUTHORIZED. The file was READY only after
`DECISION FZ-CMS-1: OPTION X`. That reply is recorded:
`OPTION B`, `VISUAL=vendor-native`, `MEDIA=fz-pipeline` (ADR-015).

Search slices below are part of this graph, not a second roadmap.
Binding search architecture: [`FZ-SEARCH-1.md`](./FZ-SEARCH-1.md).

Do not create an endless agent loop. One bounded slice at a time.
Stop at OWNER-ONLY or DANGEROUS. FZ-SEARCH-CRAWL-1 is OPEN and does
not block CMS-DATA.

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
Status: COMPLETE in the ADR-015 record. No runtime CMS install.
Accept: Apostrophe is isolated from Core API business truth; WWW reads a published projection; last published snapshot survives an editorial outage. Written in CURRENT-ARCHITECTURE and ADR-015.
Tests: architecture notes only. Vendor Admin UI and PostgreSQL remain NOT TESTED.
Next: CMS-DATA.

### CMS-DATA

Dependencies: CMS-ARCH.
Gate: REVIEW.
Status: COMPLETE for the projection contract. Apostrophe PostgreSQL tables are not created here.
Accept: `contracts/content-contract.json` names Page, Article, Service, ProjectCaseStudy, MediaAsset, MediaCollection, and SiteSettings. `contracts/content-contract.mjs` is the adapter from editorial input to the SEO object in FZ-SEARCH-1 section 5. This is also SEARCH-CONTENT-CONTRACT. No Prisma. No second business API.
Tests: `contracts/content-contract.test.mjs`.
Next: CMS-AUTH and MEDIA-CORE may start after this. Neither is started in the contract commit.

### CMS-AUTH

Dependencies: CMS-DATA.
Gate: REVIEW.
Status: COMPLETE. No paid SSO.
Accept: `packages/domain/src/content-auth.ts` maps editor, reviewer, publisher, and admin onto `actorId` capabilities. Draft reads are 401 without a session and 403 without `content:read-draft`. A client-supplied role, capability list, or actorId is rejected. A content grant does not include `leads:read` or `leads:qualify`.
Tests: `packages/domain/content-auth.test.mjs` and the unpublished-content case in `apps/api/src/http.test.mjs`. Migration `003_content_capabilities` widens the capability check.
Security: authority is server-granted; lead capabilities stay a separate allowlist; draft bodies are not returned to anonymous callers.
Next: CMS-PUBLISH.

### CMS-PUBLISH

Dependencies: CMS-AUTH.
Gate: REVIEW.
Status: COMPLETE for the in-memory publication contract. PostgreSQL persistence of these rows is not this slice.
Accept: `packages/domain/src/content-publish.ts` keeps a draft off the public projection, leaves the last published fields stable while a newer draft is edited, emits `content.published` with ids only, audits the actor, rolls back to an older revision, and holds a scheduled revision until its time.
Tests: `packages/domain/content-publish.test.mjs`.
Security: the outbox payload has no draft text. A missing public revision reads as absent, not as the latest draft.
Next: CMS-SEO, CMS-EVENTS, CMS-ADMIN. SEO still waits on the WWW slices. CMS-EVENTS is the next READY slice on this branch.

### MEDIA-CORE

Dependencies: CMS-DATA.
Gate: REVIEW.
Status: COMPLETE for the local private adapter.
Accept: `packages/media` stores an immutable checksummed master. JPEG, PNG, and WebP are sniffed from bytes. SVG and a declared type that disagrees with the bytes are denied. Dimensions above 16,000 px or 40 million pixels are rejected before a bitmap decode. The stored key is under `masters/` and `publicUrl` is null.
Tests: `packages/media/master.test.mjs`.
Security: no public path, no client MIME trust, pixel-bomb cap.
Next: MEDIA-PROCESS.

### MEDIA-PROCESS

Dependencies: MEDIA-CORE.
Gate: REVIEW.
Status: COMPLETE.
Accept: `packages/media/src/derivatives.mjs` writes WebP, AVIF, and JPEG from the master. CONTAIN and ADAPTIVE_LAYOUT keep the full frame. SMART_FILL crops. Sharp is pinned at 0.35.4 because 0.34.5, used by the lab, is below the patched range for current high libvips and libheif advisories. The lab evidence is unchanged. Public bytes omit the synthetic GPS marker. The master buffer is unchanged. No generative expand.
Tests: `packages/media/derivatives.test.mjs`.
Performance: derivative encoding is off the request that stores the master. This slice did not add a new latency budget beyond the existing lab byte evidence.
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

Dependencies: CMS-PUBLISH, SEARCH-WWW-TECHNICAL, SEARCH-STRUCTURED-DATA, SEARCH-SITEMAP-ROBOTS.
Gate: REVIEW.
Autonomous: yes.
Entry: those four are recorded. This id is the integration checkpoint, not a second SEO implementation.
Accept: WWW output matches FZ-SEARCH-1 sections 6–7 and 9. Training-crawler groups stay absent while FZ-SEARCH-CRAWL-1 is OPEN.
Tests: slug change writes redirect; JSON-LD has no placeholder prices; production robots fixture is not `Disallow: /`.
Next: CMS-WWW.

### CMS-EVENTS

Dependencies: CMS-PUBLISH.
Gate: REVIEW.
Status: COMPLETE.
Accept: `applyBusinessProjectCompleted` does not publish a case study and does not append an outbox row. Webhook signing stays later.
Tests: `packages/domain/content-events.test.mjs`. The publish path already writes `content.published` in the same operation as the public pointer.
Next: CMS-WWW still waits on gallery and SEO slices. MEDIA-PROCESS is READY.

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

### SEARCH-ARCH

Dependencies: none beyond this graph.
Gate: REVIEW.
Status: COMPLETE. Canonical text is `FZ-SEARCH-1.md` (research 2026-09-21).
Accept: measurable vs unmeasurable claims recorded; no paid vendor; training-crawler choice left OPEN.
Next: SEARCH-CONTENT-CONTRACT inside CMS-DATA.

### SEARCH-WWW-TECHNICAL

Dependencies: CMS-DATA, and the WWW app slice that first renders published content.
Gate: REVIEW.
Autonomous: yes.
Accept: SSR HTML, title, description, canonical, robots meta, status codes, 404, redirects, trailing-slash and query policies, no staging index leak.
Tests: rendered head and a non-production disallow fixture.
Next: SEARCH-STRUCTURED-DATA.

### SEARCH-STRUCTURED-DATA

Dependencies: SEARCH-WWW-TECHNICAL.
Gate: REVIEW.
Autonomous: yes.
Accept: JSON-LD only for visible verified facts. No ratings, prices, awards, or addresses unless verified.
Tests: syntax and required mapping; omitted unverified fields.
Next: SEARCH-SITEMAP-ROBOTS.

### SEARCH-SITEMAP-ROBOTS

Dependencies: SEARCH-STRUCTURED-DATA. Re-read crawler docs in the same slice.
Gate: REVIEW.
Autonomous: yes. Applying the file on Cloudflare is DANGEROUS and is not this slice.
Accept: generated robots and sitemap from policy. Non-production is non-indexable. Production fixture has no blanket disallow. No training-token group until FZ-SEARCH-CRAWL-1 is DECIDED.
Tests: the two environment fixtures.
Next: CMS-SEO.

### SEARCH-ATTRIBUTION

Dependencies: existing Lead capture contract. Does not wait on Apostrophe.
Gate: REVIEW.
Autonomous: yes.
Accept: sanitized first/last touch fields; unknown stays unknown; form body is not logged with the referrer.
Tests: hostile referrer and UTM stripped; allowlisted AI host only.
Next: SEARCH-DATA-MODEL when external observations start. May run after CMS-DATA without blocking media slices.

### SEARCH-DATA-MODEL

Dependencies: SEARCH-ARCH. Persistence waits until a connector or attribution slice needs rows.
Gate: REVIEW.
Autonomous: yes.
Accept: PostgreSQL/Kysely entities from FZ-SEARCH-1 section 12, provenance, idempotency, retention note. No second database.
Next: SEARCH-CONNECTORS.

### SEARCH-CONNECTORS

Dependencies: SEARCH-DATA-MODEL. Live OAuth to a business property is DANGEROUS.
Gate: REVIEW for interfaces and fixtures. DANGEROUS for real credentials.
Autonomous: fixtures only.
Accept: adapter boundaries, no token logs, recorded quotas re-read that day.
Next: SEARCH-SYNC.

### SEARCH-SYNC

Dependencies: SEARCH-CONNECTORS.
Gate: REVIEW.
Autonomous: yes on synthetic fixtures.
Accept: job path, checkpoint, backoff, one provider outage does not blank the other.
Next: SEARCH-HISTORY.

### SEARCH-HISTORY

Dependencies: SEARCH-SYNC.
Gate: REVIEW.
Autonomous: yes.
Accept: 7/28/90/180/365-day views from stored snapshots; year-over-year only when both sides exist.
Next: SEARCH-TECH-AUDIT.

### SEARCH-TECH-AUDIT

Dependencies: SEARCH-SITEMAP-ROBOTS, CMS-WWW.
Gate: REVIEW.
Autonomous: yes.
Accept: issues for noindex, broken canonical, missing ALT, sitemap/robots health. Recommendations do not publish.
Next: SEARCH-AI-VISIBILITY.

### SEARCH-AI-VISIBILITY

Dependencies: SEARCH-DATA-MODEL.
Gate: REVIEW.
Autonomous: yes.
Accept: Bing citations stay empty unless a real export/API was re-verified. No composite AI score.
Next: SEARCH-CRAWLER-INTELLIGENCE.

### SEARCH-CRAWLER-INTELLIGENCE

Dependencies: SEARCH-AI-VISIBILITY. Cloudflare mutation is DANGEROUS and out of slice.
Gate: REVIEW.
Autonomous: yes for the model and a synthetic Cloudflare fixture.
Accept: taxonomy A–E; referrals absent rather than zero on a free-plan fixture.
Next: SEARCH-CONTENT-INTELLIGENCE.

### SEARCH-CONTENT-INTELLIGENCE

Dependencies: SEARCH-TECH-AUDIT, internal link graph from published content.
Gate: REVIEW.
Autonomous: yes.
Accept: evidence-backed recommendations; AI output marked AI-SUGGESTED; no auto-publish.
Next: SEARCH-ADMIN.

### SEARCH-ADMIN

Dependencies: SEARCH-HISTORY or synthetic fixtures, plus SEARCH-CONTENT-INTELLIGENCE for that panel.
Gate: REVIEW + UX.
Autonomous: yes with synthetic data.
Accept: every metric shows definition, source, window, freshness, evidence class.
Next: SEARCH-ALERTS.

### SEARCH-ALERTS

Dependencies: SEARCH-ADMIN.
Gate: REVIEW.
Autonomous: yes. No production notification channel.
Accept: thresholds exist; the suite does not page on a single-row blip.
Next: SEARCH-SECURITY.

### SEARCH-SECURITY

Dependencies: SEARCH-CONNECTORS, SEARCH-ATTRIBUTION.
Gate: REVIEW.
Autonomous: yes.
Accept: redaction, XSS in imported labels, URL sanitize, preview leak test.
Next: SEARCH-PERFORMANCE.

### SEARCH-PERFORMANCE

Dependencies: MEDIA-PROCESS, SEARCH-WWW-TECHNICAL.
Gate: REVIEW.
Autonomous: yes.
Accept: field CWV and lab data are different fields. LCP/CLS notes use the media pipeline.
Next: SEARCH-RECOVERY.

### SEARCH-RECOVERY

Dependencies: SEARCH-DATA-MODEL, CMS-RESTORE.
Gate: REVIEW.
Autonomous: yes on local PostgreSQL.
Accept: restore of synthetic observations; a written list of rows that cannot be re-synced after upstream retention.
Next: SEARCH-ACCEPT.

### SEARCH-ACCEPT

Dependencies: SEARCH-SECURITY, SEARCH-PERFORMANCE, SEARCH-RECOVERY, and the WWW SEO slices.
Gate: REVIEW.
Autonomous: report only.
Accept: do not mark accepted where ZAP, SCA, live credentials, or Cloudflare policy remain deferred.
Next: RETURN-ROADMAP. CMS-ACCEPT and SEARCH-ACCEPT are separate checklists.

### RETURN-ROADMAP

Dependencies: CMS-ACCEPT. SEARCH-ACCEPT is a separate checklist and does not block the return. Open FZ-SEARCH-CRAWL-1 does not block it either.
Gate: AUTO.
Autonomous: yes.
Entry: CMS-ACCEPT recorded.
Accept: resume Lead remaining security work and the next product vertical. WWW/Admin content rules stay binding.
Next: main Forma Zieleni execution roadmap. Lead deferred security stays visible. Do not treat CMS completion as Lead security-acceptance.

## CMS acceptance still required (not PASS)

A. Apostrophe + PostgreSQL in the intended architecture.
B. Real Apostrophe Admin/editor UI.
C. Real page, project, article, and service editing.
D. Native visual editing quality.
E. FZ Media Pipeline integration.
F. Draft/publish.
G. Preview.
H. Revision/history/rollback, or an FZ compensation.
I. Scheduler strategy.
J. Permissions/auth integration.
K. Last-known-good publication boundary.
L. Backup/restore.
M. Export/exit.
N. Security.
O. Performance.
P. Accessibility.
Q. React Router WWW integration.

Lab leftovers that stay DEFERRED until re-tested: vendor Admin UI,
PostgreSQL adapter, browser swipe/pinch/deep focus, ZAP,
Dependency-Check of a running CMS, HEIC, PDF preview, video.

## Acceptance checklist (later production)

Content: drafts do not leak; publish deterministic; rollback; schedule; slug/redirect; audit.
Media: master preserved; derivatives reproducible; no GPS; no distortion; focal/safe crop; bulk failure isolation; broken references handled.
Gallery: desktop/mobile, touch/mouse/keyboard, lightbox X/backdrop/Escape, focus, reduced motion, SR labels.
Security: authz, unpublished, upload, XSS, SVG, SSRF, webhook auth, CSRF/CORS, SCA, secrets, logs.
Performance: responsive images, no original overdelivery, lazy, LCP, CLS, cache.
Recovery: DB restore, media restore, export, last-known-good published content.
