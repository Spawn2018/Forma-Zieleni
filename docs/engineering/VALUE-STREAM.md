# Value stream

Status: DESIGNED. No times in this file are measurements.

The engineering line is:

Owner need, requirement, READY slice, work start, implementation, verification, commit, release, user effect, business outcome, learning.

Git can show commit time. `docs/architecture/NEXT-SLICES-CMS.md` shows READY and blocked slices. The execution journal shows the current phase. FZ-CIS can record learning after a slice.

These durations are NOT MEASURABLE YET, because the repository has no production release clock and no collected wait log:

active work time, wait time, blocked time, Owner-gate wait, external-dependency wait, review time, rework time.

Future events may use those names. Do not backfill them. A release is not a local commit. User effect and business outcome stay empty until a real surface and a real outcome exist.
