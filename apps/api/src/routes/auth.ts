import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  verifyPassword,
  generateSessionToken,
  hashToken,
  COOKIE_NAME,
  COOKIE_OPTIONS,
} from '@uc-open-edge/auth';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/login', async (req, reply) => {
    const body = LoginSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid input' });
    }

    const user = await app.prisma.user.findUnique({
      where: { email: body.data.email },
    });

    if (!user || !user.active) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const valid = await verifyPassword(user.passwordHash, body.data.password);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const { token, tokenHash, expiresAt } = generateSessionToken();
    await app.prisma.session.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    await app.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await app.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'login',
        resourceType: 'user',
        resourceId: user.id,
      },
    });

    reply.setCookie(COOKIE_NAME, token, {
      ...COOKIE_OPTIONS,
      expires: expiresAt,
    });

    return reply.send({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  });

  app.post('/logout', async (req, reply) => {
    const cookieValue = req.cookies[COOKIE_NAME];
    if (cookieValue) {
      const tokenHash = hashToken(cookieValue);
      await app.prisma.session.updateMany({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });
      if (req.user) {
        await app.prisma.auditLog.create({
          data: {
            actorUserId: req.user.id,
            action: 'logout',
            resourceType: 'user',
            resourceId: req.user.id,
          },
        });
      }
    }
    reply.clearCookie(COOKIE_NAME, { path: '/' });
    return reply.send({ ok: true });
  });

  app.get('/me', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Not authenticated' });
    return reply.send({ user: req.user });
  });
};
