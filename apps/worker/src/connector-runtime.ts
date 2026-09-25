import type { PrismaClient } from '@uc-open-edge/db';
import type { Logger } from '@uc-open-edge/core';
import type { IConnector, ConnectorRunContext } from '@uc-open-edge/connector-sdk';
import { ingestEvent } from '@uc-open-edge/normalizer';

const HEALTH_CHECK_INTERVAL_MS = 60000;
const CONNECTOR_RELOAD_INTERVAL_MS = 30000;

export function startConnectorRuntime(prisma: PrismaClient, logger: Logger) {
  const runningConnectors = new Map<string, IConnector>();

  logger.info('Connector runtime starting');

  const reload = setInterval(
    () => syncConnectors(prisma, logger, runningConnectors),
    CONNECTOR_RELOAD_INTERVAL_MS,
  );
  const healthCheck = setInterval(
    () => checkConnectorHealth(prisma, logger, runningConnectors),
    HEALTH_CHECK_INTERVAL_MS,
  );

  syncConnectors(prisma, logger, runningConnectors).catch((err) =>
    logger.error({ err }, 'Initial connector sync failed'),
  );

  return async () => {
    clearInterval(reload);
    clearInterval(healthCheck);
    for (const [id, connector] of runningConnectors) {
      await connector.stop().catch((err) => logger.error({ err, id }, 'Error stopping connector'));
    }
  };
}

async function syncConnectors(
  prisma: PrismaClient,
  logger: Logger,
  running: Map<string, IConnector>,
) {
  const dbConnectors = await prisma.connector.findMany({ where: { enabled: true } });

  // Stop connectors that were disabled or deleted
  for (const [id, connector] of running) {
    const dbConnector = dbConnectors.find((c) => c.id === id);
    if (!dbConnector || !dbConnector.enabled) {
      logger.info({ id }, 'Stopping connector');
      await connector.stop().catch(() => undefined);
      running.delete(id);
    }
  }

  // Start new connectors
  for (const dbConnector of dbConnectors) {
    if (running.has(dbConnector.id)) continue;
    if (dbConnector.type === 'webhook') {
      // Webhook connectors are handled by the API server, not the worker
      continue;
    }

    const connector = await loadConnector(dbConnector.type);
    if (!connector) {
      logger.warn({ type: dbConnector.type, id: dbConnector.id }, 'Unknown connector type');
      continue;
    }

    const ctx: ConnectorRunContext = {
      connectorId: dbConnector.id,
      sourceSystemId: dbConnector.sourceSystemId,
      config: dbConnector.config as Record<string, unknown>,
      submitEvent: async (payload) => {
        await ingestEvent(payload, {
          prisma,
          connectorId: dbConnector.id,
          sourceSystemId: dbConnector.sourceSystemId,
        }).catch((err) => logger.error({ err }, 'submitEvent failed'));
      },
      reportHealth: async (status, message) => {
        await prisma.connectorHealth
          .create({
            data: { connectorId: dbConnector.id, status, message, checkedAt: new Date() },
          })
          .catch(() => undefined);
        await prisma.connector
          .update({
            where: { id: dbConnector.id },
            data: {
              status,
              lastSeenAt: new Date(),
              ...(status === 'error'
                ? { lastErrorAt: new Date(), lastError: message }
                : { lastSuccessAt: new Date() }),
            },
          })
          .catch(() => undefined);
      },
      logger: {
        info: (msg, meta) => logger.info({ connectorId: dbConnector.id, ...meta }, msg),
        warn: (msg, meta) => logger.warn({ connectorId: dbConnector.id, ...meta }, msg),
        error: (msg, meta) => logger.error({ connectorId: dbConnector.id, ...meta }, msg),
        debug: (msg, meta) => logger.debug({ connectorId: dbConnector.id, ...meta }, msg),
      },
    };

    logger.info(
      { id: dbConnector.id, type: dbConnector.type, name: dbConnector.name },
      'Starting connector',
    );
    connector.start(ctx).catch((err) => {
      logger.error({ err, id: dbConnector.id }, 'Connector start failed');
    });
    running.set(dbConnector.id, connector);
  }
}

async function checkConnectorHealth(
  prisma: PrismaClient,
  logger: Logger,
  running: Map<string, IConnector>,
) {
  for (const [id, connector] of running) {
    const state = connector.getState();
    const status = state === 'running' ? 'active' : state === 'error' ? 'error' : 'idle';
    await prisma.connectorHealth
      .create({
        data: {
          connectorId: id,
          status,
          message: `Worker health check: state=${state}`,
          checkedAt: new Date(),
        },
      })
      .catch(() => undefined);
    logger.debug({ id, state }, 'Connector health check');
  }
}

async function loadConnector(type: string): Promise<IConnector | null> {
  switch (type) {
    case 'file_drop': {
      const { FileDropConnector } = await import('@uc-open-edge/connector-file-drop');
      return new FileDropConnector();
    }
    case 'csv': {
      const { CsvConnector } = await import('@uc-open-edge/connector-csv');
      return new CsvConnector();
    }
    case 'rest_poll': {
      const { RestPollConnector } = await import('@uc-open-edge/connector-rest-poll');
      return new RestPollConnector();
    }
    case 'mqtt': {
      const { MqttConnector } = await import('@uc-open-edge/connector-mqtt');
      return new MqttConnector();
    }
    case 'opcua': {
      const { OpcUaConnector } = await import('@uc-open-edge/connector-opcua');
      return new OpcUaConnector();
    }
    case 'wms_template': {
      const { WmsTemplateConnector } = await import('@uc-open-edge/connector-wms-template');
      return new WmsTemplateConnector();
    }
    case 'wes_template': {
      const { WesTemplateConnector } = await import('@uc-open-edge/connector-wes-template');
      return new WesTemplateConnector();
    }
    case 'amr_template': {
      const { AmrTemplateConnector } = await import('@uc-open-edge/connector-amr-template');
      return new AmrTemplateConnector();
    }
    case 'manufacturing_template': {
      const { ManufacturingTemplateConnector } =
        await import('@uc-open-edge/connector-manufacturing-template');
      return new ManufacturingTemplateConnector();
    }
    default:
      return null;
  }
}
