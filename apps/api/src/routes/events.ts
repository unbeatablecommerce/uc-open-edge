import type { FastifyPluginAsync } from 'fastify';
import { requireSession, requireRole } from '../plugins/auth.js';
import { ingestEvent } from '@uc-open-edge/normalizer';

export const eventRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: requireSession }, async (req, reply) => {
    const query = req.query as Record<string, string>;
    const page = Math.max(1, parseInt(query['page'] ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(query['limit'] ?? '20')));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query['eventType']) where['eventType'] = query['eventType'];
    if (query['domain']) where['domain'] = query['domain'];
    if (query['sourceSystemId']) where['sourceSystemId'] = query['sourceSystemId'];
    if (query['connectorId']) where['connectorId'] = query['connectorId'];
    if (query['status']) where['status'] = query['status'];
    if (query['from'] || query['to']) {
      where['occurredAt'] = {
        ...(query['from'] ? { gte: new Date(query['from']) } : {}),
        ...(query['to'] ? { lte: new Date(query['to']) } : {}),
      };
    }
    if (query['q']) {
      where['OR'] = [
        { eventType: { contains: query['q'], mode: 'insensitive' } },
        { externalEventId: { contains: query['q'], mode: 'insensitive' } },
      ];
    }

    const [total, events] = await Promise.all([
      app.prisma.normalizedEvent.count({ where }),
      app.prisma.normalizedEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { receivedAt: 'desc' },
        include: {
          sourceSystem: { select: { name: true } },
          connector: { select: { name: true, type: true } },
        },
      }),
    ]);

    return reply.send({ data: events, total, page, limit, totalPages: Math.ceil(total / limit) });
  });

  app.get('/:id', { preHandler: requireSession }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const event = await app.prisma.normalizedEvent.findFirst({
      where: { OR: [{ id }, { eventId: id }] },
      include: {
        sourceSystem: true,
        connector: true,
        rawEvents: { take: 1 },
        deliveries: {
          include: {
            destination: true,
            attempts_log: { orderBy: { attemptedAt: 'desc' }, take: 5 },
          },
        },
      },
    });
    if (!event) return reply.status(404).send({ error: 'Event not found' });
    return reply.send({ data: event });
  });

  app.post(
    '/:id/reprocess',
    { preHandler: requireRole('admin', 'operator') },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const event = await app.prisma.normalizedEvent.findUnique({
        where: { id },
        include: { rawEvents: { take: 1 }, connector: true },
      });
      if (!event) return reply.status(404).send({ error: 'Event not found' });

      const rawEvent = event.rawEvents[0];
      if (!rawEvent || !event.connectorId) {
        return reply
          .status(400)
          .send({ error: 'Cannot reprocess: missing raw event or connector' });
      }

      const result = await ingestEvent(rawEvent.payload, {
        prisma: app.prisma,
        connectorId: event.connectorId,
        sourceSystemId: event.sourceSystemId ?? undefined,
      });

      await app.prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: 'event.reprocessed',
          resourceType: 'event',
          resourceId: id,
        },
      });

      return reply.send({ ok: true, result });
    },
  );

  app.post(
    '/:id/retry-deliveries',
    { preHandler: requireRole('admin', 'operator') },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const updated = await app.prisma.eventDelivery.updateMany({
        where: { normalizedEventId: id, status: 'failed' },
        data: { status: 'pending', nextAttemptAt: new Date() },
      });
      await app.prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: 'delivery.retried',
          resourceType: 'event',
          resourceId: id,
        },
      });
      return reply.send({ ok: true, count: updated.count });
    },
  );
};
