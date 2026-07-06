#!/usr/bin/env node
/**
 * Warehouse Demo — send sample warehouse events to UC Open Edge webhook connector
 *
 * Usage:
 *   API_URL=http://localhost:3001 API_KEY=ucedge_xxx_yyy node send-events.js
 */
const API_URL = process.env.API_URL ?? 'http://localhost:3001';
const API_KEY = process.env.API_KEY;
const CONNECTOR = 'wms-movements';

if (!API_KEY) {
  console.error('Set API_KEY env var');
  process.exit(1);
}

const events = [
  {
    eventType: 'inventory.movement.reported',
    externalEventId: 'wh-move-001',
    occurredAt: new Date().toISOString(),
    skuRef: { externalSku: 'ABC-123' },
    fromLocationRef: { externalLocationId: 'BULK-A-17' },
    toLocationRef: { externalLocationId: 'PICKFACE-04-02-09' },
    quantity: 6,
    unitOfMeasure: 'EA',
    metadata: { source: 'warehouse-demo', operator: 'OP-123' },
  },
  {
    eventType: 'inventory.pick.completed',
    externalEventId: 'wh-pick-001',
    occurredAt: new Date().toISOString(),
    skuRef: { externalSku: 'ABC-123' },
    locationRef: { externalLocationId: 'PICKFACE-04-02-09' },
    quantity: 2,
    unitOfMeasure: 'EA',
    taskRef: { externalTaskId: 'TASK-5001' },
    metadata: { source: 'warehouse-demo', orderId: 'ORD-9001' },
  },
  {
    eventType: 'inventory.cycle_count.completed',
    externalEventId: 'wh-cc-001',
    occurredAt: new Date().toISOString(),
    skuRef: { externalSku: 'XYZ-456' },
    locationRef: { externalLocationId: 'OVERSTOCK-B-3' },
    quantity: 24,
    unitOfMeasure: 'EA',
    metadata: { source: 'warehouse-demo', countedBy: 'USER-45' },
  },
];

async function send(event) {
  const r = await fetch(`${API_URL}/api/ingest/webhook/${CONNECTOR}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
    body: JSON.stringify(event),
  });
  const d = await r.json().catch(() => ({}));
  console.log(
    `${r.status} ${event.eventType} →`,
    d.normalizedEventId ?? d.error ?? JSON.stringify(d),
  );
}

(async () => {
  console.log('Sending warehouse demo events...\n');
  for (const e of events) await send(e);
  console.log('\nDone! Check the admin UI at http://localhost:3000');
})();
