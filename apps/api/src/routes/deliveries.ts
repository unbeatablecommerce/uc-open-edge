import type { FastifyPluginAsync } from 'fastify';
import { requireSession, requireRole } from '../plugins/auth.js';

export const deliveryRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: requireSession }, async (req, reply) => {
    const query = req.query as Record<string, string>;
    const page = Math.max(1, parseInt(query['page'] ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(query['limit'] ?? '20')));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query['destinationId']) where['destinationId'] = query['destinationId'];
    if (query['status']) where['status'] = query['status'];
    if (query['normalizedEventId']) where['normalizedEventId'] = query['normalizedEventId'];

    const [total, items] = await Promise.all([
      app.prisma.deliveryAttempt.count({ where }),
      app.prisma.deliveryAttempt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { attemptedAt: 'desc' },
        include: { destination: { select: { name: true, type: true } } },
      }),
    ]);

    return reply.send({ data: items, total, page, limit, totalPages: Math.ceil(total / limit) });
  });

  app.post('/:id/retry', { preHandler: requireRole('admin', 'operator') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const attempt = await app.prisma.deliveryAttempt.findUnique({
      where: { id },
      select: { eventDeliveryId: true },
    });
    if (!attempt) return reply.status(404).send({ error: 'Delivery attempt not found' });

    await app.prisma.eventDelivery.update({
      where: { id: attempt.eventDeliveryId },
      data: { status: 'pending', nextAttemptAt: new Date() },
    });
    await app.prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'delivery.retried',
        resourceType: 'delivery_attempt',
        resourceId: id,
      },
    });

    return reply.send({ ok: true });
  });
};
