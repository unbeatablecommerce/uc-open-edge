import { z } from 'zod';
import { BaseConnector, type ConnectorRunContext } from '@uc-open-edge/connector-sdk';
import type { EventType } from '@uc-open-edge/schemas';
// mqtt is a real npm dependency
import mqtt from 'mqtt';

export const MqttTopicMappingSchema = z.object({
  /** MQTT topic to subscribe to */
  topic: z.string(),
  /** Event type to emit for messages on this topic */
  eventType: z.string() as z.ZodType<EventType>,
  /** Optional JSON path to event fields in the message payload */
  fieldMappings: z.record(z.string()).optional(),
});

export const MqttConnectorConfigSchema = z.object({
  brokerUrl: z
    .string()
    .url()
    .or(z.string().startsWith('mqtt://'))
    .or(z.string().startsWith('mqtts://')),
  username: z.string().optional(),
  password: z.string().optional(),
  clientId: z.string().optional(),
  keepalive: z.number().int().positive().default(60),
  /** Topic subscriptions with event type mappings */
  topics: z.array(MqttTopicMappingSchema).min(1),
  /** QoS level */
  qos: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(1),
});

export type MqttConnectorConfig = z.infer<typeof MqttConnectorConfigSchema>;

export class MqttConnector extends BaseConnector {
  readonly type = 'mqtt';
  private client?: ReturnType<typeof mqtt.connect>;

  override validateConfig(config: unknown): string | null {
    const result = MqttConnectorConfigSchema.safeParse(config);
    return result.success ? null : result.error.message;
  }

  override async start(ctx: ConnectorRunContext): Promise<void> {
    const config = MqttConnectorConfigSchema.parse(ctx.config);
    this.state = 'starting';

    const clientId = config.clientId ?? `ucedge-${Math.random().toString(16).slice(2, 8)}`;

    this.client = mqtt.connect(config.brokerUrl, {
      username: config.username,
      password: config.password,
      clientId,
      keepalive: config.keepalive,
      reconnectPeriod: 5000,
    });

    this.client.on('connect', async () => {
      this.state = 'running';
      ctx.logger.info('MQTT connected', { brokerUrl: config.brokerUrl });
      await ctx.reportHealth('active', `Connected to ${config.brokerUrl}`);

      for (const topicMapping of config.topics) {
        this.client!.subscribe(topicMapping.topic, { qos: config.qos }, (err) => {
          if (err) {
            ctx.logger.error('MQTT subscribe failed', {
              topic: topicMapping.topic,
              error: String(err),
            });
          } else {
            ctx.logger.info('MQTT subscribed', { topic: topicMapping.topic });
          }
        });
      }
    });

    this.client.on('message', async (topic, message) => {
      const topicMapping = config.topics.find((t) => mqttTopicMatches(t.topic, topic));
      if (!topicMapping) return;

      try {
        const raw = JSON.parse(message.toString());
        const event: Record<string, unknown> = {
          eventType: topicMapping.eventType,
          payload: raw,
          metadata: { mqttTopic: topic },
        };

        if (topicMapping.fieldMappings) {
          for (const [field, path] of Object.entries(topicMapping.fieldMappings)) {
            const value = (raw as Record<string, unknown>)[field];
            if (value !== undefined) setNestedValue(event, path, value);
          }
        }

        await ctx.submitEvent(event);
      } catch (err) {
        ctx.logger.error('MQTT message parse failed', { topic, error: String(err) });
      }
    });

    this.client.on('error', async (err) => {
      this.state = 'error';
      ctx.logger.error('MQTT error', { error: String(err) });
      await ctx.reportHealth('error', String(err));
    });

    this.client.on('disconnect', async () => {
      ctx.logger.warn('MQTT disconnected');
      await ctx.reportHealth('idle', 'Disconnected from broker');
    });
  }

  override async stop(): Promise<void> {
    this.client?.end(true);
    this.state = 'stopped';
  }
}

/** Simple MQTT topic wildcard matching (+ and #) */
function mqttTopicMatches(pattern: string, topic: string): boolean {
  const patternParts = pattern.split('/');
  const topicParts = topic.split('/');

  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i];
    if (p === '#') return true;
    if (p !== '+' && p !== topicParts[i]) return false;
  }

  return patternParts.length === topicParts.length;
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

export default function createConnector(): MqttConnector {
  return new MqttConnector();
}
