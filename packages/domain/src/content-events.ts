import type { ContentStore } from './content-publish.ts';

export function applyBusinessProjectCompleted(store: ContentStore): { published: false; outboxLength: number } {
  return { published: false, outboxLength: store.outbox.length };
}
