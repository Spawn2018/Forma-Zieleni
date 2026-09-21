# Documentation quality baseline

Status: CURRENT. Date: 2026-09-22. No combined score.

Research used for the lens, not as a target number:

- DORA, software delivery metrics, https://dora.dev/guides/dora-metrics/ , retrieved 2026-09-22. Five metrics, including deployment rework rate.
- DORA, history of the metrics, https://dora.dev/insights/dora-metrics-history/ , retrieved 2026-09-22. The fifth metric was added in 2024. An older four-metric diagram is history, not a deletion of rework rate.
- DORA capability catalog, https://dora.dev/capabilities/ , retrieved 2026-09-22. Documentation quality is a capability. It is not one of the five delivery metrics.
- DORA 2023 report measured documentation as reliable, findable, updated, and relevant, then used one research score. Forma Zieleni does not adopt that composite.

| Dimension | State | Evidence |
| --- | --- | --- |
| Reliability | PARTIAL | Domain and API behavior cited from code and tests. Many product surfaces are still design. |
| Understandability | PARTIAL | Role guides exist for Owner, Agnieszka, and developers. They state missing UI instead of inventing steps. |
| Findability | ADEQUATE | `docs/DOCUMENTATION-MAP.md` and the context map. Not measured with a user study. |
| Coverage | PARTIAL | Architecture, lead API, media, growth, and security notes exist. WWW, Portal, Admin, and mobile apps do not. |
| Organization | ADEQUATE | One architecture entrypoint. Documentation OS is subordinate. |
| Change synchronization | PARTIAL | `pnpm docs:check` fails on broken pointers and drifted event names. It does not watch every legacy page. |
| Accuracy | PARTIAL | New pages were written against the tree at `b6dfb74` and this change. Older pages were not rewritten for voice. |
| Incident usefulness | GAP | No production service and no incident series. Runbooks that invent production commands were not added. |

Storybook is not adopted. There is no shared UI package and no running WWW, Portal, or Admin app. Reconsider when one shared component is used by a real screen and needs stateful, keyboard, and accessibility examples.

Backstage, MkDocs, Docusaurus, VitePress, and Vale were not added. Markdown in git plus `pnpm docs:check` is the current check.
