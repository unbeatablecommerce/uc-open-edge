# Security Model

## Authentication

**Admin UI**: HTTP-only, SameSite=lax session cookies. Tokens are 48-byte random values, stored as SHA-256 hashes.

**Ingest API**: API keys in the format `ucedge_<8-char-prefix>_<32-byte-base64url>`. Only the SHA-256 hash is stored. The prefix enables fast database lookup without scanning all keys.

## Password hashing

All passwords are hashed with Argon2id using `@node-rs/argon2` (pre-built binaries, no node-gyp required):

```
memoryCost: 65536  (64 MB)
timeCost:   3      (3 iterations)
outputLen:  32     (32 bytes)
parallelism: 1
```

## RBAC

| Role       | Permissions                                                        |
| ---------- | ------------------------------------------------------------------ |
| `admin`    | All operations                                                     |
| `operator` | Events, connectors, destinations, mappings, raw events, deliveries |
| `viewer`   | Read-only access to events, connectors, destinations, deliveries   |

## Audit logging

All mutations are recorded in the `audit_logs` table:

- User creation/modification/deactivation
- API key creation/revocation/rotation
- Connector creation/modification/enable/disable
- Destination creation/modification/enable/disable
- Event reprocessing
- Delivery retries
- Mapping creation/modification/deletion
- Login/logout

## Data in transit

- Use HTTPS in production (set up at the reverse proxy layer)
- Session cookies are `secure: true` when `NODE_ENV=production`
- Webhook destinations support HMAC signing

## Threat model

- **Unauthenticated ingest**: All ingest endpoints require a valid API key
- **Unauthorized admin access**: All admin mutations require a session with appropriate role
- **Credential exposure**: Passwords and API keys are never stored in plain text
- **Session fixation**: Session tokens are cryptographically random
- **Replay attacks**: API keys can be rotated; sessions have a 7-day TTL
