import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireSession, requireRole } from '../plugins/auth.js';

const CreateSchema = z.object({
  sourceSystemId: z.string().optional(),
  type: z.enum(['sku', 'location', 'equipment', 'robot', 'custom']),
  externalKey: z.string().min(1),
  internalKey: z.string().min(1),
  displayName: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const mappingRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: requireSession }, async (req, reply) => {
    const query = req.query as Record<string, string>;
    const where: Record<string, unknown> = { active: true };
    if (query['type']) where['type'] = query['type'];
    if (query['sourceSystemId']) where['sourceSystemId'] = query['sourceSystemId'];
    const items = await app.prisma.mapping.findMany({
      where,
      orderBy: [{ type: 'asc' }, { externalKey: 'asc' }],
    });
    return reply.send({ data: items });
  });

  app.post('/', { preHandler: requireRole('admin', 'operator') }, async (req, reply) => {
    const body = CreateSchema.safeParse(req.body);
    if (!body.success)
      return reply.status(400).send({ error: 'Invalid input', details: body.error.issues });
    const item = await app.prisma.mapping.create({ data: body.data as never });
    await app.prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'mapping.created',
        resourceType: 'mapping',
        resourceId: item.id,
      },
    });
    return reply.status(201).send({ data: item });
  });

  app.patch('/:id', { preHandler: requireRole('admin', 'operator') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = CreateSchema.partial().safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' });
    const item = await app.prisma.mapping.update({ where: { id }, data: body.data as never });
    await app.prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'mapping.updated',
        resourceType: 'mapping',
        resourceId: id,
      },
    });
    return reply.send({ data: item });
  });

  app.delete('/:id', { preHandler: requireRole('admin', 'operator') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await app.prisma.mapping.update({ where: { id }, data: { active: false } });
    await app.prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'mapping.deleted',
        resourceType: 'mapping',
        resourceId: id,
      },
    });
    return reply.send({ ok: true });
  });
};
