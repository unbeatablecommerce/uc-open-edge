/**
 * OPC UA Connector — MVP Stub
 *
 * STATUS: Interface + config model only. Real OPC UA node subscriptions are
 * NOT yet implemented in this release.
 *
 * WHY: The `node-opcua` package requires native builds (~100MB) and is a
 * significant integration effort. Rather than fake a working implementation,
 * this package provides:
 *
 *   1. A complete, production-ready config schema.
 *   2. The IConnector interface implementation (skeleton).
 *   3. A simulator path: OPC UA-shaped events can be sent to the
 *      file-drop or webhook connector using the provided example payloads.
 *   4. Clear docs on how to extend this to a real connection.
 *
 * EXTENSION PATH:
 *   1. Install node-opcua: `pnpm --filter @uc-open-edge/connector-opcua add node-opcua`
 *   2. In start(): create OPCUAClient, connect to config.endpointUrl
 *   3. Create a session, subscribe to config.nodes using ClientSubscription
 *   4. On dataValue change: call ctx.submitEvent with mapped payload
 *   5. On disconnect: reconnect with backoff, report health errors
 *
 * See docs/connector-development.md for full extension guidance.
 */
import { z } from 'zod';
import { BaseConnector, type ConnectorRunContext } from '@uc-open-edge/connector-sdk';
import type { EventType } from '@uc-open-edge/schemas';

export const OpcUaNodeConfigSchema = z.object({
  /** OPC UA node ID (e.g., "ns=2;i=1001" or "ns=2;s=MyVariable") */
  nodeId: z.string(),
  /** Display name for this node */
  displayName: z.string().optional(),
  /** Event type to emit when this node value changes */
  eventType: z.string() as z.ZodType<EventType>,
  /** Sampling interval in milliseconds */
  samplingIntervalMs: z.number().int().positive().default(1000),
  /** Field in normalized event to store the value */
  valueField: z.string().default('payload.value'),
});

export const OpcUaConnectorConfigSchema = z.object({
  /** OPC UA server endpoint URL (e.g., opc.tcp://192.168.1.10:4840) */
  endpointUrl: z.string(),
  /** Security mode: None, Sign, or SignAndEncrypt */
  securityMode: z.enum(['None', 'Sign', 'SignAndEncrypt']).default('None'),
  /** Security policy */
  securityPolicy: z.string().default('None'),
  /** Username for user/password authentication */
  username: z.string().optional(),
  /** Password for user/password authentication */
  password: z.string().optional(),
  /** Subscription interval in milliseconds */
  publishingIntervalMs: z.number().int().positive().default(1000),
  /** List of nodes to subscribe to */
  nodes: z.array(OpcUaNodeConfigSchema).min(1),
  /** Source system reference for equipment mapping */
  equipmentRef: z.string().optional(),
});

export type OpcUaConnectorConfig = z.infer<typeof OpcUaConnectorConfigSchema>;

export class OpcUaConnector extends BaseConnector {
  readonly type = 'opcua';

  override validateConfig(config: unknown): string | null {
    const result = OpcUaConnectorConfigSchema.safeParse(config);
    return result.success ? null : result.error.message;
  }

  override async start(ctx: ConnectorRunContext): Promise<void> {
    const config = OpcUaConnectorConfigSchema.parse(ctx.config);
    this.state = 'error';

    const nodeList = config.nodes.map((n) => n.nodeId).join(', ');
    const message = [
      'OPC UA connector is not yet fully implemented.',
      `Would connect to: ${config.endpointUrl}`,
      `Would subscribe to nodes: ${nodeList}`,
      'See connectors/opcua/src/index.ts for the extension path.',
      'Use the file-drop or webhook connector to simulate OPC UA events.',
    ].join(' | ');

    ctx.logger.warn(message);
    await ctx.reportHealth('error', message);
  }

  override async stop(): Promise<void> {
    this.state = 'stopped';
  }
}

/**
 * Example OPC UA event payload (for use with file-drop or webhook simulator):
 *
 * {
 *   "eventType": "sensor.reading.observed",
 *   "externalEventId": "opcua-ns2-i1001-1720180800",
 *   "occurredAt": "2026-07-05T12:00:00.000Z",
 *   "equipmentRef": { "externalEquipmentId": "PLC-LINE-1" },
 *   "payload": {
 *     "nodeId": "ns=2;i=1001",
 *     "displayName": "ConveyorSpeed",
 *     "value": 1.23,
 *     "unit": "m/s",
 *     "quality": "Good"
 *   },
 *   "metadata": { "source": "opc-ua-simulator" }
 * }
 */
export const OPCUA_EXAMPLE_EVENTS = [
  {
    eventType: 'sensor.reading.observed' as EventType,
    externalEventId: 'opcua-ns2-i1001-example',
    occurredAt: new Date().toISOString(),
    equipmentRef: { externalEquipmentId: 'PLC-LINE-1' },
    payload: {
      nodeId: 'ns=2;i=1001',
      displayName: 'ConveyorSpeed',
      value: 1.23,
      unit: 'm/s',
      quality: 'Good',
    },
    metadata: { source: 'opc-ua-simulator' },
  },
  {
    eventType: 'equipment.alarm.raised' as EventType,
    externalEventId: 'opcua-ns2-i1002-example',
    occurredAt: new Date().toISOString(),
    equipmentRef: { externalEquipmentId: 'CONVEYOR-4' },
    payload: {
      nodeId: 'ns=2;i=1002',
      alarmCode: 'JAM_DETECTED',
      severity: 'high',
      message: 'Jam at zone 4',
      quality: 'Good',
    },
    metadata: { source: 'opc-ua-simulator' },
  },
];

export default function createConnector(): OpcUaConnector {
  return new OpcUaConnector();
}
