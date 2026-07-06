#!/usr/bin/env node
const API_URL = process.env.API_URL ?? 'http://localhost:3001';
const API_KEY = process.env.API_KEY;
const CONNECTOR = 'mes-connector';
if (!API_KEY) {
  console.error('Set API_KEY env var');
  process.exit(1);
}

const events = [
  {
    eventType: 'manufacturing.work_order.started',
    externalEventId: 'wo-start-001',
    occurredAt: new Date().toISOString(),
    workOrderRef: { externalWorkOrderId: 'WO-12345' },
    itemRef: { externalItemId: 'FINISHED-GOOD-1' },
    equipmentRef: { externalEquipmentId: 'LINE-2' },
    metadata: { source: 'manufacturing-demo' },
  },
  {
    eventType: 'manufacturing.production.completed',
    externalEventId: 'prod-2001',
    occurredAt: new Date().toISOString(),
    workOrderRef: { externalWorkOrderId: 'WO-12345' },
    itemRef: { externalItemId: 'FINISHED-GOOD-1' },
    equipmentRef: { externalEquipmentId: 'LINE-2' },
    quantity: 100,
    unitOfMeasure: 'EA',
    payload: { shift: 'A', rejectCount: 2, cycleTime: 45 },
    metadata: { source: 'manufacturing-demo' },
  },
  {
    eventType: 'equipment.alarm.raised',
    externalEventId: 'alarm-3001',
    occurredAt: new Date().toISOString(),
    equipmentRef: { externalEquipmentId: 'CONVEYOR-4' },
    payload: {
      alarmCode: 'JAM_DETECTED',
      severity: 'high',
      message: 'Jam detected at conveyor zone 4',
    },
    metadata: { source: 'manufacturing-demo' },
  },
];

async function send(event) {
  const r = await fetch(`${API_URL}/api/ingest/webhook/${CONNECTOR}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
    body: JSON.stringify(event),
  });
  const d = await r.json().catch(() => ({}));
  console.log(`${r.status} ${event.eventType} →`, d.normalizedEventId ?? d.error ?? '');
}

(async () => {
  console.log('Sending manufacturing demo events...\n');
  for (const e of events) await send(e);
  console.log('\nDone!');
})();
