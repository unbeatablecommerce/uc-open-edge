import { z } from 'zod';
import { BaseConnector, type ConnectorRunContext } from '@uc-open-edge/connector-sdk';
import type { EventType } from '@uc-open-edge/schemas';

export const RestPollConfigSchema = z.object({
  /** The URL to poll */
  url: z.string().url(),
  /** HTTP method (default GET) */
  method: z.enum(['GET', 'POST']).default('GET'),
  /** Request headers (e.g., Authorization, X-API-Key) */
  headers: z.record(z.string()).default({}),
  /** For POST requests: request body */
  body: z.record(z.unknown()).optional(),
  /** Poll interval in milliseconds */
  pollIntervalMs: z.number().int().positive().default(30000),
  /** JSON path to the array of event rows in the response (e.g., "data.items") */
  responsePath: z.string().optional(),
  /** Event type to emit for each row */
  eventType: z.string() as z.ZodType<EventType>,
  /** Column/field mappings from response row to normalized event fields */
  fieldMappings: z.record(z.string()).default({}),
  /** Field in response row to use as externalEventId */
  externalEventIdField: z.string().optional(),
  /** Field in response row to use as occurredAt */
  occurredAtField: z.string().optional(),
});

export type RestPollConfig = z.infer<typeof RestPollConfigSchema>;

export class RestPollConnector extends BaseConnector {
  readonly type = 'rest_poll';
  private timer?: ReturnType<typeof setInterval>;

  override validateConfig(config: unknown): string | null {
    const result = RestPollConfigSchema.safeParse(config);
    return result.success ? null : result.error.message;
  }

  override async start(ctx: ConnectorRunContext): Promise<void> {
    const config = RestPollConfigSchema.parse(ctx.config);
    this.state = 'running';

    ctx.logger.info('REST poll connector started', {
      url: config.url,
      intervalMs: config.pollIntervalMs,
    });
    await ctx.reportHealth('active', `Polling ${config.url}`);

    this.timer = setInterval(() => this.poll(ctx, config), config.pollIntervalMs);
    await this.poll(ctx, config);
  }

  private async poll(ctx: ConnectorRunContext, config: RestPollConfig) {
    try {
      const resp = await fetch(config.url, {
        method: config.method,
        headers: { 'Content-Type': 'application/json', ...config.headers },
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      }

      const json = await resp.json();
      const rows = config.responsePath
        ? getNestedValue(json as Record<string, unknown>, config.responsePath)
        : json;

      const items = Array.isArray(rows) ? rows : [rows];

      for (const row of items) {
        const event: Record<string, unknown> = {
          eventType: config.eventType,
        };

        if (config.externalEventIdField) {
          event['externalEventId'] = (row as Record<string, unknown>)[config.externalEventIdField];
        }
        if (config.occurredAtField) {
          event['occurredAt'] = (row as Record<string, unknown>)[config.occurredAtField];
        }

        for (const [field, path] of Object.entries(config.fieldMappings)) {
          const value = (row as Record<string, unknown>)[field];
          if (value !== undefined) setNestedValue(event, path, value);
        }

        // Pass remaining fields as payload
        event['payload'] = row;

        await ctx.submitEvent(event);
      }

      await ctx.reportHealth('active', `Last poll: ${items.length} row(s) from ${config.url}`);
    } catch (err) {
      ctx.logger.error('REST poll failed', { error: String(err) });
      await ctx.reportHealth('error', String(err));
    }
  }

  override async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.state = 'stopped';
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((o: unknown, k) => {
    if (typeof o === 'object' && o !== null) return (o as Record<string, unknown>)[k];
    return undefined;
  }, obj);
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    if (typeof current[part] !== 'object') current[part] = {};
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]!] = value;
}

export default function createConnector(): RestPollConnector {
  return new RestPollConnector();
}
