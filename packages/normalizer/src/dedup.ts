import { createHash } from 'node:crypto';
import type { PrismaClient } from '@uc-open-edge/db';
import type { InboundEvent } from '@uc-open-edge/schemas';

export interface DedupeContext {
  prisma: PrismaClient;
  sourceSystemId?: string;
  connectorId?: string;
}

export type DedupeResult = { isDuplicate: false } | { isDuplicate: true; existingId: string };

/**
 * Deduplication strategy (in priority order):
 *
 * 1. sourceSystemId + externalEventId  — most reliable
 * 2. connectorId + dedupeKey           — connector-specific dedup key
 * 3. payload hash + occurredAt window  — fallback (5-minute window)
 *
 * See docs/event-schemas.md for full deduplication behavior documentation.
 */
export async function checkDuplicate(
  ctx: DedupeContext,
  event: InboundEvent & { occurredAt?: Date | string },
): Promise<DedupeResult> {
  // Strategy 1: sourceSystemId + externalEventId
  if (ctx.sourceSystemId && event.externalEventId) {
    const existing = await ctx.prisma.normalizedEvent.findUnique({
      where: {
        sourceSystemId_externalEventId: {
          sourceSystemId: ctx.sourceSystemId,
          externalEventId: event.externalEventId,
        },
      },
      select: { id: true },
    });
    if (existing) return { isDuplicate: true, existingId: existing.id };
  }

  // Strategy 2: connectorId + dedupeKey
  if (ctx.connectorId && event.dedupeKey) {
    const existing = await ctx.prisma.normalizedEvent.findUnique({
      where: {
        connectorId_dedupeKey: {
          connectorId: ctx.connectorId,
          dedupeKey: event.dedupeKey,
        },
      },
      select: { id: true },
    });
    if (existing) return { isDuplicate: true, existingId: existing.id };
  }

  // Strategy 3: payload hash + occurredAt window (5-minute window)
  const payloadHash = computePayloadHash(event);
  const occurredAt = event.occurredAt ? new Date(event.occurredAt) : null;
  if (payloadHash && occurredAt && !isNaN(occurredAt.getTime())) {
    const windowStart = new Date(occurredAt.getTime() - 5 * 60 * 1000);
    const windowEnd = new Date(occurredAt.getTime() + 5 * 60 * 1000);
    const existing = await ctx.prisma.rawEvent.findFirst({
      where: {
        payloadHash,
        receivedAt: { gte: windowStart, lte: windowEnd },
        normalizedEventId: { not: null },
      },
      select: { normalizedEventId: true },
    });
    if (existing?.normalizedEventId) {
      return { isDuplicate: true, existingId: existing.normalizedEventId };
    }
  }

  return { isDuplicate: false };
}

export function computePayloadHash(event: Record<string, unknown>): string {
  const canonical = JSON.stringify(event, Object.keys(event).sort());
  return createHash('sha256').update(canonical).digest('hex');
}
