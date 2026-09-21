# Gate A Owner Decision Packets

Status: OPEN — refined 2026-09-21 for coherent stack bundles; FZ-A5
expanded then delta-amended (Casdoor added); FZ-A1/A2/A3/A4/A6/A7
landscape-delta the same day. These packets do not implement
infrastructure and do not rank options. Reply with
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
   where this pack marks it compatible. FZ-A5-D (dedicated IdP) is
   compatible with every bundle. FZ-A5 must not move domain BOLA/BFLA
   out of Core API.
3. Pick FZ-A1 as **two facts**: where compute runs now, and how
   apps will be deployed on the later remote host. Local Windows may
   stay non-containerized even if staging later uses Docker/PaaS.
4. Pick FZ-A4 / A6 / A7 as **now / staging / production** horizons.
   A6 is one reply but three concerns (telemetry, secrets, backup).
5. Issue all seven replies. Do not implement until those replies exist.

## Decision dependencies

| Coupling | What it means |
|---|---|
| **A2 ↔ A5** | **Embedded libraries** stay bundle-coupled: Auth.js first-party frameworks are Next.js, Qwik, SvelteKit and Express ([Auth.js getting started](https://authjs.dev/getting-started), updated 2026-06-11). Better Auth official mount helpers listed on [installation](https://www.better-auth.com/docs/installation) include Next.js, Hono, Express, Nuxt, SvelteKit, React Router, SolidStart, Expo and others — **not Fastify**. A `tanstackStartCookies` plugin is documented for TanStack Start (Bundle E); Start itself remains official **Release Candidate**. NestJS Better Auth is **community-maintained** (`@thallesp/nestjs-better-auth`); that same official Nest page says Fastify support in the library is **beta**. **Dedicated IdP** (A5-D) treats Core API as an OIDC resource server and is compatible with every A2 bundle; the frontends become OIDC/PKCE clients instead of mounting Better Auth or Auth.js as the issuer. **A5-E** starts embedded (A or B) with the same client/`sub` contract so a later D issuer can replace login without moving BOLA. |
| **A3 ↔ A5** | Better Auth official adapters include PostgreSQL, SQLite, Drizzle and Prisma ([installation](https://www.better-auth.com/docs/installation)). Better Auth’s own migrate path uses **Kysely** internally; a first-party `kyselyAdapter` URL was **404** this pass — treat Kysely+Better Auth as *compatible in principle*, not as a documented first-party adapter until that page exists. Auth.js official adapters include Prisma and Drizzle. First-party sessions (A5-A) work with any A3 option. A dedicated IdP keeps **its own** identity store. Core API still needs A3 for domain data plus a local `subject`/`actorId` map. Do not share IdP tables with project/lead/file rows. |
| **A1 compute ↔ A1 deploy** | Where the process runs (this Windows box / Hetzner EU VM / Fly Machines) is not the same as how it is shipped (pnpm+systemd, Compose, Coolify, Dokploy, CapRover, Fly Machines). A PaaS does not choose the cloud. |
| **A1 ↔ A4 / A6 / A7** | Remote object storage, a self-hosted obs host, a PaaS control plane, and a persistent tunnel need a non-local compute target. Local-now A1 still allows those as **later** staging steps. Docker is **not** required on Windows now. |
| **A2 ↔ A1** | NestJS + three Next apps, or three TanStack Start apps, need more RAM than Fastify/Hono + Vite CSR. Size the lab VM after the bundle. A self-hosted PaaS adds its own 2 GB-class control plane on top. |
| **A4 ↔ files / A7** | Private files stay authorized through Core API. A public bucket URL is not an authorization control. Tunnel/localhost does not replace BOLA on `fileId`. |
| **A2 / A3 ↔ outbox** | Transactional outbox is already accepted (ADR-004). All A3 options can implement same-transaction writes. ORM choice does not remove the outbox. |
| **OpenAPI ↔ mobile / SketchUp** | Android/iOS and the later SketchUp Ruby client consume the canonical OpenAPI contract. Bundle choice must not move business truth into a frontend framework. |

Incompatible-without-extra-work (not forbidden, but not “no further gate”):

- Auth.js as the primary staff/portal library **without** Next.js or Express (A2-A/B) needs a custom integration. Official first-party list does not include Fastify, Hono or Nest.
- Better Auth **on Fastify** has no first-party helper on the official install page. Use the documented generic Request/Response path, a community adapter, or pick A5-A (first-party sessions).
- TanStack Start official docs (2026-09-21) still say **Release Candidate** (feature-complete, API considered stable, not bug-free). Treating it as production-settled v1 is not evidenced.
- SQLite-only production is not offered. A3-C is local/dev SQLite with PostgreSQL for lab/staging/prod.
- **MinIO community GitHub is no longer maintained** (official README). It is not offered as a *new* FZ-A4 dependency.
- Moving project/customer/`fileId` BOLA or BFLA into an IdP authorization product (Keycloak Authorization Services, Ory Keto, Logto/ZITADEL application roles as the only ACL) is **not** offered unless a later packet explicitly justifies it. Identity choice must not relocate domain authorization.

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
- [Drizzle PostgreSQL](https://orm.drizzle.team/docs/get-started/postgresql-new) — official `pg` driver, `drizzle-kit generate` / `migrate`. [Prisma docs](https://www.prisma.io/docs). [PostgreSQL](https://www.postgresql.org/). [SQLite](https://www.sqlite.org/). [OpenTelemetry](https://opentelemetry.io/). [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/). [MinIO GitHub README](https://raw.githubusercontent.com/minio/minio/master/README.md) — community repo **no longer maintained**; not a recommended new dependency.
- [CodeRabbit plans](https://docs.coderabbit.ai/management/plans) — already recorded in S2.5 evidence.
- [Better Auth introduction](https://www.better-auth.com/docs/introduction), [comparison](https://www.better-auth.com/docs/comparison), [plugins](https://www.better-auth.com/docs/plugins), [pricing](https://www.better-auth.com/pricing), [enterprise](https://www.better-auth.com/enterprise), [LICENSE.md](https://raw.githubusercontent.com/better-auth/better-auth/main/LICENSE.md) (MIT).
- [ZITADEL](https://zitadel.com/), [pricing](https://zitadel.com/pricing), [pricing detail](https://zitadel.com/pricing/detail), [self-hosted](https://zitadel.com/self-hosted), [database](https://zitadel.com/docs/self-hosting/manage/database), [requirements](https://zitadel.com/docs/self-hosting/manage/requirements), [LICENSING.md](https://github.com/zitadel/zitadel/blob/main/LICENSING.md) (AGPL-3.0-only; proto/docs Apache 2.0; login/client MIT).
- [Keycloak](https://www.keycloak.org/) (26.7.4 noted 16 Sep 2026), [database](https://www.keycloak.org/server/db), [LICENSE.txt](https://raw.githubusercontent.com/keycloak/keycloak/main/LICENSE.txt) (Apache 2.0), [passkeys 26.4](https://www.keycloak.org/2025/09/passkeys-support-26-4).
- [authentik pricing](https://goauthentik.io/pricing/), [Docker Compose install](https://docs.goauthentik.io/install-config/install/docker-compose/), [LICENSE](https://raw.githubusercontent.com/goauthentik/authentik/main/LICENSE) (MIT for core; `authentik/enterprise/` separate; website CC BY-SA 4.0).
- [Ory open source](https://www.ory.com/open-source), [Ory pricing](https://www.ory.com/pricing) (Hydra/Kratos/Polis/Keto/Oathkeeper Apache-2; Network + OEL commercial).
- [Logto pricing](https://logto.io/pricing), [self-hosted plans](https://logto.io/self-hosted-plans), [github.com/logto-io/logto](https://github.com/logto-io/logto/) (MPL-2.0). Added because official OIDC/OAuth 2.1 + self-host + Cloud free tier is material for this stage; not a ranking.
- **Delta pass 3 (2026-09-21):** [minio/minio README](https://raw.githubusercontent.com/minio/minio/master/README.md) (`THIS REPOSITORY IS NO LONGER MAINTAINED`; source-only community; legacy binaries unmaintained). [TanStack Start overview](https://tanstack.com/start/latest/docs/framework/react/overview) (**Release Candidate**). [React Router Framework Mode](https://reactrouter.com/start/framework/installation). [Kysely](https://kysely.dev/). [Coolify docs](https://coolify.io/docs) / [LICENSE](https://raw.githubusercontent.com/coollabsio/coolify/v4.x/LICENSE) Apache-2.0; [self-host vs Cloud](https://next.coolify.io/docs/core/selfhosted-cloud-comparison). [Dokploy license update](https://dokploy.com/blog/we-are-updating-dokploys-open-source-license). [CapRover LICENSE](https://raw.githubusercontent.com/caprover/caprover/master/LICENSE). [Garage](https://garagehq.deuxfleurs.fr/) / [backup clients](https://garagehq.deuxfleurs.fr/documentation/connect/backup/). [RustFS](https://github.com/rustfs/rustfs) Apache-2.0. [SeaweedFS](https://github.com/seaweedfs/seaweedfs) Apache-2.0. [OpenObserve](https://github.com/zinclabs/openobserve) AGPL-3.0. [SigNoz](https://github.com/SigNoz/signoz). [Infisical](https://github.com/Infisical/infisical) MIT+`ee/`. [OpenBao](https://github.com/openbao/openbao/) MPL-2.0. [Pangolin](https://github.com/fosrl/PANGOLIN).
- **Delta 2026-09-21 (pass 2, official only):** [Casdoor README](https://raw.githubusercontent.com/casdoor/casdoor/master/README.md), [LICENSE](https://raw.githubusercontent.com/casdoor/casdoor/master/LICENSE) (Apache 2.0), [overview](https://casdoor.org/docs/overview), [OIDC client](https://casdoor.org/docs/how-to-connect/oidc-client), [server installation](https://casdoor.ai/docs/basic/server-installation), [MCP security](https://casdoor.ai/docs/llm/mcp-security/). [SuperTokens LICENSE.md](https://raw.githubusercontent.com/supertokens/supertokens-core/master/LICENSE.md), [ee/LICENSE.md](https://raw.githubusercontent.com/supertokens/supertokens-core/master/ee/LICENSE.md), [pricing](https://supertokens.com/pricing), [self-host](https://supertokens.com/docs/deployment/self-host-supertokens.md), [telemetry wiki](https://github.com/supertokens/supertokens-core/wiki/Telemetry). [Authelia](https://www.authelia.com/), [OIDC provider](https://www.authelia.com/configuration/identity-providers/openid-connect/provider/), [OIDC integration](https://www.authelia.com/integration/openid-connect/introduction/), [first-factor backends](https://www.authelia.com/configuration/first-factor/introduction/). [Kanidm](https://kanidm.com/), [comparisons](https://kanidm.com/comparisons/), [supported features](https://kanidm.github.io/kanidm/stable/supported_features.html), [support](https://kanidm.github.io/kanidm/stable/support.html), [LICENSE.md](https://raw.githubusercontent.com/kanidm/kanidm/master/LICENSE.md) (MPL-2.0). OpenID Foundation certified-implementation lists retrieved this pass did **not** contain Casdoor (certification **UNKNOWN** / not evidenced).

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

### Bundle E — Hono + TanStack Start ×3 + PostgreSQL/Drizzle or Kysely + Better Auth

- **Core API:** Hono on Node 24 via `@hono/node-server` (same as B). Fastify is compatible but loses the official Better Auth Hono helper.
- **WWW / Portal / Admin:** three **TanStack Start** React apps (Vite). Official: full-document SSR, streaming, typed TanStack Router, server functions, Node-portable hosting. **Official status 2026-09-21: Release Candidate** — feature-complete, API considered stable, not claimed bug-free, road to v1 “likely quick” ([overview](https://tanstack.com/start/latest/docs/framework/react/overview)). React Server Components are **experimental**.
- **Data pairing:** Drizzle or Kysely (A3-B/E).
- **Auth pairing:** Better Auth documents a `tanstackStartCookies` plugin on the install page. First-party sessions (A5-A) and A5-D OIDC also compatible.
- **Binding:** server functions must **not** become domain truth. They may call Core API / generated clients only. Mobile and SketchUp stay OpenAPI clients.
- **Consequences:** first-party typed routing and SSR without Next. Extra RAM vs Vite CSR. RC risk: API drift before v1. Three trust zones remain three apps.

### Bundle F — Hono or Fastify + React Router Framework Mode ×3 + PostgreSQL/Drizzle or Kysely + Better Auth

- **Core API:** Hono (preferred for Better Auth) or Fastify.
- **WWW / Portal / Admin:** three official React Router Framework Mode apps (`npx create-react-router@latest`, Vite, `localhost:5173`) ([installation](https://reactrouter.com/start/framework/installation)). This is the current Remix-lineage framework, not a beta experiment.
- **Data/auth pairing:** same as E. Better Auth lists a React Router helper on the official install page.
- **Binding:** loaders/actions are BFF adapters, not the CRM/offer/file source of truth.
- **Consequences:** stable Vite + typed routes + SSR without Next and without TanStack RC. Less “battery included” than Next for SEO image/caching conventions.

Express + Astro is **not** offered. It resembles legacy shape and is not inherited (POST-V2 §4).

**Excluded from the A2 shortlist (evidence):** Remix 2 as a *new* start (official path is React Router Framework Mode). SolidStart/Qwik/SvelteKit (would fork the React Visual/UX canons). Astro (legacy shape). Cloudflare Workers/Pages as the app runtime (ingress-only). Nest+TanStack (two heavy frameworks, no first-party pairing).

**MikroORM** is not offered as an A2 pairing target; see A3 exclusions.

### Bundle evaluation (facts, not a ranking)

Applies to all four: TypeScript, pnpm/Turborepo, OpenAPI source of truth,
modular monolith, outbox, private files via API, server-side authz,
Android/iOS and SketchUp via the same contract, Cloudflare as ingress
not as compute, EU/privacy depends on A1 region, ZAP once a process
listens, ASVS mapping already started, SCA after lockfile deps exist,
0 PLN **now** if A1 stays local.

| Requirement | A Fastify+Vite | B Hono+Vite | C Nest+Next+Drizzle+Better Auth | D Nest+Next+Prisma+Auth.js | E Hono+TanStack Start | F Hono/Fastify+RR Framework |
|---|---|---|---|---|---|---|
| Windows DX | Node + Vite official | Node adapter official | Node + Next official | same as C | Vite + RC Start | official `create-react-router` |
| WWW SEO/performance | Vite SSR/prerender is extra work | same | Next official SSR/SSG/streaming | same as C | official SSR/streaming; **RC** | official Framework Mode SSR |
| Portal/Admin | separate Vite CSR apps | same | separate Next apps | same | separate Start apps | separate RR apps |
| Better Auth first-party API helper | not listed for Fastify | **Hono listed** | Nest helper is **community** | not the Auth.js path | Hono API + `tanstackStartCookies` | Hono API + RR helper listed |
| Auth.js first-party | no | no | possible on Next only | **yes** on Next | no | no |
| Three trust zones | three apps | three apps | three Next apps | same | three Start apps | three RR apps |
| Cloudflare independence | Node self-host | Node; do not inherit Workers | Node; do not inherit Vercel | same | Node-portable; not CF-bound | Node-portable |
| OpenAPI clients | fronts consume generated clients | same | same | same | server functions call API only | loaders/actions call API only |
| Vendor lock-in | low | low | Nest/Next conventions | Nest/Next + Prisma | TanStack RC + Vite | RR conventions; no Next |
| Agent/Cursor maintainability | small API; SSR extra | small API; official auth helper | more Nest/Next files | most generated/config | typed router; RC docs flux | typed routes; Remix-lineage docs |
| Future scaling | scale `apps/api` + fronts | same | heavier baseline | Prisma client sync | same + Start runtime | same + RR runtime |
| Testability | Fastify inject | Hono `app.request` | Nest testing module | Nest + Prisma test DB | Vite/Start test surface | RR test surface |

---

## FZ-A1 — Compute location + deployment model (now / staging / production)

- **question:** Two facts, currently conflated: **(A)** where compute physically runs, and **(B)** how applications/services are deployed and operated on that compute. Production cutover is out of scope and DANGEROUS. Docker is **not** mandatory on Windows even if a later Linux PaaS uses it.
- **why_blocked:** Hosting/compute undecided (POST-V2 §4, ADR-007). A raw Hetzner VM is not the only deploy model on Hetzner.
- **options (compute):**
  - **A — Local now; remote staging later.** Develop on this Windows workstation (0 PLN compute), typically **non-containerized** `pnpm` + Node 24. GitHub Actions later as a **check runner only**, not hosting. **Staging path:** add a Hetzner Cloud EU VM (FSN/NBG/HEL) when Owner approves spend — CX23 cap **€5.49/mo excl. IPv4 and VAT** — and name a **DEPLOY** model below. **Production path:** new OWNER-DECISION; not this VM by default; never CT8.
  - **B — Hetzner EU lab/staging now.** Create a FSN/NBG/HEL Cloud VM now. CX23 **€5.49/mo excl. IPv4 and VAT**. IPv4 / backups / extra traffic **UNKNOWN**. GDPR/EU. Recurring spend is OWNER-ONLY before create. **Now = staging VM + named DEPLOY.** **Production path:** still a later OWNER-DECISION.
  - **C — Fly.io Machines lab/staging now.** Usage billing; card required ([Fly pricing](https://fly.io/docs/about/pricing/)). Example: `shared-cpu-1x` 256MB **$2.02/mo**; volumes **$0.15/GB/mo**. EU regions listed (`fra`, `ams`, `cdg`). Free-trial allowance **UNKNOWN**. **DEPLOY is Machines** (do not also install Coolify on Fly). Unmanaged Fly Postgres is documented as unsupported for new production reliance.
  - **D — Local-only until a later packet.** Same 0 PLN now as A, but **no** pre-accepted Hetzner/Fly staging path and no DEPLOY name. A new packet is required before any remote VM.
- **DEPLOY (required on A/B; ignored on C; forbidden as a substitute for D):**
  - **DEPLOY=systemd** — `pnpm` build + systemd units on Linux (NSSM/Task Scheduler can stay on Windows). No Docker required. Fewest extra services. You write unit files, reverse-proxy, certs, migrate/backup jobs.
  - **DEPLOY=compose** — Docker Compose on the Linux host for API/fronts/Postgres/obs/IAM/files/backup sidecars. Windows can remain native Node. Compose is the contract; no PaaS control plane.
  - **DEPLOY=coolify** — [Coolify](https://coolify.io/docs) Apache-2.0 self-hosted PaaS. Official: **no Coolify license fee**; you pay infrastructure. Cloud (not required) starts at **$5/mo** for two connected servers, **$3/mo** each extra ([self-host vs Cloud](https://next.coolify.io/docs/core/selfhosted-cloud-comparison)). Workloads stay on *your* Docker servers. Can deploy apps, databases and one-click services (Postgres, etc.). **Adds a control plane** you must install, update, backup and restore. Compromising Coolify compromises deploys.
  - **DEPLOY=dokploy** — current published code Apache-2.0; vendor blog states a future `proprietary/` paid split ([license update](https://dokploy.com/blog/we-are-updating-dokploys-open-source-license)). Cloud from about **$4.50/server/mo** annual (confirm at decision time). Docker-native. **Open-core risk** if FZ-needed features move behind paywall.
  - **DEPLOY=caprover** — Apache-2.0 plus LICENSE appendix restricting redistribution of paid features. Docker Swarm PaaS. Older, smaller ecosystem than Coolify. Software $0.
- **Can a free self-hosted PaaS simplify Core API + WWW + Portal + Admin + PostgreSQL + object storage + observability + IAM + backup jobs?** Officially yes for *Linux Docker-shaped* services (Coolify documents applications, databases and one-click services on connected servers). It does **not** force Docker on Windows now. It does **not** replace Cloudflare. It **increases** services operated by one control plane unless it replaces hand-written systemd/nginx/cert/compose scripts. Control-plane backup/restore becomes part of A6.
- **Excluded from the A1 shortlist:** Kubernetes/k3s/Rancher (ops mass for this stage). Portainer as the *app* PaaS (container UI, not git-deploy). Dokku (older Heroku clone; not materially stronger than Coolify/Compose for this monorepo). Kamal (Rails/Docker-centric; not a TS first-class win). Railway/Render/Heroku-class SaaS (paid; not OSS self-host). Coolify Cloud as the default (paid control plane; self-host has the same feature set and $0 license). Installing a PaaS on the Windows workstation as the *now* path (Docker Desktop + control plane RAM is not “0 PLN simpler”).
- **cost:** A/D = 0 PLN compute now. B = documented euro cap + UNKNOWN extras + VAT. C = USD usage + card. Self-hosted PaaS software $0; Cloud PaaS is OWNER-ONLY. Recurring spend OWNER-ONLY.
- **security/privacy:** EU preferred for remote. No customer data in lab. Secrets off git. PaaS dashboards are admin surfaces (A7 identity-aware access later).
- **reversibility:** A/D reversible. B/C destroyable. Compose/systemd exit is files. PaaS exit is “export compose + volumes” — test it.
- **blocks if local-only:** remote restore, remote private-origin proof, CI deploy.
- **does not block:** local API/UI after A2, localhost ZAP, contracts, domain.
- **reply:** `DECISION FZ-A1: OPTION A|B|C|D` and if A or B: `DEPLOY=systemd|compose|coolify|dokploy|caprover`

## FZ-A2 — Application bundle (API + WWW + Portal + Admin)

- **question:** Which coherent bundle implements Core API and the three frontends? Isolated framework names are not accepted.
- **why_blocked:** Frameworks undecided (POST-V2 §3). The Fastify/Hono+Vite vs Nest+Next shortlist omitted current Vite full-stack frameworks.
- **options:**
  - **A** — Bundle A: Fastify + Vite React (WWW SSR via Vite is extra work; Portal/Admin may stay CSR) + intended Drizzle or Kysely + Better Auth (non-first-party Fastify wiring) or A5-A/D.
  - **B** — Bundle B: Hono (`@hono/node-server`) + Vite React + intended Drizzle or Kysely + Better Auth (official Hono helper).
  - **C** — Bundle C: NestJS + Next.js ×3 + intended Drizzle + Better Auth (Nest helper is community).
  - **D** — Bundle D: NestJS + Next.js ×3 + intended Prisma + Auth.js (Auth.js first-party on Next).
  - **E** — Bundle E: Hono + **TanStack Start ×3** + Drizzle or Kysely + Better Auth (`tanstackStartCookies`). Official status **Release Candidate** (feature-complete, API considered stable, **not** bug-free) as of 2026-09-21. RSC experimental. Server functions must only call Core API.
  - **F** — Bundle F: Hono (or Fastify) + **React Router Framework Mode ×3** + Drizzle or Kysely + Better Auth (RR helper listed). Official `create-react-router` path; not a beta experiment. Loaders/actions are BFF adapters only.
- **cost:** All software is OSS. Hosting follows FZ-A1. C/D/E need more RAM than A/B Vite CSR. Extra VM size **UNKNOWN** until measured.
- **security/privacy:** Server-side authz in `apps/api` in every option. Frontend server functions / loaders / Server Actions do **not** become domain BOLA. CSP/CSRF/security headers live at the Node origin and/or Cloudflare; they do not replace ASVS tests.
- **reversibility:** A/B smallest runtimes. E carries RC churn until v1. C/D couple Nest/Next. Prisma (D) adds a generated client. OpenAPI clients stay the Android/iOS/SketchUp path in every option.
- **blocks:** HTTP server, generated runtime clients, WWW/Portal/Admin, ZAP against a live process.
- **safe work continuing:** current OpenAPI/domain/validation already exist.
- **reply:** `DECISION FZ-A2: OPTION A|B|C|D|E|F`

## FZ-A3 — Database engine and data access

- **question:** Which database and access style does the modular monolith use in lab, with the same engine intended for later staging/prod unless a later packet says otherwise? Type-safe SQL is a first-class option; this is not a raw-SQL-versus-ORM-only choice.
- **why_blocked:** Database/ORM undecided (POST-V2 §4, ADR-007).
- **options:**
  - **A — PostgreSQL + explicit SQL migrations, no query builder.** Compatible with all bundles. Most portable SQL. Manual TypeScript mapping. Outbox is raw SQL in the same transaction. Highest SQL transparency; highest agent-string-SQL risk.
  - **B — PostgreSQL + Drizzle.** Official `pg` + `drizzle-kit` migrations. Intended pairing for Bundles A–C/E/F. Official Better Auth `drizzleAdapter`. Official Auth.js Drizzle adapter if A5 uses Auth.js on Next.
  - **C — SQLite locally + PostgreSQL in lab/staging/prod, same SQL migrations.** Dev convenience only. Dual-engine dialect risk. Not a production SQLite decision.
  - **D — PostgreSQL + Prisma.** Official Prisma client/migrations. Intended pairing for Bundle D. Official Better Auth and Auth.js Prisma adapters. Exit cost: replace generated client. Weakest SQL transparency; highest generated-code burden.
  - **E — PostgreSQL + Kysely.** Official type-safe SQL builder, **0 runtime dependencies**, PostgreSQL first-class, TypeScript migrator, optional `kysely-codegen` ([kysely.dev](https://kysely.dev/)). Explicit transactions. Complex CRM/reporting stays close to SQL. JSONB via typed helpers / `sql` fragments. PostGIS later via raw fragments (first-party GIS **UNKNOWN**). Better Auth uses Kysely internally for migrate; a dedicated public adapter page was **404** this pass. Lowest ORM lock-in after raw SQL. First-class FZ-A3 option for outbox + reporting without Prisma/Drizzle schema DSLs.
- **Evaluation notes (all PG options):** transactional outbox = same-transaction writes (already accepted). Rollback = down migrations you write and test; no product removes that. Vendor lock-in is lowest for A/E, medium for B, highest for D. Hosted cloud Postgres is **not** offered solely because it has a free tier.
- **Excluded from the A3 shortlist:** MikroORM (Unit-of-Work ORM; more enterprise ceremony than Drizzle/Kysely; no first-party Better Auth/Auth.js adapter evidenced this pass; not materially stronger for explicit outbox SQL). TypeORM / Sequelize (weaker current TS story than Drizzle/Kysely/Prisma). Knex alone (Kysely is the typed successor shape). PlanetScale/Neon/Supabase/RDS as *replacements for PostgreSQL the engine* (they are hosts; pick a host later, keep PG). Replacing PostgreSQL with a cloud document store.
- **now / staging / prod:** Install PostgreSQL on Windows now (official installer) or later on the A1 host. Hosted Postgres price **UNKNOWN** until a provider is chosen. Do not treat a local cluster as production HA.
- **cost:** PostgreSQL, SQLite, Drizzle, Kysely, Prisma Client are free software. Hosted price UNKNOWN.
- **security/privacy:** EU hosting once remote. Reversible lab migrations. No customer dumps.
- **blocks:** Persistence, outbox tables, real restore, CRM beyond fixtures.
- **reply:** `DECISION FZ-A3: OPTION A|B|C|D|E`

## FZ-A4 — Private object/file storage (now / staging / production)

- **question:** Where do private, versioned, checksummed files live in each horizon? Public bucket URLs are never authorization.
- **why_blocked:** Object storage undecided. Legacy R2 is not current. **MinIO is no longer a good new dependency** (official evidence below).
- **MinIO correction (official, 2026):** the `minio/minio` README states **`THIS REPOSITORY IS NO LONGER MAINTAINED`**. Community Edition is **source-only**; legacy binaries are **no longer updated**. GitHub discussion #21723 is archived (2026-04-25). Upstream points new users at **AIStor Free / AIStor Enterprise** (vendor distribution, not the historic AGPL community binary). Using unmaintained MinIO CE as a *new* FZ store is rejected in this pack. Existing unofficial mentions of MinIO as the default S3 stand-in are withdrawn.
- **options:**
  - **A — Local `private/` now; S3-shaped remote later.** Gitignored disk, checksums, non-guessable keys, downloads only through authorized Core API. **Staging path (name one later):** Garage **or** RustFS **or** Hetzner Object Storage **or** R2. **Production path:** later OWNER-DECISION; keep the API/file contract stable. Best 0 PLN / Windows-now fit.
  - **B — Garage (S3) on Linux staging.** [Garage](https://garagehq.deuxfleurs.fr/) — official single dependency-free Linux binary, S3 API, ~**1 GB RAM** / 16 GB disk published minimums, EU-funded (NGI/NLnet). Official restic and Kopia connection docs. License **AGPL-3.0** (confirm in repo LICENSE at implement time). Single-node is possible; product is designed for multi-zone replication. **Windows local first-class binary: not claimed** — keep A for Windows now, Garage on the A1 Linux host. Presigned URLs / SSE / versioning completeness vs AWS S3: treat gaps as **UNKNOWN** until a lab matrix. Authorization remains Core API.
  - **C — RustFS (S3) OSS.** [rustfs/rustfs](https://github.com/rustfs/rustfs) Apache-2.0, S3-oriented, actively published 2026. Young versus Garage; S3 compatibility matrix dated **2026-08-09** in project materials — full FZ feature parity (presign, versioning, multipart, SSE) is **UNKNOWN** until tested. Windows/local DX **UNKNOWN** from official docs this pass (confirm before using as the Windows-now store). Software $0.
  - **D — Managed S3 now (R2 or Hetzner Object Storage).** R2 official free tier 10 GB-month / 1M Class A / 10M Class B; Standard **$0.015/GB-month** after ([R2 pricing](https://developers.cloudflare.com/r2/pricing/)). Hetzner Object Storage: EU FSN/NBG/HEL, S3-compatible, hourly charge while any bucket exists including empty ([overview](https://docs.hetzner.com/storage/object-storage/overview/)); euro amounts **UNKNOWN** here. Recurring spend OWNER-ONLY. Still: Core API authorizes; no public bucket ACL.
- **Excluded from the A4 shortlist:** **MinIO CE / unmaintained binaries** (official “no longer maintained”). **AIStor** (vendor successor; not the free community path this pack prefers). **SeaweedFS** (Apache-2.0, active; master+volume+filer topology is more operational surface than Garage/RustFS/local for the current private-file module — revisit if a later scale packet needs a filer/HDFS-like store). OpenStack Swift, Ceph RGW (cluster ops). Making a public R2/Hetzner/Garage URL the authorization control.
- **cost:** A now = 0 PLN. B/C = software $0 + A1 host RAM/disk. D = official USD free tier and/or UNKNOWN euros + VAT.
- **security/privacy:** No public predictable URLs as access control. Authorized, versioned, checksummed. Encryption in transit via origin TLS; at-rest encryption support varies (**UNKNOWN** per product until lab). Replication/erasure coding: Garage is replication-oriented; SeaweedFS erasure coding exists but that product is not on the shortlist.
- **blocks:** File module and Portal/Admin binary UX.
- **does not block:** lead slice (no binaries).
- **reply:** `DECISION FZ-A4: OPTION A|B|C|D` and if A: optional `LATER=garage|rustfs|hetzner-os|r2`

## FZ-A5 — Identity / authentication foundation

- **question:** Who issues staff, portal, later mobile, SketchUp and service identities, and how does Core API verify them? Domain authorization is already accepted and is **not** this decision.
- **why_blocked:** Auth library / IdP undecided. The previous four-option packet mixed “no framework”, two TypeScript libraries and one unnamed “external IdP later”, which hid the 2026 IAM landscape and the identity-versus-authorization boundary.

### Binding: identity is not domain authorization

| Layer | Owns | Examples | Must stay |
|---|---|---|---|
| **Authentication / identity** | Proof of who (or which service/agent) is calling | login, MFA, passkeys, magic link, recovery, social, SSO, session/token, `sub`, org membership as *identity grouping* | issuer + session/token verification |
| **Coarse identity roles** | Which *product surface* the subject may enter | `public` / `portal` / `admin`; later `mobile`, SketchUp, M2M | may be claimed by the issuer; Core API must still enforce |
| **Domain authorization** | What that subject may do to *Forma Zieleni objects* | BOLA on `projectId` / `offerId` / `fileId` / lead; BFLA on qualify/admin ops; BOPLA field filter; tenant/owner isolation ([SECURITY.md](./SECURITY.md)) | **Core API**, unless a later packet explicitly moves a named check |

Choosing an IAM/IdP must **not** move project/customer/resource BOLA or BFLA into Keycloak Authorization Services, Ory Keto, ZITADEL/Logto application roles, or Better Auth organization RBAC as the only ACL. Those products may *also* do RBAC/ABAC; that is not a reason to relocate domain truth. Core API remains the authorization server for domain objects. The IdP/library is the identity issuer (and optionally a coarse role source).

### What this stage actually needs versus later surfaces

**Now (lead slice):** public `POST /leads` stays anonymous. Authorized list/get/qualify needs **staff** identity. No customer Portal session exists yet. One operator. Windows local-first. 0 PLN compute is available via FZ-A1 A/D.

**Soon after A2:** Portal (client) and Admin (staff) as separate trust zones; CSRF/CORS per origin; logout; recovery.

**Later, without requiring a second identity migration if the issuer contract is stable:** Android/iOS (PKCE public clients), SketchUp/service (confidential or device/M2M), reconnectable Google (and later other) social/IdP brokering, staff SSO if an enterprise directory appears, service accounts for adapters, optional agent identities *above* DATA→RULES→DOMAIN (not botanical/financial truth), audit of login and privilege change.

### Two product classes (not a ranking)

1. **Embedded auth library** — runs inside `apps/api` (or Next). Users live in **your** Postgres. Zero extra JVM/Go/Python control plane. Fast Windows DX. You own flows, backups and ASVS session tests. You do **not** automatically get a certified OIDC IdP, SAML, SCIM, device grant or HA IdP cluster unless the library’s plugins actually provide them.
2. **Dedicated IAM/IdP** — separate issuer (self-host or Cloud). Core API is an **OIDC resource server**. WWW/Portal/Admin/Mobile/SketchUp are clients of one issuer (SSO). You pay with operations (compose/K8s/Java/second database) and/or vendor spend. Protocol surface (OIDC/OAuth2/PKCE) is the main migration hedge.

Delta pass 2 (2026-09-21) researched Casdoor, SuperTokens, Authelia and Kanidm from official docs/GitHub. **Casdoor is added** as A5-D because it is a complete Apache-2.0 self-hosted IdP with PostgreSQL, OIDC+PKCE, device grant, M2M, SAML, SCIM, LDAP, orgs, WebAuthn/MFA and OSS MCP/A2A — a free-OSS combination the earlier shortlist split across paid editions (Logto Pro add-ons, authentik Enterprise agents, Ory OEL SAML). SuperTokens, Authelia and Kanidm stay **off** the Owner shortlist; exclusion reasons are in the delta section below (not “not researched”).

### Candidate evidence (official sources 2026-09-21; not a ranking)

**Better Auth** — TypeScript auth/authorization *framework*, MIT ([LICENSE.md](https://raw.githubusercontent.com/better-auth/better-auth/main/LICENSE.md)). Official: email/password, social, 2FA, passkey, magic link, email OTP, organization/access control, admin plugin, generic OAuth, multi-session; plugins for SSO/SAML 2.0, SCIM, JWT, API keys, OAuth 2.1 *provider*, device authorization, bearer, **Agent Auth**, MCP ([plugins](https://www.better-auth.com/docs/plugins)). Comparison page: framework-agnostic; data in your DB; no per-user auth billing; can run embedded or as a standalone self-hosted auth server ([comparison](https://www.better-auth.com/docs/comparison)). Install: PostgreSQL/SQLite/MySQL; official Drizzle/Prisma adapters; official handlers include Hono and Next, not Fastify ([installation](https://www.better-auth.com/docs/installation)). Framework itself is free. Optional **managed infrastructure** (dashboard, audit, detections): Starter **$0/mo** (1 seat, 10k audit logs/mo, 1-day retention); Pro **$20/mo** (20k logs then $0.0001/event; SSO/Directory Sync 1 connection then **$50/mo** each; email $0.001, SMS $0.09); Enterprise custom; dashboard custom domain / log drain **$25/mo** add-ons ([pricing](https://www.better-auth.com/pricing)). Enterprise marketing: SSO, SAML, audit logs, dedicated support ([enterprise](https://www.better-auth.com/enterprise)). Windows DX: pnpm on Node 24 — no extra IdP process. Production ops: your app + Postgres backups. Lock-in: schema + plugin APIs in *your* repo; export is SQL. Maturity: active product; not an OpenID-certified IdP on the pages read. Security history as a certified IdP: **UNKNOWN** (library, not a standalone certified OP on those pages).

**Auth.js** (`next-auth` v5) — library, first-party Next/Qwik/SvelteKit/Express; Prisma/Drizzle adapters; official “Migrate to Better Auth” page exists ([getting started](https://authjs.dev/getting-started)). Fits Bundle D. Not a dedicated IdP. SAML/SCIM/device grant/OIDC-as-IdP: not first-party on that page. Windows DX same as Next. Lock-in: Next session conventions.

**ZITADEL OSS / Cloud** — dedicated identity platform (hosted login or API login UI; MFA; passkeys; social; RBAC; multi-tenant orgs; service users/agents; Actions; gRPC/REST admin APIs) ([zitadel.com](https://zitadel.com/)). Self-host: **AGPL-3.0-only** on the main repo; commercial license replaces AGPL ([LICENSING.md](https://github.com/zitadel/zitadel/blob/main/LICENSING.md), [self-hosted](https://zitadel.com/self-hosted)). PostgreSQL **14–18** required ([requirements](https://zitadel.com/docs/self-hosting/manage/requirements), [database](https://zitadel.com/docs/self-hosting/manage/database)). Cloud **Free $0/mo**: 100 DAU, unlimited users/orgs, 3 IdPs, service users/agents, data residency **EU, US, Switzerland, Australia**, 1 admin, 5k management API req, 1-day audit history ([pricing](https://zitadel.com/pricing), [detail](https://zitadel.com/pricing/detail)). **Pro starts at $100/mo**: 25k DAU included, 3 IdPs, 1 custom domain, 3 admins, 500k API req, 2-week audit; extra DAU/IdP/API/admin metered ($50 / $100 / $100 / $20 in the official calculator). Enterprise Cloud / Enterprise Self-Hosted: contact; commercial license; SLA up to 99.99%; GDPR/CCPA/ISO 27001/SOC 2 listed for Cloud (ISO/SOC **n/a** on Self-Hosted column). Windows native binary: **UNKNOWN** on pages read; documented deploy is Docker Compose / Kubernetes. HA: production checklist wants K8s + HA Postgres + tested restore.

**Keycloak** — OSS IAM, **Apache 2.0** ([LICENSE.txt](https://raw.githubusercontent.com/keycloak/keycloak/main/LICENSE.txt)). Official: SSO / single logout, OIDC, OAuth 2.0, SAML, identity brokering, social, LDAP/AD federation, admin + account consoles, clustering, adapters, **fine-grained authorization services** ([keycloak.org](https://www.keycloak.org/)). PostgreSQL supported/tested through **18** ([server/db](https://www.keycloak.org/server/db)); default `dev-file` is **not** for production. Passkeys supported (official since 26.4; enable in WebAuthn Passwordless Policy) ([passkeys 26.4](https://www.keycloak.org/2025/09/passkeys-support-26-4)). Latest release noted on the homepage: **26.7.4** (16 Sep 2026). Zero license cost. No first-party Keycloak Cloud on those pages (Red Hat/other commercial builds are a **different** product; their price is **UNKNOWN** here and not required). Windows: Java runtime or official container; Docker Desktop on Windows is the usual lab path, not documented as a first-class Windows service. Ops: JVM + Infinispan cache + Postgres + reverse proxy; clustering is real operational surface. Using Authorization Services for `fileId` BOLA would violate the binding above.

**authentik** — self-host only. Official FAQ: **no hosted** offering ([pricing](https://goauthentik.io/pricing/)). **OSS Free**: OIDC (OpenID Certified™), SAML, LDAP, SCIM, RADIUS, Kerberos, proxy; token exchange; B2B/B2C; community support, no vendor support. **Enterprise $5 / internal user / month** + **$0.02 / external user / month**, billed annually; service accounts **$0**; PAM, **agent accounts for non-human identity**, Entra/Google Workspace, mTLS, enhanced audit, scheduled offboarding, Windows local device login, etc. **Enterprise Plus** from **$20k / year**. Core LICENSE: **MIT** with enterprise directory under a separate license ([LICENSE](https://raw.githubusercontent.com/goauthentik/authentik/main/LICENSE)). Compose install: **≥2 CPU and 2 GB RAM**; official download snippets are Linux/macOS; Windows host is **UNKNOWN** on that page (Docker Desktop is a practical lab path, not an official Windows installer) ([compose](https://docs.goauthentik.io/install-config/install/docker-compose/)). PostgreSQL is required by the official compose (password length limit documented). Agent accounts that this project might want later are **Enterprise**, not OSS.

**Ory** — modular Apache-2 OSS: **Hydra** (OAuth2/OIDC, OpenID Certified®), **Kratos** (headless identities, first-party flows, MFA, WebAuthn), **Polis** (SAML/OIDC/SCIM bridge), **Oathkeeper** (IAP), **Keto** (Zanzibar-style RBAC/ABAC/ACL), **Talos** (API keys / non-human) ([open-source](https://www.ory.com/open-source)). Official OSS vs commercial split (do not assume OSS has everything): **B2B Organizations, SAML & OIDC via Polis, directory sync, token exchange, stateless JWT access tokens** are listed **No** on Open Source and **Yes** on OEL/Network. Social SSO and Hydra OAuth2/OIDC **Yes** on OSS. Self-host OSS = you run K8s/DB/patches; no 24/7, no production Helm on the OSS column. **Ory Network** pricing ([pricing](https://www.ory.com/pricing)): Developer **Free** (2 development environments, **0** production / **0** staging); Production **$770/year** ($21 included monthly credit; **$0.14 / aDAU / month**; M2M **$0.007 / token / month**; permission checks **$0.000090 / check / month**; 1 prod + 3 staging); Growth **$9,350/year** (B2B SSO **OIDC only** on that tier); Enterprise and **Ory Enterprise License** (self-host) custom. Multi-region / data residency called out on Network Enterprise. GDPR/SOC 2 claimed for Network, not for OSS. Kratos React Native UI exists officially — relevant to later mobile. Keto must **not** become domain BOLA. Windows native: **UNKNOWN**; documented path is containers/K8s.

**Logto** (additional candidate — official OIDC/OAuth 2.1 IdP with a real free Cloud and MPL-2.0 OSS). Cloud **Free $0/mo**, no card: up to **50k MAU**, 50k tokens, 3 apps, 1 M2M app, 3 social connectors, passwordless email/SMS, magic links, audit; **passkeys, MFA, enterprise SSO, orgs, RBAC, SAML apps** are Pro add-ons or Pro-only ([pricing](https://logto.io/pricing)). Pro **from $24/mo** + usage (tokens $0.08 / 100 after 50k; MFA **$48/mo**; orgs **$48**; RBAC **$32**; enterprise SSO **$48** / connector; SAML app **$96**; extra M2M **$8**). Enterprise: custom region, private cloud, SLA. Self-host: **OSS Community Free** (complete auth, unlimited users/apps, community support; **3 SAML apps**; IdP-initiated SSO and mandatory console MFA policy are paid) ([self-hosted plans](https://logto.io/self-hosted-plans)). Self-hosted Pro **$199/mo billed annually** (early access, intended up to 50k MAU). License **MPL-2.0**. Official local: Docker Compose or `npm init @logto` **requiring PostgreSQL**. Cloud data regions mentioned on third-party pages; official Enterprise “custom data region” only — EU residency on Free/Pro **UNKNOWN** on the pricing page.

**Casdoor** (delta add — Apache-2.0 dedicated IdP; **software license $0**, ops/infra separate). Official: complete self-hosted identity provider, not a proxy and not an embeddable library ([README](https://raw.githubusercontent.com/casdoor/casdoor/master/README.md)). **Apache License 2.0** on the whole repository ([LICENSE](https://raw.githubusercontent.com/casdoor/casdoor/master/LICENSE)); no `ee/` split found. Official protocols in that OSS tree: OAuth 2.0 / OIDC (full authorization server), SAML 2.0 as IdP **and** SP, CAS, LDAP (sync or serve), SCIM 2.0, WebAuthn/passkeys, TOTP/MFA including email/SMS codes, Face ID, social/IdP brokering (Google, GitHub, Entra ID, plugins). Organizations / multi-tenancy, Casbin ACL/RBAC/ABAC (do **not** use as domain BOLA), audit logs, REST/Swagger admin API, webhooks, MCP gateway + A2A. Discovery claims `code_challenge_methods_supported: S256` (PKCE) and `grant_types_supported` includes `authorization_code`, `client_credentials`, `refresh_token`, and `urn:ietf:params:oauth:grant-type:device_code` ([OIDC client](https://casdoor.org/docs/how-to-connect/oidc-client)). MCP docs: OAuth 2.1 + PKCE + DCR + RFC 8707 resource indicators ([MCP security](https://casdoor.ai/docs/llm/mcp-security/)). Databases via XORM: MySQL, MariaDB, **PostgreSQL**, CockroachDB, SQL Server, Oracle, SQLite 3, TiDB; official Windows/Linux/macOS binaries including Windows arm64 ([server installation](https://casdoor.ai/docs/basic/server-installation)). HA: optional Redis when more than one replica (README). Phone/email verification and password retrieval ([overview](https://casdoor.org/docs/overview)). SDKs include Node/React; first-party Android/iOS SDK: **UNKNOWN** on pages read (standard OIDC/PKCE clients apply). Token exchange RFC8693: **UNKNOWN** (not in the discovery grant list quoted). OpenID Certified™: **not found** on the OpenID Foundation certified-implementation lists retrieved this pass → treat as **not evidenced**. Commercial support exists at casdoor.ai/help; that is optional paid *support*, not a feature lock. Demo default `admin` / `123` must not reach any lab with real data. Windows local: official `casdoor.exe` + Postgres (or SQLite eval only). Ops: one Go binary + database; no JVM. Compared with the existing shortlist only where it changes the choice: Apache-2.0 vs ZITADEL AGPL; SAML+SCIM+LDAP+device+MCP all in OSS vs Logto Cloud/Pro add-ons and authentik Enterprise agent accounts; lighter than Keycloak JVM; still a second control plane (over-engineers the current lead slice if picked *now*).

### Delta exclusions (official reasons; not “not researched”)

**SuperTokens — excluded from the Owner shortlist.** Dual license: everything outside `ee/` is Apache 2.0; `ee/` is the SuperTokens Enterprise license and may be used in **production only** with a valid subscription/license; development/testing of `ee/` without a subscription is allowed ([LICENSE.md](https://raw.githubusercontent.com/supertokens/supertokens-core/master/LICENSE.md), [ee/LICENSE.md](https://raw.githubusercontent.com/supertokens/supertokens-core/master/ee/LICENSE.md)). Official: “Self hosting the open source features is free without any limits”; paid add-ons apply to **both** Cloud and self-host ([pricing](https://supertokens.com/pricing), [helpdesk pricing](https://helpdesk.supertokens.com/articles/1663201169-supertokens-pricing-for-high-volume-and-enterprise-use-cases)). **Free OSS (FZ-relevant):** email/password, social/custom providers, passwordless magic links, email/SMS OTP, verification, forgot-password, session management, RBAC, user-management dashboard, overrides/hooks, community support. **Paid / license-key (FZ-relevant):** MFA **$0.01/MAU**, self-host **minimum $100/mo**; multi-tenancy / organisational support; “this is where your application would become an OAuth 2.0 provider”; M2M; extra dashboard users **$20/user/mo** after 3 free; managed multi-AZ/SLA. Self-host unlocks those via `PUT /ee/license` ([self-host](https://supertokens.com/docs/deployment/self-host-supertokens.md)). Core **11.0.0+ is PostgreSQL-only** (MySQL/Mongo dropped); official Windows `install.bat`; extra Java Core on port 3567 (not in-process). **Telemetry default on:** Core pings every 24h (version, anonymous ID, MAU/user counts, dashboard emails — wiki states no end-user data); disable with `disable_telemetry: true` in `config.yaml` or `DISABLE_TELEMETRY=true` in Docker. Backend SDK telemetry is separate (`telemetry: false`). License-key stats are **not** disabled by that flag; a “stateless license key” from support is required to stop those ([telemetry wiki](https://github.com/supertokens/supertokens-core/wiki/Telemetry)). **Why this does not change A5:** Forma Zieleni later needs MFA, a real OIDC issuer for Portal/Admin/mobile/SketchUp, and M2M — those are **ee/ paid**, not Apache Core. Better Auth already covers the free-embedded class (MFA/orgs/OAuth 2.1 provider/device/Agent Auth as OSS plugins) without a licensed Java control plane.

**Authelia — excluded (re-evaluated as a certified OIDC Provider, not “forward-auth only”).** Official homepage: Apache-2.0 IAM/SSO portal, **OpenID Certified™** OIDC Provider, reverse-proxy companion, passkeys/passwordless, TOTP, WebAuthn, mobile push, email identity validation, password reset, HA/K8s, domain/resource authorization policies, <20 MB image / typically <30 MB RAM ([authelia.com](https://www.authelia.com/)). Provider **and** integration docs still call OIDC **open beta** while claiming certification to Basic / Implicit / Hybrid / Form Post / Config OP ([provider](https://www.authelia.com/configuration/identity-providers/openid-connect/provider/), [integration](https://www.authelia.com/integration/openid-connect/introduction/)). Official grant table: authorization_code, client_credentials, device_code, refresh **Yes**; **token exchange No (planned)**; SAML bearer grant **No (planned)**. **Does not support the OIDC Relying Party role** and “do not intend to” — no social/IdP brokering. Dynamic Client Registration: none / planned. User store is **file YAML or LDAP only** ([first-factor](https://www.authelia.com/configuration/first-factor/introduction/)) — password reset exists; first-party customer self-registration, organizations, SCIM directory, and a CIAM user database are not offered. **Why unsuitable for Forma Zieleni as the primary issuer:** Portal needs a customer identity directory (signup, recovery, later social/Google reconnect); Admin + mobile + SketchUp need a stable CIAM issuer with brokering and (later) SAML/SCIM. Authelia can issue OIDC tokens and even M2M/device grants, but it authenticates a **pre-provisioned file/LDAP workforce** in front of reverse-proxied apps. That is a real IdP for homelab/intranet SSO, not a customer+staff CIAM. Keycloak/authentik/Casdoor/Logto already cover certified-or-full OIDC without those CIAM holes. Do not use Authelia domain policies as BOLA.

**Kanidm — excluded (re-evaluated as a complete Unix/IDM IdP).** Official: “complete identity provider… you should not need any other components (like Keycloak)” — WebAuthn/passkeys, OAuth2/OIDC SSO, app portal, Linux/UNIX offline auth, SSH key distribution, RADIUS, read-only LDAPS, CLI + user self-service WebUI ([kanidm.com](https://kanidm.com/)). Supported standards include authorization-code, **client_credentials**, PKCE S256, RFC8693 **token exchange**, JWT access tokens, OIDC Core/Discovery, WebAuthn L3 + FIDO MDS ([supported features](https://kanidm.github.io/kanidm/stable/supported_features.html)). License **MPL-2.0**. Own ACID database + replication — **not PostgreSQL**; official comparison treats SQL IdPs as a single point of failure they chose to avoid ([comparisons](https://kanidm.com/comparisons/)). Replication: all nodes same version, **maximum 2 nodes**; stable support **4 months**; upgrade only N→N+1 ([support](https://kanidm.github.io/kanidm/stable/support.html)). SCIM: **bulk import / sync from another IdP only**. LDAP: read-only gateway. SAML: not listed. Social / upstream OIDC brokering: **not official** (open issue/discussion; maintainers: planned, not a priority). **Missing for Portal + Android/iOS + Admin + SketchUp/M2M:** customer self-registration CIAM, reconnectable Google/social, magic-link passwordless, SAML/SCIM *outbound* for later enterprise customers, first-party mobile SDKs (standard OIDC only), A3-aligned PostgreSQL identity store, Windows-first official install (**UNKNOWN**). M2M (client_credentials) and token exchange exist, so SketchUp *could* be a confidential client — the gap is the customer-facing and brokering side, not the grant table. Does not beat Keycloak/authentik/Casdoor on FZ surfaces; extra IDM (PAM/RADIUS/SSH) is unused weight.

### Capability matrix (official pages only; blank = not claimed there)

Legend: **Y** = claimed on an official page cited above; **P** = plugin / paid / edition-split; **N** = official page says no or not in OSS; **—** = not established on the pages read (**UNKNOWN**).

| Capability | Better Auth | Auth.js | ZITADEL OSS/Cloud | Keycloak | authentik OSS | Ory OSS / Network | Logto OSS / Cloud | Casdoor OSS |
|---|---|---|---|---|---|---|---|---|
| License (OSS core) | MIT | — (library; treat as OSS) | AGPL-3.0-only | Apache 2.0 | MIT (+ enterprise dir) | Apache-2 | MPL-2.0 | Apache 2.0 (whole repo) |
| True $0 self-host software | Y | Y | Y (AGPL) | Y | Y | Y | Y | Y |
| True $0 managed | P Starter infra $0 (not the issuer) | n/a | Cloud Free 100 DAU | n/a first-party | N (no hosted) | Network Developer (dev envs only) | Cloud Free 50k MAU | n/a first-party (demos only) |
| Users in *your* Postgres | Y | Y | Self-host Y / Cloud N | Y | Y | Self-host Y / Network N | Self-host Y / Cloud N | Y (also MySQL/SQLite/…) |
| Windows local burden | Node only | Node/Next | Container/K8s | JVM or Docker | Compose ≥2GB; Linux/macOS docs | Container/K8s | Node+PG or Compose | Official Win/Linux/macOS binaries |
| Extra production control plane | No | No | Yes | Yes | Yes | Yes (multi-component if Hydra+Kratos) | Yes | Yes (one Go binary + DB) |
| OIDC / OAuth2 | P OAuth 2.1 provider plugin | consumer, not IdP | Y | Y | Y Certified™ | Hydra Y Certified® | Y | Y (certification not evidenced) |
| PKCE | — (expect with OAuth plugin; confirm in impl) | Y typical for Auth.js | — | Y (OIDC) | Y (OIDC) | Y (Hydra docs historically; confirm) | Y (pricing CSRF/PKCE text) | Y S256 in discovery |
| Passkeys / WebAuthn | Y plugin | — | Y (Cloud table) | Y (26.4+) | — (MFA claimed in FAQ) | Kratos WebAuthn claimed | Cloud Pro; Free **—** | Y OSS |
| MFA | Y 2FA plugin | — | Y | Y (account console) | FAQ Y | Kratos Y | Cloud P $48 | Y TOTP/email/SMS OSS |
| Magic link / recovery | Y plugin | Y | — | — | email stages documented | Kratos recovery Y | Y magic links (Cloud Free) | email/SMS codes + password retrieval |
| Social login | Y | Y | Y | Y | Y (sources) | OSS Y | Free: 3 connectors | Y OSS (Google/GitHub/Entra + plugins) |
| Orgs / multi-tenancy | Y org plugin | — | Y core | realms/orgs Y | Y | OSS **N** / commercial Y | OSS Y / Cloud org add-on $48 | Y OSS |
| RBAC (identity) | Y org/admin | — | Y | Y | Y | Keto exists; OSS optimized checks **N** | Cloud P $32 | Casbin ACL/RBAC/ABAC OSS |
| Fine-grained *domain* authz | do not use as BOLA | n/a | do not use as BOLA | AuthZ Services exist — **do not use as BOLA** | policies exist — **do not use as BOLA** | Keto — **do not use as BOLA** | API resources — **do not use as BOLA** | Casbin — **do not use as BOLA** |
| SSO / SAML | P SSO SAML plugin | — | Y | Y | Y | Polis SAML OSS **N** | OSS 3 SAML apps; Cloud SAML P | Y IdP and SP OSS |
| SCIM | P plugin | — | Cloud inbound listed | — | Y OSS | directory sync OSS **N** | — | Y 2.0 OSS |
| Identity brokering | generic OAuth | providers | external IdPs | Y | sources | — | enterprise SSO P | Y OSS |
| Service accounts / M2M | API key / JWT plugins | — | Y (Cloud Free) | clients/service accts | OSS $0 in Enterprise billing text | Hydra M2M; Network metered | Free 1 M2M app | client_credentials in discovery |
| Device flow | Y plugin | — | — | Y (OAuth) | — | Hydra capable; confirm edition | — | Y device_code in discovery |
| Token exchange | — | — | — | JWT authz grants in 26.5 notes | Y OSS | OSS **N** / commercial Y | token exchange mentioned in billing FAQ | — |
| Audit trail | P managed infra or your logs | your logs | Cloud 1 day / 2 weeks | account history + server logs | OSS events; enhanced = Enterprise | commercial compliance tooling | Cloud 3 / 14 days | Y access logs OSS |
| Admin APIs | admin plugin | — | Y gRPC/REST | Y | Y | Y | Y | Y REST/Swagger |
| Hooks / events | plugins | callbacks | Actions | SPI/events | flows/stages | webhooks/hooks | webhooks 1 (Free) / 10 (Pro) | Y webhooks OSS |
| Android / iOS | Expo listed on install; RN **—** | — | SDKs claimed | adapters | — | official Kratos RN UI | SDKs claimed on GitHub | OIDC/PKCE; first-party mobile SDK **—** |
| WWW/Portal/Admin SSO | one cookie domain or OIDC plugin | Next-centric | one IdP, many clients | one IdP, many clients | one IdP, many clients | Hydra many clients | omni sign-in claimed | one IdP, many applications |
| SketchUp / service | API keys / device plugin | poor fit | service users | confidential clients | service accounts | Hydra clients | M2M apps | confidential + device grant |
| Agent identities | Agent Auth plugin | — | service users/agents (Cloud Free) | clients | **Enterprise** agent accounts | Talos / M2M | MCP claimed on GitHub | MCP gateway + A2A OSS |
| Backup/restore | your Postgres | your Postgres | your PG / Cloud | your PG | your PG | your PG / Network backups claimed | your PG / Cloud | your DB |
| HA / scale | scale `apps/api` | scale Next | K8s + HA PG | clustering official | compose = small; K8s later | Network HA; OSS you build | Cloud / your K8s | replicas + Redis |
| EU / residency | wherever A1 lives | same | Cloud: EU listed | wherever you host | wherever you host | Network Enterprise multi-region; OSS you host | Enterprise custom region; Free/Pro EU **UNKNOWN** | wherever you host |
| Vendor lock-in | schema + TS APIs | Next session | AGPL + Cloud API; proto Apache | standard protocols | MIT + enterprise features | APIs shared OSS↔Network | MPL + Cloud metering | Apache + standard protocols |
| Migration / export | SQL dump | SQL + session rewrite | standards + Cloud APIs | standards | standards (FAQ) | same APIs OSS↔Network | migrate-off FAQ; no dump format on page | SQL + OIDC/SAML/SCIM |
| Maintenance maturity | young TS product | long Next lineage; vendor points to Better Auth | commercial + OSS | long-lived (26.7.x in 2026) | 2026.8 line; certified OP | long-lived modular | commercial + OSS | active OSS; not certified on lists read |
| Operational complexity | lowest | low if already on Next | medium Cloud / high self-host | high | medium–high | highest if many components | medium | medium (single binary) |

### Architecture variants (coherent; not a ranking)

These are the **decision options**. A dedicated-IdP option requires naming the product in the reply. Bundle intended pairings (Better Auth / Auth.js) remain *compatible defaults*, not winners.

- **A — First-party opaque sessions + magic link, no auth framework.** Identity tables in Core Postgres. Compatible with every A2/A3 option. Most portable; most ASVS V6/V7 code to specify/test. No SAML/SCIM/OIDC-as-IdP unless you build it. Best “zero extra process on Windows” path. Future IdP migration means rewriting login UX unless you immediately emit a stable `actorId` and treat sessions as replaceable.

- **B — Embedded Better Auth (identity in Core Postgres).** Official Next/Hono helpers; Fastify is generic Request/Response or community. Plugins cover passkeys, magic link, orgs, SAML/SCIM, OAuth 2.1 provider, device grant, API keys, Agent Auth — **if** you enable and test them. Optional $0 Starter / $20 Pro infra is **not** required to authenticate. **Fits Bundle B and C best.** Domain BOLA stays in Core API; Better Auth organization RBAC is identity grouping only.

- **C — Embedded Auth.js.** First-party on Next (Bundle D, or C if Owner prefers Auth.js). Official Prisma/Drizzle. Vendor docs currently link “Migrate to Better Auth”. Not a no-extra-gate choice for Fastify/Hono. Weakest dedicated-IdP story (no official SAML/SCIM/device IdP).

- **D — Dedicated IdP now; Core API is an OIDC resource server.** One issuer for Admin + Portal + later Mobile + SketchUp/M2M. Frontends do not mount Better Auth/Auth.js as issuer. Owner **must name** one product and mode:
  - **D-ZITADEL-CLOUD** — $0 / 100 DAU, EU residency listed, passkeys/MFA/orgs/service users; recurring Pro $100+ if you outgrow Free. Identity data in vendor Cloud.
  - **D-ZITADEL-OSS** — AGPL self-host on Postgres 14–18; legal review of AGPL before coupling to a public product; commercial license if AGPL is unacceptable.
  - **D-KEYCLOAK** — Apache 2.0, full protocol suite, passkeys, clustering; highest classic IAM ops; Authorization Services must stay unused for domain BOLA.
  - **D-AUTHENTIK-OSS** — MIT core, certified OIDC, SAML/SCIM/token exchange, no vendor host; ≥2 GB compose; agent accounts are Enterprise ($5/user/mo).
  - **D-ORY-NETWORK** — managed; Developer Free has **no** production environment; Production **$770/year** + aDAU/M2M meters. SAML/B2B orgs not on the cheap tiers the way OSS marketing implies.
  - **D-ORY-OSS** — Kratos ± Hydra on your Postgres/K8s; Apache-2; you assemble login UI; B2B orgs/SAML/token exchange are **not** on the OSS feature column.
  - **D-LOGTO-CLOUD** — Free 50k MAU / 3 apps / 1 M2M; passkeys/MFA/SSO/orgs mostly Pro add-ons; EU residency **UNKNOWN** on Free/Pro.
  - **D-LOGTO-OSS** — MPL-2.0, `npm init @logto` or Compose + Postgres; 3 SAML apps in OSS; paid self-host from $199/mo annual if you want vendor support.
  - **D-CASDOOR** — Apache-2.0, official Windows binary + PostgreSQL, OIDC+PKCE, device grant, M2M, SAML, SCIM, LDAP, orgs, WebAuthn/MFA, OSS MCP/A2A; OpenID certification **not evidenced**; Casbin must not become domain BOLA. Software $0; ops/infra separate.

- **E — Phased protocol-ready embedded.** Implement **A or B now** (Owner names which) so Portal/Admin can ship on Windows without a second control plane. **Additionally bind** (not optional flavour): (1) stable `actorId` / issuer `sub` mapping in Core Postgres; (2) separate OAuth/OIDC *client identities* conceptually for `web` (public), `portal`, `admin`, later `mobile`, `sketchup`, `m2m` even if the first issuer is Better Auth’s OAuth 2.1 plugin or a local session cookie; (3) PKCE for any public client; (4) domain BOLA only in Core API. A later packet may swap the issuer to D-* without moving ACLs. This is the explicit “avoid a future auth *authorization* rewrite” path; login UX may still change.

### Over-engineering this stage versus capabilities that avoid a later auth migration

**Usually over-engineered for the current lead/staff slice (one operator, anonymous public lead, no enterprise customer IdP yet):** standing up Keycloak/authentik/Casdoor/Ory (Kratos+Hydra+Keto+Polis+Oathkeeper) or authentik Enterprise on the Windows workstation; paying ZITADEL Pro / Ory Production / Logto Pro add-ons before 100 DAU exist; buying SAML/SCIM/IdP-initiated SSO before any customer directory exists; using Keycloak Authorization Services, Ory Keto or Casdoor Casbin as the project/file ACL; enabling device grant, token exchange and agent-account products before SketchUp/agents exist; running a second HA identity cluster beside Core API.

**Materially reduces a later *identity-issuer* migration (keep even if you pick A/B/E):** treat Core API as a resource server (verify session or JWT, do not trust client-sent roles); store a stable subject; keep three web origins as three clients; plan PKCE for mobile; keep magic-link/MFA/recovery as identity concerns; keep Google (and later others) reconnectable; exportable identity rows (your Postgres or standard OIDC); do **not** encode `fileId` ACLs in the issuer.

**Materially reduces a later *protocol* migration (stronger reason to pick D or to enable Better Auth’s OAuth 2.1 provider under E):** one OIDC issuer that Admin, Portal, iOS/Android and SketchUp can all join without a new session invention; SSO across those surfaces; M2M client_credentials for adapters; optional later SAML/SCIM when a real enterprise buyer appears.

**Does not reduce domain-authz migration:** any IdP. BOLA tests stay in Core API regardless of A–E.

### now / staging / prod

- **Now:** localhost. Embedded A/B/C add no VM. Dedicated D on this Windows host implies Docker Desktop or WSL (not specified by most official Linux/macOS compose pages) plus a **second** Postgres (or a second schema) and RAM above a typical Node API. ZITADEL Cloud / Logto Cloud / Ory Developer can be $0 *managed* now but move identity PII off-box (lab must still use no customer data).
- **Staging:** same issuer mode as now, or promote E→D when a remote A1 host exists. Recurring Cloud/Pro/Network spend is OWNER-ONLY before subscribe.
- **Production:** new OWNER-DECISION. Do not treat Cloud Free DAU/MAU caps or OSS compose as production HA. Never point an IdP at CT8.

- **cost:** A–C = OSS in-process. B optional infra $0–$20+/mo. D-ZITADEL-CLOUD Free $0 then Pro from $100/mo. D-KEYCLOAK / D-AUTHENTIK-OSS / D-ZITADEL-OSS / D-ORY-OSS / D-LOGTO-OSS / D-CASDOOR = software $0 + A1 host (license vs infra are separate). D-ORY-NETWORK Production $770/year + meters. D-LOGTO-CLOUD Free then $24+ add-ons. authentik Enterprise $5/user/mo if agent accounts/PAM wanted. All recurring spend OWNER-ONLY.
- **security/privacy:** Sessions/CSRF/logout; no PII in logs; EU preferred for remote identity stores; AGPL legal review for ZITADEL OSS; Cloud identity is vendor subprocessors (DPA/SOC where listed). Framework/IdP auth is not object authorization.
- **reversibility:** A/B/C export SQL subjects. D Cloud: export/API **UNKNOWN** in detail except Logto “migrate off” FAQ and ZITADEL standard protocols. D OSS: DB + standard tokens. E is designed so the issuer is replaceable.
- **blocks:** Authorized list/get/qualify, Portal, Admin, Mobile sessions.
- **does not block:** public lead capture, OpenAPI, domain types.
- **reply:** `DECISION FZ-A5: OPTION A|B|C|D|E` and if D: `IdP=ZITADEL-CLOUD|ZITADEL-OSS|KEYCLOAK|AUTHENTIK-OSS|ORY-NETWORK|ORY-OSS|LOGTO-CLOUD|LOGTO-OSS|CASDOOR`. If E: `EMBED=A|B`. Optional: `CONSTRAINT domain-authz=core-api` (already binding).

## FZ-A6 — Observability + secrets + backup/restore (one packet, three concerns)

- **question:** Three independent layers that must not be forced into one product: **(A) telemetry/observability**, **(B) secrets**, **(C) backup/restore**. OpenTelemetry remains the instrumentation/export baseline regardless of backend. A backup product is not accepted until a real restore is tested. Secrets never go in git, prompts, logs, fixtures or Cursor rules.
- **why_blocked:** Observability backend, secret store and backup tool undecided.

### A6-A Observability (instrument once with OTel)

| Candidate | License / split | Logs | Metrics | Traces | Dashboards/alerts | RUM / session replay | OTLP | SLO / LLM-agent | Single-node / resources | Windows / Linux | HA | Ops |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| OTel SDK + JSON/stdout now | Apache-2.0 | Y (app logs) | later | later | N | N | export later | N | process-local | Y / Y | n/a | lowest |
| Grafana + Loki + Tempo (+ Prometheus) | AGPL/Apache mix per component; Grafana OSS vs Cloud | Y Loki | Y Prom | Y Tempo | Y Grafana | Grafana Cloud extras; OSS RUM **UNKNOWN** | Y | SLO in Grafana; LLM **UNKNOWN** | several processes; RAM **UNKNOWN** here | collector Y; full stack prefers Linux | possible | highest classic |
| OpenObserve | AGPL-3.0 ([repo](https://github.com/zinclabs/openobserve)); Cloud paid | claims Y | claims Y | claims Y | Y | RUM claimed | OTLP claimed | LLM observability claimed in marketing | designed single binary | Linux first; Windows **UNKNOWN** | claimed | one service vs LGTM |
| SigNoz | community MIT-shaped + separately licensed enterprise (`Other` on GitHub) | Y | Y | Y | Y | session replay / RUM **UNKNOWN** this pass | OTel-native | APM/SLO claimed; LLM **UNKNOWN** | ClickHouse-class footprint | Linux first | claimed | medium–high |

RUM/session replay that records Portal/Admin sessions is a **privacy** decision (EU/PII). Do not enable session replay on customer surfaces without a later packet.

### A6-B Secrets

| Candidate | License / split | Encrypt at rest | GitOps | Rotation / dynamic | Service / machine ID | Audit | PKI | Agent/AI isolation | Windows | Self-host burden | Recovery |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Windows Credential Manager / env + gitignored files | OS | OS DPAPI for stored creds; env is process memory | N (files stay gitignored) | manual | N | OS logs | N | N official | **native** | lowest | export you invent |
| SOPS + age | MPL-2.0 / CC0-ish age | Y (encrypted files) | **Y** | manual | N | git history of ciphertext | N | N | Y (age/sops binaries) | low | age key backup |
| Infisical OSS | MIT except `ee/` ([repo](https://github.com/Infisical/infisical)) | Y claimed | Y | rotation claimed; dynamic **check edition** | Y claimed | Y | **UNKNOWN** / paid? | official AI isolation **UNKNOWN** this pass | client Y; server Linux | adds a service + DB | you backup Infisical DB |
| OpenBao | MPL-2.0 ([repo](https://github.com/openbao/openbao/)) | Y | via agents | Y (Vault-class) | Y | Y | Y PKI engine | **UNKNOWN** | binary; Linux first | highest | unseal/keys you hold |

HashiCorp Vault is **not** offered (license/product split; OpenBao is the OSS successor shape).

### A6-C Backup / restore

| Candidate | Role | Encrypted | Dedup | Retention | PITR | Target | Windows | Restore-test required |
|---|---|---|---|---|---|---|---|---|
| Filesystem copy only | not accepted as the *only* layer | optional | N | manual | N | disk | Y | still required — and insufficient alone |
| restic | app + file + snapshot to S3/Garage/local | Y | Y | Y | N (snapshots) | S3, local, rclone | Y | Y |
| Kopia | same class as restic | Y | Y | Y | N (snapshots) | S3 (Garage docs exist) | Y | Y |
| pgBackRest | PostgreSQL WAL/backup | Y | Y | Y | **Y** | repo disk/S3 | Linux first | Y |
| WAL-G | PostgreSQL WAL/backup | Y | Y | Y | **Y** | S3 | Linux first | Y |

Off-site copy (second disk, Garage/R2/Hetzner OS, or Owner-held offline) is part of “backup exists”. PITR is a Postgres concern; restic/Kopia do not replace WAL archiving.

- **options (coherent now/staging composites; mix with constraints if needed):**
  - **A — Minimal local now.** OTel-compatible JSON/stdout; Windows Credential Manager + gitignored env; filesystem snapshots **plus a documented restore test**. **Staging:** add OTel export; SOPS+age when secrets must live beside git; restic or Kopia to an S3-shaped target (A4). **Prod:** later OWNER-DECISION; keep OTel.
  - **B — Consolidated OSS obs + GitOps secrets + restic.** OpenObserve (or SigNoz if Owner names it) on the A1 Linux host + SOPS+age + restic (Kopia allowed). Software $0 / AGPL or community license; host RAM extra. Session replay off until a privacy packet.
  - **C — Classic LGTM + OpenBao + Postgres-aware backup.** Grafana+Loki+Tempo(+Prometheus) + OpenBao + restic **and** pgBackRest or WAL-G. Most services operated. Fits a heavier enterprise-style profile.
  - **D — Infisical OSS for secrets + A observability + restic.** Infisical `ee/` features stay unused unless a later paid packet. Vendor SaaS observability (Sentry/Axiom/Grafana Cloud) is **optional later**, prices **UNKNOWN** here, OWNER-ONLY; not required to pick D.
- **Excluded:** Datadog/New Relic/Elastic as the default (paid/ops). Grafana Cloud / Infisical Cloud as the *now* 0 PLN path (vendor). Vault (use OpenBao if a Vault-class store is wanted). “Filesystem backup” with no restore test. Langfuse/other LLM obs as a *required* A6 product before agents exist (OTel remains enough to start).
- **cost:** A closest to 0 PLN. B/C/D add A1 RAM/disk. Cloud vendors UNKNOWN + OWNER-ONLY.
- **security/privacy:** redaction of secrets/PII in OTel attributes; EU data locality follows A1; no customer dumps in traces.
- **blocks:** Monitoring PASS, restore PASS, rotation runbooks.
- **reply:** `DECISION FZ-A6: OPTION A|B|C|D` optional `OBS=otel-json|openobserve|signoz|lgtm` `SECRETS=os-env|sops-age|openbao|infisical` `BACKUP=fs-tested|restic|kopia` `PG=pgbackrest|wal-g|none`

## FZ-A7 — Private origin / network (Cloudflare remains the public layer)

- **question:** Which **additional** components keep the Forma Zieleni origin off the public Internet without bypassing Cloudflare? Cloudflare is the required public protection layer unless a later Owner decision changes that. Live Cloudflare/DNS mutation is DANGEROUS immediately before action.
- **why_blocked:** Tunnel/private origin not implemented (POST-V2 §7).
- **Bypass test (binding):** *Can Internet traffic reach the Forma Zieleni origin without traversing Cloudflare?* If **YES**, that candidate does **not** satisfy the production private-origin requirement **by itself**.

| Candidate | Internet can reach origin without Cloudflare? | Outbound-only | Origin IP exposure | mTLS / AOP | Ops/admin IAP | Windows | Linux | OSS / license | External coordinator | Role if used |
|---|---|---|---|---|---|---|---|---|---|---|
| Cloudflare Tunnel (`cloudflared`) | **NO** if the host firewall admits no public :443 and only the tunnel is ingress ([Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)) | Y | hidden | complementary | Cloudflare Access optional (paid extras **UNKNOWN**) | client Y | Y | `cloudflared` is Cloudflare software (not a second public origin) | Cloudflare edge | **production public ingress path** |
| Authenticated Origin Pull / mTLS | **NO** if enforced (only Cloudflare presented certs) | N (origin may still listen) | IP may still be known | **Y** | N | N | Y | Cloudflare feature; extra cost **UNKNOWN** | Cloudflare | defense in depth; DANGEROUS to enable |
| Headscale | **YES** if a public HTTP port also exists | overlay is outbound to *your* coordination server | overlay IPs only | N | Y for operators | client Y | server Linux | BSD-3 ([headscale](https://github.com/juanfont/headscale)) | **you** run the coordination server | **ops/dev overlay only** |
| Tailscale-class overlay | **YES** if a public HTTP port also exists | typically Y to vendor coord | hidden on overlay | N | Y | Y | Y | client OSS; coordination is vendor; business pricing **UNKNOWN** | Tailscale/coordination SaaS | **ops/dev overlay only** |
| WireGuard direct | **YES** if a public HTTP port also exists | peer-dependent | WG endpoint IPs known to peers | N | DIY | Y | Y | OSS | none | **ops overlay only** |
| Pangolin | **YES** if used as the public HTTPS edge (outbound WG + reverse proxy) ([fosrl/PANGOLIN](https://github.com/fosrl/PANGOLIN) AGPL-3 community / commercial EE) | tunnel Y; **public entry is Pangolin, not Cloudflare** | origin can stay hidden from the Internet *via Pangolin* | product-dependent **UNKNOWN** | identity-aware claimed | client **UNKNOWN** | Linux | AGPL + EE | your Pangolin node | **does not replace Cloudflare** as production public ingress |
| FRP | **YES** (typically publishes ports on a VPS) | optional | exposed on FRP server | N | N | Y | Y | OSS | your FRP server | **excluded as ingress** |

- **options:**
  - **A — Localhost now; Cloudflare Tunnel on staging after DANGEROUS approval.** Only listed option that is outbound-only **through Cloudflare**. **Do not create the tunnel until Owner approves the Cloudflare change immediately before.** **Production path:** same pattern; never point a tunnel at CT8. Optional later: Access for Admin/ops.
  - **B — Localhost now; overlay for *operator* access only (Headscale OSS preferred if self-host; else Tailscale-class or raw WireGuard); Cloudflare Tunnel still required before any public hostname.** Overlay **fails** the bypass test as a public ingress. Use it for remote developer/staging SSH and Admin jump hosts.
  - **C — Localhost-only until staging exists.** No remote ingress. Safest now; remote private-origin proof stays blocked. **Staging/prod path:** later packet (A, or A+B).
  - **D — Authenticated origin pull / mTLS** in addition to A. Touches live Cloudflare → **DANGEROUS** immediately before action. Extra cost **UNKNOWN**. Not required to start local product work.
- **Excluded as sole production public ingress:** Pangolin, FRP, raw nginx/Caddy on a public IP, “just allowlist my home IP”, Quick Tunnels as the lab hostname strategy (Cloudflare documents Quick Tunnels for testing, not as the durable hostname). Pangolin/Headscale remain valid *behind* Cloudflare or for ops-only overlays if a later packet wants them.
- **cost:** C and local-now A/B = 0 PLN. Tunnel uses the existing zone; paid Zero Trust extras UNKNOWN. Headscale = software $0 + A1. Tailscale business UNKNOWN.
- **security/privacy:** Origin must not accept bypass traffic. No customer data through lab origin. Do not mutate Cloudflare/DNS in this packet.
- **blocks:** Remote private-origin validation only. Local API/UI after A2 does not wait.
- **reply:** `DECISION FZ-A7: OPTION A|B|C|D` optional `OVERLAY=none|headscale|tailscale|wireguard`

---

## Coherent architecture profiles (not a ranking, not a winner)

These show how the expanded options *can* be combined. Owner may mix across profiles. None is selected.

### Profile 1 — Minimal / local-first

- **Compute/deploy:** FZ-A1-A or D. Windows `pnpm` + Node 24, no Docker. Later Hetzner + `DEPLOY=systemd` if A.
- **API/fronts:** FZ-A2-A or B (Fastify/Hono + Vite). WWW SSR is extra Vite work; Portal/Admin CSR.
- **Data:** FZ-A3-A or E (explicit SQL or Kysely) on local PostgreSQL.
- **Files:** FZ-A4-A (`private/`).
- **Identity:** FZ-A5-A or B or E (embedded; Casdoor/Keycloak *not* on the workstation).
- **Obs/secrets/backup:** FZ-A6-A (JSON/OTel later, OS secrets, tested filesystem restore).
- **Ingress:** FZ-A7-C now; Tunnel later.
- **Against FZ requirements:** Hits ~0 PLN, Windows DX, TS/pnpm/Turborepo, OpenAPI, modular monolith, outbox, private files via API, BOLA in Core API, OTel-ready, low lock-in, Cursor-small surface. Defers isolated EU staging, private production origin, HA, CRM-scale reporting host, Site Intelligence/Garden OS/agents runtime. SEO depends on doing Vite prerender well. Android/iOS/SketchUp wait on the same OpenAPI. ASVS/ZAP/SCA still apply locally.

### Profile 2 — Lightweight OSS / self-host

- **Compute/deploy:** FZ-A1-A then B. Windows stays native. Linux staging `DEPLOY=compose` or `DEPLOY=coolify` (Coolify $0 license; control-plane backup required).
- **API/fronts:** FZ-A2-B or F (Hono + Vite, or Hono + React Router Framework Mode for official SSR without Next/RC).
- **Data:** FZ-A3-B or E (Drizzle or Kysely) + PostgreSQL on the VM.
- **Files:** FZ-A4-A now, `LATER=garage` on Linux (AGPL, ~1 GB RAM, S3, restic target).
- **Identity:** FZ-A5-B (Better Auth) or FZ-A5-E; or FZ-A5-D-CASDOOR / D-LOGTO-OSS when a second process is acceptable.
- **Obs/secrets/backup:** FZ-A6-B (OpenObserve + SOPS+age + restic to Garage). Optional `PG=pgbackrest` later.
- **Ingress:** FZ-A7-A (Cloudflare Tunnel after DANGEROUS). Optional `OVERLAY=headscale` for operator SSH only.
- **Against FZ requirements:** Still ~0 PLN software; infra is the Hetzner cap. EU staging and private origin become possible. Three trust zones remain three apps. OTel portable. Garage+restic gives encrypted off-box copies. Coolify reduces hand-written deploy *or* adds control-plane risk. TanStack Start is **not** assumed here (RC). Cloudflare stays the public layer. Scaling = bigger VM / second node later.

### Profile 3 — Consolidated platform

- **Compute/deploy:** FZ-A1-B + `DEPLOY=coolify` or `dokploy` (or C Fly Machines without a second PaaS). PaaS deploys API, three fronts, Postgres, one-click obs/IAM if used.
- **API/fronts:** FZ-A2-C or E (Nest+Next, or Hono+TanStack Start RC).
- **Data:** FZ-A3-B or D.
- **Files:** FZ-A4-B Garage *or* D managed S3, still authorized by Core API.
- **Identity:** FZ-A5-D-* Cloud ($0 tiers: ZITADEL Cloud / Logto Cloud) **or** one OSS IdP compose service on the same PaaS.
- **Obs/secrets/backup:** FZ-A6-B or D (OpenObserve or Infisical OSS + restic). One or two extra containers, not a full LGTM.
- **Ingress:** FZ-A7-A. PaaS dashboard must not be on the public Internet without Cloudflare.
- **Against FZ requirements:** Fewer hand-written unit files; **more** services (control plane + IdP + obs). Windows now can stay non-containerized; remote is Docker. Vendor/open-core risk if Dokploy features move to `proprietary/`. Cloud IdP moves identity off-box (lab must still use no customer data). RC Start or Next both increase agent file count. Does not remove ASVS/ZAP/SCA/OTel/restore-test duties.

### Profile 4 — Heavier enterprise-style OSS

- **Compute/deploy:** FZ-A1-B + `DEPLOY=compose` or systemd (explicit, no PaaS) **or** Coolify if Owner wants a UI on top of the same compose.
- **API/fronts:** FZ-A2-C or D (Nest + Next ×3).
- **Data:** FZ-A3-D Prisma or A3-E Kysely if CRM SQL must stay transparent.
- **Files:** FZ-A4-B Garage cluster-capable *or* D Hetzner OS. Never MinIO CE.
- **Identity:** FZ-A5-D-KEYCLOAK or D-AUTHENTIK-OSS or D-ZITADEL-OSS or D-CASDOOR (full protocol suite; Casbin/Keycloak Authorization Services still **not** domain BOLA).
- **Obs/secrets/backup:** FZ-A6-C (LGTM + OpenBao + restic + pgBackRest/WAL-G).
- **Ingress:** FZ-A7-A plus D (AOP/mTLS) when Owner approves DANGEROUS; `OVERLAY=headscale` for admin/ops.
- **Against FZ requirements:** Strongest protocol/IAM/PITR/HA *shape*. Worst ~0 PLN and Windows-now fit (RAM, compose, second Postgres for IdP, OpenBao unseal). Highest Cursor/ops surface. Lowest SaaS lock-in if everything is OSS on EU VMs. Still Cloudflare-fronted. Over-engineered for the current lead/staff slice unless Owner is buying future protocol/HA now.

**Shared bindings for every profile:** Core API remains canonical (OpenAPI 3.0.4). Domain BOLA/BFLA/BOPLA stays server-side. Private files authorized through the API. Transactional outbox stays in Postgres. Android/iOS and SketchUp consume the contract, not a frontend server function. Site Intelligence / Garden OS / future agents attach later as modules/clients. OWASP ASVS, ZAP (local/lab/staging only), SCA, OpenTelemetry, tested restore, EU/privacy, and no CT8 remain binding. No profile is ranked.

---

## Suggested reply block

Copy and fill. Constraints optional.

```text
DECISION FZ-A1: OPTION _
DEPLOY=
DECISION FZ-A2: OPTION _
DECISION FZ-A3: OPTION _
DECISION FZ-A4: OPTION _
LATER=
DECISION FZ-A5: OPTION _
IdP=
EMBED=
DECISION FZ-A6: OPTION _
OBS=
SECRETS=
BACKUP=
PG=
DECISION FZ-A7: OPTION _
OVERLAY=
```

If FZ-A1 is A or B, fill `DEPLOY=systemd|compose|coolify|dokploy|caprover`. Omit DEPLOY on C (Machines) and D.
If FZ-A4 is A, optional `LATER=garage|rustfs|hetzner-os|r2`.
If FZ-A5 is D, add `IdP=…` from the D-* list (including **CASDOOR**). If FZ-A5 is E, add `EMBED=A|B`.
Domain BOLA/BFLA stays in Core API for every A5 option unless a later packet says otherwise.
If FZ-A2 is A, B or F (Fastify/Hono/RR without Next), FZ-A5-C (Auth.js) is not a no-extra-gate pairing.
If FZ-A2 is A, FZ-A5-B needs non-first-party Fastify wiring or switch to FZ-A5-A.
If FZ-A2 is E, treat TanStack Start as official **Release Candidate**, not settled v1.
FZ-A5-D is compatible with every A2 bundle (OIDC resource server in `apps/api`).
Kysely (A3-E) is a first-class pairing for Bundles A/B/E/F; Prisma (A3-D) is the intended pairing for Bundle D.
If FZ-A1 is A or D, FZ-A4-B/C/D, FZ-A6-B/C remote hosts, a self-hosted PaaS, and FZ-A7 tunnel stay **later**, not this week’s host create. A self-hosted IdP on this workstation still implies Docker/WSL RAM, not a free lunch.
Do not pick MinIO CE as a new store. Do not pick Pangolin/FRP as the sole production public ingress.
Any Cloudflare, DNS, production, secret-store cloud, or paid add-on remains DANGEROUS / OWNER-ONLY at the moment of action.
