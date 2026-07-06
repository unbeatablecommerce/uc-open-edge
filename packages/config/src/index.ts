import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters')
    .default('REPLACE_THIS_WITH_SECURE_SESSION_SECRET_FOR_LOCAL_ONLY'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  ADMIN_PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  FILE_DROP_ROOT: z.string().default('/var/uc-open-edge/file-drop'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),
  MQTT_BROKER_URL: z.string().optional(),
  MQTT_USERNAME: z.string().optional(),
  MQTT_PASSWORD: z.string().optional(),
});

export type AppConfig = z.infer<typeof envSchema>;

let _config: AppConfig | null = null;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const errors = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Configuration validation failed:\n${errors}`);
  }
  _config = result.data;
  return _config;
}

export function getConfig(): AppConfig {
  if (!_config) {
    return loadConfig();
  }
  return _config;
}

export function getCorsOrigins(config: AppConfig): string[] {
  return config.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}
