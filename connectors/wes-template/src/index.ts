/**
 * WES Template Connector
 *
 * Warehouse Execution System (WES) template connector.
 * WES systems orchestrate picking, sorting, conveyor, and labor tasks.
 *
 * Common WES events to map:
 *   - Task created/started/completed/failed/cancelled
 *   - Equipment (conveyor, sorter, ASRS) status changes
 *   - Wave/batch release events
 *   - Labor assignment events
 */
import { z } from 'zod';
import { BaseConnector, type ConnectorRunContext } from '@uc-open-edge/connector-sdk';
import type { InboundEvent } from '@uc-open-edge/schemas';

export const WesConnectorConfigSchema = z.object({
  apiUrl: z.string().url(),
  apiKey: z.string().optional(),
  pollIntervalMs: z.number().int().positive().default(10000),
  siteRef: z.string().optional(),
});

export class WesTemplateConnector extends BaseConnector {
  readonly type = 'wes_template';
  private timer?: ReturnType<typeof setInterval>;

  override validateConfig(config: unknown): string | null {
    const result = WesConnectorConfigSchema.safeParse(config);
    return result.success ? null : result.error.message;
  }

  override async start(ctx: ConnectorRunContext): Promise<void> {
    const config = WesConnectorConfigSchema.parse(ctx.config);
    this.state = 'running';
    this.timer = setInterval(() => this.poll(ctx, config), config.pollIntervalMs);
    await this.poll(ctx, config);
  }

  private async poll(ctx: ConnectorRunContext, _config: WesConnectorConfigSchema): Promise<void> {
    ctx.logger.debug('WES poll (template stub)');
    await ctx.reportHealth('idle', 'Template stub: implement poll() for your WES');
  }

  override async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.state = 'stopped';
  }
}

type WesConnectorConfigSchema = z.infer<typeof WesConnectorConfigSchema>;

export function mapWesTaskToEvent(record: Record<string, unknown>): InboundEvent {
  const statusMap: Record<string, InboundEvent['eventType']> = {
    CREATED: 'task.created',
    STARTED: 'task.started',
    COMPLETED: 'task.completed',
    FAILED: 'task.failed',
    CANCELLED: 'task.cancelled',
  };
  const eventType = statusMap[String(record['status'] ?? '')] ?? 'task.created';

  return {
    eventType,
    externalEventId: String(record['taskId'] ?? ''),
    occurredAt: String(record['timestamp'] ?? new Date().toISOString()),
    taskRef: {
      externalTaskId: String(record['taskId'] ?? ''),
      type: String(record['taskType'] ?? ''),
    },
    locationRef: record['locationId']
      ? { externalLocationId: String(record['locationId']) }
      : undefined,
    equipmentRef: record['equipmentId']
      ? { externalEquipmentId: String(record['equipmentId']) }
      : undefined,
    payload: {
      status: record['status'],
      priority: record['priority'],
      completionCode: record['completionCode'],
    },
    metadata: { source: 'wes', raw: record },
  };
}

export default function createConnector(): WesTemplateConnector {
  return new WesTemplateConnector();
}
