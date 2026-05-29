# VPS Docker Deployment

This stack runs production and staging on one VPS with isolated local Postgres
containers. It is designed for a 4 vCPU / 8 GB RAM server.

## Containers

- `olmosq-reverse-proxy`: Caddy reverse proxy for HTTPS
- `olmosq-app-prod`: production Next.js app
- `olmosq-app-staging`: staging Next.js app
- `olmosq-postgres-prod`: production Postgres
- `olmosq-postgres-staging`: staging Postgres

Production and staging use separate Docker networks and Postgres volumes.

## First Setup

1. Point DNS records at the VPS:

   ```txt
   yourdomain.com          A  <vps-ip>
   staging.yourdomain.com  A  <vps-ip>
   ```

2. Copy the single VPS env template:

   ```bash
   cp .env.vps.example .env.vps
   ```

3. Edit `.env.vps`. Use strong, different database passwords for production
   and staging. The Compose file builds `DATABASE_URL` and `DIRECT_URL`
   automatically from those values.

4. Start the stack:

   ```bash
   docker compose --env-file .env.vps -f compose.vps.yml up -d --build
   ```

5. Run migrations on staging first:

   ```bash
   scripts/vps-migrate.sh staging
   ```

6. Verify staging, then run production migrations:

   ```bash
   scripts/vps-migrate.sh production
   ```

## Deploy Updates

Build and restart both app containers:

```bash
docker compose --env-file .env.vps -f compose.vps.yml up -d --build app-staging app-prod
```

Recommended release flow:

1. Deploy staging.
2. Run `scripts/vps-migrate.sh staging`.
3. Verify `https://staging.yourdomain.com`.
4. Deploy production.
5. Run `scripts/vps-migrate.sh production`.
6. Verify `https://yourdomain.com`.

## GitHub CI/CD

The repo includes three GitHub Actions workflows:

- `CI`: runs on pull requests and pushes to `main` or `staging`
- `Deploy Staging`: runs after pushes to `staging` or manually from `staging`
- `Deploy Production`: runs after pushes to `main` or manually from `main`

Create these repository or environment secrets in GitHub:

```txt
VPS_HOST       # VPS IP or hostname
VPS_USER       # SSH user, for example deploy
VPS_SSH_KEY    # private key allowed to SSH into the VPS
VPS_SSH_PORT   # usually 22
VPS_SSH_FINGERPRINT # server host key fingerprint
VPS_APP_DIR    # repo directory on VPS, for example /opt/olmosq-qr
```

Get the VPS host key fingerprint from your machine:

```bash
ssh-keyscan -p 22 your-vps-host | ssh-keygen -lf -
```

Recommended GitHub environments:

- `staging`: no approval required
- `production`: require manual approval before deployment

Add these environment variables in GitHub:

```txt
STAGING_URL     # for staging environment, for example https://staging.yourdomain.com
PRODUCTION_URL  # for production environment, for example https://yourdomain.com
```

The deploy workflows SSH into the VPS, check out the exact commit that passed
CI, build only the target app image, run the target migration, then restart that
target app and the reverse proxy.

The same VPS deploy logic is available locally:

```bash
scripts/vps-deploy.sh staging <git-sha-or-branch>
scripts/vps-deploy.sh production <git-sha-or-branch>
```

## Backups

Create a production backup:

```bash
scripts/vps-backup-postgres.sh production
```

Create a staging backup:

```bash
scripts/vps-backup-postgres.sh staging
```

Production backups should be copied off the VPS by cron, rsync, S3-compatible
storage, or another external backup target.

## WebSocket Note

With one production app container, a future in-memory WebSocket broadcaster is
safe. If production later runs multiple app replicas, add Redis pub/sub so all
replicas receive the same order events.
