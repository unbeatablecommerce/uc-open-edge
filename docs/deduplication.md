# Deduplication

UC Open Edge deduplicates events using three strategies in priority order.

## Strategy 1: sourceSystemId + externalEventId

**Used when**: The event has `externalEventId` and the connector has a `sourceSystemId`.

**Logic**: Checks for an existing `NormalizedEvent` with the same `(sourceSystemId, externalEventId)` pair.

This is the most reliable deduplication strategy. Use it whenever your source system provides stable, unique event identifiers.

```json
{ "externalEventId": "WMS-MOVE-12345" }
```

## Strategy 2: connectorId + dedupeKey

**Used when**: The event has `dedupeKey` set.

**Logic**: Checks for an existing `NormalizedEvent` with the same `(connectorId, dedupeKey)` pair.

Useful when the source system doesn't provide event IDs but you can construct a meaningful dedup key.

```json
{ "dedupeKey": "MOVE-SKU-ABC-FROM-BULK-TO-PICK-2026070512" }
```

## Strategy 3: Payload hash + occurredAt window

**Used when**: Neither of the above are available.

**Logic**: Computes a SHA-256 hash of the entire event payload (keys sorted for determinism). Checks for an existing `RawEvent` with the same hash within a ±5 minute window of `occurredAt`.

This is a best-effort fallback and may miss duplicates if the payload varies slightly between attempts.

## Duplicate handling

When a duplicate is detected:

- The `RawEvent` is stored with `validationStatus=duplicate`
- The `normalizedEventId` of the original is recorded
- The pipeline returns `{ isDuplicate: true, duplicateOfId: "..." }`
- HTTP status 200 is returned (not 201) for webhook ingest

Duplicates are **never dropped silently** — they are always stored and traceable.
