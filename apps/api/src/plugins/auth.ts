import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { hashToken, COOKIE_NAME, parseApiKeyPrefix, hashApiKey } from '@uc-open-edge/auth';

const authPlugin: FastifyPluginAsync = async (app) => {
  // Decorate with helpers
  app.decorateRequest('user', undefined);
  app.decorateRequest('apiKeyId', undefined);
  app.decorateRequest('apiKeyScope', undefined);

  /**
   * Verify session cookie. Attaches req.user if valid.
   * Does NOT reject the request — routes requiring auth must call requireSession.
   */
  app.addHook('onRequest', async (req: FastifyRequest) => {
    const cookieValue = req.cookies[COOKIE_NAME];
    if (!cookieValue) return;

    const tokenHash = hashToken(cookieValue);
    const session = await app.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (session && !session.revokedAt && session.expiresAt > new Date() && session.user.active) {
      req.user = {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        name: session.user.name,
      };
    }
  });
};

export { authPlugin };

/** Require a valid session. Returns 401 if not authenticated. */
export async function requireSession(req: FastifyRequest, reply: FastifyReply) {
  if (!req.user) {
    reply.status(401).send({ error: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' });
  }
}

/** Require a specific role. */
export function requireRole(...roles: string[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    await requireSession(req, reply);
    if (req.user && !roles.includes(req.user.role)) {
      reply
        .status(403)
        .send({ error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' });
    }
  };
}

/**
 * Verify an API key from Authorization header (Bearer ucedge_...) or X-API-Key header.
 * Attaches req.apiKeyId and req.apiKeyScope if valid.
 */
export async function verifyApiKey(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers['authorization'];
  const xApiKey = req.headers['x-api-key'];

  let rawKey: string | undefined;
  if (authHeader?.startsWith('Bearer ')) {
    rawKey = authHeader.slice(7);
  } else if (typeof xApiKey === 'string') {
    rawKey = xApiKey;
  }

  if (!rawKey) {
    return reply.status(401).send({ error: 'API key required', code: 'API_KEY_REQUIRED' });
  }

  const prefix = parseApiKeyPrefix(rawKey);
  if (!prefix) {
    return reply.status(401).send({ error: 'Invalid API key format', code: 'INVALID_API_KEY' });
  }

  const apiKey = await req.server.prisma.apiKey.findFirst({
    where: { keyPrefix: prefix, active: true },
  });

  if (!apiKey) {
    return reply.status(401).send({ error: 'Invalid or revoked API key', code: 'INVALID_API_KEY' });
  }

  const keyHash = hashApiKey(rawKey);
  if (keyHash !== apiKey.keyHash) {
    return reply.status(401).send({ error: 'Invalid or revoked API key', code: 'INVALID_API_KEY' });
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return reply.status(401).send({ error: 'API key expired', code: 'API_KEY_EXPIRED' });
  }

  req.apiKeyId = apiKey.id;
  req.apiKeyScope = apiKey.scope;

  // Update last used (non-blocking)
  req.server.prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => undefined);
}

export default fp(authPlugin, { name: 'auth' });
