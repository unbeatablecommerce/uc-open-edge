import type { FastifyPluginAsync } from 'fastify';
import { verifyApiKey } from '../plugins/auth.js';
import { ingestEvent } from '@uc-open-edge/normalizer';

export const ingestRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/ingest/:connectorKey — generic ingest
  app.post('/:connectorKey', { preHandler: verifyApiKey }, async (req, reply) => {
    const { connectorKey } = req.params as { connectorKey: string };
    return handleIngest(app, req, reply, connectorKey);
  });

  // POST /api/ingest/webhook/:connectorKey — explicit webhook alias
  app.post('/webhook/:connectorKey', { preHandler: verifyApiKey }, async (req, reply) => {
    const { connectorKey } = req.params as { connectorKey: string };
    return handleIngest(app, req, reply, connectorKey);
  });
};

async function handleIngest(
  app: ReturnType<typeof import('fastify').default> & {
    prisma: import('@uc-open-edge/db').PrismaClient;
  },
  req: import('fastify').FastifyRequest,
  reply: import('fastify').FastifyReply,
  connectorKey: string,
) {
  // Look up connector by name (key)
  const connector = await app.prisma.connector.findUnique({
    where: { name: connectorKey },
  });

  if (!connector) {
    return reply.status(404).send({ error: `Connector '${connectorKey}' not found` });
  }

  if (!connector.enabled) {
    return reply.status(409).send({ error: `Connector '${connectorKey}' is disabled` });
  }

  const headers = req.headers as Record<string, string>;
  const result = await ingestEvent(req.body, {
    prisma: app.prisma,
    connectorId: connector.id,
    sourceSystemId: connector.sourceSystemId ?? undefined,
    headers,
  });

  const statusCode = result.success ? (result.isDuplicate ? 200 : 201) : 422;
  return reply.status(statusCode).send(result);
}
