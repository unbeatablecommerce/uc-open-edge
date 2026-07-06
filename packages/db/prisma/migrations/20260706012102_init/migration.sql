-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'operator', 'viewer');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('pending', 'processing', 'normalized', 'invalid', 'duplicate', 'failed');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('pending', 'in_progress', 'delivered', 'failed', 'skipped');

-- CreateEnum
CREATE TYPE "ConnectorType" AS ENUM ('webhook', 'file_drop', 'csv', 'rest_poll', 'mqtt', 'opcua', 'wms_template', 'wes_template', 'amr_template', 'manufacturing_template');

-- CreateEnum
CREATE TYPE "ConnectorStatus" AS ENUM ('active', 'error', 'idle', 'disabled');

-- CreateEnum
CREATE TYPE "DestinationType" AS ENUM ('http', 'file', 'webhook', 'mqtt');

-- CreateEnum
CREATE TYPE "DestinationStatus" AS ENUM ('active', 'error', 'idle', 'disabled');

-- CreateEnum
CREATE TYPE "MappingType" AS ENUM ('sku', 'location', 'equipment', 'robot', 'custom');

-- CreateEnum
CREATE TYPE "EventDomain" AS ENUM ('inventory', 'location', 'task', 'equipment', 'robotics', 'manufacturing', 'quality', 'maintenance', 'sensor', 'container', 'shipment', 'order_fulfillment', 'system');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'viewer',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'ingest',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "userId" TEXT,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_systems" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connectors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ConnectorType" NOT NULL,
    "sourceSystemId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" "ConnectorStatus" NOT NULL DEFAULT 'idle',
    "lastSeenAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DestinationType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" "DestinationStatus" NOT NULL DEFAULT 'idle',
    "lastSuccessAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_events" (
    "id" TEXT NOT NULL,
    "sourceSystemId" TEXT,
    "connectorId" TEXT,
    "externalEventId" TEXT,
    "payload" JSONB NOT NULL,
    "headers" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parseStatus" TEXT NOT NULL DEFAULT 'ok',
    "validationStatus" TEXT NOT NULL DEFAULT 'pending',
    "normalizedEventId" TEXT,
    "errorMessage" TEXT,
    "payloadHash" TEXT,

    CONSTRAINT "raw_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "normalized_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "domain" "EventDomain" NOT NULL,
    "sourceSystemId" TEXT,
    "connectorId" TEXT,
    "rawEventId" TEXT,
    "externalEventId" TEXT,
    "dedupeKey" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "status" "EventStatus" NOT NULL DEFAULT 'pending',
    "siteRef" JSONB,
    "areaRef" JSONB,
    "zoneRef" JSONB,
    "locationRef" JSONB,
    "fromLocationRef" JSONB,
    "toLocationRef" JSONB,
    "skuRef" JSONB,
    "itemRef" JSONB,
    "containerRef" JSONB,
    "equipmentRef" JSONB,
    "robotRef" JSONB,
    "taskRef" JSONB,
    "workOrderRef" JSONB,
    "quantity" DECIMAL(65,30),
    "unitOfMeasure" TEXT,
    "payload" JSONB,
    "metadata" JSONB,
    "validationErrors" JSONB,

    CONSTRAINT "normalized_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_deliveries" (
    "id" TEXT NOT NULL,
    "normalizedEventId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAttemptAt" TIMESTAMP(3),
    "lastStatusCode" INTEGER,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_attempts" (
    "id" TEXT NOT NULL,
    "eventDeliveryId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "normalizedEventId" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL,
    "statusCode" INTEGER,
    "requestBody" JSONB,
    "responseBody" TEXT,
    "error" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER,

    CONSTRAINT "delivery_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mappings" (
    "id" TEXT NOT NULL,
    "sourceSystemId" TEXT,
    "type" "MappingType" NOT NULL,
    "externalKey" TEXT NOT NULL,
    "internalKey" TEXT NOT NULL,
    "displayName" TEXT,
    "metadata" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connector_health" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "status" "ConnectorStatus" NOT NULL,
    "message" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "connector_health_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_keyPrefix_idx" ON "api_keys"("keyPrefix");

-- CreateIndex
CREATE UNIQUE INDEX "source_systems_name_key" ON "source_systems"("name");

-- CreateIndex
CREATE UNIQUE INDEX "connectors_name_key" ON "connectors"("name");

-- CreateIndex
CREATE INDEX "connectors_sourceSystemId_idx" ON "connectors"("sourceSystemId");

-- CreateIndex
CREATE INDEX "connectors_type_idx" ON "connectors"("type");

-- CreateIndex
CREATE UNIQUE INDEX "destinations_name_key" ON "destinations"("name");

-- CreateIndex
CREATE INDEX "destinations_type_idx" ON "destinations"("type");

-- CreateIndex
CREATE INDEX "raw_events_connectorId_idx" ON "raw_events"("connectorId");

-- CreateIndex
CREATE INDEX "raw_events_sourceSystemId_idx" ON "raw_events"("sourceSystemId");

-- CreateIndex
CREATE INDEX "raw_events_receivedAt_idx" ON "raw_events"("receivedAt");

-- CreateIndex
CREATE INDEX "raw_events_payloadHash_idx" ON "raw_events"("payloadHash");

-- CreateIndex
CREATE UNIQUE INDEX "normalized_events_eventId_key" ON "normalized_events"("eventId");

-- CreateIndex
CREATE INDEX "normalized_events_eventType_idx" ON "normalized_events"("eventType");

-- CreateIndex
CREATE INDEX "normalized_events_domain_idx" ON "normalized_events"("domain");

-- CreateIndex
CREATE INDEX "normalized_events_occurredAt_idx" ON "normalized_events"("occurredAt");

-- CreateIndex
CREATE INDEX "normalized_events_receivedAt_idx" ON "normalized_events"("receivedAt");

-- CreateIndex
CREATE INDEX "normalized_events_status_idx" ON "normalized_events"("status");

-- CreateIndex
CREATE UNIQUE INDEX "normalized_events_sourceSystemId_externalEventId_key" ON "normalized_events"("sourceSystemId", "externalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "normalized_events_connectorId_dedupeKey_key" ON "normalized_events"("connectorId", "dedupeKey");

-- CreateIndex
CREATE INDEX "event_deliveries_status_idx" ON "event_deliveries"("status");

-- CreateIndex
CREATE INDEX "event_deliveries_nextAttemptAt_idx" ON "event_deliveries"("nextAttemptAt");

-- CreateIndex
CREATE INDEX "event_deliveries_destinationId_idx" ON "event_deliveries"("destinationId");

-- CreateIndex
CREATE UNIQUE INDEX "event_deliveries_normalizedEventId_destinationId_key" ON "event_deliveries"("normalizedEventId", "destinationId");

-- CreateIndex
CREATE INDEX "delivery_attempts_eventDeliveryId_idx" ON "delivery_attempts"("eventDeliveryId");

-- CreateIndex
CREATE INDEX "delivery_attempts_destinationId_idx" ON "delivery_attempts"("destinationId");

-- CreateIndex
CREATE INDEX "delivery_attempts_attemptedAt_idx" ON "delivery_attempts"("attemptedAt");

-- CreateIndex
CREATE INDEX "mappings_type_idx" ON "mappings"("type");

-- CreateIndex
CREATE UNIQUE INDEX "mappings_sourceSystemId_type_externalKey_key" ON "mappings"("sourceSystemId", "type", "externalKey");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_idx" ON "audit_logs"("actorUserId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_key_key" ON "app_settings"("key");

-- CreateIndex
CREATE INDEX "connector_health_connectorId_idx" ON "connector_health"("connectorId");

-- CreateIndex
CREATE INDEX "connector_health_checkedAt_idx" ON "connector_health"("checkedAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connectors" ADD CONSTRAINT "connectors_sourceSystemId_fkey" FOREIGN KEY ("sourceSystemId") REFERENCES "source_systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_events" ADD CONSTRAINT "raw_events_sourceSystemId_fkey" FOREIGN KEY ("sourceSystemId") REFERENCES "source_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_events" ADD CONSTRAINT "raw_events_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "connectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_events" ADD CONSTRAINT "raw_events_normalizedEventId_fkey" FOREIGN KEY ("normalizedEventId") REFERENCES "normalized_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normalized_events" ADD CONSTRAINT "normalized_events_sourceSystemId_fkey" FOREIGN KEY ("sourceSystemId") REFERENCES "source_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normalized_events" ADD CONSTRAINT "normalized_events_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "connectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_deliveries" ADD CONSTRAINT "event_deliveries_normalizedEventId_fkey" FOREIGN KEY ("normalizedEventId") REFERENCES "normalized_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_deliveries" ADD CONSTRAINT "event_deliveries_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_eventDeliveryId_fkey" FOREIGN KEY ("eventDeliveryId") REFERENCES "event_deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_normalizedEventId_fkey" FOREIGN KEY ("normalizedEventId") REFERENCES "normalized_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mappings" ADD CONSTRAINT "mappings_sourceSystemId_fkey" FOREIGN KEY ("sourceSystemId") REFERENCES "source_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connector_health" ADD CONSTRAINT "connector_health_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "connectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
