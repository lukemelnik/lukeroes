# Umami Analytics Integration

## Status: Deployed (2026-03-21)

Self-hosted analytics via [Umami](https://umami.is) for tracking traffic sources and link clicks across lukeroes.com and Songkeeper.

## Architecture

- Standalone docker-compose at `/opt/umami/` on the VPS (independent of both app deploys)
- Public via Traefik subdomain (`analytics.lukeroes.com`) — built-in auth protects the dashboard
- Own dedicated Postgres container (clean isolation from both app databases)
- One Umami instance serves both lukeroes.com and Songkeeper (separate website IDs in the dashboard)
- `web` network for Traefik routing, `umami-internal` network for its Postgres

## VPS setup

### docker-compose.yml (`/opt/umami/docker-compose.yml`)

```yaml
services:
  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    environment:
      DATABASE_URL: postgresql://umami:${UMAMI_DB_PASSWORD}@umami-db:5432/umami
      APP_SECRET: ${UMAMI_APP_SECRET}
    networks:
      - web
      - umami-internal
    depends_on:
      umami-db:
        condition: service_healthy
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.umami.rule=Host(`analytics.lukeroes.com`)"
      - "traefik.http.routers.umami.entrypoints=websecure"
      - "traefik.http.routers.umami.tls=true"
      - "traefik.http.routers.umami.tls.certresolver=myresolver"
      - "traefik.http.services.umami.loadbalancer.server.port=3000"
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/api/heartbeat"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  umami-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: umami
      POSTGRES_USER: umami
      POSTGRES_PASSWORD: ${UMAMI_DB_PASSWORD}
    volumes:
      - umami-db-data:/var/lib/postgresql/data
    networks:
      - umami-internal
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U umami -d umami"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  umami-db-data:

networks:
  web:
    external: true
  umami-internal:
```

### .env (`/opt/umami/.env`)

```
UMAMI_DB_PASSWORD=<generated>
UMAMI_APP_SECRET=<generated>
```

## App integration

### Tracking script (all pages)

In `apps/web/src/routes/__root.tsx`, a deferred script tag in `<head>`:

```html
<script
  defer
  src="https://analytics.lukeroes.com/script.js"
  data-website-id="9411c20e-2f59-466e-8b0e-6ab690a00cbb"
/>
```

### Click tracking (links page)

In `apps/web/src/routes/links.tsx`, `data-umami-event` attributes on all interactive elements:

- Streaming links: `data-umami-event="Streaming click" data-umami-event-platform="spotify"`
- Main buttons: `data-umami-event="Link click" data-umami-event-label="Work with Me"`
- Social icons: `data-umami-event="Social click" data-umami-event-platform="instagram"`
- Mailing list: `data-umami-event="Mailing list subscribe"`

## Key decisions and notes

### DNS

`analytics.lukeroes.com` is an A record pointing to the same VPS IP as `lukeroes.com`. Traefik auto-provisions the TLS cert. This domain is shared across projects — Songkeeper tracking also sends data here. We chose this over a neutral domain for simplicity.

### Why public instead of Tailscale-only

The tracking script (`script.js`) and data endpoint (`/api/send`) must be publicly reachable because they're called from the visitor's browser, not from the server. We considered proxying these through the app (keeping Umami fully internal), but decided the simpler public approach was better since Umami has built-in auth and the audience (music fans) is unlikely to run ad blockers.

### Website IDs

Each tracked site gets its own UUID in Umami's dashboard. The ID is not secret — it's embedded in the public HTML. Data for each site is kept separate in the dashboard.

- **lukeroes.com**: `9411c20e-2f59-466e-8b0e-6ab690a00cbb`
- **Songkeeper**: (to be added)

### Own Postgres vs shared

Umami runs its own Postgres container rather than sharing lukeroes's or Songkeeper's. This means restarting or migrating either app's database doesn't affect analytics, and vice versa. The overhead is minimal (~30-50MB RAM idle).

### UTM params for social media attribution

In-app browsers (TikTok, Instagram) strip the HTTP Referer header, so UTM params are required to attribute traffic. Use different URLs in each platform's bio:

- TikTok: `lukeroes.com/links?utm_source=tiktok&utm_medium=social`
- Instagram: `lukeroes.com/links?utm_source=instagram&utm_medium=social`
- Twitter/X: `lukeroes.com/links?utm_source=twitter&utm_medium=social`

Umami captures all UTM params automatically and displays them in a dedicated dashboard section.

### Managing Umami

```bash
# Check status
ssh hetzner "cd /opt/umami && docker compose ps"

# View logs
ssh hetzner "cd /opt/umami && docker compose logs umami --tail 50"

# Restart
ssh hetzner "cd /opt/umami && docker compose restart"

# Update Umami
ssh hetzner "cd /opt/umami && docker compose pull && docker compose up -d"
```
