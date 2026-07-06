/**
 * Manufacturing Template Connector
 *
 * Template connector for manufacturing execution systems (MES) and production control.
 *
 * Common manufacturing events to map:
 *   - Work order started/completed
 *   - Production completed (quantity, scrap)
 *   - Quality inspection completed
 *   - Equipment alarms raised/cleared
 *   - Maintenance issues reported
 *   - Shift changes
 */
import { z } from 'zod';
import { BaseConnector, type ConnectorRunContext } from '@uc-open-edge/connector-sdk';
import type { InboundEvent } from '@uc-open-edge/schemas';

export const ManufacturingConnectorConfigSchema = z.object({
  mesApiUrl: z.string().url(),
  apiKey: z.string().optional(),
  pollIntervalMs: z.number().int().positive().default(15000),
  siteRef: z.string().optional(),
  productionLineRef: z.string().optional(),
});

export class ManufacturingTemplateConnector extends BaseConnector {
  readonly type = 'manufacturing_template';
  private timer?: ReturnType<typeof setInterval>;

  override validateConfig(config: unknown): string | null {
    const result = ManufacturingConnectorConfigSchema.safeParse(config);
    return result.success ? null : result.error.message;
  }

  override async start(ctx: ConnectorRunContext): Promise<void> {
    const config = ManufacturingConnectorConfigSchema.parse(ctx.config);
    this.state = 'running';
    this.timer = setInterval(() => this.poll(ctx, config), config.pollIntervalMs);
    await this.poll(ctx, config);
  }

  private async poll(
    ctx: ConnectorRunContext,
    _config: z.infer<typeof ManufacturingConnectorConfigSchema>,
  ): Promise<void> {
    ctx.logger.debug('Manufacturing MES poll (template stub)');
    await ctx.reportHealth('idle', 'Template stub: implement poll() for your MES');
  }

  override async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.state = 'stopped';
  }
}

export function mapProductionRecordToEvent(record: Record<string, unknown>): InboundEvent {
  return {
    eventType: 'manufacturing.production.completed',
    externalEventId: String(record['productionId'] ?? ''),
    occurredAt: String(record['completedAt'] ?? new Date().toISOString()),
    workOrderRef: { externalWorkOrderId: String(record['workOrderId'] ?? '') },
    itemRef: { externalItemId: String(record['itemCode'] ?? record['productCode'] ?? '') },
    equipmentRef: record['lineId'] ? { externalEquipmentId: String(record['lineId']) } : undefined,
    quantity: Number(record['goodQuantity'] ?? record['quantity'] ?? 0),
    unitOfMeasure: String(record['uom'] ?? 'EA'),
    payload: {
      scrapQuantity: record['scrapQuantity'],
      shift: record['shift'],
      operator: record['operator'],
      cycleTime: record['cycleTime'],
    },
    metadata: { source: 'mes', raw: record },
  };
}

export default function createConnector(): ManufacturingTemplateConnector {
  return new ManufacturingTemplateConnector();
}
