import type { IDestination } from '@uc-open-edge/destination-sdk';

export function createMqttDestination(): IDestination {
  return {
    type: 'mqtt',
    validateConfig: () => null,
    async deliver(event, ctx) {
      const config = ctx.config as {
        brokerUrl: string;
        username?: string;
        password?: string;
        clientId?: string;
        topicTemplate?: string;
        qos?: 0 | 1 | 2;
        retain?: boolean;
        connectTimeoutMs?: number;
      };
      const startMs = Date.now();
      const topic = (config.topicTemplate ?? 'ucedge/events/{domain}/{eventType}')
        .replace('{domain}', String((event as Record<string, unknown>)['domain'] ?? 'unknown'))
        .replace(
          '{eventType}',
          String((event as Record<string, unknown>)['eventType'] ?? 'unknown').replace(/\./g, '/'),
        );
      try {
        const { default: mqtt } = await import('mqtt');
        return new Promise((resolve) => {
          const client = mqtt.connect(config.brokerUrl, {
            username: config.username,
            password: config.password,
            clientId: config.clientId ?? `ucedge-dest-${Math.random().toString(16).slice(2, 8)}`,
            connectTimeout: config.connectTimeoutMs ?? 5000,
          });
          client.on('connect', () => {
            client.publish(
              topic,
              JSON.stringify(event),
              { qos: config.qos ?? 1, retain: config.retain ?? false },
              (err) => {
                client.end(true);
                if (err)
                  resolve({ success: false, error: String(err), durationMs: Date.now() - startMs });
                else
                  resolve({
                    success: true,
                    requestBody: event,
                    responseBody: topic,
                    durationMs: Date.now() - startMs,
                  });
              },
            );
          });
          client.on('error', (err) => {
            client.end(true);
            resolve({ success: false, error: String(err), durationMs: Date.now() - startMs });
          });
        });
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
