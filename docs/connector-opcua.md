# OPC UA Connector

## Status: Interface + Config Model Only (MVP Stub)

The OPC UA connector (`connectors/opcua`) ships with:

- A complete, production-ready config schema (`OpcUaConnectorConfigSchema`)
- The `IConnector` interface implemented
- Example OPC UA event shapes for simulation via file-drop or webhook

Real `node-opcua` connections are **deferred** to v0.2. The `node-opcua` package requires native builds (~100MB) and is a significant integration effort. Rather than fake a working implementation, we provide the extension path.

## Simulating OPC UA events

Use the file-drop connector to drop JSON files with OPC UA-shaped events:

```json
{
  "eventType": "sensor.reading.observed",
  "externalEventId": "opcua-ns2-i1001-1720180800",
  "occurredAt": "2026-07-05T12:00:00.000Z",
  "equipmentRef": { "externalEquipmentId": "PLC-LINE-1" },
  "payload": {
    "nodeId": "ns=2;i=1001",
    "displayName": "ConveyorSpeed",
    "value": 1.23,
    "unit": "m/s",
    "quality": "Good"
  },
  "metadata": { "source": "opc-ua-simulator" }
}
```

## Extension path

1. Add the dependency:
   ```bash
   pnpm --filter @uc-open-edge/connector-opcua add node-opcua
   ```
2. Import in `connectors/opcua/src/index.ts`:
   ```typescript
   import {
     OPCUAClient,
     MessageSecurityMode,
     SecurityPolicy,
     ClientSubscription,
   } from 'node-opcua';
   ```
3. In `start()`:
   - Create `OPCUAClient.create({ ... })`
   - Connect to `config.endpointUrl`
   - Create a session
   - Create a `ClientSubscription` with `publishingIntervalMs`
   - For each node in `config.nodes`: add `ClientMonitoredItem`
   - On `dataValueChanged`: call `ctx.submitEvent()` with event payload
4. On `connectionLost`: reconnect with backoff, call `ctx.reportHealth('error', ...)`
5. In `stop()`: terminate subscription, close session, disconnect

See [node-opcua documentation](https://node-opcua.github.io/api_doc/) for full API details.
