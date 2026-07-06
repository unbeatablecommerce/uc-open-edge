import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (_req, reply) => {
    try {
      await app.prisma.$queryRaw`SELECT 1`;
      return reply.send({ status: 'ok', db: 'ok', uptime: process.uptime() });
    } catch {
      return reply.status(503).send({ status: 'error', db: 'unreachable' });
    }
  });

  app.get('/connectors', async (_req, reply) => {
    const connectors = await app.prisma.connector.findMany({
      where: { enabled: true },
      include: {
        health: { orderBy: { checkedAt: 'desc' }, take: 1 },
      },
    });
    const summary = connectors.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      status: c.status,
      lastHealth: c.health[0] ?? null,
      lastSeenAt: c.lastSeenAt,
      lastSuccessAt: c.lastSuccessAt,
      lastErrorAt: c.lastErrorAt,
      lastError: c.lastError,
    }));
    return reply.send({ data: summary });
  });

  app.get('/destinations', async (_req, reply) => {
    const destinations = await app.prisma.destination.findMany({
      where: { enabled: true },
    });
    const summary = destinations.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      status: d.status,
      lastSuccessAt: d.lastSuccessAt,
      lastErrorAt: d.lastErrorAt,
      lastError: d.lastError,
    }));

    const pendingCount = await app.prisma.eventDelivery.count({ where: { status: 'pending' } });
    const failedCount = await app.prisma.eventDelivery.count({ where: { status: 'failed' } });

    return reply.send({
      data: summary,
      pendingDeliveries: pendingCount,
      failedDeliveries: failedCount,
    });
  });
};
