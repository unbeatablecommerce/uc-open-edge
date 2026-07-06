import { createHash } from 'node:crypto';
import type { PrismaClient } from '@uc-open-edge/db';
import { InboundEventSchema, DOMAIN_BY_EVENT_TYPE } from '@uc-open-edge/schemas';
import type { InboundEvent } from '@uc-open-edge/schemas';
import { getLogger } from '@uc-open-edge/core';
import { mapSkuRef, mapLocationRef, mapEquipmentRef, mapRobotRef } from '@uc-open-edge/mapper';
import { checkDuplicate, computePayloadHash } from './dedup.js';

export interface IngestContext {
  prisma: PrismaClient;
  connectorId: string;
  sourceSystemId?: string;
  headers?: Record<string, string>;
}

export interface IngestResult {
  success: boolean;
  rawEventId: string;
  normalizedEventId?: string;
  isDuplicate?: boolean;
  duplicateOfId?: string;
  validationErrors?: string[];
  error?: string;
}

/**
 * Core event ingestion pipeline.
 *
 * Flow:
 *   1. Store raw event (always)
 *   2. Validate against InboundEventSchema
 *   3. Apply connector field mappings
 *   4. Resolve ref mappings (SKU, location, equipment, robot)
 *   5. Check deduplication
 *   6. Store normalized event
 *   7. Fan out EventDelivery rows for enabled destinations
 *   8. Update connector health
 */
export async function ingestEvent(rawPayload: unknown, ctx: IngestContext): Promise<IngestResult> {
  const logger = getLogger();
  const payloadHash = computePayloadHash(rawPayload as Record<string, unknown>);

  // Step 1: Store raw event (always, even if invalid)
  const rawEvent = await ctx.prisma.rawEvent.create({
    data: {
      connectorId: ctx.connectorId,
      sourceSystemId: ctx.sourceSystemId,
      payload: rawPayload as never,
      headers: ctx.headers as never,
      payloadHash,
      parseStatus: 'ok',
      validationStatus: 'pending',
    },
  });

  // Step 2: Validate
  const parseResult = InboundEventSchema.safeParse(rawPayload);
  if (!parseResult.success) {
    const errors = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    await ctx.prisma.rawEvent.update({
      where: { id: rawEvent.id },
      data: { validationStatus: 'invalid', errorMessage: errors.join('; ') },
    });
    await updateConnectorHealth(ctx.prisma, ctx.connectorId, 'error', errors.join('; '));
    return { success: false, rawEventId: rawEvent.id, validationErrors: errors };
  }

  const event: InboundEvent = parseResult.data;
  const domain = DOMAIN_BY_EVENT_TYPE[event.eventType];
  const occurredAt = event.occurredAt ? new Date(event.occurredAt as string) : new Date();

  // Step 3 & 4: Apply ref mappings
  const mapCtx = { prisma: ctx.prisma, sourceSystemId: ctx.sourceSystemId };
  const skuRef = event.skuRef ? await mapSkuRef(mapCtx, event.skuRef) : null;
  const itemRef = event.itemRef ?? null;
  const locationRef = event.locationRef ? await mapLocationRef(mapCtx, event.locationRef) : null;
  const fromLocationRef = event.fromLocationRef
    ? await mapLocationRef(mapCtx, event.fromLocationRef)
    : null;
  const toLocationRef = event.toLocationRef
    ? await mapLocationRef(mapCtx, event.toLocationRef)
    : null;
  const equipmentRef = event.equipmentRef
    ? await mapEquipmentRef(mapCtx, event.equipmentRef)
    : null;
  const robotRef = event.robotRef ? await mapRobotRef(mapCtx, event.robotRef) : null;

  // Step 5: Deduplication check
  const dedupeResult = await checkDuplicate(
    { prisma: ctx.prisma, sourceSystemId: ctx.sourceSystemId, connectorId: ctx.connectorId },
    { ...event, occurredAt },
  );

  if (dedupeResult.isDuplicate) {
    await ctx.prisma.rawEvent.update({
      where: { id: rawEvent.id },
      data: {
        validationStatus: 'duplicate',
        normalizedEventId: dedupeResult.existingId,
      },
    });
    logger.debug(
      { connectorId: ctx.connectorId, existingId: dedupeResult.existingId },
      'Duplicate event skipped',
    );
    return {
      success: true,
      rawEventId: rawEvent.id,
      normalizedEventId: dedupeResult.existingId,
      isDuplicate: true,
      duplicateOfId: dedupeResult.existingId,
    };
  }

  // Step 6: Store normalized event
  const normalizedEvent = await ctx.prisma.normalizedEvent.create({
    data: {
      eventType: event.eventType,
      domain,
      sourceSystemId: ctx.sourceSystemId,
      connectorId: ctx.connectorId,
      rawEventId: rawEvent.id,
      externalEventId: event.externalEventId,
      dedupeKey: event.dedupeKey,
      occurredAt,
      processedAt: new Date(),
      status: 'normalized',
      siteRef: (event.siteRef as never) ?? null,
      areaRef: (event.areaRef as never) ?? null,
      zoneRef: (event.zoneRef as never) ?? null,
      locationRef: (locationRef as never) ?? null,
      fromLocationRef: (fromLocationRef as never) ?? null,
      toLocationRef: (toLocationRef as never) ?? null,
      skuRef: (skuRef as never) ?? null,
      itemRef: (itemRef as never) ?? null,
      containerRef: (event.containerRef as never) ?? null,
      equipmentRef: (equipmentRef as never) ?? null,
      robotRef: (robotRef as never) ?? null,
      taskRef: (event.taskRef as never) ?? null,
      workOrderRef: (event.workOrderRef as never) ?? null,
      quantity: event.quantity != null ? event.quantity : null,
      unitOfMeasure: event.unitOfMeasure ?? null,
      payload: (event.payload as never) ?? null,
      metadata: (event.metadata as never) ?? null,
    },
  });

  // Update raw event with normalized event id
  await ctx.prisma.rawEvent.update({
    where: { id: rawEvent.id },
    data: {
      validationStatus: 'valid',
      normalizedEventId: normalizedEvent.id,
    },
  });

  // Step 7: Fan out EventDelivery rows for enabled destinations
  const destinations = await ctx.prisma.destination.findMany({
    where: { enabled: true },
  });

  if (destinations.length > 0) {
    await ctx.prisma.eventDelivery.createMany({
      data: destinations.map((d) => ({
        normalizedEventId: normalizedEvent.id,
        destinationId: d.id,
        status: 'pending' as const,
        nextAttemptAt: new Date(),
      })),
      skipDuplicates: true,
    });
  }

  // Step 8: Update connector health
  await updateConnectorHealth(ctx.prisma, ctx.connectorId, 'active');
  await ctx.prisma.connector.update({
    where: { id: ctx.connectorId },
    data: {
      lastSeenAt: new Date(),
      lastSuccessAt: new Date(),
      status: 'active',
      lastError: null,
    },
  });

  logger.info(
    { connectorId: ctx.connectorId, eventType: event.eventType, id: normalizedEvent.id },
    'Event ingested',
  );

  return {
    success: true,
    rawEventId: rawEvent.id,
    normalizedEventId: normalizedEvent.id,
  };
}

async function updateConnectorHealth(
  prisma: PrismaClient,
  connectorId: string,
  status: 'active' | 'error' | 'idle' | 'disabled',
  message?: string,
): Promise<void> {
  await prisma.connectorHealth.create({
    data: {
      connectorId,
      status,
      message,
      checkedAt: new Date(),
    },
  });
}
