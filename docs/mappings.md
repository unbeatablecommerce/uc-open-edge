# Mappings

Mappings translate external identifiers (from source systems) to internal standardized identifiers.

## Types

| Type        | External field        | Internal field        | Example                           |
| ----------- | --------------------- | --------------------- | --------------------------------- |
| `sku`       | `externalSku`         | `internalSku`         | `WMS-ITEM-001` → `SKU-001`        |
| `location`  | `externalLocationId`  | `internalLocationId`  | `BIN-A-01-01` → `ZONE-A-SLOT-001` |
| `equipment` | `externalEquipmentId` | `internalEquipmentId` | `PLC-LINE-1` → `CONVEYOR-MAIN`    |
| `robot`     | `externalRobotId`     | `internalRobotId`     | `BOT-001` → `AMR-FLEET-001`       |

## Schema

Mappings can be scoped to a specific source system or applied globally.

| Field            | Type    | Description                               |
| ---------------- | ------- | ----------------------------------------- |
| `id`             | string  | UUID                                      |
| `type`           | enum    | `sku`, `location`, `equipment`, `robot`   |
| `sourceSystemId` | string? | Scope to a source system (null = global)  |
| `externalKey`    | string  | The raw identifier from the source system |
| `internalKey`    | string  | The canonical identifier in your platform |
| `label`          | string? | Optional human-readable label             |
| `metadata`       | json?   | Optional additional data                  |

## How normalization uses mappings

During the pipeline's normalization step, the mapper looks up:

- `skuRef.externalSku` → `skuRef.internalSku`
- `fromLocationRef.externalLocationId` → `fromLocationRef.internalLocationId`
- `toLocationRef.externalLocationId` → `toLocationRef.internalLocationId`
- `equipmentRef.externalEquipmentId` → `equipmentRef.internalEquipmentId`
- `robotRef.externalRobotId` → `robotRef.internalRobotId`

The resolved internal keys are stored in the `NormalizedEvent` so downstream destinations always receive canonical identifiers.

## API

```
GET    /api/mappings?type=sku&sourceSystemId=xxx  - List mappings
POST   /api/mappings                              - Create mapping
PATCH  /api/mappings/:id                          - Update mapping
DELETE /api/mappings/:id                          - Delete mapping
```

## Bulk import

Use the admin UI (Mappings page) or `POST /api/mappings` in a loop to import from CSV.
