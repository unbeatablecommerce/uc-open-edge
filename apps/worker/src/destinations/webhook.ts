import { createHmac } from 'node:crypto';
import type { IDestination } from '@uc-open-edge/destination-sdk';

export function createWebhookDestination(): IDestination {
  return {
    type: 'webhook',
    validateConfig: () => null,
    async deliver(event, ctx) {
      const config = ctx.config as {
        url: string;
        method?: string;
        headers?: Record<string, string>;
        signingSecret?: string;
        signatureHeader?: string;
        signatureAlgorithm?: string;
        timeoutMs?: number;
      };
      const startMs = Date.now();
      const body = JSON.stringify(event);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-UC-Open-Edge-Delivery': ctx.deliveryId,
        ...(config.headers ?? {}),
      };
      if (config.signingSecret) {
        const algo = config.signatureAlgorithm ?? 'sha256';
        const sig = createHmac(algo, config.signingSecret).update(body).digest('hex');
        headers[config.signatureHeader ?? 'x-ucedge-signature-256'] = `${algo}=${sig}`;
      }
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), config.timeoutMs ?? 10000);
        const resp = await fetch(config.url, {
          method: config.method ?? 'POST',
          headers,
          body,
          signal: controller.signal,
        });
        clearTimeout(tid);
        const responseBody = await resp.text().catch(() => '');
        return {
          success: resp.ok,
          statusCode: resp.status,
          requestBody: event,
          responseBody,
          durationMs: Date.now() - startMs,
          error: resp.ok ? undefined : `HTTP ${resp.status}`,
        };
      } catch (err) {
        return {
          success: false,
          requestBody: event,
          error: String(err),
          durationMs: Date.now() - startMs,
        };
      }
    },
    async test(ctx) {
      return this.deliver({ test: true }, ctx);
    },
  };
}
