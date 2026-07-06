import { createHmac } from 'node:crypto';
import { z } from 'zod';
import {
  BaseDestination,
  type DestinationDeliveryContext,
  type DeliveryResult,
} from '@uc-open-edge/destination-sdk';

export const WebhookDestinationConfigSchema = z.object({
  url: z.string().url(),
  method: z.enum(['POST', 'PUT']).default('POST'),
  headers: z.record(z.string()).default({}),
  /** HMAC signing secret. If set, a signature is added to the request headers. */
  signingSecret: z.string().optional(),
  /** Header name for the HMAC signature */
  signatureHeader: z.string().default('x-ucedge-signature-256'),
  /** HMAC algorithm */
  signatureAlgorithm: z.enum(['sha256', 'sha512']).default('sha256'),
  timeoutMs: z.number().int().positive().default(10000),
});

export type WebhookDestinationConfig = z.infer<typeof WebhookDestinationConfigSchema>;

export class WebhookDestination extends BaseDestination {
  readonly type = 'webhook';

  override validateConfig(config: unknown): string | null {
    const result = WebhookDestinationConfigSchema.safeParse(config);
    return result.success ? null : result.error.message;
  }

  override async deliver(
    event: Record<string, unknown>,
    ctx: DestinationDeliveryContext,
  ): Promise<DeliveryResult> {
    const config = WebhookDestinationConfigSchema.parse(ctx.config);
    const startMs = Date.now();
    const requestBody = JSON.stringify(event);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-UC-Open-Edge-Delivery': ctx.deliveryId,
      ...config.headers,
    };

    if (config.signingSecret) {
      const signature = createHmac(config.signatureAlgorithm, config.signingSecret)
        .update(requestBody)
        .digest('hex');
      headers[config.signatureHeader] = `${config.signatureAlgorithm}=${signature}`;
    }

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

      return {
        success: resp.ok,
        statusCode: resp.status,
        requestBody: event,
        responseBody,
        error: resp.ok ? undefined : `HTTP ${resp.status} ${resp.statusText}`,
        durationMs,
      };
    } catch (err) {
      return {
        success: false,
        requestBody: event,
        error: String(err),
        durationMs: Date.now() - startMs,
      };
    }
  }
}

export default function createDestination(): WebhookDestination {
  return new WebhookDestination();
}
