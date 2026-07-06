import { z } from 'zod';
import {
  BaseDestination,
  type DestinationDeliveryContext,
  type DeliveryResult,
} from '@uc-open-edge/destination-sdk';
import mqtt from 'mqtt';

export const MqttDestinationConfigSchema = z.object({
  brokerUrl: z.string(),
  username: z.string().optional(),
  password: z.string().optional(),
  clientId: z.string().optional(),
  /** Topic to publish events to. Supports {eventType} and {domain} placeholders. */
  topicTemplate: z.string().default('ucedge/events/{domain}/{eventType}'),
  qos: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(1),
  retain: z.boolean().default(false),
  connectTimeoutMs: z.number().int().positive().default(5000),
});

export type MqttDestinationConfig = z.infer<typeof MqttDestinationConfigSchema>;

export class MqttDestination extends BaseDestination {
  readonly type = 'mqtt';

  override validateConfig(config: unknown): string | null {
    const result = MqttDestinationConfigSchema.safeParse(config);
    return result.success ? null : result.error.message;
  }

  override async deliver(
    event: Record<string, unknown>,
    ctx: DestinationDeliveryContext,
  ): Promise<DeliveryResult> {
    const config = MqttDestinationConfigSchema.parse(ctx.config);
    const startMs = Date.now();

    const topic = config.topicTemplate
      .replace('{domain}', String(event['domain'] ?? 'unknown'))
      .replace('{eventType}', String(event['eventType'] ?? 'unknown').replace(/\./g, '/'));

    return new Promise((resolve) => {
      const clientId = config.clientId ?? `ucedge-dest-${Math.random().toString(16).slice(2, 8)}`;
      const client = mqtt.connect(config.brokerUrl, {
        username: config.username,
        password: config.password,
        clientId,
        connectTimeout: config.connectTimeoutMs,
      });

      client.on('connect', () => {
        const payload = JSON.stringify(event);
        client.publish(topic, payload, { qos: config.qos, retain: config.retain }, (err) => {
          client.end(true);
          if (err) {
            resolve({ success: false, error: String(err), durationMs: Date.now() - startMs });
          } else {
            resolve({
              success: true,
              requestBody: event,
              responseBody: topic,
              durationMs: Date.now() - startMs,
            });
          }
        });
      });

      client.on('error', (err) => {
        client.end(true);
        resolve({ success: false, error: String(err), durationMs: Date.now() - startMs });
      });
    });
  }
}

export default function createDestination(): MqttDestination {
  return new MqttDestination();
}
