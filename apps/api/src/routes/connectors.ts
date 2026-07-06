import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireSession, requireRole } from '../plugins/auth.js';

const CreateSchema = z.object({
  name: z.string().min(1),
  type: z.enum([
    'webhook',
    'file_drop',
    'csv',
    'rest_poll',
    'mqtt',
    'opcua',
    'wms_template',
    'wes_template',
    'amr_template',
    'manufacturing_template',
  ]),
  sourceSystemId: z.string(),
  config: z.record(z.unknown()).default({}),
  enabled: z.boolean().default(true),
});

export const connectorRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: requireSession }, async (_req, reply) => {
    const items = await app.prisma.connector.findMany({
      include: { sourceSystem: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
    return reply.send({ data: items });
  });

  app.get('/:id', { preHandler: requireSession }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const item = await app.prisma.connector.findUnique({
      where: { id },
      include: {
        sourceSystem: true,
        health: { orderBy: { checkedAt: 'desc' }, take: 10 },
      },
    });
    if (!item) return reply.status(404).send({ error: 'Connector not found' });
    return reply.send({ data: item });
  });

  app.post('/', { preHandler: requireRole('admin', 'operator') }, async (req, reply) => {
    const body = CreateSchema.safeParse(req.body);
    if (!body.success)
      return reply.status(400).send({ error: 'Invalid input', details: body.error.issues });
    const item = await app.prisma.connector.create({ data: body.data as never });
    await app.prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'connector.created',
        resourceType: 'connector',
        resourceId: item.id,
      },
    });
    return reply.status(201).send({ data: item });
  });

  app.patch('/:id', { preHandler: requireRole('admin', 'operator') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = CreateSchema.partial().safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' });
    const item = await app.prisma.connector.update({ where: { id }, data: body.data as never });
    await app.prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'connector.updated',
        resourceType: 'connector',
        resourceId: id,
      },
    });
    return reply.send({ data: item });
  });

  app.post('/:id/enable', { preHandler: requireRole('admin', 'operator') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await app.prisma.connector.update({ where: { id }, data: { enabled: true } });
    await app.prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'connector.enabled',
        resourceType: 'connector',
        resourceId: id,
      },
    });
    return reply.send({ ok: true });
  });

  app.post('/:id/disable', { preHandler: requireRole('admin', 'operator') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await app.prisma.connector.update({
      where: { id },
      data: { enabled: false, status: 'disabled' },
    });
    await app.prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'connector.disabled',
        resourceType: 'connector',
        resourceId: id,
      },
    });
    return reply.send({ ok: true });
  });

  app.post('/:id/test', { preHandler: requireRole('admin', 'operator') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const connector = await app.prisma.connector.findUnique({ where: { id } });
    if (!connector) return reply.status(404).send({ error: 'Connector not found' });
    // Basic test: verify connector exists and is configured
    return reply.send({
      ok: true,
      message: `Connector "${connector.name}" (${connector.type}) is configured. Live testing requires the connector to be running in the worker.`,
    });
  });
};
