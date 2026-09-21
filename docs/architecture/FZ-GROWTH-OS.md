# FZ Growth OS

Status: CURRENT subordinate Canon. Product architecture remains
[`CURRENT-ARCHITECTURE.md`](./CURRENT-ARCHITECTURE.md). Connected
facts remain [`FZ-CONNECTED-ECOSYSTEM.md`](./FZ-CONNECTED-ECOSYSTEM.md).
Learning remains [`FZ-CONTINUOUS-IMPROVEMENT.md`](./FZ-CONTINUOUS-IMPROVEMENT.md).
Search remains [`FZ-SEARCH-1.md`](./FZ-SEARCH-1.md). This file is not
a second roadmap and not a DORA score.

The working contract is `packages/domain/src/growth.ts`. The Core API
compiles a plan at `POST /v1/growth/plans` for an actor with
`growth:plan`. The response is marked synthetic. It does not spend
and it does not publish.

## Closed loop

Owner goal, budget ceiling and time horizon become a versioned
MarketingPlan. The plan compiles into a work graph. Content, concept
projects, plant palettes, Atlas dependencies, visualizations,
portfolio candidates, creative, social drafts, landing work,
experiments and measurement are work items with dependencies. A later
item is not READY while a blocking dependency is open. Approval is a
gate, not a status someone can skip.

A plan is not permission to spend, to publish, to start OAuth, or to
transfer customer data. Paid channels in the compiler return
`DO_NOT_USE` with reason `PAID_MEDIA_NOT_AUTHORIZED`.

Qualified opportunity is the commercial direction. Raw lead count is
not enough. Offer price and terms stay in the commercial owner.
Marketing code cannot change them. A rejection records hypotheses. It
does not lower a price.

A real project with verified facts may propose portfolio, case-study
and Atlas candidates. Those candidates are not published. Private
facts and missing rights produce no public candidate. A concept
project cannot take that path.

## Evidence limits

Capacity starts as UNKNOWN. The article count is an explicit planning
assumption, not an observed production rate. The growth simulator
returns `NOT_ENOUGH_DATA` and no point forecast. Creative fatigue has
no universal threshold. Platform asset sizes stay `UNVERIFIED` until
a dated official source is recorded. Marketing-mix modeling is a
future boundary. Google Meridian is discovered, not selected, and is
not a dependency. There is not enough history to run a model.

DORA metrics stay the five software-delivery metrics. MarketingOps
and the other operations lists are separate and are not measurable
yet. No world-class claim is authorized.

## Research note

Sources and limits for this foundation are in
[`../engineering/requirements/RESEARCH-2026-09-21.md`](../engineering/requirements/RESEARCH-2026-09-21.md).
