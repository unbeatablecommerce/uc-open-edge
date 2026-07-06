/**
 * AMR/Fleet Manager Template Connector
 *
 * Autonomous Mobile Robot (AMR) fleet manager template connector.
 * Connects to fleet management systems (FMS) like SEER, MiR, Fetch, 6 River, etc.
 *
 * Common AMR/FMS events to map:
 *   - Mission started/completed/failed
 *   - Robot status changes (idle, charging, error, moving)
 *   - Container/tote transport events
 *   - Destination reached events
 *   - Fleet health heartbeats
 */
import { z } from 'zod';
import { BaseConnector, type ConnectorRunContext } from '@uc-open-edge/connector-sdk';
import type { InboundEvent } from '@uc-open-edge/schemas';

export const AmrConnectorConfigSchema = z.object({
  fleetApiUrl: z.string().url(),
  apiKey: z.string().optional(),
  pollIntervalMs: z.number().int().positive().default(5000),
  siteRef: z.string().optional(),
});

export class AmrTemplateConnector extends BaseConnector {
  readonly type = 'amr_template';
  private timer?: ReturnType<typeof setInterval>;

  override validateConfig(config: unknown): string | null {
    const result = AmrConnectorConfigSchema.safeParse(config);
    return result.success ? null : result.error.message;
  }

  override async start(ctx: ConnectorRunContext): Promise<void> {
    const config = AmrConnectorConfigSchema.parse(ctx.config);
    this.state = 'running';
    this.timer = setInterval(() => this.poll(ctx, config), config.pollIntervalMs);
    await this.poll(ctx, config);
  }

  private async poll(
    ctx: ConnectorRunContext,
    _config: z.infer<typeof AmrConnectorConfigSchema>,
  ): Promise<void> {
    ctx.logger.debug('AMR fleet poll (template stub)');
    await ctx.reportHealth('idle', 'Template stub: implement poll() for your AMR fleet manager');
  }

  override async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.state = 'stopped';
  }
}

export function mapAmrMissionToEvent(record: Record<string, unknown>): InboundEvent {
  const statusMap: Record<string, InboundEvent['eventType']> = {
    STARTED: 'robotics.mission.started',
    COMPLETED: 'robotics.mission.completed',
    FAILED: 'robotics.mission.failed',
  };
  const eventType = statusMap[String(record['status'] ?? '')] ?? 'robotics.mission.started';

  return {
    eventType,
    externalEventId: String(record['missionId'] ?? ''),
    occurredAt: String(record['timestamp'] ?? new Date().toISOString()),
    robotRef: { externalRobotId: String(record['robotId'] ?? '') },
    taskRef: record['taskId'] ? { externalTaskId: String(record['taskId']) } : undefined,
    fromLocationRef: record['fromLocation']
      ? { externalLocationId: String(record['fromLocation']) }
      : undefined,
    toLocationRef: record['toLocation']
      ? { externalLocationId: String(record['toLocation']) }
      : undefined,
    containerRef: record['containerId']
      ? { externalContainerId: String(record['containerId']) }
      : undefined,
    payload: { missionType: record['missionType'], errorCode: record['errorCode'] },
    metadata: { source: 'amr-fleet', raw: record },
  };
}

export default function createConnector(): AmrTemplateConnector {
  return new AmrTemplateConnector();
}
