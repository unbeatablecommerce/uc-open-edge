import { describe, it, expect } from 'vitest';
import { computePayloadHash } from '../dedup.js';

describe('computePayloadHash', () => {
  it('produces consistent hashes for the same object', () => {
    const obj = { eventType: 'sensor.reading.observed', value: 42 };
    expect(computePayloadHash(obj)).toBe(computePayloadHash(obj));
  });

  it('produces the same hash regardless of key order', () => {
    const a = { z: 1, a: 2, m: 3 };
    const b = { m: 3, z: 1, a: 2 };
    expect(computePayloadHash(a)).toBe(computePayloadHash(b));
  });

  it('produces different hashes for different objects', () => {
    const a = { eventType: 'sensor.reading.observed', value: 42 };
    const b = { eventType: 'sensor.reading.observed', value: 43 };
    expect(computePayloadHash(a)).not.toBe(computePayloadHash(b));
  });

  it('returns a 64-char hex string', () => {
    const hash = computePayloadHash({ test: true });
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
