# Domain events

The names between the markers are the domain event names this check
expects to find in code. Add a name here only when the code emits it.
There is no separate consumer bus. Delivery is the transactional outbox
described in `docs/architecture/CURRENT-ARCHITECTURE.md`. Payloads must
not carry draft prose or customer contact fields.

<!-- events:start -->
content.published
fabric.field-updated
<!-- events:end -->

`content.published` is the publication outbox type in
`packages/domain/src/content-publish.ts`. `fabric.field-updated` is
emitted by `packages/domain/src/connected.ts` after an approved
deterministic field change. Repeating the same event id does not apply
the change twice. A causation cycle throws `LOOP_GUARD`.
