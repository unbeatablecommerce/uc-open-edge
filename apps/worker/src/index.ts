import { loadConfig } from '@uc-open-edge/config';
import { createLogger } from '@uc-open-edge/core';
import { prisma } from '@uc-open-edge/db';
import { startDeliveryWorker } from './delivery.js';
import { startConnectorRuntime } from './connector-runtime.js';

const config = loadConfig();
const logger = createLogger({ level: config.LOG_LEVEL, name: 'worker' });

logger.info('UC Open Edge Worker starting');

const stopDelivery = startDeliveryWorker(prisma, logger);
const stopConnectors = startConnectorRuntime(prisma, logger);

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down worker gracefully');
  stopDelivery();
  await stopConnectors();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down worker gracefully');
  stopDelivery();
  await stopConnectors();
  await prisma.$disconnect();
  process.exit(0);
});

logger.info('UC Open Edge Worker running');
