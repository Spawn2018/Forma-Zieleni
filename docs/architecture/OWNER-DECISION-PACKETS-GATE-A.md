# Gate A Owner Decision Packets

Status: OPEN — refined 2026-09-21 for coherent stack bundles. These packets
do not implement infrastructure and do not rank options. Reply with
`DECISION FZ-A#: OPTION X` plus optional constraints. Silence is not
consent. Prices not read as a number from an official current page are
**UNKNOWN**.

Choosing a local/zero-cost path **now** is a development horizon, not
the permanent production architecture. Staging and production remain
later OWNER-DECISION / DANGEROUS steps.

## How to use this pack

1. Pick one **application bundle** in FZ-A2. That locks Core API runtime
   and the WWW / Portal / Admin framework so a later “UI library”
   decision is not required to start those apps.
2. Pick FZ-A3 and FZ-A5 using the compatibility notes. The bundle already
   names a coherent data/auth pairing; a different pairing is allowed
   only where this pack marks it compatible.
3. Pick FZ-A1 / A4 / A6 / A7 as **now / staging / production** horizons.
   A local-now choice must name the later remote path; it does not
   become hosting, storage or ingress forever.
4. Issue all seven replies. Do not implement until those replies exist.

## Decision dependencies

| Coupling | What it means |
|---|---|
| **A2 ↔ A5** | Auth.js first-party frameworks are Next.js, Qwik, SvelteKit and Express ([Auth.js getting started](https://authjs.dev/getting-started), updated 2026-06-11). Better Auth official mount helpers listed on [installation](https://www.better-auth.com/docs/installation) include Next.js, Hono, Express, Nuxt, SvelteKit, React Router, SolidStart, Expo and others — **not Fastify**. NestJS Better Auth is **community-maintained** (`@thallesp/nestjs-better-auth`); that same official Nest page says Fastify support in the library is **beta**. |
| **A3 ↔ A5** | Better Auth official adapters include PostgreSQL, SQLite, Drizzle and Prisma ([installation](https://www.better-auth.com/docs/installation)). Auth.js official adapters include Prisma and Drizzle ([getting started](https://authjs.dev/getting-started)). First-party sessions (A5-A) work with any A3 option. |
| **A1 ↔ A4 / A6 / A7** | Remote object storage, a self-hosted Grafana/OTel host, and a persistent tunnel need a non-local compute target. Local-now A1 still allows those as **later** staging steps. |
| **A2 ↔ A1** | NestJS + three Next.js apps have a larger Node memory/CPU surface than Fastify or Hono + Vite. A small lab VM must be sized after the bundle, not before. |
| **A4 ↔ files / A7** | Private files stay authorized through Core API. A public bucket URL is not an authorization control. Tunnel/localhost does not replace BOLA on `fileId`. |
| **A2 / A3 ↔ outbox** | Transactional outbox is already accepted (ADR-004). All A3 options can implement same-transaction writes. ORM choice does not remove the outbox. |
| **OpenAPI ↔ mobile / SketchUp** | Android/iOS and the later SketchUp Ruby client consume the canonical OpenAPI contract. Bundle choice must not move business truth into a frontend framework. |

Incompatible-without-extra-work (not forbidden, but not “no further gate”):

- Auth.js as the primary staff/portal library **without** Next.js or Express (A2-A/B) needs a custom integration. Official first-party list does not include Fastify, Hono or Nest.
- Better Auth **on Fastify** has no first-party helper on the official install page. Use the documented generic Request/Response path, a community adapter, or pick A5-A (first-party sessions).
- SQLite-only production is not offered. A3-C is local/dev SQLite with PostgreSQL for lab/staging/prod.

---

## Official sources reviewed 2026-09-21

- [Hetzner price adjustment 15 June 2026](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/) — CX23 FSN/NBG/HEL **€5.49/mo excl. IPv4 and excl. VAT** (new price). German list notes 19% VAT. IPv4, backups and extra traffic: **UNKNOWN** on that page.
- [Hetzner Cloud](https://www.hetzner.com/cloud/) — EU locations Germany/Finland; GDPR; ISO/IEC 27001 on DE/FI parks; firewalls included; Linux images. Windows guest images: **UNKNOWN** on that page.
- [Hetzner Object Storage overview](https://docs.hetzner.com/storage/object-storage/overview/) — S3-compatible; FSN1/NBG1/HEL1; hourly base price while any bucket exists; included quota ~1 TB storage and ~1 TB egress per month (hour-accumulated); ingress and `eu-central` internal traffic free; S3 API calls free, egress of those calls billed. Exact euro figures on [hetzner.com/storage/object-storage](https://www.hetzner.com/storage/object-storage/) did not appear as numbers in the 2026-09-21 scrape → **UNKNOWN**.
- [Fly.io pricing](https://fly.io/docs/about/pricing/) — credit card required except linked orgs; usage billing; `shared-cpu-1x` 256MB listed at **$2.02/mo** in the first published matrix (region-dependent; other region tables differ). Additional RAM about **$5 / 30 days / GB**. Volumes **$0.15/GB/mo**. Stopped Machine rootfs **$0.15/GB / 30 days**. Dedicated IPv4 **$2/mo**. EU/NA egress **$0.02/GB**. Free-trial details: not re-fetched after a Context rate-limit; treat current trial allowance as **UNKNOWN** and confirm on [fly.io/docs/about/free-trial](https://fly.io/docs/about/free-trial/) before spend.
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/) (updated 2026-08-07) — Standard **$0.015/GB-month**; free tier **10 GB-month**, **1M Class A**, **10M Class B**; egress free. R2 is a candidate only (ADR-007).
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/) (updated 2026-08-04) — outbound-only `cloudflared`; no public origin IP. [Cloudflare One](https://developers.cloudflare.com/cloudflare-one/) documents Free and Paid Zero Trust plans. Paid-plan euro/USD: **UNKNOWN**. Live Cloudflare/DNS change remains **DANGEROUS**.
- [Better Auth installation](https://www.better-auth.com/docs/installation) — pnpm-installable; PostgreSQL/SQLite/MySQL; official Drizzle and Prisma adapters; magic-link plugin; official handlers include **Hono** and **Next.js**, not Fastify.
- [Better Auth NestJS](https://www.better-auth.com/docs/integrations/nestjs) — community package; Fastify support **beta**.
- [Auth.js getting started](https://authjs.dev/getting-started) — Next.js / Qwik / SvelteKit / Express; Prisma and Drizzle adapters; official “Migrate to Better Auth” page exists.
- [Hono on Node.js](https://hono.dev/docs/getting-started/nodejs) — official `@hono/node-server` adapter; Node 18.14.1+ / 20+; Vite plugins mentioned for front-end apps; example Dockerfile uses `node:22-alpine`.
- [Fastify](https://fastify.dev/) — Node HTTP framework. [NestJS](https://nestjs.com/) — Node framework. [Next.js](https://nextjs.org/docs) — React framework with official SSR/SSG. [Vite](https://vite.dev/guide/) — official React TypeScript templates and an official SSR guide.
- [Drizzle PostgreSQL](https://orm.drizzle.team/docs/get-started/postgresql-new) — official `pg` driver, `drizzle-kit generate` / `migrate`. [Prisma docs](https://www.prisma.io/docs). [PostgreSQL](https://www.postgresql.org/). [SQLite](https://www.sqlite.org/). [MinIO](https://min.io/). [OpenTelemetry](https://opentelemetry.io/). [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/).
- [CodeRabbit plans](https://docs.coderabbit.ai/management/plans) — already recorded in S2.5 evidence.

---

## Coherent application bundles

Each bundle is a complete **API + WWW + Portal + Admin** start set. Shared
rules for every bundle: Node 24, pnpm 10, Turborepo, `apps/web|portal|admin|api`,
OpenAPI 3.0.4 as HTTP source of truth, modular monolith, server-side
authz/BOLA, generated TS clients later, SketchUp Ruby client later from
the same contract, no Workers/D1/R2/Astro/Sanity inheritance.

### Bundle A — Fastify + Vite React + PostgreSQL/Drizzle + Better Auth

- **Core API:** Fastify on Node 24 in `apps/api`.
- **WWW / Portal / Admin:** three Vite + React + TypeScript apps (`create vite` official `react-ts` template). WWW uses Vite’s official SSR path (or prerender) for public SEO. Portal and Admin may stay CSR.
- **Data pairing:** PostgreSQL + Drizzle (A3-B). A3-A (SQL only) remains compatible; A3-D Prisma is extra surface.
- **Auth pairing:** Better Auth via documented Request/Response handler, **or** first-party sessions (A5-A). There is **no first-party Fastify helper** on the Better Auth install page.
- **Consequences:** Smallest first-party API surface. WWW SEO is not automatic; SSR must be built with Vite, not assumed. Auth on Fastify is the least officially packaged Better Auth path in this pack. Three Vite apps match ADR-003. Windows DX: Node + official Vite. ZAP: localhost processes. Outbox: Drizzle or SQL in the same Postgres transaction.

### Bundle B — Hono + Vite React + PostgreSQL/Drizzle + Better Auth

- **Core API:** Hono on Node 24 via official `@hono/node-server` in `apps/api`.
- **WWW / Portal / Admin:** same three Vite + React + TypeScript apps as Bundle A, including Vite SSR/prerender for WWW.
- **Data pairing:** PostgreSQL + Drizzle (A3-B). A3-A compatible.
- **Auth pairing:** Better Auth official **Hono** mount helper ([installation](https://www.better-auth.com/docs/installation)). First-party sessions (A5-A) also compatible. Auth.js is not first-party on Hono.
- **Consequences:** Official Better Auth + Hono pairing. Hono was not originally designed for Node; the adapter is official and requires current Node. Fetch-style handlers are portable later; this pack still runs them on Node 24, not Workers. WWW SEO same Vite-SSR requirement as A. Agent/Cursor surface is small. Docker remains optional (Hono docs show a Node 22 Alpine example; project still has no Docker prerequisite).

### Bundle C — NestJS + Next.js + PostgreSQL/Drizzle + Better Auth

- **Core API:** NestJS on Node 24 in `apps/api`.
- **WWW / Portal / Admin:** three Next.js App Router TypeScript apps. Official SSR/SSG for WWW SEO; Portal/Admin can still disable unneeded SSR later. Not one Next app with mixed trust zones.
- **Data pairing:** PostgreSQL + Drizzle (A3-B). A3-D Prisma also compatible.
- **Auth pairing:** Better Auth official Next.js helper for the three frontends; NestJS API uses the **community** `@thallesp/nestjs-better-auth` package. First-party sessions (A5-A) avoid that community adapter. Auth.js is an alternative on Next (see Bundle D).
- **Consequences:** WWW SEO is first-party Next. Heavier framework surface and more files. Nest Better Auth is not first-party. Global AuthGuard in that community module is documented as on-by-default — public `POST /leads` must stay explicitly anonymous. Larger RAM than A/B on a CX23-class VM: capacity **UNKNOWN** until measured.

### Bundle D — NestJS + Next.js + PostgreSQL/Prisma + Auth.js

- **Core API:** NestJS on Node 24 in `apps/api`.
- **WWW / Portal / Admin:** three Next.js App Router TypeScript apps (same split as C).
- **Data pairing:** PostgreSQL + Prisma (A3-D).
- **Auth pairing:** Auth.js (`next-auth` v5 / `@auth/nextjs`) on the Next apps; official Prisma adapter. API authorization still lives in Nest/Core API, not in the Next middleware alone. First-party sessions remain possible instead of Auth.js.
- **Consequences:** First-party Auth.js + Prisma + Next documentation. Auth.js getting started currently links “Migrate to Better Auth” — treat Auth.js as supported, not as the vendor’s implied end state. Prisma adds a generated client that must be replaced on exit (portability). Nest + Prisma + three Next apps is the largest operational surface in this pack.

Express + Astro is **not** offered. It resembles legacy shape and is not inherited (POST-V2 §4).

### Bundle evaluation (facts, not a ranking)

Applies to all four: TypeScript, pnpm/Turborepo, OpenAPI source of truth,
modular monolith, outbox, private files via API, server-side authz,
Android/iOS and SketchUp via the same contract, Cloudflare as ingress
not as compute, EU/privacy depends on A1 region, ZAP once a process
listens, ASVS mapping already started, SCA after lockfile deps exist,
0 PLN **now** if A1 stays local.

| Requirement | A Fastify+Vite | B Hono+Vite | C Nest+Next+Drizzle+Better Auth | D Nest+Next+Prisma+Auth.js |
|---|---|---|---|---|
| Windows DX | Node + Vite official | Node adapter official | Node + Next official | same as C |
| WWW SEO/performance | Vite SSR/prerender required | same | Next official SSR/SSG | same as C |
| Portal/Admin | separate Vite CSR apps | same | separate Next apps | same |
| Better Auth first-party API helper | not listed for Fastify | **Hono listed** | Nest helper is **community** | not the Auth.js path |
| Auth.js first-party | no | no | possible on Next only | **yes** on Next |
| Vendor lock-in | low framework lock | low; avoid treating Hono as a Workers decision | Nest/Next conventions | Nest/Next + Prisma client |
| Agent/Cursor maintainability | small API, SSR is extra work | small API, official auth helper | more Nest/Next files | most generated/config surface |
| Future scaling | scale `apps/api` + static/SSR fronts | same | same shape, heavier baseline | same, Prisma client to keep in sync |
| Testability | Fastify inject / Node test | Hono `app.request` | Nest testing module | Nest + Prisma test DB |

---

## FZ-A1 — Lab/staging compute (now / staging / production)

- **question:** Where does isolated compute run **now**, and what is the later remote path? Production cutover is out of scope and DANGEROUS.
- **why_blocked:** Hosting/compute undecided (POST-V2 §4, ADR-007).
- **options:**
  - **A — Local now; remote staging later.** Develop on this Windows workstation (0 PLN compute). GitHub Actions later as a **check runner only**, not hosting. **Staging path:** add a Hetzner Cloud EU VM (FSN/NBG/HEL) when Owner approves spend — CX23 cap **€5.49/mo excl. IPv4 and VAT**. **Production path:** new OWNER-DECISION; not this VM by default; never CT8.
  - **B — Hetzner EU lab/staging now.** Create a FSN/NBG/HEL Cloud VM now. CX23 **€5.49/mo excl. IPv4 and VAT**. IPv4 / backups / extra traffic **UNKNOWN**. GDPR/EU. Recurring spend is OWNER-ONLY before create. **Now = staging VM.** **Production path:** still a later OWNER-DECISION (resize, second VM, or other provider).
  - **C — Fly.io Machines lab/staging now.** Usage billing; credit card required ([Fly pricing](https://fly.io/docs/about/pricing/)). Example: `shared-cpu-1x` 256MB **$2.02/mo** in the first published matrix; region markups apply; volumes **$0.15/GB/mo**. EU regions exist (e.g. `fra`, `ams`, `cdg` listed). Free-trial allowance **UNKNOWN** here. **Production path:** later OWNER-DECISION; unmanaged Fly Postgres is documented as unsupported for new production reliance.
  - **D — Local-only until a later packet.** Same 0 PLN now as A, but **no** pre-accepted Hetzner/Fly staging path. A new packet is required before any remote VM.
- **cost:** A/D = 0 PLN compute now. B = documented euro cap + UNKNOWN extras + VAT. C = USD usage + card on file. Any recurring spend OWNER-ONLY.
- **security/privacy:** EU preferred for remote. No customer data in lab. Secrets off git.
- **reversibility:** A/D reversible. B/C destroyable; data portability follows A3/A4.
- **blocks if local-only:** remote restore, remote private-origin proof, CI deploy.
- **does not block:** local API/UI after A2, localhost ZAP, contracts, domain.
- **reply:** `DECISION FZ-A1: OPTION A|B|C|D`

## FZ-A2 — Application bundle (API + WWW + Portal + Admin)

- **question:** Which coherent bundle implements Core API and the three frontends?
- **why_blocked:** Frameworks undecided (POST-V2 §3). Previous A/B options left the UI framework open; that is closed here.
- **options:**
  - **A** — Bundle A: Fastify + Vite React (WWW SSR via Vite) + intended Drizzle/Better Auth pairing.
  - **B** — Bundle B: Hono (`@hono/node-server`) + Vite React + intended Drizzle/Better Auth pairing.
  - **C** — Bundle C: NestJS + Next.js ×3 + intended Drizzle/Better Auth pairing.
  - **D** — Bundle D: NestJS + Next.js ×3 + intended Prisma/Auth.js pairing.
- **cost:** All software is open-source. Hosting follows FZ-A1. C/D need more RAM than A/B; extra VM size **UNKNOWN** until measured.
- **security/privacy:** Server-side authz in `apps/api` in every option. Framework cookies/middleware do not replace BOLA tests.
- **reversibility:** A/B smaller runtimes. C/D couple more Nest/Next conventions. Prisma (D) adds a generated client.
- **blocks:** HTTP server, generated runtime clients, WWW/Portal/Admin, ZAP against a live process.
- **safe work continuing:** current OpenAPI/domain/validation already exist.
- **reply:** `DECISION FZ-A2: OPTION A|B|C|D`

## FZ-A3 — Database engine and data access

- **question:** Which database and access style does the modular monolith use in lab, with the same engine intended for later staging/prod unless a later packet says otherwise?
- **why_blocked:** Database/ORM undecided (POST-V2 §4, ADR-007).
- **options:**
  - **A — PostgreSQL + explicit SQL migrations, no ORM.** Compatible with all bundles. Most portable SQL. More manual TypeScript mapping. Outbox is raw SQL in the same transaction.
  - **B — PostgreSQL + Drizzle.** Official `pg` + `drizzle-kit` migrations. Intended pairing for Bundles A–C. Official Better Auth `drizzleAdapter`. Official Auth.js Drizzle adapter if A5 uses Auth.js on Next.
  - **C — SQLite locally + PostgreSQL in lab/staging/prod, same SQL migrations.** Dev convenience only. Dual-engine dialect risk. Not a production SQLite decision. Compatible with A5-A; Better Auth/Auth.js both document SQLite **and** PostgreSQL, but schema must stay portable.
  - **D — PostgreSQL + Prisma.** Official Prisma client/migrations. Intended pairing for Bundle D. Official Better Auth and Auth.js Prisma adapters. Exit cost: replace generated client.
- **now / staging / prod:** Install PostgreSQL on Windows now (official installer) or later on the A1 host. Hosted Postgres price **UNKNOWN** until a provider is chosen. Do not treat a local cluster as production HA.
- **cost:** PostgreSQL and SQLite are free software. Hosted price UNKNOWN.
- **security/privacy:** EU hosting once remote. Reversible lab migrations. No customer dumps.
- **blocks:** Persistence, outbox tables, real restore, CRM beyond fixtures.
- **reply:** `DECISION FZ-A3: OPTION A|B|C|D`

## FZ-A4 — Private object/file storage (now / staging / production)

- **question:** Where do private, versioned, checksummed files live in each horizon?
- **why_blocked:** Object storage undecided. Legacy R2 is not current.
- **options:**
  - **A — Local `private/` now; S3-shaped remote later.** Gitignored disk, checksums, non-guessable keys, downloads only through authorized API. **Staging path:** MinIO on the A1 host **or** Hetzner Object Storage (EU S3 API; euro base price **UNKNOWN** in this scrape) **or** R2 (free tier 10 GB-month; not inherited). **Production path:** later OWNER-DECISION; keep the API/file contract stable.
  - **B — MinIO (S3 API) in lab now.** Free software on local Windows or the A1 VM. **Staging/prod path:** same S3 API against Hetzner OS or R2 without rewriting callers if keys/metadata stay owned.
  - **C — Cloudflare R2 as the lab store.** Official free tier 10 GB-month / 1M Class A / 10M Class B; Standard **$0.015/GB-month** after ([R2 pricing](https://developers.cloudflare.com/r2/pricing/)). Candidate only. **Now** uses Cloudflare storage. **Prod path:** still OWNER-DECISION; S3-shaped portability if the API owns keys.
  - **D — Hetzner Object Storage now.** EU endpoints FSN/NBG/HEL; S3-compatible; hourly charge while any bucket exists, including empty ([overview](https://docs.hetzner.com/storage/object-storage/overview/)). Euro amounts **UNKNOWN** here. Recurring spend OWNER-ONLY before create.
- **cost:** A now = 0 PLN. B = software + optional VM. C = official USD free tier then listed rates. D = UNKNOWN euros + VAT.
- **security/privacy:** No public predictable URLs as the access control. Authorized, versioned, checksummed.
- **blocks:** File module and Portal/Admin binary UX.
- **does not block:** lead slice (no binaries).
- **reply:** `DECISION FZ-A4: OPTION A|B|C|D`

## FZ-A5 — Auth foundation

- **question:** How do staff, client portal and later mobile authenticate? Server-side authz is already accepted.
- **why_blocked:** Auth library undecided.
- **options:**
  - **A — First-party opaque sessions + magic link, no auth framework.** Compatible with every bundle and every A3 option. Most portable. More code to specify/test (ASVS V6/V7).
  - **B — Better Auth.** Official Next and Hono helpers; official Drizzle/Prisma/Postgres adapters; official magic-link plugin. **Fits Bundle B and C best.** Bundle A needs a non-first-party Fastify wiring. Bundle D can use it instead of Auth.js but then ignores D’s Auth.js pairing.
  - **C — Auth.js.** First-party on Next (and Express). Official Prisma and Drizzle adapters; official magic links. **Fits Bundle D (and C if Owner prefers Auth.js over Better Auth).** Not a no-extra-gate choice for Fastify/Hono APIs.
  - **D — External IdP later (Ory or similar).** SaaS/self-host price **UNKNOWN**. Recurring spend OWNER-ONLY. Delays Portal/Admin sessions.
- **now / staging / prod:** Implement against localhost first. Same identity records migrate if they live in Core API/Postgres. Google OAuth remains reconnectable; no hard-wired test account (POST-V2 §10).
- **cost:** A–C software. D UNKNOWN / OWNER-ONLY.
- **security/privacy:** Sessions, CSRF, logout, no PII in logs. Framework auth is not object authorization.
- **blocks:** Authorized list/get/qualify, Portal, Admin, Mobile sessions.
- **reply:** `DECISION FZ-A5: OPTION A|B|C|D`

## FZ-A6 — Observability, secrets and backup/restore (now / staging / production)

- **question:** What is the baseline in lab, and what is added on the remote host later?
- **why_blocked:** Observability backend and secret store undecided. OpenTelemetry-compatible telemetry is a requirement, not a vendor pick.
- **options:**
  - **A — Local JSON logs now; OTel later; gitignored secret files; filesystem backup + a real restore test.** **Staging path:** ship the same JSON/OTel to a collector on the A1 host. **Production path:** later OWNER-DECISION (keep OTel; vendor optional).
  - **B — Self-hosted Grafana/Loki/Tempo or OTel collector.** Needs A1 remote or a heavy local compose. Grafana OSS is free software; host cost follows A1. Hetzner lists a Grafana one-click app. **Now** only if Owner accepts that host. **Prod path:** same stack or replace the backend, keep OTel.
  - **C — Vendor SaaS (Sentry, Axiom or similar).** Current list prices **UNKNOWN** (not fetched as official numbers here). Recurring spend OWNER-ONLY. Lock-in risk. Can wait until staging.
  - **D — OS secret store (Windows Credential Manager / later OS store) plus A.** No metrics backend yet. **Staging path:** same as A plus host secrets. **Prod path:** later secret manager OWNER-DECISION.
- **cost:** A/D closest to 0 PLN. B = A1 host. C UNKNOWN.
- **security/privacy:** Secrets never in git or prompts. No CUSTOMER/SECRET class data in logs.
- **blocks:** Monitoring PASS, restore PASS, rotation runbooks.
- **reply:** `DECISION FZ-A6: OPTION A|B|C|D`

## FZ-A7 — Private-origin implementation (now / staging / production)

- **question:** How does the origin stay off the public Internet in each horizon? Ingress direction (Cloudflare → private origin) is already accepted.
- **why_blocked:** Tunnel/private origin not implemented (POST-V2 §7). Live Cloudflare mutation is DANGEROUS.
- **options:**
  - **A — Localhost now; Cloudflare Tunnel on staging after DANGEROUS approval.** `cloudflared` outbound-only, no public origin IP ([Tunnel docs](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)). **Do not create the tunnel until Owner approves the Cloudflare change immediately before.** **Production path:** same pattern on the production origin, separate DANGEROUS approval; never point a tunnel at CT8.
  - **B — Localhost now; Tailscale or another private overlay for staging; Cloudflare proxy later.** Overlay client is free software; business/pricing **UNKNOWN** unless confirmed on the vendor’s official pricing page at decision time. **Production path:** later OWNER-DECISION; may still add Tunnel.
  - **C — Localhost-only until staging exists.** No remote ingress. **Staging/prod path:** requires a later packet (A or B). Safest now; remote private-origin proof stays blocked.
  - **D — Authenticated origin pull / mTLS.** Cloudflare feature extra cost **UNKNOWN**. Touches live Cloudflare → **DANGEROUS** immediately before action. Not required to start local product work.
- **cost:** C and local-now A/B = 0 PLN. Tunnel uses the existing zone; paid Zero Trust extras UNKNOWN. Overlay pricing UNKNOWN.
- **security/privacy:** Origin must not accept bypass traffic. No customer data through lab origin. Quick Tunnels are documented for testing only, not as the lab hostname strategy.
- **blocks:** Remote private-origin validation only. Local API/UI after A2 does not wait.
- **reply:** `DECISION FZ-A7: OPTION A|B|C|D`

---

## Suggested reply block

Copy and fill. Constraints optional.

```text
DECISION FZ-A1: OPTION _
DECISION FZ-A2: OPTION _
DECISION FZ-A3: OPTION _
DECISION FZ-A4: OPTION _
DECISION FZ-A5: OPTION _
DECISION FZ-A6: OPTION _
DECISION FZ-A7: OPTION _
```

If FZ-A2 is A or B, FZ-A5-C (Auth.js) is not a no-extra-gate pairing.
If FZ-A2 is A, FZ-A5-B needs non-first-party Fastify wiring or switch to FZ-A5-A.
If FZ-A1 is A or D, FZ-A4-B/C/D and FZ-A6-B and FZ-A7 tunnel stay **later**, not this week’s host create.
Any Cloudflare, DNS, production, secret-store cloud, or paid add-on remains DANGEROUS / OWNER-ONLY at the moment of action.
