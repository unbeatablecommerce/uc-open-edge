/**
 * WMS Template Connector
 *
 * This is an example adapter template showing how to build a connector for
 * a Warehouse Management System (WMS).
 *
 * Extend this template to connect to your specific WMS by:
 *   1. Implementing the API client for your WMS (REST, SOAP, database polling, etc.)
 *   2. Mapping WMS-specific event fields to the normalized event schema
 *   3. Registering the connector in your worker configuration
 *
 * Common WMS events to map:
 *   - Inventory movements (picks, putaways, transfers, cycle counts)
 *   - Receipt confirmations
 *   - Shipment departures
 *   - Exception flags
 *   - Location status changes
 */
import { z } from 'zod';
import { BaseConnector, type ConnectorRunContext } from '@uc-open-edge/connector-sdk';
import type { InboundEvent } from '@uc-open-edge/schemas';

export const WmsConnectorConfigSchema = z.object({
  /** Base URL of the WMS API */
  apiUrl: z.string().url(),
  /** API key or token for WMS authentication */
  apiKey: z.string().optional(),
  /** Poll interval (ms) */
  pollIntervalMs: z.number().int().positive().default(15000),
  /** Site identifier */
  siteRef: z.string().optional(),
});

export type WmsConnectorConfig = z.infer<typeof WmsConnectorConfigSchema>;

export class WmsTemplateConnector extends BaseConnector {
  readonly type = 'wms_template';
  private timer?: ReturnType<typeof setInterval>;

  override validateConfig(config: unknown): string | null {
    const result = WmsConnectorConfigSchema.safeParse(config);
    return result.success ? null : result.error.message;
  }

  override async start(ctx: ConnectorRunContext): Promise<void> {
    const config = WmsConnectorConfigSchema.parse(ctx.config);
    this.state = 'running';

    ctx.logger.info('WMS template connector started', { apiUrl: config.apiUrl });
    await ctx.reportHealth('active', 'WMS connector running (template)');

    this.timer = setInterval(() => this.poll(ctx, config), config.pollIntervalMs);
    await this.poll(ctx, config);
  }

  private async poll(ctx: ConnectorRunContext, config: WmsConnectorConfig): Promise<void> {
    try {
      /**
       * STUB: Replace this section with real WMS API calls.
       *
       * Example pattern:
       *   const response = await fetch(`${config.apiUrl}/api/movements/since/${lastPollTime}`, {
       *     headers: { 'Authorization': `Bearer ${config.apiKey}` }
       *   });
       *   const { movements } = await response.json();
       *   for (const movement of movements) {
       *     await ctx.submitEvent(mapWmsMovementToEvent(movement, config));
       *   }
       */
      ctx.logger.debug('WMS poll (template stub — no real API call)');
      await ctx.reportHealth('idle', 'Template stub: implement poll() for your WMS');
    } catch (err) {
      ctx.logger.error('WMS poll failed', { error: String(err) });
      await ctx.reportHealth('error', String(err));
    }
  }

  override async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.state = 'stopped';
  }
}

/**
 * Example: Map a WMS movement record to a normalized inventory event.
 * Replace field names with those from your actual WMS API response.
 */
export function mapWmsMovementToEvent(
  record: Record<string, unknown>,
  config: WmsConnectorConfig,
): InboundEvent {
  return {
    eventType: 'inventory.movement.reported',
    externalEventId: String(record['movementId'] ?? record['id'] ?? ''),
    occurredAt: String(record['completedAt'] ?? record['timestamp'] ?? new Date().toISOString()),
    skuRef: { externalSku: String(record['sku'] ?? record['itemCode'] ?? '') },
    fromLocationRef: {
      externalLocationId: String(record['fromLocation'] ?? record['fromLoc'] ?? ''),
    },
    toLocationRef: { externalLocationId: String(record['toLocation'] ?? record['toLoc'] ?? '') },
    quantity: Number(record['quantity'] ?? record['qty'] ?? 0),
    unitOfMeasure: String(record['uom'] ?? 'EA'),
    siteRef: config.siteRef ? { siteName: config.siteRef } : undefined,
    metadata: { source: 'wms', raw: record },
  };
}

export default function createConnector(): WmsTemplateConnector {
  return new WmsTemplateConnector();
}
