import type { FastifyPluginAsync } from 'fastify';
import { requireSession } from '../plugins/auth.js';

export const auditLogRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: requireSession }, async (req, reply) => {
    const query = req.query as Record<string, string>;
    const page = Math.max(1, parseInt(query['page'] ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(query['limit'] ?? '50')));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query['action']) where['action'] = { contains: query['action'] };
    if (query['actorUserId']) where['actorUserId'] = query['actorUserId'];
    if (query['resourceType']) where['resourceType'] = query['resourceType'];

    const [total, logs] = await Promise.all([
      app.prisma.auditLog.count({ where }),
      app.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { name: true, email: true } } },
      }),
    ]);

    return reply.send({ data: logs, total, page, limit, totalPages: Math.ceil(total / limit) });
  });
};
