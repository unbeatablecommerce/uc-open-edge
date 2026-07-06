import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireSession, requireRole } from '../plugins/auth.js';

const CreateSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const sourceSystemRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: requireSession }, async (_req, reply) => {
    const items = await app.prisma.sourceSystem.findMany({ orderBy: { name: 'asc' } });
    return reply.send({ data: items });
  });

  app.post('/', { preHandler: requireRole('admin', 'operator') }, async (req, reply) => {
    const body = CreateSchema.safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' });
    const item = await app.prisma.sourceSystem.create({ data: body.data as never });
    await app.prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'source_system.created',
        resourceType: 'source_system',
        resourceId: item.id,
      },
    });
    return reply.status(201).send({ data: item });
  });

  app.patch('/:id', { preHandler: requireRole('admin', 'operator') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = CreateSchema.partial().safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' });
    const item = await app.prisma.sourceSystem.update({ where: { id }, data: body.data as never });
    await app.prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'source_system.updated',
        resourceType: 'source_system',
        resourceId: id,
      },
    });
    return reply.send({ data: item });
  });
};
