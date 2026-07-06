# Warehouse Demo

This example demonstrates a typical warehouse integration scenario:

- Inbound webhook connector receiving WMS inventory movements
- File-drop connector receiving CSV cycle counts
- HTTP destination forwarding events to an ERP system
- File destination writing JSONL audit trail

## Events demonstrated

- `inventory.movement.reported` — picks, putaways, transfers
- `inventory.pick.completed` — individual pick line completions
- `inventory.cycle_count.completed` — cycle count results
- `location.status.changed` — location opens/closes

## Setup

1. Start UC Open Edge: `docker compose up`
2. Create a source system: POST /api/source-systems `{"name":"wms","type":"wms"}`
3. Create a webhook connector named `wms-movements`
4. Create an API key
5. Run: `node send-events.js`

## Sample events
