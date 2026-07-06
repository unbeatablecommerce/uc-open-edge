# Deployment Guide

## Docker Compose (recommended)

```bash
cp .env.example .env
# Edit .env — set SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
docker compose up -d
pnpm db:seed  # Or: docker compose exec api node dist/seed.js
```

## Environment variables

| Variable          | Required  | Description                                                |
| ----------------- | --------- | ---------------------------------------------------------- |
| `DATABASE_URL`    | Yes       | PostgreSQL connection string                               |
| `SESSION_SECRET`  | Yes       | Random string, min 32 chars                                |
| `ADMIN_EMAIL`     | Seed only | Initial admin email                                        |
| `ADMIN_PASSWORD`  | Seed only | Initial admin password (min 12 chars)                      |
| `API_PORT`        | No        | API port (default 3001)                                    |
| `ADMIN_PORT`      | No        | Admin UI port (default 3000)                               |
| `LOG_LEVEL`       | No        | trace/debug/info/warn/error (default info)                 |
| `FILE_DROP_ROOT`  | No        | File drop inbox path (default /var/uc-open-edge/file-drop) |
| `CORS_ORIGINS`    | No        | Comma-separated CORS origins                               |
| `MQTT_BROKER_URL` | No        | MQTT broker URL (for MQTT connector/destination)           |

## Production checklist

- [ ] Generate a strong `SESSION_SECRET`: `openssl rand -hex 32`
- [ ] Set `NODE_ENV=production`
- [ ] Use a dedicated Postgres instance (not the Docker Compose one for production)
- [ ] Set up regular Postgres backups
- [ ] Review CORS origins to only include your admin UI origin
- [ ] Use HTTPS in production (reverse proxy with nginx/Caddy)
- [ ] Set `secure: true` on session cookies (auto when `NODE_ENV=production`)

## MQTT profile

```bash
docker compose --profile mqtt up -d
```

## Reverse proxy (nginx example)

```nginx
server {
  listen 443 ssl;
  server_name ucedge.internal;

  location /api/ {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
  }
}
```
