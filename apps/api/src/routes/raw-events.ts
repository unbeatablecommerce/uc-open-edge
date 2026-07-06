import type { FastifyPluginAsync } from 'fastify';
import { requireSession } from '../plugins/auth.js';

export const rawEventRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: requireSession }, async (req, reply) => {
    const query = req.query as Record<string, string>;
    const page = Math.max(1, parseInt(query['page'] ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(query['limit'] ?? '20')));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query['connectorId']) where['connectorId'] = query['connectorId'];
    if (query['sourceSystemId']) where['sourceSystemId'] = query['sourceSystemId'];
    if (query['validationStatus']) where['validationStatus'] = query['validationStatus'];

    const [total, events] = await Promise.all([
      app.prisma.rawEvent.count({ where }),
      app.prisma.rawEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { receivedAt: 'desc' },
        include: { connector: { select: { name: true } } },
      }),
    ]);

    return reply.send({ data: events, total, page, limit, totalPages: Math.ceil(total / limit) });
  });

  app.get('/:id', { preHandler: requireSession }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const event = await app.prisma.rawEvent.findUnique({
      where: { id },
      include: { connector: true, normalizedEvent: true },
    });
    if (!event) return reply.status(404).send({ error: 'Raw event not found' });
    return reply.send({ data: event });
  });
};
