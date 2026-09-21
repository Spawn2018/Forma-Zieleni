# Healthy data

Status: CURRENT. This is not a data-quality score.

| Domain | Owner | Contract | Consumers | Visibility |
| --- | --- | --- | --- | --- |
| Lead | Core API | `packages/domain/src/lead.ts` and OpenAPI | API, future CRM | Private operational data |
| Editorial prose | CMS content model | `packages/domain/src/content-publish.ts` | Public projection | Draft private, published public |
| Plant name | Plant domain | `packages/domain/src/connected.ts` | Projects, articles, portfolio projection | Public only when the entity is public |
| Marketing plan | Growth OS | `packages/domain/src/growth.ts` | Plan route, execution graph | Synthetic until a real plan is approved |
| Media master | Media pipeline | `packages/media/src/master.mjs` | Derivatives, future collections | Private master, public derivative |

Provenance and human lock live on connected fields. A projection is not an owner.
Freshness of a plan is its version. A stale proposal does not apply.

Quality rules that are tested: opaque lead ids, draft isolation, no GPS on public derivatives, synthetic plan label, spend flag rejected, private customer relations hidden.

A material data failure, such as a public projection of another customer's project, is an FZ-CIS candidate. No production data incident is recorded. There is no single accuracy percentage.
