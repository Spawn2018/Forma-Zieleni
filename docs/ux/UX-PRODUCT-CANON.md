# Forma Zieleni — UX Product Canon

Status: **CURRENT / BINDING**

## Principle
UX follows the real Forma Zieleni lifecycle and domain. Cursor must not invent generic funnels, screens or workflows when a canonical flow exists.

## Canonical lifecycle
Anonymous Visitor → Site Analysis → Qualified Lead → Consultation → Opportunity → Offer → Contract → Payment → Project → Garden → Garden OS → Referral / Maintenance / Next Project.

Contract states, signature-when-required, and the rule that a signing
engine is not the business record are defined only in
[`../architecture/FZ-SIGN-1-CONTRACT-LIFECYCLE.md`](../architecture/FZ-SIGN-1-CONTRACT-LIFECYCLE.md).
This UX lifecycle does not require an electronic signature on every
payment.

## UX rules
- Every screen has a clear user, job-to-be-done, state and next action.
- Public WWW is a Sales Application: educate, build evidence, qualify and move the right visitor to the right next step.
- Public copy, case studies and galleries wait on FZ-CMS-1
  ([`../architecture/OWNER-DECISION-PACKET-FZ-CMS-1.md`](../architecture/OWNER-DECISION-PACKET-FZ-CMS-1.md)).
  Do not invent testimonials or hard-code unverified marketing pages.
  Carousel, lightbox and before/after remain keyboard- and
  screen-reader-first when those surfaces are built.
- Optimize qualified visitor value and owner capacity, not raw lead count.
- Capacity influences promises, availability and marketing pressure.
- Offer is first-class: scope, exclusions, price, timeline, milestones, correction rounds where applicable, payment schedule, validity, files, acceptance and contract relation.
- Scope changes must be visible; change orders/decision history must not become invisible work.
- Portal exposes project truth: status, next action, decisions, files/revisions, approvals, payments and communication relevant to the client. A signing view, if later added, shows Core API contract state.
- Admin/CRM exposes next action, value, source, qualification, property/site context, capacity and history. Staff contract approval stays an Admin operation on Core API.
- Garden OS continues the relationship after project delivery; it is not merely a maintenance checklist.
- Mobile is task/photo/push-first, not a full portal clone.
- Site Intelligence should progressively collect/use property context without making the visitor fight a technical GIS interface.
- External geodata availability must not be a live UX dependency when ingestion/cache can make the experience reliable.
- AI assistance must be visibly assistance where relevant; domain truth remains data/rules/domain.

## Forms and interactions
- Ask only what is needed at the current stage.
- Preserve progress; do not make users re-enter known data.
- Use plain Polish labels and concrete error messages.
- Error states explain recovery, not blame.
- Destructive/irreversible actions require appropriate confirmation.
- Loading, empty, error, partial and offline/degraded states are designed, not left to framework defaults.
- Keyboard, focus, touch target and screen-reader behavior are part of acceptance criteria.

## Experience contract

Machine check: `node scripts/requirements/experience-contract.mjs`.
It extends product scope and FZ-CIS. It is not a second roadmap.
A user-facing capability needs a business purpose, a workflow, a
canonical source, downstream effects, and a visual reference or an
explicit missing-reference review. Looking like the mockup does not
complete a workflow. A correct command does not complete visual
acceptance. Browser screenshot evidence stays waiting until a reviewed
runtime exists. Replay stays off.

## No invented UX
A new major screen, role, lifecycle stage, navigation model or material business workflow is a DECISION unless already implied by current domain requirements. Small supporting states required to make an approved flow usable are allowed with REVIEW.
