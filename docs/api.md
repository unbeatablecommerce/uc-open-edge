# API Reference

Base URL: `http://localhost:3001`

## Authentication

Session-based authentication (admin UI) or API key (ingest endpoints).

- **Session**: Cookie `ucedge_session` obtained from `POST /api/auth/login`
- **API Key**: Header `X-API-Key: ucedge_xxx_yyy` or `Authorization: Bearer ucedge_xxx_yyy`

## Auth endpoints

| Method | Path               | Description                                       |
| ------ | ------------------ | ------------------------------------------------- |
| POST   | `/api/auth/login`  | Login with email/password, returns session cookie |
| POST   | `/api/auth/logout` | Revoke session                                    |
| GET    | `/api/auth/me`     | Get current user                                  |

## Ingest

| Method | Path                                | Auth    | Description               |
| ------ | ----------------------------------- | ------- | ------------------------- |
| POST   | `/api/ingest/:connectorKey`         | API Key | Submit event to connector |
| POST   | `/api/ingest/webhook/:connectorKey` | API Key | Webhook alias             |

## Events

| Method | Path                               | Auth                | Description               |
| ------ | ---------------------------------- | ------------------- | ------------------------- |
| GET    | `/api/events`                      | Session             | List events (filterable)  |
| GET    | `/api/events/:id`                  | Session             | Get event with deliveries |
| POST   | `/api/events/:id/reprocess`        | Session (operator+) | Reprocess event           |
| POST   | `/api/events/:id/retry-deliveries` | Session (operator+) | Retry failed deliveries   |

## Raw Events

| Method | Path                  | Auth    | Description     |
| ------ | --------------------- | ------- | --------------- |
| GET    | `/api/raw-events`     | Session | List raw events |
| GET    | `/api/raw-events/:id` | Session | Get raw event   |

## Connectors

| Method | Path                          | Auth                | Description               |
| ------ | ----------------------------- | ------------------- | ------------------------- |
| GET    | `/api/connectors`             | Session             | List connectors           |
| GET    | `/api/connectors/:id`         | Session             | Get connector with health |
| POST   | `/api/connectors`             | Session (operator+) | Create connector          |
| PATCH  | `/api/connectors/:id`         | Session (operator+) | Update connector          |
| POST   | `/api/connectors/:id/enable`  | Session (operator+) | Enable connector          |
| POST   | `/api/connectors/:id/disable` | Session (operator+) | Disable connector         |
| POST   | `/api/connectors/:id/test`    | Session (operator+) | Test connector            |

## Destinations

| Method | Path                            | Auth                | Description         |
| ------ | ------------------------------- | ------------------- | ------------------- |
| GET    | `/api/destinations`             | Session             | List destinations   |
| GET    | `/api/destinations/:id`         | Session             | Get destination     |
| POST   | `/api/destinations`             | Session (operator+) | Create destination  |
| PATCH  | `/api/destinations/:id`         | Session (operator+) | Update destination  |
| POST   | `/api/destinations/:id/enable`  | Session (operator+) | Enable destination  |
| POST   | `/api/destinations/:id/disable` | Session (operator+) | Disable destination |
| POST   | `/api/destinations/:id/test`    | Session (operator+) | Test destination    |

## Other endpoints

| Method                | Path                               | Auth                | Description                          |
| --------------------- | ---------------------------------- | ------------------- | ------------------------------------ |
| GET/POST/PATCH/DELETE | `/api/users`                       | Session (admin)     | User management                      |
| GET/POST/DELETE       | `/api/api-keys`                    | Session (admin)     | API key management                   |
| POST                  | `/api/api-keys/:id/rotate`         | Session (admin)     | Rotate API key                       |
| GET/POST/PATCH/DELETE | `/api/source-systems`              | Session             | Source system management             |
| GET/POST/PATCH/DELETE | `/api/mappings`                    | Session             | Mapping management                   |
| GET                   | `/api/delivery-attempts`           | Session             | Delivery attempt history             |
| POST                  | `/api/delivery-attempts/:id/retry` | Session (operator+) | Retry delivery                       |
| GET                   | `/api/audit-logs`                  | Session             | Audit log                            |
| GET                   | `/api/health`                      | None                | System health                        |
| GET                   | `/api/health/connectors`           | None                | Connector health                     |
| GET                   | `/api/health/destinations`         | None                | Destination health + delivery counts |

## Query parameters (GET /api/events)

| Param            | Description                            |
| ---------------- | -------------------------------------- |
| `q`              | Search event type or external event ID |
| `eventType`      | Filter by event type                   |
| `domain`         | Filter by domain                       |
| `status`         | Filter by status                       |
| `sourceSystemId` | Filter by source system                |
| `connectorId`    | Filter by connector                    |
| `from`           | Filter by occurredAt >= (ISO 8601)     |
| `to`             | Filter by occurredAt <= (ISO 8601)     |
| `page`           | Page number (default 1)                |
| `limit`          | Page size (default 20, max 100)        |
