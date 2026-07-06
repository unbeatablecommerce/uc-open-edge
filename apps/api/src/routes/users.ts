import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireRole } from '../plugins/auth.js';
import { hashPassword } from '@uc-open-edge/auth';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(12),
  role: z.enum(['admin', 'operator', 'viewer']).default('viewer'),
});

const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['admin', 'operator', 'viewer']).optional(),
  active: z.boolean().optional(),
  password: z.string().min(12).optional(),
});

export const userRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: requireRole('admin') }, async (req, reply) => {
    const users = await app.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return reply.send({ data: users });
  });

  app.post('/', { preHandler: requireRole('admin') }, async (req, reply) => {
    const body = CreateUserSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid input', details: body.error.issues });
    }
    const passwordHash = await hashPassword(body.data.password);
    const user = await app.prisma.user.create({
      data: { email: body.data.email, name: body.data.name, passwordHash, role: body.data.role },
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    });
    await app.prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'user.created',
        resourceType: 'user',
        resourceId: user.id,
      },
    });
    return reply.status(201).send({ data: user });
  });

  app.patch('/:id', { preHandler: requireRole('admin') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = UpdateUserSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid input' });
    }
    const updateData: Record<string, unknown> = {};
    if (body.data.name !== undefined) updateData['name'] = body.data.name;
    if (body.data.role !== undefined) updateData['role'] = body.data.role;
    if (body.data.active !== undefined) updateData['active'] = body.data.active;
    if (body.data.password !== undefined) {
      updateData['passwordHash'] = await hashPassword(body.data.password);
    }
    const user = await app.prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, active: true },
    });
    await app.prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'user.updated',
        resourceType: 'user',
        resourceId: id,
      },
    });
    return reply.send({ data: user });
  });

  app.delete('/:id', { preHandler: requireRole('admin') }, async (req, reply) => {
    const { id } = req.params as { id: string };
    if (id === req.user!.id) {
      return reply.status(400).send({ error: 'Cannot deactivate yourself' });
    }
    await app.prisma.user.update({ where: { id }, data: { active: false } });
    await app.prisma.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: 'user.deactivated',
        resourceType: 'user',
        resourceId: id,
      },
    });
    return reply.send({ ok: true });
  });
};
