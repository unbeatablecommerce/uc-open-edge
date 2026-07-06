import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireRole } from '../plugins/auth.js';
import { generateApiKey } from '@uc-open-edge/auth';

const CreateApiKeySchema = z.object({
  name: z.string().min(1),
  scope: z.string().default('ingest'),
  expiresAt: z.string().datetime().optional(),
});

export const apiKeyRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: requireRole('admin') }, async (_req, reply) => {
    const keys = await app.prisma.apiKey.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scope: true,
        createdAt: true,
        expiresAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ data: keys });
  });

  app.post('/', { preHandler: requireRole('admin') }, async (req, reply) => {
    const body = CreateApiKeySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid input' });
    }
    const { fullKey, keyPrefix, keyHash } = generateApiKey();
    const apiKey = await app.prisma.apiKey.create({
      data: {
        name: body.data.name,
        keyHash,
        keyPrefix,
        scope: body.data.scope,
        userId: req.user!.id,
        expiresAt: body.data.expiresAt ? new Date(body.data.expiresAt) : null,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scope: true,
        createdAt: true,
        expiresAt: true,
      },
    });
    await app.prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'api_key.created',
        resourceType: 'api_key',
        resourceId: apiKey.id,
      },
    });
    // Return full key ONCE — never stored in plain text
    return reply.status(201).send({ data: { ...apiKey, key: fullKey } });
  });

  app.delete('/:id', { preHandler: requireRole('admin') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await app.prisma.apiKey.update({
      where: { id },
      data: { active: false, revokedAt: new Date() },
    });
    await app.prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'api_key.revoked',
        resourceType: 'api_key',
        resourceId: id,
      },
    });
    return reply.send({ ok: true });
  });

  app.post('/:id/rotate', { preHandler: requireRole('admin') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const old = await app.prisma.apiKey.findUnique({ where: { id } });
    if (!old) return reply.status(404).send({ error: 'API key not found' });

    await app.prisma.apiKey.update({
      where: { id },
      data: { active: false, revokedAt: new Date() },
    });
    const { fullKey, keyPrefix, keyHash } = generateApiKey();
    const newKey = await app.prisma.apiKey.create({
      data: {
        name: old.name,
        keyHash,
        keyPrefix,
        scope: old.scope,
        userId: old.userId,
        expiresAt: old.expiresAt,
      },
      select: { id: true, name: true, keyPrefix: true, scope: true, createdAt: true },
    });
    await app.prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'api_key.rotated',
        resourceType: 'api_key',
        resourceId: newKey.id,
      },
    });
    return reply.send({ data: { ...newKey, key: fullKey } });
  });
};
