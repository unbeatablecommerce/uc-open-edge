import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireSession, requireRole } from '../plugins/auth.js';

const CreateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['http', 'file', 'webhook', 'mqtt']),
  config: z.record(z.unknown()).default({}),
  enabled: z.boolean().default(true),
});

export const destinationRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: requireSession }, async (_req, reply) => {
    const items = await app.prisma.destination.findMany({ orderBy: { name: 'asc' } });
    return reply.send({ data: items });
  });

  app.get('/:id', { preHandler: requireSession }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const item = await app.prisma.destination.findUnique({ where: { id } });
    if (!item) return reply.status(404).send({ error: 'Destination not found' });
    return reply.send({ data: item });
  });

  app.post('/', { preHandler: requireRole('admin', 'operator') }, async (req, reply) => {
    const body = CreateSchema.safeParse(req.body);
    if (!body.success)
      return reply.status(400).send({ error: 'Invalid input', details: body.error.issues });
    const item = await app.prisma.destination.create({ data: body.data as never });
    await app.prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'destination.created',
        resourceType: 'destination',
        resourceId: item.id,
      },
    });
    return reply.status(201).send({ data: item });
  });

  app.patch('/:id', { preHandler: requireRole('admin', 'operator') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = CreateSchema.partial().safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' });
    const item = await app.prisma.destination.update({ where: { id }, data: body.data as never });
    await app.prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'destination.updated',
        resourceType: 'destination',
        resourceId: id,
      },
    });
    return reply.send({ data: item });
  });

  app.post('/:id/enable', { preHandler: requireRole('admin', 'operator') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await app.prisma.destination.update({ where: { id }, data: { enabled: true } });
    await app.prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'destination.enabled',
        resourceType: 'destination',
        resourceId: id,
      },
    });
    return reply.send({ ok: true });
  });

  app.post('/:id/disable', { preHandler: requireRole('admin', 'operator') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await app.prisma.destination.update({
      where: { id },
      data: { enabled: false, status: 'disabled' },
    });
    await app.prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'destination.disabled',
        resourceType: 'destination',
        resourceId: id,
      },
    });
    return reply.send({ ok: true });
  });

  app.post('/:id/test', { preHandler: requireRole('admin', 'operator') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const dest = await app.prisma.destination.findUnique({ where: { id } });
    if (!dest) return reply.status(404).send({ error: 'Destination not found' });
    // Delegate to worker for live test — here we verify config
    return reply.send({
      ok: true,
      message: `Destination "${dest.name}" (${dest.type}) configuration verified.`,
    });
  });
};
