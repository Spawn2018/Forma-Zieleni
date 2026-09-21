# Reliability

Status: CURRENT architecture for later SLOs. No numeric SLO is set.
Subordinate to
[`../architecture/FZ-CONTINUOUS-IMPROVEMENT.md`](../architecture/FZ-CONTINUOUS-IMPROVEMENT.md).

Sources checked 2026-09-21: Google SRE guidance on SLOs and error
budgets (risk is explicit and shared), blameless postmortems, and
toil (manual, repetitive, automatable, tactical, no enduring value,
and scaling with growth). OpenObserve remains the later staging
direction in current architecture. It is not deployed here.

## SLI / SLO

Template: [`../templates/SLO.md`](../templates/SLO.md).

An SLI is a measured user-journey or service indicator. An SLO is a
target over a window. Write the SLO only when the service is real and
the Owner accepts the number. Until then the state is NOT SET, which
is not zero and not 100%.

Prefer a few journeys: public page available, lead accepted, published
page still served when the editor is down, authenticated portal
action. WWW must not fail only because the CMS editor is down. That
rule is already product architecture, not a new SLO.

## Error budget

Policy template, not an active control:

- HEALTHY: product and reliability work stay in their normal balance.
- AT RISK: reliability work takes priority over risky change.
- EXHAUSTED: risky change waits, and reliability work dominates,
  still subject to Owner and Canon.

An error budget is not permission to cause an outage. Burning the
budget on purpose is a failure of the policy.

## Failure cost

For a material failure, record detection time, diagnosis time,
recovery time, and blast radius, not only whether it happened. Some
failures will still occur. Graceful degradation beats a hard
dependency on an optional reviewer or an editor process.

## Toil

Candidates: repeated manual verification, repeated context
reconstruction, manual formatting, manual data repair, repeated
deploy steps, repeated Owner continuation, repeated identical review.
Automation of dangerous steps still needs the existing gate.
