import { loadConfig } from '@uc-open-edge/config';
import { createLogger } from '@uc-open-edge/core';
import { buildApp } from './app.js';

const config = loadConfig();
const logger = createLogger({ level: config.LOG_LEVEL, name: 'api' });

const app = await buildApp({ config, logger });

app.listen({ port: config.API_PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    logger.error(err, 'Failed to start API server');
    process.exit(1);
  }
  logger.info(`UC Open Edge API running at ${address}`);
});
