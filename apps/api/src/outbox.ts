import { randomBytes } from 'node:crypto';
import { sql, type Kysely } from 'kysely';
import type { Database } from './db.ts';

export type OutboxDelivery = {
  id: string;
  eventType: string;
  leadId: string;
};

export type OutboxSink = {
  deliver(message: OutboxDelivery): Promise<void>;
};

export type DispatchOptions = {
  limit: number;
  maxAttempts: number;
  leaseMs: number;
  now: Date;
};

export type DispatchCounts = {
  published: number;
  retried: number;
  poisoned: number;
};

type Claimed = { id: string; event_type: string; lead_id: string; attempts: number };

export async function dispatchOutbox(db: Kysely<Database>, sink: OutboxSink, options: DispatchOptions): Promise<DispatchCounts> {
  const token = randomBytes(16).toString('hex');
  const leaseBefore = new Date(options.now.getTime() - options.leaseMs);
  const claimed = await db.transaction().execute(async trx => {
    const rows = await sql<Claimed>`
      WITH picked AS (
        SELECT id FROM domain_outbox
        WHERE delivery_status = 'pending'
          AND (next_attempt_at IS NULL OR next_attempt_at <= ${options.now})
          AND (claimed_at IS NULL OR claimed_at <= ${leaseBefore})
        ORDER BY created_at
        FOR UPDATE SKIP LOCKED
        LIMIT ${options.limit}
      )
      UPDATE domain_outbox AS outbox
      SET claimed_at = ${options.now}, claim_token = ${token}, attempts = attempts + 1
      FROM picked
      WHERE outbox.id = picked.id
      RETURNING outbox.id, outbox.event_type, outbox.lead_id, outbox.attempts
    `.execute(trx);
    return rows.rows;
  });
  const counts: DispatchCounts = { published: 0, retried: 0, poisoned: 0 };
  for (const row of claimed) {
    try {
      await sink.deliver({ id: row.id, eventType: row.event_type, leadId: row.lead_id });
      await db.updateTable('domain_outbox').set({
        delivery_status: 'published',
        published_at: options.now,
        claimed_at: null,
        claim_token: null,
        last_error: null,
      }).where('id', '=', row.id).where('claim_token', '=', token).execute();
      counts.published += 1;
    } catch {
      const poison = row.attempts >= options.maxAttempts;
      const delay = Math.min(60_000, 1000 * 2 ** Math.max(0, row.attempts - 1));
      await db.updateTable('domain_outbox').set({
        delivery_status: poison ? 'poison' : 'pending',
        claimed_at: null,
        claim_token: null,
        last_error: 'DELIVERY_FAILED',
        next_attempt_at: poison ? null : new Date(options.now.getTime() + delay),
      }).where('id', '=', row.id).where('claim_token', '=', token).execute();
      if (poison) counts.poisoned += 1;
      else counts.retried += 1;
    }
  }
  return counts;
}
