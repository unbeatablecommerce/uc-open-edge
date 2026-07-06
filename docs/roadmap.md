# Roadmap

## MVP (v0.1)

The current release includes:

- Fastify API with full CRUD endpoints
- SvelteKit admin UI (all pages)
- PostgreSQL via Prisma (14 models)
- Webhook, file-drop, CSV, REST poll, MQTT connectors
- HTTP, file, webhook (HMAC), MQTT destinations
- Delivery queue with exponential backoff
- Deduplication (3 strategies)
- Argon2 password hashing, session auth, API key auth
- RBAC (admin/operator/viewer)
- Audit logging
- Docker Compose deployment
- 6 example demos

## Planned (future releases)

### v0.2 — OPC UA

- Real `node-opcua` integration for the OPC UA connector
- Certificate-based security modes
- Sparkplug B payload support

### v0.3 — Advanced delivery

- Dead-letter queues for permanently failed deliveries
- Event replay from raw events
- Per-destination retry configuration
- Prometheus/OpenTelemetry metrics

### v0.4 — Schema management

- Schema versioning for event types
- Breaking change detection
- Schema registry UI

### v0.5 — Plugin system

- Dynamic connector/destination loading from npm packages
- Connector certification process

### v0.6 — Multi-site

- Multi-site management (multiple edge nodes)
- Edge-to-edge synchronization
- Central management plane

### Future

- TLS configuration wizard
- Advanced RBAC (custom roles, per-resource permissions)
- AI-assisted mapping builder
- Graphical pipeline builder
- HA deployment (multiple workers)
- AMQP/RabbitMQ destination
- Kafka destination
