# FZ-SEARCH-1 — SEO, AI Search, GEO/AEO and Search Intelligence

Status: CURRENT architecture. Research date **2026-09-21**. This file
is the binding Search Intelligence definition. It is not an
implementation, not a production connector, and not CMS-ACCEPT.

Execution order lives only in
[`NEXT-SLICES-CMS.md`](./NEXT-SLICES-CMS.md). Do not keep a second
roadmap.

## 1. What this capability is

Four areas, kept distinct:

| Area | Question it answers |
|---|---|
| Technical search | Is the public site crawlable, indexable, fast, and correctly rendered? |
| Content / discovery | Which pages, services, articles, and case studies exist, and how are they described? |
| AI visibility | Where supported systems cite, refer, or crawl Forma Zieleni, and where measurement does not exist? |
| Business attribution | Which observed sources are associated with Leads and later business events, without fake causality? |

SEO means traditional discoverability, indexing, ranking signals, and
traffic. AEO means answer-oriented content structure. GEO means
writing and structure aimed at generative answer systems. AI
visibility means an observation we can actually collect. None of those
words authorizes an invented universal score.

Forbidden as if they were external rankings: AI rank, ChatGPT rank,
GEO score, AI authority score, AI SEO score. An internal diagnostic
may exist only when labeled **INTERNAL SIGNAL / HEURISTIC**.

Evidence classes, never mixed in one field without provenance:

`MEASURED` · `ESTIMATED` · `DERIVED` · `HEURISTIC` · `AI-SUGGESTED`

AI follows DATA → RULES → DOMAIN → AI. A model must not become the
source of truth for clicks, impressions, citations, or revenue.

Every meaningful metric can carry: `source`, `sourceAccount` when
applicable, metric definition, time range, `collectedAt`, external vs
derived, freshness, dimensions, and provenance.

## 2. Domain boundary

| Owner | Owns | Does not own |
|---|---|---|
| CMS (Apostrophe, content domain) | Editable content, SEO editorial overrides, publication lifecycle, public media references | Search analytics tables, CRM writes |
| WWW (React Router) | Public HTML, metadata, structured data, runtime performance | Business truth, imported metrics |
| Search Intelligence (FZ, PostgreSQL/Kysely when built) | Imported observations, crawl observations, AI visibility observations, technical audits, snapshots, derived opportunities, alert state, attribution summaries | Direct writes to Lead/Opportunity/Offer/Contract |
| Core business domain | Lead, Qualified Lead, Opportunity, Offer, Contract, revenue/business outcome | Search-provider payload shape |

Attribution may store a business object id through an explicit
contract. Search Intelligence has no uncontrolled CRM write path.

Do not add a separate analytics database without evidence. Do not put
this model in Apostrophe tables.

## 3. Research record (2026-09-21)

Primary pages read in this pass. Re-read them at connector or robots
implementation time. Quotas and products move.

