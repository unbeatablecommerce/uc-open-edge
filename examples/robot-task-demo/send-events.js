#!/usr/bin/env node
const API_URL = process.env.API_URL ?? 'http://localhost:3001';
const API_KEY = process.env.API_KEY;
const CONNECTOR = 'amr-fleet';
if (!API_KEY) {
  console.error('Set API_KEY env var');
  process.exit(1);
}

const events = [
  {
    eventType: 'robotics.mission.started',
    externalEventId: 'mission-7788',
    occurredAt: new Date().toISOString(),
    robotRef: { externalRobotId: 'AMR-07' },
    taskRef: { externalTaskId: 'TASK-441' },
    fromLocationRef: { externalLocationId: 'RECEIVING-01' },
    toLocationRef: { externalLocationId: 'OVERSTOCK-B' },
    containerRef: { externalContainerId: 'TOTE-991' },
    metadata: { source: 'robot-task-demo' },
  },
  {
    eventType: 'robotics.mission.completed',
    externalEventId: 'mission-7789',
    occurredAt: new Date(Date.now() + 30000).toISOString(),
    robotRef: { externalRobotId: 'AMR-07' },
    taskRef: { externalTaskId: 'TASK-441' },
    fromLocationRef: { externalLocationId: 'RECEIVING-01' },
    toLocationRef: { externalLocationId: 'OVERSTOCK-B' },
    containerRef: { externalContainerId: 'TOTE-991' },
    metadata: { source: 'robot-task-demo', durationMs: 30000 },
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
  console.log('Sending robot task demo events...\n');
  for (const e of events) await send(e);
  console.log('\nDone!');
})();
