import pino from 'pino';

export type Logger = pino.Logger;

let _logger: pino.Logger | null = null;

export function createLogger(options?: { level?: string; name?: string }): pino.Logger {
  return pino({
    level: options?.level ?? process.env['LOG_LEVEL'] ?? 'info',
    name: options?.name ?? 'uc-open-edge',
    ...(process.env['NODE_ENV'] !== 'production' && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    }),
  });
}

export function getLogger(): pino.Logger {
  if (!_logger) {
    _logger = createLogger();
  }
  return _logger;
}

export function setLogger(logger: pino.Logger): void {
  _logger = logger;
}
