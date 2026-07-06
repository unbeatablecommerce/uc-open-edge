# Destinations

Destinations are the outbound half of UC Open Edge. Events are delivered with exponential backoff retries (up to 5 attempts by default).

## Destination types

### http

Simple HTTP POST/PUT/PATCH to any endpoint.

Config:

```json
{
  "url": "https://erp.example.com/api/events",
  "method": "POST",
  "headers": { "Authorization": "Bearer token" },
  "timeoutMs": 10000
}
```

### file

Appends events as JSONL to a file. Supports daily rotation.

Config:

```json
{
  "filePath": "/var/log/ucedge/events.jsonl",
  "rotateDailyPath": true,
  "prettyPrint": false
}
```

### webhook

HTTP POST with optional HMAC signature for verification by the receiver.

Config:

```json
{
  "url": "https://webhook.site/your-id",
  "signingSecret": "my-secret",
  "signatureHeader": "x-ucedge-signature-256",
  "signatureAlgorithm": "sha256"
}
```

To verify the signature on the receiving end:

```javascript
const signature = createHmac('sha256', secret).update(rawBody).digest('hex');
const expected = `sha256=${signature}`;
const received = req.headers['x-ucedge-signature-256'];
if (!timingSafeEqual(Buffer.from(expected), Buffer.from(received))) {
  // reject
}
```

### mqtt

Publishes events to an MQTT broker. Topic supports `{domain}` and `{eventType}` placeholders.

Config:

```json
{
  "brokerUrl": "mqtt://localhost:1883",
  "topicTemplate": "ucedge/events/{domain}/{eventType}",
  "qos": 1
}
```

## Delivery retries

Events are queued in the `event_deliveries` table. The worker polls for `status=pending AND nextAttemptAt <= now`.

Backoff schedule (with default 5s initial delay):

- Attempt 1: immediate
- Attempt 2: 5s
- Attempt 3: 10s
- Attempt 4: 20s
- Attempt 5: 40s
- After 5 failures: marked `failed` (manual retry available in admin UI)
