# Connectors

Connectors are the inbound half of UC Open Edge. Each connector represents a connection to a specific operational system.

## Connector types

### webhook

Events are posted to `POST /api/ingest/webhook/:connectorKey`

Config:

```json
{
  "connectorKey": "my-connector",
  "signingSecret": "optional-hmac-secret",
  "signatureHeader": "x-webhook-signature"
}
```

### file_drop

Polls a folder for `.json` files.

Config:

```json
{
  "inboxPath": "/var/uc-open-edge/file-drop/wms",
  "processedFolder": "processed",
  "failedFolder": "failed",
  "pollIntervalMs": 5000
}
```

### csv

Polls a folder for `.csv` files with column-to-field mappings.

Config:

```json
{
  "inboxPath": "/var/uc-open-edge/file-drop/csv",
  "pollIntervalMs": 10000,
  "delimiter": ",",
  "hasHeader": true,
  "mapping": {
    "eventType": "inventory.movement.reported",
    "externalEventIdColumn": "movement_id",
    "occurredAtColumn": "completed_at",
    "quantityColumn": "qty",
    "columnMappings": {
      "sku_code": "skuRef.externalSku",
      "from_loc": "fromLocationRef.externalLocationId",
      "to_loc": "toLocationRef.externalLocationId"
    }
  }
}
```

### rest_poll

Polls an HTTP endpoint on an interval.

Config:

```json
{
  "url": "https://wms.internal/api/movements/since",
  "method": "GET",
  "headers": { "Authorization": "Bearer token" },
  "pollIntervalMs": 30000,
  "responsePath": "data.items",
  "eventType": "inventory.movement.reported",
  "externalEventIdField": "movementId",
  "occurredAtField": "completedAt",
  "fieldMappings": {
    "sku": "skuRef.externalSku",
    "fromLocation": "fromLocationRef.externalLocationId",
    "qty": "quantity"
  }
}
```

### mqtt

Subscribes to MQTT topics.

Config:

```json
{
  "brokerUrl": "mqtt://localhost:1883",
  "topics": [
    {
      "topic": "warehouse/movements/+",
      "eventType": "inventory.movement.reported"
    },
    {
      "topic": "sensors/readings/+",
      "eventType": "sensor.reading.observed"
    }
  ],
  "qos": 1
}
```

### opcua (stub)

> **Status**: Config model and interface only. Real node-opcua connections are deferred.
> Use file-drop or webhook with the example OPC UA event shapes to simulate.

See [docs/connector-opcua.md](connector-opcua.md) for extension path.

### Template connectors

`wms_template`, `wes_template`, `amr_template`, `manufacturing_template` — extend these for your specific systems. See the connector source files for the `mapXxxToEvent()` helper functions.
