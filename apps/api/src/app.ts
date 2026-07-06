import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import type { AppConfig } from '@uc-open-edge/config';
import { getCorsOrigins } from '@uc-open-edge/config';
import type { Logger } from '@uc-open-edge/core';
import { prisma } from '@uc-open-edge/db';

import { authPlugin } from './plugins/auth.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { apiKeyRoutes } from './routes/api-keys.js';
import { sourceSystemRoutes } from './routes/source-systems.js';
import { connectorRoutes } from './routes/connectors.js';
import { destinationRoutes } from './routes/destinations.js';
import { eventRoutes } from './routes/events.js';
import { rawEventRoutes } from './routes/raw-events.js';
import { deliveryRoutes } from './routes/deliveries.js';
import { mappingRoutes } from './routes/mappings.js';
import { auditLogRoutes } from './routes/audit-logs.js';
import { healthRoutes } from './routes/health.js';
import { ingestRoutes } from './routes/ingest.js';

export interface AppOptions {
  config: AppConfig;
  logger: Logger;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function buildApp(opts: AppOptions) {
  const app = Fastify({
    loggerInstance: opts.logger as never,
    trustProxy: true,
  });

  // Security headers
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  });

  // CORS
  await app.register(fastifyCors, {
    origin: getCorsOrigins(opts.config),
    credentials: true,
  });

  // Cookies
  await app.register(fastifyCookie, {
    secret: opts.config.SESSION_SECRET,
  });

  // Attach prisma to every request
  app.decorate('prisma', prisma);
  app.decorate('config', opts.config);

  // Auth plugin (session verification, API key verification)
  await app.register(authPlugin);

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(apiKeyRoutes, { prefix: '/api/api-keys' });
  await app.register(sourceSystemRoutes, { prefix: '/api/source-systems' });
  await app.register(connectorRoutes, { prefix: '/api/connectors' });
  await app.register(destinationRoutes, { prefix: '/api/destinations' });
  await app.register(eventRoutes, { prefix: '/api/events' });
  await app.register(rawEventRoutes, { prefix: '/api/raw-events' });
  await app.register(deliveryRoutes, { prefix: '/api/delivery-attempts' });
  await app.register(mappingRoutes, { prefix: '/api/mappings' });
  await app.register(auditLogRoutes, { prefix: '/api/audit-logs' });
  await app.register(healthRoutes, { prefix: '/api/health' });
  await app.register(ingestRoutes, { prefix: '/api/ingest' });

  app.setErrorHandler((err, _req, reply) => {
    const e = err as Error & { statusCode?: number; code?: string };
    const statusCode = e.statusCode ?? 500;
    reply.status(statusCode).send({
      error: e.message,
      code: e.code ?? 'INTERNAL_ERROR',
    });
  });

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    prisma: typeof prisma;
    config: AppConfig;
  }
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
      name: string;
    };
    apiKeyId?: string;
    apiKeyScope?: string;
  }
}