| Source | What was confirmed | API | Cost noted |
|---|---|---|---|
| [Search Analytics how-to](https://developers.google.com/webmaster-tools/v1/how-tos/search_analytics), updated 2025-08-28 | `searchanalytics.query` exposes Performance-report data: clicks, impressions, CTR, position. Dimensions include date, query, page, country, device. Page in batches of 25,000 rows. | Yes | Google API project; no FZ spend decided |
| [All performance data](https://developers.google.com/webmaster-tools/v1/how-tos/all-your-data), updated 2025-08-28 | Daily one-day pulls are the documented way to stay inside quota. Max **50,000 rows per day per search type**. Page/query grouping can drop rows. Data typically lags 2–3 days. `searchAppearance` is not a column beside other dimensions; it is a two-step query. Property vs page aggregation changes the metric definition. | Yes | Same |
| [URL Inspection API announcement](https://developers.google.com/search/blog/2022/01/url-inspection-api) | Index status, robots state, canonicals, last crawl, rich-result verdict. Quota stated there: **2,000 queries/day** and **600 queries/minute** per property. | Yes | Do not inspect every URL every day |
| [Structured data intro](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data), updated 2025-12-10 | JSON-LD recommended. Markup must match visible content. Google Search Central, not schema.org alone, decides rich-result eligibility. | n/a | — |
| [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals) | Field metrics: LCP ≤ 2.5s, INP < 200ms, CLS < 0.1 for a "good" experience. Search Console has a CWV report. | Report in Search Console; CrUX API not re-verified here | — |
| [Google crawler overview](https://developers.google.com/crawling/docs/crawlers-fetchers/overview-google-crawlers), updated 2026-06-12 | Common crawlers, special-case crawlers, user-triggered fetchers. Verify by user-agent, source IP, and reverse DNS. User-agent strings are spoofable. | n/a | — |
| [Google common crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers), updated 2026-07-14 | Tokens below. `Google-Extended` is a robots token, not a separate HTTP user-agent. It does not control Google Search inclusion. | n/a | — |
| [Bing API access](https://learn.microsoft.com/en-us/bingwebmaster/getting-access) | OAuth 2.0 or one API key per user, for verified sites. Key is user-scoped, not site-scoped. | Yes, for Webmaster APIs | Method catalog not re-listed in this pass |
| [Bing AI Performance preview](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview), 2026-02-10 | UI: total citations, average cited pages, grounding queries (a **sample**), page citation counts, trends. Surfaces named: Microsoft Copilot, Bing AI summaries, select partner integrations. Explicitly not placement, ranking, or authority. | Not in that post | — |
| [Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/5780844/bing-webmaster-tools-ai-performance-report-is-ther), 2026-02-19 | Staff reply: no API was mentioned; "not right now." | No AI Performance API as of that reply | Re-check before a connector claims it |
| [Cloudflare AI Crawl Control](https://developers.cloudflare.com/ai-crawl-control/), updated 2026-08-14 | "Available on all plans." Dashboard visibility and allow/block. Pay Per Crawl is private beta. | GraphQL Analytics API is documented on the metrics page | Free plan is not a paid crawler SaaS. Do not enable Pay Per Crawl |
| [Analyze AI traffic](https://developers.cloudflare.com/ai-crawl-control/features/analyze-ai-traffic/), updated 2026-04-23 | Requests, status codes, paths, operators. **Referrals are paid plans only.** CSV/image download in the dashboard. Retention window was not stated. | GraphQL | Retention = UNKNOWN until re-read |
| [OpenAI crawlers](https://developers.openai.com/api/docs/bots) | `OAI-SearchBot` search; `GPTBot` training; `ChatGPT-User` user-triggered (robots.txt may not apply); `OAI-AdsBot` ads only. Published IP JSON. | No webmaster citation API found | — |
| [Anthropic crawlers](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler), modified 2026-04-07 | `ClaudeBot` training; `Claude-SearchBot` search indexing; `Claude-User` user-triggered. robots.txt is the documented opt-out. | No webmaster citation API found | — |
| [Perplexity crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) | `PerplexityBot` search, not training. `Perplexity-User` user fetch; docs say it generally ignores robots.txt. | No webmaster citation API found | — |
| [llms.txt v2](https://llmstxt.org/) | Community **proposal**, not an IETF/W3C standard. No search-engine ranking benefit was stated. | n/a | Maintenance cost is ongoing |

The Bing help URL returned no usable body in this pass. Do not treat
a search snippet about CSV export as verified. Re-fetch that help page
before modeling an importer.

Project Search Analytics load and QPS quotas were re-read on
2026-09-22 from
[Usage Limits](https://developers.google.com/webmaster-tools/limits)
(last updated 2025-08-28): Search Analytics 1,200 QPM per site and per
user; 40,000 QPM / 30,000,000 QPD per project; URL Inspection 2,000 QPD
and 600 QPM per property. The 50,000 rows/day/search-type data cap and
25,000 page size remain on the all-your-data how-to. Do not invent an
additional Cloud Console number beyond that published page.

## 4. Measurable now, and what is not

**Google, MEASURED when a verified property is connected later:**
clicks, impressions, CTR, position (provider definition), by date /
query / page / country / device; search appearance only via the
two-step method; URL inspection for a small watched set; sitemap
submission/status where the sitemaps API still exposes it at
implementation time. Not promised: a query Google anonymizes away, a
row past the 50k daily cap, or a live rank.

**Bing traditional Webmaster API:** authentication exists (OAuth 2.0 or
one user-scoped API key). Read methods re-listed in SEARCH-CONNECTORS
(`BING_WEBMASTER_READ_METHODS`, 2026-09-22) from
`IWebmasterApi`: GetQueryStats, GetPageStats, GetCrawlStats,
GetUrlInfo, feeds/fetch/quota getters, and related traffic helpers.
Mutation methods on that interface are out of the fixture connector.
**Bing AI citations:** MEASURED in the product UI as of 2026-02-10,
including a sampled grounding-query set. **Not an API** as of the
2026-02-19 staff reply. Manual or exported import may be added later
only if the export is real and lawful. Until then citation rows are
unavailable, not zero.

**Cloudflare:** crawler request metrics on the current plan, via
dashboard and GraphQL. Referral totals are documented as paid-plan
only. Retention UNKNOWN. This is crawl observability, not citation
observability.

**OpenAI, Anthropic, Perplexity:**

| Provider | Crawl observability | Referral observability | Citation observability | Webmaster API |
|---|---|---|---|---|
| OpenAI | Logs / Cloudflare if the UA is verified | HTTP referrer when the browser sends one | NO RELIABLE MEASUREMENT | None found |
| Anthropic | Same | Same | NO RELIABLE MEASUREMENT | None found |
| Perplexity | Same | Same | NO RELIABLE MEASUREMENT | None found |

Do not scrape those products to manufacture a visibility metric.

**Rejected claims:** any single AI visibility percentage; a ChatGPT
rank; a GEO score; "Bing citation count" from an API that does not
exist; treating a missing referrer as a known AI source; treating a
search impression as the cause of a contract.

## 5. SEO content contract

Location of the contract: this section. CMS-DATA must implement it.
Editors see a short form. The rest is defaults plus optional
overrides.

Applies to `Page`, `Service`, `Article`, `ProjectCaseStudy`.

| Field | Rule |
|---|---|
| `seo.title` | Default: content title. Optional override. |
| `seo.description` | Default: summary when present. Optional override. |
| `seo.canonical` | Default: stable public URL. Override only when the owner of the URL is us. Reject a malformed canonical (**ERROR**, blocks publish). |
| `seo.robots.index` / `follow` | Default index,follow for published public types. `noindex` on an important public page is a **WARNING**, not a silent default. |
| `seo.ogTitle` / `ogDescription` / `ogImage` | Default from title, description, and hero. Optional override. |
| `seo.socialImage` | Optional, only when it differs from the OG image. |
| `seo.schemaType` | Controlled enum, not free text. Omit when the visible type is unclear. |
| `seo.excludeFromSitemap` | Default false for indexable published URLs. |
| `seo.priority` / `changeFrequency` | Not editor fields. Omit unless a later measured test shows a sitemap consumer uses them. |
| Redirect metadata | Written by the system when a slug changes. Not a blank form. |

`SiteSettings.seoDefaults` may hold the site name suffix and a default
social image. It must not invent a description per page.

Freshness fields, separate from a cosmetic date bump: `createdAt`,
`updatedAt`, `reviewedAt`, optional `factualReviewDueAt`. A metadata
touch must not change the visible publication date.

Editorial UX (CMS-ADMIN, not a publish blocker for opinions):

- Previews: title, description, slug, canonical, index state, social card.
- Status: image ALT, structured data, internal links, freshness.
- **ERROR** blocks publish (malformed canonical, unpublished target in a public canonical).
- **WARNING** is visible and overridable when the editor has publisher rights (important page `noindex`).
- **RECOMMENDATION** never blocks (description could be clearer).

## 6. Technical SEO contract (WWW)

React Router WWW must server-render the HTML that search engines
should discover. Client-only content is not the discovery path.

Required when WWW ships, not months later:

- unique title, meta description, canonical, robots meta
- `robots.txt` generated from policy, XML sitemap, sitemap index only if scale requires it
- correct status codes, a real 404, redirects that preserve the old slug
- one trailing-slash policy and one query-parameter policy, both tested
- semantic HTML, one heading order, descriptive anchors, breadcrumb trail
- Open Graph aligned with the SEO contract
- image width/height, responsive derivatives from the FZ media pipeline, ALT
- crawlable internal links, stable URLs
- no staging host emitting indexable production URLs

Non-production environments must not be indexable. Production must not
ship an accidental `Disallow: /`.

## 7. Structured data

JSON-LD only, generated, tested. Emit a type only when the visible
page states the facts. Google's feature guide wins over a schema.org
type that Google does not use.

Candidates, each optional: `Organization`, a `LocalBusiness` subtype
only with verified NAP, `Service`, `Article` or `BlogPosting`,
`BreadcrumbList`, `ImageObject`, `WebSite`, `WebPage`, `ContactPoint`
only when the contact is the one we actually publish.

Never emit ratings, reviews, prices, awards, service areas, addresses,
opening hours, or credentials that are not verified. If it is not
verified, omit the property.

`ProjectCaseStudy` public fields, when true and non-private: project
type, garden characteristics, services performed, challenges, design
approach, implementation approach, verified materials, verified plants,
privacy-safe locality (not a street address), before/after, media,
completion date, related services, related articles. No customer name.
No private coordinates. Thin city templates are forbidden.

Local pages exist only when the content is unique. Do not generate
"projektowanie ogrodów + city" doorway sets.

## 8. Crawler governance

Taxonomy: **A** traditional indexing, **B** AI search/retrieval,
**C** user-triggered fetch, **D** model training, **E** unknown.

Last verified **2026-09-21** except where a source date is older.
Desired policy below is **not applied**. Production Cloudflare changes
are DANGEROUS. Training tokens are OPEN:
[`OWNER-DECISION-PACKET-FZ-SEARCH-CRAWL-1.md`](./OWNER-DECISION-PACKET-FZ-SEARCH-CRAWL-1.md).

| Token | Class | Purpose (official) | robots.txt | Verify | Proposed production stance |
|---|---|---|---|---|---|
| `Googlebot` (+ Image, Video, News) | A | Google Search and listed product surfaces | Obeys on automatic crawls | IP + reverse DNS; UA is spoofable | Allow. Rules not emitted until SEARCH-SITEMAP-ROBOTS re-reads the token list |
| `Google-Extended` | D and Gemini grounding | Not a separate UA. Does not affect Google Search inclusion | Token only | n/a | **OPEN** with other training tokens. Disallow would also opt out of Gemini grounding |
| `Google-CloudVertexBot` | B/special | Vertex AI agent crawls requested for that product. `Googlebot` token also matches | Token | Same Google verification | No rule until re-read. Do not treat as Google Search |
| `GoogleOther` | E/research | Generic fetch, not a specific product | Own token | Same | No special rule |
| `OAI-SearchBot` | B | ChatGPT search | Independent of GPTBot | Published IP JSON | Allow is the visibility direction. Not applied yet |
| `GPTBot` | D | Training | Independent of search | Published IP JSON | **OPEN** |
| `ChatGPT-User` | C | User-triggered. robots.txt may not apply | Docs say so | Published IP JSON | Do not pretend robots.txt controls it |
| `OAI-AdsBot` | other | Ads landing pages only | — | Published IP JSON | No FZ ads program. No rule |
| `ClaudeBot` | D | Training | robots.txt | Anthropic IP list | **OPEN** |
| `Claude-SearchBot` | B | Search index | robots.txt | Anthropic IP list | Allow is the visibility direction. Not applied yet |
| `Claude-User` | C | User-triggered | Disabling reduces user-fetch visibility | Anthropic IP list | Do not equate with training |
| `PerplexityBot` | B | Search, not training | robots.txt | Published IP JSON | Allow is the visibility direction. Not applied yet |
| `Perplexity-User` | C | User fetch; docs say it generally ignores robots.txt | Weak | Published IP JSON | Report as ungovernable via robots.txt |

Unknown user-agents stay class E. Do not block or allow them by
guessing the vendor. Cloudflare recognition is a dashboard fact to
ingest later, not a second policy language.

## 9. robots.txt

Generated from version-controlled policy. Environment-aware.
Deterministic. Production names the sitemap. Crawler-specific groups
exist only for tokens in the table above, and training groups are
omitted until FZ-SEARCH-CRAWL-1 is decided.

Tests must fail if production policy is `Disallow: /`, and fail if a
non-production policy would allow indexing.

## 10. Cloudflare

Design only. **Do not change the live zone.**

Ingest later, if the GraphQL schema still matches the docs: crawler,
operator, requests, status class, path, hostname, date. Referrals only
if the plan actually returns them; otherwise the field is absent, not
zero. Retention UNKNOWN: snapshot before assuming history survives.

Privacy: paths can contain query strings. Strip query values before
storage. Do not store raw client IPs from this feed.

### DANGEROUS runbook — do not execute

Stop. This section is not authorization.

1. Owner approval immediately before the change, naming the zone and
   the exact allow/block diff.
2. FZ-SEARCH-CRAWL-1 must be DECIDED before any training-token rule.
3. Read current Cloudflare docs and the live robots.txt in the same
   session.
4. Change a staging zone first if one exists. Production DNS and
   origin stay untouched.
5. Record the previous policy for rollback.
6. No Pay Per Crawl. No new paid Cloudflare product.

## 11. Connectors, jobs, history

```text
SearchConnector
├── GoogleSearchConsoleAdapter
├── BingWebmasterAdapter
├── CloudflareCrawlerAdapter
├── AnalyticsAdapter          (first-party, not a paid vendor)
└── later adapters
```

Each adapter: least OAuth/API scope, secrets outside git and logs,
refresh, rate limit, backoff, idempotent sync, checkpoint cursor,
outage isolated from other providers, structured error state. No
production credentials in this architecture slice.

Sync is a job, not an Admin request:

scheduled sync → connector → normalize → validate → persist →
aggregate → derive opportunities → dashboard.

Use the existing transactional outbox / job approach. No Redis added
for this feature.

History windows: 7 days, 28 days, 3, 6, and 12 months, plus a custom
range only where the source still has the rows. Compare with the
previous period, and year-over-year only when both windows exist.
Snapshot rows before an upstream retention window closes, once that
window is known. Do not re-download full history on every run.

## 12. Data model

Conceptual entities, normalized when the PostgreSQL slice starts.
Each observation has provenance and an idempotency key.

`SearchProperty`, `SearchSource`, `SearchMetricObservation`,
`SearchQueryObservation`, `SearchPageObservation`,
`IndexingObservation`, `CrawlObservation`, `AICitationObservation`,
`AIReferralObservation`, `TechnicalSEOIssue`, `ContentOpportunity`,
`SearchAlert`, `SearchSnapshot`, `AttributionTouch`,
`SearchContentLink`.

Roll up. Dedupe. Drop raw payloads after the normalized row is stored,
except a short-lived quarantine for a failed row. Query text is not
joined to form bodies.

`AICitationObservation` may be empty for providers with no API. A
later manual import sets `source=manual-import` and is still MEASURED
only if the file came from the provider's own export.

## 13. Attribution

Referral signals, privacy-safe: referrer host if present, our own UTM
parameters, landing path, campaign metadata we set. No fingerprinting.
Missing referrer → `searchSourceClass=UNKNOWN`. Do not guess ChatGPT.

Lead capture may receive, after server-side sanitize:

`firstTouch`, `lastTouch`, `landingPage`, `referrerDomain`,
`utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `utmTerm`,
`searchSourceClass`, `aiReferralProvider` (only from an allowlist of
hosts we observed).

Client JSON is not business truth. Store attribution apart from the
message body. Do not log the form next to the referrer.

Long-term chain, as an attribution **model**, not a causal claim:

source → visit (when permitted) → Lead → Qualified Lead →
Opportunity → Offer → Contract → revenue.

Models to label in the UI: first touch, last touch, assisted,
unknown. A impression and a later contract are two events. The
dashboard says "associated under the first-touch model", not "caused".

## 14. Privacy

Classes: public URL metrics; query strings that may be personal;
business-object ids; never raw form payloads; never a standing IP
history; never a device fingerprint.

Retention follows the rollup: detailed query rows for the shortest
window that still answers the 12-month view, then aggregates. Exact
days are set in SEARCH-DATA-MODEL, not guessed here.

No paid analytics vendor in this decision. Cookies, consent, hosting,
transfer, and a processor agreement are a later legal check before
any third-party script. Legal conclusions for production are not made
here.

## 15. Admin information architecture

Not built in this slice. Every number on a future screen shows
definition, source, window, freshness, and MEASURED vs derived.

**Search Intelligence:** overview (search visibility, AI visibility,
traffic, leads, qualified leads, opportunities, contracts, revenue
attribution). **SEO:** queries, pages, clicks, impressions, CTR,
position, indexing, sitemaps, structured data, technical issues,
internal links, performance. **AI visibility:** citations, cited
pages, grounding queries, trends, referrals, crawler activity,
provider coverage, measurement limitations. **Content intelligence:**
opportunities through AI-suggested drafts. **Crawl intelligence:**
bots by class, frequency, URLs, errors, configured policy. **Conversions:**
the chain in section 13.

"Average position" uses the provider's definition and names the
provider. "AI citations" names which providers are included. An empty
provider is listed under measurement limitations, not folded into a
percentage.

Content intelligence may recommend ("query X has impressions and a low
CTR; review title alignment"). It must not publish the rewrite.
AI title, description, ALT, heading, FAQ, link, and case-study drafts
stay **AI-SUGGESTED** until a person approves them. ALT suggestions
must not invent image contents. No paid AI service is added here.

Internal links are a graph among Service, Article, and
ProjectCaseStudy. Detect orphans, broken links, and weak connections.
Do not auto-insert keyword links.

## 16. Alerts, performance, media, machine-readable files

Future alerts, no production notifications now: sitemap down, robots
blocking unexpectedly, important `noindex`, 404 or 5xx spike, indexing
drop, traffic anomaly against a baseline, structured-data break,
connector stalled, crawler policy mismatch, citation change where the
provider is measurable, large visibility drop. Start quiet.

Performance: field CWV and lab Lighthouse stay in different fields.
WWW budgets: responsive media, LCP candidate, CLS (dimensions), lazy
non-critical images, font strategy, JS budget, cache, origin
response, no casual third-party scripts. The FZ media pipeline is the
image path: ALT, caption, nearby text, stable id, dimensions,
WebP/AVIF, `ImageObject` when the image is visible, image sitemap
only if useful, no GPS.

`llms.txt` is an optional later public curated file. It is not a
ranking control and must not list private URLs. Prefer SSR HTML,
JSON-LD, sitemap, and an article RSS/Atom feed if articles exist.
No public dump of drafts.

Prohibited: keyword stuffing, doorway pages, hidden text, cloaking,
mass near-duplicate city pages, fake FAQ, fake reviews, fake ratings,
fake authors, mass unreviewed AI pages, purchased or auto-generated
link schemes.

## 17. Security, telemetry, backup

Threats: token leakage, over-broad OAuth, malicious provider payloads,
stored XSS from query or page labels, SSRF via imported URLs, spoofed
webhooks, redirect abuse, sitemap poisoning, robots mistakes, preview
token leak, draft HTML leak, analytics query injection, unbounded
imports, quota exhaustion, PII in URLs, secrets in logs.

Telemetry names: sync start/end, fetched, normalized, failed, rate
limited, stale connector, sitemap generate, sitemap fetch, robots
generate, audit run, alert emit. Never log access tokens, refresh
tokens, or form bodies.

FZ tables follow normal PostgreSQL backup. Rows can be rebuilt from
the provider only inside that provider's retention. Document the gap
when retention is UNKNOWN. Restore is not accepted until tested
(CMS-RESTORE / SEARCH-RECOVERY).

## 18. Tests

Unit: canonical, robots, sitemap, SEO defaults, URL normalize, JSON-LD
mapping, attribution sanitize, provider normalize. Contract: connector
fixtures, CMS→WWW SEO, publish→sitemap, search→lead. Integration:
idempotent sync, retry, snapshots, rollups on PostgreSQL. WWW: title,
canonical, robots, OG, JSON-LD, 404, redirect, sitemap, responsive
image. Security: redaction, hostile strings, referrer sanitize,
preview hidden. Later E2E uses synthetic observations only.

## 19. Later gates

| Gate | Item |
|---|---|
| OPEN, does not block CMS-DATA | FZ-SEARCH-CRAWL-1 training-crawler policy |
| DANGEROUS | Production Cloudflare crawler policy, DNS, live OAuth to a business property, production secrets, public cutover |
| OWNER-ONLY | Recurring spend, a paid SEO/analytics/GEO vendor, legal claims, real customer-data use |
| OWNER-DECISION | Replacing Apostrophe, or any analytics design that changes the privacy boundary above |

No such vendor is selected. Local target remains about 0 PLN/month.
