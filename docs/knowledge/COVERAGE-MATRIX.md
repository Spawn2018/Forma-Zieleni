# Coverage Matrix — consolidated audit

Status: AUDITED CURRENT BASELINE, 2026-09-20.

## Evidence actually inspected
- Original `formazieleni-pack.zip` — extracted and inventoried.
- `FormaZieleni-ChatGPT-lean.tar.gz` — extracted and inventoried.
- F-RESET BC, AUDITED, ZERO-OMISSION and V2 archives — extracted and inventoried.
- Current top-level project evidence available in this session, including pasted markdown and email-test artifacts, inventoried where relevant.
- Project conversation state available to this audit, including post-V2 decisions, was reconciled into `POST-V2-DECISIONS.md` and the current Canon.

Machine inventory contains 488 extracted/text-evidence records across the supplied source sets. Many are intentionally duplicate/evolution copies across F-RESET archives; this count is evidence inventory, not 488 unique requirements.

## Cross-audit result
The previous F-RESET V2 already contained a zero-omission audit and explicitly reported that earlier audits had missed semantic stack conflicts. This audit therefore did not trust its PASS blindly. It re-opened the original pack, lean pack and all F-RESET generations, retained complete source snapshots, and overlaid every later project decision currently available.

### Current canonical coverage
| Area | Current destination | Result |
|---|---|---|
| Business constraint / owner-hour economics | PRODUCT-CANON | COVERED |
| Full customer lifecycle | PRODUCT-CANON | COVERED |
| Revenue OS / CRM / Capacity | PRODUCT-CANON | COVERED |
| Offer / contract / payment activation | PRODUCT-CANON + FZ-SIGN-1 | COVERED — signature when required; provider UNDECIDED |
| Scope protection / change orders / decision log | PRODUCT-CANON | COVERED |
| Project OS / revisions / files | PRODUCT-CANON | COVERED |
| Site Intelligence / Data Layer | PRODUCT-CANON | COVERED |
| Plant Knowledge Graph / botanical truth | PRODUCT-CANON + Constitution | COVERED |
| Garden OS digital twin | PRODUCT-CANON | COVERED |
| WWW / Evidence / local SEO / analytics / experiments | PRODUCT-CANON | COVERED |
| Portal / Admin / Mobile | PRODUCT-CANON + Architecture | COVERED |
| SketchUp / V-Ray | PRODUCT-CANON | COVERED |
| API-first / OpenAPI / typed clients | Constitution + Master Plan | COVERED |
| Modular monolith / events / outbox | Constitution + Master Plan | COVERED |
| Security / private files / authz | Constitution + Architecture | COVERED |
| Observability / audit / backup restore | Constitution + Master Plan | COVERED |
| Cloudflare/private origin/current CT8 distinction | POST-V2 + Architecture + Master Plan | COVERED |
| Current DNS/TLS/mail operational truth | POST-V2 | COVERED |
| Google/Meta/Fakturownia/payments integration posture | POST-V2 + Architecture | COVERED |
| AI / MCP / source-of-truth rule | Constitution + legacy V2 reference | COVERED |
| Cursor autonomy / decision gates | Workflows + Core Rule | COVERED |
| Current public-main monorepo decisions | POST-V2 + Architecture | COVERED |
| CMS / public content / media publishing | FZ-CMS-1 packet OPEN | RESEARCHED / OWNER-DECISION — not selected |
| Legacy API/DB/migrations/OpenAPI/client/plugin/code | `legacy/` snapshots | PRESERVED / NOT CURRENT BY DEFAULT |
| Marketing/copy/ads/research/visual/product details | `legacy/` snapshots + V2 reference | PRESERVED / ACTIVE INPUT WHEN SLICE REQUIRES |
| GitHub repository/tool candidates | REPOSITORY-CATALOG | INVENTORIED / REVIEW REQUIRED |
| External URLs/research evidence | URL-CATALOG + legacy research | INVENTORIED / REVERIFY BEFORE USE |

## Conflict resolutions that matter
- Astro/Sanity/Workers/D1/R2/wrangler: SUPERSEDED AS STACK DECISION; retained as legacy candidates/evidence.
- Old KANON-FREEZE prohibition on new endpoints/redesign and >3-files approval: SUPERSEDED by F-RESET + autonomous slices; UX/business intent remains reference.
- Old PR/branch-centric workflow: SUPERSEDED by explicit direct-`main` owner decision. Quality gates/commit checkpoints remain applicable without requiring branches.
- Old statement that Cloudflare Tunnel/private origin is implemented: false if present anywhere; current status is NOT IMPLEMENTED for the new system/legacy CT8.
- DMARC: configured `p=none`, but PASS not verified. Any stronger statement is superseded.
- Gate A architecture (compute horizon, Hono, React Router Framework Mode, PostgreSQL + Kysely, Better Auth, local private files, OpenObserve/SOPS/restic/pgBackRest horizons, localhost then Cloudflare Tunnel): DECIDED in ADR-014. Payment provider, signing provider, CMS (FZ-CMS-1 OPEN), production compute and production object storage remain UNDECIDED. Legacy implementation does not override that record.
- Existing OpenAPI/DB/client/server artifacts: valuable reference/scaffold, not proof that current Gate B/C is implemented.
- Historical prices/KPIs/budgets/company claims: do not publish or use as current facts without explicit re-verification.

## Coverage gate
For the materials actually available to this audit: source sets are inventoried and preserved, current conflicts above are resolved or explicitly left undecided, and all top-level product/engineering decisions currently available are mapped into the Canon. There is no known unaccounted top-level project area.

This is an engineering coverage claim over the **available source corpus**, not a logical claim that inaccessible/deleted/never-provided information cannot exist. Any newly surfaced chat export/file becomes a new source and must pass the same reconciliation before it can change the Canon.

## UI/UX/Content canonicalization update — 2026-09-20

| Area | Source evidence | Current canonical layer | Status |
|---|---|---|---|
| WWW visual direction | 02-DESIGN + supplied WWW screenshots | VISUAL-PRODUCT-CANON + VISUAL-REFERENCE-MAP | CURRENT/MERGED |
| Portal visual/product intent | supplied portal/project screenshots + portal docs | Visual Canon + UX Canon | CURRENT/MERGED |
| Admin/CRM UI intent | supplied admin screen + Revenue OS canon | Visual Canon + UX Canon | CURRENT/MERGED |
| Mobile/Garden OS visual intent | KANON-MOBILE + 8 supplied mobile screens | Visual Canon + UX Canon + reference map | CURRENT/MERGED; legacy stack superseded |
| Customer copy/voice | 03-COPY + project decisions | CONTENT-AND-VOICE-CANON | CURRENT/MERGED; factual values require verification |
| Anti-AI-slop behavior | current owner decision + established design rules | Visual Canon + Content Canon + Cursor skills/reviewer | CURRENT |
| UI implementation process | engineering + current owner decision | visual-implementation/ux-consistency skills + visual-ux-reviewer | CURRENT |
