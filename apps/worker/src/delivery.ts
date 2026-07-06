import type { PrismaClient } from '@uc-open-edge/db';
import type { Logger } from '@uc-open-edge/core';
import { calculateBackoffMs } from '@uc-open-edge/destination-sdk';
import { createHttpDestination } from './destinations/http.js';
import { createFileDestination } from './destinations/file.js';
import { createWebhookDestination } from './destinations/webhook.js';
import { createMqttDestination } from './destinations/mqtt-dest.js';
import type {
  IDestination,
  DestinationDeliveryContext,
  DeliveryResult,
} from '@uc-open-edge/destination-sdk';

const MAX_RETRIES = 5;
const POLL_INTERVAL_MS = 5000;

export function startDeliveryWorker(prisma: PrismaClient, logger: Logger) {
  logger.info('Delivery worker starting');

  const interval = setInterval(async () => {
    try {
      await processDeliveries(prisma, logger);
    } catch (err) {
      logger.error({ err }, 'Delivery worker error');
    }
  }, POLL_INTERVAL_MS);

  return () => clearInterval(interval);
}

async function processDeliveries(prisma: PrismaClient, logger: Logger) {
  const now = new Date();

  const pending = await prisma.eventDelivery.findMany({
    where: {
      status: 'pending',
      nextAttemptAt: { lte: now },
    },
    include: {
      normalizedEvent: true,
      destination: true,
    },
    take: 50,
    orderBy: { nextAttemptAt: 'asc' },
  });

  for (const delivery of pending) {
    await prisma.eventDelivery.update({
      where: { id: delivery.id },
      data: { status: 'in_progress' },
    });

    const destination = getDestinationHandler(delivery.destination.type as string);
    if (!destination) {
      logger.warn({ type: delivery.destination.type }, 'Unknown destination type');
      await prisma.eventDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'failed',
          lastError: `Unknown destination type: ${delivery.destination.type}`,
        },
      });
      continue;
    }

    const ctx: DestinationDeliveryContext = {
      destinationId: delivery.destinationId,
      deliveryId: delivery.id,
      config: delivery.destination.config as Record<string, unknown>,
      logger: {
        info: (msg, meta) => logger.info({ ...meta }, msg),
        warn: (msg, meta) => logger.warn({ ...meta }, msg),
        error: (msg, meta) => logger.error({ ...meta }, msg),
        debug: (msg, meta) => logger.debug({ ...meta }, msg),
      },
    };

    const eventPayload = buildEventPayload(delivery.normalizedEvent);
    const startMs = Date.now();

    const result: DeliveryResult = await destination.deliver(eventPayload, ctx).catch((err) => ({
      success: false as const,
      error: String(err),
      durationMs: Date.now() - startMs,
    }));

    const newAttempts = delivery.attempts + 1;

    await prisma.deliveryAttempt.create({
      data: {
        eventDeliveryId: delivery.id,
        destinationId: delivery.destinationId,
        normalizedEventId: delivery.normalizedEventId,
        status: result.success ? 'delivered' : 'failed',
        statusCode: result.statusCode,
        requestBody: result.requestBody as never,
        responseBody: result.responseBody,
        error: result.error,
        durationMs: result.durationMs,
      },
    });

    if (result.success) {
      await prisma.eventDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'delivered',
          attempts: newAttempts,
          lastAttemptAt: new Date(),
          lastStatusCode: result.statusCode,
          lastError: null,
        },
      });
      await prisma.destination.update({
        where: { id: delivery.destinationId },
        data: { lastSuccessAt: new Date(), status: 'active', lastError: null },
      });
    } else {
      const shouldRetry = newAttempts < MAX_RETRIES;
      const nextAttemptAt = shouldRetry
        ? new Date(Date.now() + calculateBackoffMs(newAttempts))
        : null;

      await prisma.eventDelivery.update({
        where: { id: delivery.id },
        data: {
          status: shouldRetry ? 'pending' : 'failed',
          attempts: newAttempts,
          lastAttemptAt: new Date(),
          lastStatusCode: result.statusCode,
          lastError: result.error,
          nextAttemptAt: nextAttemptAt ?? delivery.nextAttemptAt,
        },
      });
      await prisma.destination.update({
        where: { id: delivery.destinationId },
        data: { lastErrorAt: new Date(), status: 'error', lastError: result.error },
      });

      logger.warn(
        {
          deliveryId: delivery.id,
          attempt: newAttempts,
          maxRetries: MAX_RETRIES,
          error: result.error,
        },
        shouldRetry ? 'Delivery failed, will retry' : 'Delivery permanently failed',
      );
    }
  }
}

function getDestinationHandler(type: string): IDestination | null {
  switch (type) {
    case 'http':
      return createHttpDestination();
    case 'file':
      return createFileDestination();
    case 'webhook':
      return createWebhookDestination();
    case 'mqtt':
      return createMqttDestination();
    default:
      return null;
  }
}

function buildEventPayload(event: Record<string, unknown>): Record<string, unknown> {
  return {
    id: event['id'],
    eventId: event['eventId'],
    eventType: event['eventType'],
    domain: event['domain'],
    occurredAt: event['occurredAt'],
    receivedAt: event['receivedAt'],
    processedAt: event['processedAt'],
    sourceSystemId: event['sourceSystemId'],
    connectorId: event['connectorId'],
    externalEventId: event['externalEventId'],
    locationRef: event['locationRef'],
    fromLocationRef: event['fromLocationRef'],
    toLocationRef: event['toLocationRef'],
    skuRef: event['skuRef'],
    itemRef: event['itemRef'],
    containerRef: event['containerRef'],
    equipmentRef: event['equipmentRef'],
    robotRef: event['robotRef'],
    taskRef: event['taskRef'],
    workOrderRef: event['workOrderRef'],
    quantity: event['quantity'],
    unitOfMeasure: event['unitOfMeasure'],
    payload: event['payload'],
    metadata: event['metadata'],
  };
}
