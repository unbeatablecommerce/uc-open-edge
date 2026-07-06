import type { EventType } from '@uc-open-edge/schemas';

export interface SimulatedEvent {
  eventType: EventType;
  externalEventId: string;
  occurredAt: string;
  [key: string]: unknown;
}

let counter = 1000;

function nextId(): string {
  return String(++counter);
}

export function generateInventoryMovement(): SimulatedEvent {
  const id = nextId();
  return {
    eventType: 'inventory.movement.reported',
    externalEventId: `move-${id}`,
    occurredAt: new Date().toISOString(),
    skuRef: { externalSku: `SKU-${String(Math.floor(Math.random() * 50)).padStart(4, '0')}` },
    fromLocationRef: { externalLocationId: `BULK-A-${Math.floor(Math.random() * 20) + 1}` },
    toLocationRef: { externalLocationId: `PICKFACE-${Math.floor(Math.random() * 100) + 1}-01` },
    quantity: Math.floor(Math.random() * 20) + 1,
    unitOfMeasure: 'EA',
    metadata: { source: 'simulator' },
  };
}

export function generateQuantityObservation(): SimulatedEvent {
  const id = nextId();
  return {
    eventType: 'inventory.quantity.observed',
    externalEventId: `obs-${id}`,
    occurredAt: new Date().toISOString(),
    skuRef: { externalSku: `SKU-${String(Math.floor(Math.random() * 50)).padStart(4, '0')}` },
    locationRef: { externalLocationId: `PICKFACE-${Math.floor(Math.random() * 100) + 1}-01` },
    quantity: Math.floor(Math.random() * 50),
    unitOfMeasure: 'EA',
    metadata: {
      source: 'smart-shelf-sensor',
      sensorId: `SENSOR-${Math.floor(Math.random() * 20) + 1}`,
    },
  };
}

export function generateRobotMission(): SimulatedEvent {
  const id = nextId();
  const statuses: Array<
    'robotics.mission.started' | 'robotics.mission.completed' | 'robotics.mission.failed'
  > = ['robotics.mission.started', 'robotics.mission.completed', 'robotics.mission.failed'];
  const eventType = statuses[Math.floor(Math.random() * statuses.length)]!;
  return {
    eventType,
    externalEventId: `mission-${id}`,
    occurredAt: new Date().toISOString(),
    robotRef: {
      externalRobotId: `AMR-${String(Math.floor(Math.random() * 10) + 1).padStart(2, '0')}`,
    },
    taskRef: { externalTaskId: `TASK-${id}` },
    fromLocationRef: { externalLocationId: 'RECEIVING-01' },
    toLocationRef: {
      externalLocationId: `OVERSTOCK-${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
    },
    containerRef: { externalContainerId: `TOTE-${id}` },
    metadata: { source: 'simulator' },
  };
}

export function generateProductionCompleted(): SimulatedEvent {
  const id = nextId();
  return {
    eventType: 'manufacturing.production.completed',
    externalEventId: `prod-${id}`,
    occurredAt: new Date().toISOString(),
    workOrderRef: { externalWorkOrderId: `WO-${id}` },
    itemRef: { externalItemId: `FINISHED-GOOD-${Math.floor(Math.random() * 10) + 1}` },
    equipmentRef: { externalEquipmentId: `LINE-${Math.floor(Math.random() * 4) + 1}` },
    quantity: Math.floor(Math.random() * 200) + 50,
    unitOfMeasure: 'EA',
    payload: {
      shift: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
      rejectCount: Math.floor(Math.random() * 5),
    },
    metadata: { source: 'simulator' },
  };
}

export function generateEquipmentAlarm(): SimulatedEvent {
  const id = nextId();
  const alarms = ['JAM_DETECTED', 'TEMP_HIGH', 'PRESSURE_LOW', 'MOTOR_FAULT', 'SENSOR_FAIL'];
  const severities = ['low', 'medium', 'high', 'critical'];
  return {
    eventType: 'equipment.alarm.raised',
    externalEventId: `alarm-${id}`,
    occurredAt: new Date().toISOString(),
    equipmentRef: { externalEquipmentId: `CONVEYOR-${Math.floor(Math.random() * 8) + 1}` },
    payload: {
      alarmCode: alarms[Math.floor(Math.random() * alarms.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      message: 'Simulated equipment alarm',
    },
    metadata: { source: 'simulator' },
  };
}

export function generateSensorReading(): SimulatedEvent {
  const id = nextId();
  return {
    eventType: 'sensor.reading.observed',
    externalEventId: `sensor-${id}`,
    occurredAt: new Date().toISOString(),
    equipmentRef: { externalEquipmentId: `ZONE-${Math.floor(Math.random() * 10) + 1}` },
    payload: {
      sensorId: `TEMP-${id}`,
      sensorType: 'temperature',
      value: +(18 + Math.random() * 10).toFixed(1),
      unit: '°C',
    },
    metadata: { source: 'simulator' },
  };
}

export function generateHeartbeat(): SimulatedEvent {
  return {
    eventType: 'system.heartbeat',
    externalEventId: `hb-${Date.now()}`,
    occurredAt: new Date().toISOString(),
    payload: { version: '0.1.0', uptime: process.uptime() },
    metadata: { source: 'simulator' },
  };
}

export const EVENT_GENERATORS: Record<string, () => SimulatedEvent> = {
  'inventory-movement': generateInventoryMovement,
  'quantity-observed': generateQuantityObservation,
  'robot-mission': generateRobotMission,
  'production-completed': generateProductionCompleted,
  'equipment-alarm': generateEquipmentAlarm,
  'sensor-reading': generateSensorReading,
  heartbeat: generateHeartbeat,
};

export function generateRandomEvent(): SimulatedEvent {
  const generators = Object.values(EVENT_GENERATORS);
  return generators[Math.floor(Math.random() * generators.length)]!();
}
