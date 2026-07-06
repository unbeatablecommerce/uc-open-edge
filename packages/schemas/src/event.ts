import { z } from 'zod';
import { EventDomainSchema, EventTypeSchema } from './domains.js';
import {
  SkuRefSchema,
  ItemRefSchema,
  LocationRefSchema,
  ContainerRefSchema,
  EquipmentRefSchema,
  RobotRefSchema,
  TaskRefSchema,
  WorkOrderRefSchema,
  SiteRefSchema,
  AreaRefSchema,
  ZoneRefSchema,
} from './refs.js';

/**
 * The inbound event input accepted by connectors before normalization.
 * This is the raw "intent" from a connector, not yet fully normalized.
 */
export const InboundEventSchema = z
  .object({
    eventType: EventTypeSchema,
    externalEventId: z.string().optional(),
    occurredAt: z.string().datetime().or(z.date()).optional(),
    dedupeKey: z.string().optional(),
    siteRef: SiteRefSchema.optional(),
    areaRef: AreaRefSchema.optional(),
    zoneRef: ZoneRefSchema.optional(),
    locationRef: LocationRefSchema.optional(),
    fromLocationRef: LocationRefSchema.optional(),
    toLocationRef: LocationRefSchema.optional(),
    skuRef: SkuRefSchema.optional(),
    itemRef: ItemRefSchema.optional(),
    containerRef: ContainerRefSchema.optional(),
    equipmentRef: EquipmentRefSchema.optional(),
    robotRef: RobotRefSchema.optional(),
    taskRef: TaskRefSchema.optional(),
    workOrderRef: WorkOrderRefSchema.optional(),
    quantity: z.number().optional(),
    unitOfMeasure: z.string().optional(),
    payload: z.record(z.unknown()).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .passthrough();

export type InboundEvent = z.infer<typeof InboundEventSchema>;

/**
 * The fully normalized event stored in the database and forwarded to destinations.
 * Events are observations/reports — NOT commands. They record what was observed
 * by an operational system. Business platforms decide how to act on them.
 */
export const NormalizedEventSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  eventType: z.string(),
  domain: EventDomainSchema,
  sourceSystemId: z.string().nullable().optional(),
  sourceSystemName: z.string().nullable().optional(),
  connectorId: z.string().nullable().optional(),
  rawEventId: z.string().nullable().optional(),
  externalEventId: z.string().nullable().optional(),
  dedupeKey: z.string().nullable().optional(),
  occurredAt: z.date().or(z.string().datetime()),
  receivedAt: z.date().or(z.string().datetime()),
  processedAt: z.date().or(z.string().datetime()).nullable().optional(),
  status: z.enum(['pending', 'processing', 'normalized', 'invalid', 'duplicate', 'failed']),
  siteRef: SiteRefSchema.nullable().optional(),
  areaRef: AreaRefSchema.nullable().optional(),
  zoneRef: ZoneRefSchema.nullable().optional(),
  locationRef: LocationRefSchema.nullable().optional(),
  fromLocationRef: LocationRefSchema.nullable().optional(),
  toLocationRef: LocationRefSchema.nullable().optional(),
  skuRef: SkuRefSchema.nullable().optional(),
  itemRef: ItemRefSchema.nullable().optional(),
  containerRef: ContainerRefSchema.nullable().optional(),
  equipmentRef: EquipmentRefSchema.nullable().optional(),
  robotRef: RobotRefSchema.nullable().optional(),
  taskRef: TaskRefSchema.nullable().optional(),
  workOrderRef: WorkOrderRefSchema.nullable().optional(),
  quantity: z.number().nullable().optional(),
  unitOfMeasure: z.string().nullable().optional(),
  payload: z.record(z.unknown()).nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
  validationErrors: z.array(z.string()).nullable().optional(),
});

export type NormalizedEvent = z.infer<typeof NormalizedEventSchema>;

// ─── Per-type payload refinements (used for validation/docs) ─────────────────

export const InventoryMovementPayloadSchema = z
  .object({
    reason: z.string().optional(),
    operator: z.string().optional(),
  })
  .passthrough();

export const InventoryQuantityPayloadSchema = z
  .object({
    countedBy: z.string().optional(),
    variance: z.number().optional(),
  })
  .passthrough();

export const EquipmentAlarmPayloadSchema = z
  .object({
    alarmCode: z.string().optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    message: z.string().optional(),
  })
  .passthrough();

export const SensorReadingPayloadSchema = z
  .object({
    sensorId: z.string().optional(),
    sensorType: z.string().optional(),
    value: z.number().optional(),
    unit: z.string().optional(),
    threshold: z.number().optional(),
  })
  .passthrough();

export const TaskPayloadSchema = z
  .object({
    taskType: z.string().optional(),
    priority: z.number().optional(),
    assignedTo: z.string().optional(),
    completionCode: z.string().optional(),
    errorCode: z.string().optional(),
  })
  .passthrough();

export const ManufacturingPayloadSchema = z
  .object({
    productionLine: z.string().optional(),
    shift: z.string().optional(),
    cycleTime: z.number().optional(),
    rejectCount: z.number().optional(),
  })
  .passthrough();

export const QualityInspectionPayloadSchema = z
  .object({
    inspectorId: z.string().optional(),
    result: z.enum(['pass', 'fail', 'conditional']).optional(),
    defects: z.array(z.string()).optional(),
    sampleSize: z.number().optional(),
  })
  .passthrough();

export const HeartbeatPayloadSchema = z
  .object({
    version: z.string().optional(),
    uptime: z.number().optional(),
    connectorCount: z.number().optional(),
  })
  .passthrough();
