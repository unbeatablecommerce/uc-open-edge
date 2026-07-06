# Event Schemas

## Normalized event envelope

All events are normalized into a standard envelope. Events are **observations** — they record what was observed by an operational system. They are not commands.

```typescript
{
  // Identity
  id: string;               // Internal UUID
  eventId: string;          // External-safe event ID
  eventType: string;        // e.g. "inventory.movement.reported"
  domain: EventDomain;      // e.g. "inventory"

  // Source traceability
  sourceSystemId: string | null;
  connectorId: string | null;
  rawEventId: string | null;
  externalEventId: string | null;
  dedupeKey: string | null;

  // Timing
  occurredAt: DateTime;     // When the event happened in the operational system
  receivedAt: DateTime;     // When UC Open Edge received it
  processedAt: DateTime | null;

  // Status
  status: 'pending' | 'processing' | 'normalized' | 'invalid' | 'duplicate' | 'failed';

  // References (populated selectively by event type)
  siteRef: SiteRef | null;
  areaRef: AreaRef | null;
  zoneRef: ZoneRef | null;
  locationRef: LocationRef | null;
  fromLocationRef: LocationRef | null;
  toLocationRef: LocationRef | null;
  skuRef: SkuRef | null;
  itemRef: ItemRef | null;
  containerRef: ContainerRef | null;
  equipmentRef: EquipmentRef | null;
  robotRef: RobotRef | null;
  taskRef: TaskRef | null;
  workOrderRef: WorkOrderRef | null;

  // Quantity
  quantity: Decimal | null;
  unitOfMeasure: string | null;

  // Arbitrary data
  payload: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  validationErrors: string[] | null;
}
```

## Domains and event types

| Domain              | Event Types                                                                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inventory`         | `inventory.movement.reported`, `inventory.quantity.observed`, `inventory.pick.completed`, `inventory.putaway.completed`, `inventory.replenishment.completed`, `inventory.cycle_count.completed`, `inventory.exception.reported` |
| `location`          | `location.status.changed`                                                                                                                                                                                                       |
| `task`              | `task.created`, `task.started`, `task.completed`, `task.failed`, `task.cancelled`                                                                                                                                               |
| `equipment`         | `equipment.status.changed`, `equipment.alarm.raised`, `equipment.alarm.cleared`                                                                                                                                                 |
| `robotics`          | `robotics.mission.started`, `robotics.mission.completed`, `robotics.mission.failed`                                                                                                                                             |
| `manufacturing`     | `manufacturing.work_order.started`, `manufacturing.production.completed`, `manufacturing.scrap.reported`                                                                                                                        |
| `quality`           | `quality.inspection.completed`                                                                                                                                                                                                  |
| `maintenance`       | `maintenance.issue.reported`                                                                                                                                                                                                    |
| `sensor`            | `sensor.reading.observed`                                                                                                                                                                                                       |
| `container`         | `container.scanned`, `container.moved`                                                                                                                                                                                          |
| `shipment`          | `shipment.loaded`, `shipment.received`                                                                                                                                                                                          |
| `order_fulfillment` | `order_fulfillment.pick_completed`                                                                                                                                                                                              |
| `system`            | `system.heartbeat`                                                                                                                                                                                                              |

## Example events

### inventory.movement.reported

```json
{
  "eventType": "inventory.movement.reported",
  "externalEventId": "move-001",
  "occurredAt": "2026-07-05T12:00:00.000Z",
  "skuRef": { "externalSku": "ABC-123" },
  "fromLocationRef": { "externalLocationId": "BULK-A-17" },
  "toLocationRef": { "externalLocationId": "PICKFACE-04-02-09" },
  "quantity": 6,
  "unitOfMeasure": "EA"
}
```

### robotics.mission.completed

```json
{
  "eventType": "robotics.mission.completed",
  "externalEventId": "mission-7788",
  "occurredAt": "2026-07-05T12:02:30.000Z",
  "robotRef": { "externalRobotId": "AMR-07" },
  "taskRef": { "externalTaskId": "TASK-441" },
  "fromLocationRef": { "externalLocationId": "RECEIVING-01" },
  "toLocationRef": { "externalLocationId": "OVERSTOCK-B" },
  "containerRef": { "externalContainerId": "TOTE-991" }
}
```

### sensor.reading.observed (OPC UA via file-drop)

```json
{
  "eventType": "sensor.reading.observed",
  "externalEventId": "opcua-ns2-i1001-1720180800",
  "occurredAt": "2026-07-05T12:00:00.000Z",
  "equipmentRef": { "externalEquipmentId": "PLC-LINE-1" },
  "payload": {
    "nodeId": "ns=2;i=1001",
    "displayName": "ConveyorSpeed",
    "value": 1.23,
    "unit": "m/s",
    "quality": "Good"
  }
}
```
