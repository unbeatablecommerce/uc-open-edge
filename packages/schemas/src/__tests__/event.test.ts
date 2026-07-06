import { describe, it, expect } from 'vitest';
import {
  InboundEventSchema,
  EventTypeSchema,
  DOMAIN_BY_EVENT_TYPE,
  EVENT_TYPES,
} from '../index.js';

describe('InboundEventSchema', () => {
  it('validates a valid inventory movement event', () => {
    const event = {
      eventType: 'inventory.movement.reported',
      externalEventId: 'move-001',
      occurredAt: '2026-07-05T12:00:00.000Z',
      skuRef: { externalSku: 'ABC-123' },
      fromLocationRef: { externalLocationId: 'BULK-A-17' },
      toLocationRef: { externalLocationId: 'PICKFACE-04-02-09' },
      quantity: 6,
      unitOfMeasure: 'EA',
    };
    const result = InboundEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('validates a robotics mission completed event', () => {
    const event = {
      eventType: 'robotics.mission.completed',
      externalEventId: 'mission-7788',
      occurredAt: '2026-07-05T12:02:00.000Z',
      robotRef: { externalRobotId: 'AMR-07' },
      taskRef: { externalTaskId: 'TASK-441' },
    };
    const result = InboundEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('validates manufacturing production event', () => {
    const event = {
      eventType: 'manufacturing.production.completed',
      externalEventId: 'prod-2001',
      occurredAt: '2026-07-05T12:03:00.000Z',
      workOrderRef: { externalWorkOrderId: 'WO-12345' },
      itemRef: { externalItemId: 'FINISHED-GOOD-1' },
      quantity: 100,
      unitOfMeasure: 'EA',
    };
    expect(InboundEventSchema.safeParse(event).success).toBe(true);
  });

  it('rejects event with invalid eventType', () => {
    const event = { eventType: 'not.a.valid.type', occurredAt: new Date().toISOString() };
    expect(InboundEventSchema.safeParse(event).success).toBe(false);
  });

  it('rejects event without eventType', () => {
    const event = { externalEventId: 'abc', occurredAt: new Date().toISOString() };
    expect(InboundEventSchema.safeParse(event).success).toBe(false);
  });

  it('allows passthrough extra fields', () => {
    const event = { eventType: 'system.heartbeat', customField: 'value' };
    const result = InboundEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });
});

describe('DOMAIN_BY_EVENT_TYPE', () => {
  it('maps all event types to a domain', () => {
    for (const eventType of EVENT_TYPES) {
      expect(DOMAIN_BY_EVENT_TYPE[eventType]).toBeDefined();
    }
  });

  it('maps inventory events to inventory domain', () => {
    expect(DOMAIN_BY_EVENT_TYPE['inventory.movement.reported']).toBe('inventory');
    expect(DOMAIN_BY_EVENT_TYPE['inventory.pick.completed']).toBe('inventory');
  });

  it('maps robotics events to robotics domain', () => {
    expect(DOMAIN_BY_EVENT_TYPE['robotics.mission.completed']).toBe('robotics');
  });
});

describe('EventTypeSchema', () => {
  it('accepts all valid event types', () => {
    for (const t of EVENT_TYPES) {
      expect(EventTypeSchema.safeParse(t).success).toBe(true);
    }
  });

  it('rejects unknown event types', () => {
    expect(EventTypeSchema.safeParse('unknown.event').success).toBe(false);
  });
});
