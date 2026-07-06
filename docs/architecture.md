# Architecture

## Overview

UC Open Edge is a local edge integration framework that runs on-premise alongside operational systems. It has no cloud dependency and does not call external vendor APIs.

## Components

### API Server (`apps/api`)

- Fastify REST API
- Handles ingest endpoints (`POST /api/ingest/:connectorKey`)
- Provides all admin CRUD endpoints
- Session cookie authentication + API key authentication
- RBAC middleware (admin/operator/viewer)

### Worker (`apps/worker`)

- Delivery retry loop (polls `EventDelivery` table for pending deliveries)
- Connector runtime (starts/stops polling connectors)
- Health checks

### Admin UI (`apps/admin`)

- SvelteKit server-side rendered application
- Proxies all API calls through the Fastify server
- Session forwarded from browser cookie

### Database (`packages/db`)

- PostgreSQL via Prisma ORM
- 14 models: User, Session, ApiKey, SourceSystem, Connector, Destination, RawEvent, NormalizedEvent, EventDelivery, DeliveryAttempt, Mapping, AuditLog, AppSetting, ConnectorHealth

## Event ingestion pipeline

```
Inbound event (raw JSON)
  │
  ├─► Store as RawEvent (always — never dropped)
  │
  ├─► Validate (Zod InboundEventSchema)
  │     └─ If invalid → mark RawEvent status=invalid, update connector health error
  │
  ├─► Apply ref mappings (SKU, location, equipment, robot)
  │
  ├─► Deduplication check
  │     ├─ Strategy 1: sourceSystemId + externalEventId
  │     ├─ Strategy 2: connectorId + dedupeKey
  │     └─ Strategy 3: payload hash + occurredAt 5-minute window
  │           └─ If duplicate → mark RawEvent status=duplicate, skip
  │
  ├─► Store NormalizedEvent
  │
  ├─► Fan out EventDelivery rows (one per enabled destination)
  │
  └─► Update connector health (lastSeenAt, lastSuccessAt, status=active)
```

## Delivery pipeline (worker)

```
EventDelivery rows (status=pending, nextAttemptAt <= now)
  │
  ├─► Mark in_progress
  ├─► Call destination.deliver(event, ctx)
  ├─► Record DeliveryAttempt
  └─► On success: mark delivered
      On failure: exponential backoff, up to 5 attempts, then mark failed
```

## Data model key relationships

```
SourceSystem ─── Connector ─── RawEvent ─── NormalizedEvent ─── EventDelivery ─── DeliveryAttempt
                                                                        │
                                                                   Destination
```

## Security boundaries

- Admin UI and API are separate processes
- API keys are hashed (SHA-256) before storage
- Session tokens are hashed (SHA-256) before storage
- Passwords are hashed with Argon2
- All ingest requires a valid API key
- All admin mutations require a session and appropriate role
