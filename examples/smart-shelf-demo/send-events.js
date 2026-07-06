#!/usr/bin/env node
const API_URL = process.env.API_URL ?? 'http://localhost:3001';
const API_KEY = process.env.API_KEY;
const CONNECTOR = 'smart-shelf';
if (!API_KEY) {
  console.error('Set API_KEY env var');
  process.exit(1);
}

const events = Array.from({ length: 5 }, (_, i) => ({
  eventType: 'inventory.quantity.observed',
  externalEventId: `shelf-obs-${Date.now()}-${i}`,
  occurredAt: new Date().toISOString(),
  skuRef: { externalSku: `SKU-${String(i + 1).padStart(4, '0')}` },
  locationRef: { externalLocationId: `SHELF-${i + 1}-01` },
  quantity: Math.floor(Math.random() * 30),
  unitOfMeasure: 'EA',
  metadata: { source: 'smart-shelf-sensor', sensorId: `RFID-${i + 1}` },
}));

async function send(e) {
  const r = await fetch(`${API_URL}/api/ingest/webhook/${CONNECTOR}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
    body: JSON.stringify(e),
  });
  const d = await r.json().catch(() => ({}));
  console.log(
    `${r.status} ${e.eventType} qty=${e.quantity} → ${d.normalizedEventId ?? d.error ?? ''}`,
  );
}

(async () => {
  for (const e of events) await send(e);
})();
