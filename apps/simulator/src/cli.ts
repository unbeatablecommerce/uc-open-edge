#!/usr/bin/env node
/**
 * UC Open Edge Event Simulator CLI
 *
 * Sends sample events to a running UC Open Edge API via webhooks.
 *
 * Usage:
 *   pnpm --filter @uc-open-edge/simulator dev [options]
 *   node dist/cli.js [options]
 *
 * Options:
 *   --api-url <url>     API base URL (default: http://localhost:3001)
 *   --api-key <key>     API key with ingest scope
 *   --connector <name>  Connector name to send to (default: demo-webhook)
 *   --type <type>       Event type to generate (default: random)
 *   --count <n>         Number of events to send (default: 1)
 *   --interval <ms>     Interval between events in ms (default: 0)
 *   --loop              Send events in a continuous loop
 */

import { EVENT_GENERATORS, generateRandomEvent } from './events.js';

const args = process.argv.slice(2);

function getArg(flag: string, defaultVal: string): string {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1]! : defaultVal;
}

const apiUrl = getArg('--api-url', 'http://localhost:3001');
const apiKey = getArg('--api-key', '');
const connector = getArg('--connector', 'demo-webhook');
const eventType = getArg('--type', 'random');
const count = parseInt(getArg('--count', '1'));
const intervalMs = parseInt(getArg('--interval', '0'));
const loop = args.includes('--loop');

if (!apiKey) {
  console.error('Error: --api-key is required');
  console.error('Create an API key in the admin UI first.');
  process.exit(1);
}

const endpoint = `${apiUrl}/api/ingest/webhook/${connector}`;

async function sendEvent(): Promise<void> {
  const generator = EVENT_GENERATORS[eventType] ?? generateRandomEvent;
  const event = typeof generator === 'function' ? generator() : generateRandomEvent();

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(event),
    });

    const body = await resp.json().catch(() => ({}));

    if (resp.ok) {
      console.log(`✓ ${resp.status} ${event.eventType} → ${event.externalEventId}`);
      if ((body as Record<string, unknown>)['isDuplicate']) {
        console.log(`  (duplicate of ${(body as Record<string, unknown>)['duplicateOfId']})`);
      }
    } else {
      console.error(`✗ ${resp.status} ${event.eventType} →`, JSON.stringify(body));
    }
  } catch (err) {
    console.error(`✗ Network error:`, String(err));
  }
}

async function main() {
  console.log(`UC Open Edge Simulator`);
  console.log(`  API: ${apiUrl}`);
  console.log(`  Connector: ${connector}`);
  console.log(`  Event type: ${eventType}`);
  console.log(`  Endpoint: ${endpoint}`);
  console.log('');

  if (loop) {
    console.log('Running in loop mode. Press Ctrl+C to stop.\n');
    while (true) {
      await sendEvent();
      await new Promise((r) => setTimeout(r, intervalMs || 2000));
    }
  } else {
    for (let i = 0; i < count; i++) {
      await sendEvent();
      if (intervalMs > 0 && i < count - 1) {
        await new Promise((r) => setTimeout(r, intervalMs));
      }
    }
    console.log(`\nSent ${count} event(s).`);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
