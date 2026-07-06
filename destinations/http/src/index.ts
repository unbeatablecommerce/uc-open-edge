import { z } from 'zod';
import {
  BaseDestination,
  type DestinationDeliveryContext,
  type DeliveryResult,
} from '@uc-open-edge/destination-sdk';

export const HttpDestinationConfigSchema = z.object({
  url: z.string().url(),
  method: z.enum(['POST', 'PUT', 'PATCH']).default('POST'),
  headers: z.record(z.string()).default({}),
  /** Authorization header value (e.g., "Bearer <token>") */
  authHeader: z.string().optional(),
  /** Request timeout in milliseconds */
  timeoutMs: z.number().int().positive().default(10000),
  /** Number of retries before marking as failed */
  maxRetries: z.number().int().nonnegative().default(5),
});

export type HttpDestinationConfig = z.infer<typeof HttpDestinationConfigSchema>;

export class HttpDestination extends BaseDestination {
  readonly type = 'http';

  override validateConfig(config: unknown): string | null {
    const result = HttpDestinationConfigSchema.safeParse(config);
    return result.success ? null : result.error.message;
  }

  override async deliver(
    event: Record<string, unknown>,
    ctx: DestinationDeliveryContext,
  ): Promise<DeliveryResult> {
    const config = HttpDestinationConfigSchema.parse(ctx.config);
    const startMs = Date.now();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-UC-Open-Edge-Delivery': ctx.deliveryId,
      ...config.headers,
    };
    if (config.authHeader) {
      headers['Authorization'] = config.authHeader;
    }

    const requestBody = JSON.stringify(event);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

      const resp = await fetch(config.url, {
        method: config.method,
        headers,
        body: requestBody,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const responseBody = await resp.text().catch(() => '');
      const durationMs = Date.now() - startMs;

      if (resp.ok) {
        return {
          success: true,
          statusCode: resp.status,
          requestBody: event,
          responseBody,
          durationMs,
        };
      } else {
        return {
          success: false,
          statusCode: resp.status,
          requestBody: event,
          responseBody,
          error: `HTTP ${resp.status} ${resp.statusText}`,
          durationMs,
        };
      }
    } catch (err) {
      return {
        success: false,
        requestBody: event,
        error: String(err),
        durationMs: Date.now() - startMs,
      };
    }
  }

  override async test(ctx: DestinationDeliveryContext): Promise<DeliveryResult> {
    const config = HttpDestinationConfigSchema.parse(ctx.config);
    const testPayload = {
      test: true,
      destination: ctx.destinationId,
      timestamp: new Date().toISOString(),
    };
    return this.deliver(testPayload, ctx).catch((err) => ({
      success: false,
      error: String(err),
    }));
  }
}

export default function createDestination(): HttpDestination {
  return new HttpDestination();
}
