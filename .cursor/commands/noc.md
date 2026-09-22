---
description: Autonomous Forma Zieleni session until the next Europe/Warsaw hour
---

`/noc 9` works until the next 09:00 Europe/Warsaw. `/noc 21` means 21:00, not a second meaning of 9. The hour is 0–23.

- `/noc` without an hour, or `/noc stop` when no window is active: print `Usage: /noc 9` and stop.
- `/noc stop` during a window: finish only the atomic step already started, `node scripts/fz-noc/cli.mjs stop`, stop the `loop-noc` watchdog, report, and do not start another slice.

Stay in Agent. Do not switch to Plan. Do not launch the whole session as a background Task. The coordinator, the watchdog, and the slice loop stay in this Agent session. Read-only research may run beside it. A second writer on `main` may not.

Follow `.cursor/skills/fz-autonomous-execution/SKILL.md`.

1. `node scripts/fz-noc/cli.mjs start <hour>`. Exit code 1 means a window is already active: do not start another one.
2. Arm `/loop` every 15 minutes, name `loop-noc`, in this session. Watchdog prompt: read `.fz-noc/live.json`. If `status` is `stop` or `untilUtc` has passed, stop the loop. If `busy` and `lastBeat` is newer than 25 minutes, do nothing. If `lastBeat` is older than 25 minutes and the deadline is still ahead, run one recovery cycle from the skill. Do not start a second writer.
3. Run the first cycle immediately. The watchdog is not the first cycle.

The `stop` hook continues an ordinary completed turn while the window is active. Do not ask the Owner for `continue`, `resume`, or `next`. Refresh repository state on every continuation. A local commit is not itself a push. After the pre-push gate passes, an ordinary fast-forward push to the existing `origin` `main` is AUTO, including inside `/noc`. Force-push, `--force-with-lease`, mirror, delete, and history rewrite stay DANGEROUS. Deploy, DNS, Cloudflare, production credentials, spend, and live customer data stay outside this command.
