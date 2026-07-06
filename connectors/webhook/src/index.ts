/**
 * Webhook Connector
 *
 * The webhook connector exposes an HTTP endpoint in the API server.
 * Inbound events are POSTed to: POST /api/ingest/webhook/:connectorKey
 *
 * This package provides the config schema and documentation.
 * The actual HTTP handler lives in apps/api/src/routes/ingest.ts.
 *
 * Config schema (stored in Connector.config JSON field):
 */
import { z } from 'zod';
import { BaseConnector, type ConnectorRunContext } from '@uc-open-edge/connector-sdk';

export const WebhookConnectorConfigSchema = z.object({
  /** Path segment used in the ingest URL: /api/ingest/webhook/<connectorKey> */
  connectorKey: z.string().optional(),
  /** Optional: validate that payload contains these top-level keys */
  requiredFields: z.array(z.string()).optional(),
  /** Optional: HMAC signature verification (key stored in config) */
  signingSecret: z.string().optional(),
  /** Header to read the signature from */
  signatureHeader: z.string().default('x-webhook-signature'),
});

export type WebhookConnectorConfig = z.infer<typeof WebhookConnectorConfigSchema>;

export class WebhookConnector extends BaseConnector {
  readonly type = 'webhook';

  override validateConfig(config: unknown): string | null {
    const result = WebhookConnectorConfigSchema.safeParse(config);
    return result.success ? null : result.error.message;
  }

  override async start(_ctx: ConnectorRunContext): Promise<void> {
    // The webhook connector does not poll — it is handled by the API server.
    // The worker calls start() only to confirm the connector is "running".
    this.state = 'running';
    _ctx.logger.info('Webhook connector active (handled by API server)');
    await _ctx.reportHealth('active', 'Webhook endpoint is active in API server');
  }

  override async stop(): Promise<void> {
    this.state = 'stopped';
  }
}

export default function createConnector(): WebhookConnector {
  return new WebhookConnector();
}
