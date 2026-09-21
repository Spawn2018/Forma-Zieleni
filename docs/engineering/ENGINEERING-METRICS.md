# Engineering metrics

Status: CURRENT specification. Subordinate to
[`../architecture/FZ-CONTINUOUS-IMPROVEMENT.md`](../architecture/FZ-CONTINUOUS-IMPROVEMENT.md).
Research date: 2026-09-21.

No composite score. A metric without a decision is not collected.

## SPACE

Primary source: Forsgren, Storey, Maddila, Zimmermann, Houck, Butler,
“The SPACE of Developer Productivity”, ACM Queue / Microsoft Research,
2021. Satisfaction, Performance, Activity, Communication and
collaboration, Efficiency and flow.

Adapted for one Owner and AI agents:

- Satisfaction: record only an explicit Owner statement. Do not invent
  a survey.
- Performance: customer and product outcomes when those events exist.
  Until then, accepted slice behavior and escaped defects.
- Activity: commits, reviews, and messages are context. They are not
  productivity.
- Communication: avoidable questions caused by missing Canon, versus
  legitimate gates.
- Efficiency: toil, blocked time, and rework when those events exist.

## Flow and quality

Design, do not fake: cycle time, blocked time, review latency,
feedback latency, WIP, queue age, rework, handoff count. Quality
signals worth keeping: escaped defects, regressions, change failure,
rollback, security findings, flaky tests, contract violations,
accessibility regressions, performance regressions.

Event names are in
[`../../contracts/engineering-event.schema.json`](../../contracts/engineering-event.schema.json).
Store them only when a real producer exists. The foundation does not
emit a stream.

## AI engineering

Define the event first. Do not publish a rate the store cannot
support.

| Metric | Event needed | Now |
|---|---|---|
| Autonomous slice completion | `slice_completed` versus `slice_blocked` inside a `/noc` window | NOT MEASURABLE YET |
| Avoidable Owner intervention | `owner_intervention` class AVOIDABLE | NOT MEASURABLE YET |
| Legitimate Owner gate | `gate_reached` or intervention class LEGITIMATE | NOT MEASURABLE YET |
| Agent retry / no-progress | session attempt keys, already enforced at 3 | OPERATIONAL as a guard, not a rate |
| False PASS | verifier finding | NOT MEASURABLE YET |
| Reviewer unique finding | `review_finding` with source | NOT MEASURABLE YET |
| AI-introduced regression | linked `test_failed` after an agent change | NOT MEASURABLE YET |
| False assumption | `assumption_invalidated` | NOT MEASURABLE YET |
| Context recovery | successful reconstruct after compaction | NOT MEASURABLE YET |
| Mean `/noc` duration and slices per window | session file, gitignored | NOT MEASURABLE from git |

Owner intervention classes:

- LEGITIMATE: OWNER-DECISION, OWNER-ONLY, DANGEROUS, business
  preference, product direction.
- AVOIDABLE: forgotten context, unnecessary stop, asking which READY
  slice to run, missing automation, missing documented fact, repeated
  preventable error, reviewer coordination failure, unnecessary manual
  continuation.

The avoidable rate should fall. The legitimate rate must not be
gamed by skipping a gate.

## Reviewer value

Move detection left. A repeated CodeRabbit or verifier comment should
become a test, lint, helper, or contract. A reviewer with no unique
material findings for a class of work should be used less. Quota and
outages still follow the security-tool policy.

## Dashboard contract

A future internal view may show DORA, quality, flow, reliability,
learning, AI engineering, Learning Debt, toil, and experiment status
as separate series. It must not collapse them into one number. No UI
is built in this foundation.

## Retrospective

When a trend exists, a short review asks START, STOP, CONTINUE, and
then: recurring failures, toil, Learning Debt, useful automation,
low-value process, reviewer value, Owner intervention, DORA,
reliability, and whether FZ-CIS itself is worth its cost. Do not
schedule a paid job for it.
