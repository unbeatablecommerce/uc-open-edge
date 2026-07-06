import type { IDestination } from '@uc-open-edge/destination-sdk';

// Dynamic import to avoid circular deps — destinations are loaded at runtime
export function createHttpDestination(): IDestination {
  // Inline implementation to avoid workspace import issues in the worker bundle
  return {
    type: 'http',
    validateConfig: () => null,
    async deliver(event, ctx) {
      const config = ctx.config as {
        url: string;
        method?: string;
        headers?: Record<string, string>;
        authHeader?: string;
        timeoutMs?: number;
      };
      const startMs = Date.now();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-UC-Open-Edge-Delivery': ctx.deliveryId,
        ...(config.headers ?? {}),
      };
      if (config.authHeader) headers['Authorization'] = config.authHeader;

      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), config.timeoutMs ?? 10000);
        const resp = await fetch(config.url, {
          method: config.method ?? 'POST',
          headers,
          body: JSON.stringify(event),
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
