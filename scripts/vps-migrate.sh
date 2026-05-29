#!/usr/bin/env sh
set -eu

if [ "${1:-}" != "staging" ] && [ "${1:-}" != "production" ]; then
  echo "Usage: scripts/vps-migrate.sh <staging|production>" >&2
  exit 1
fi

ENVIRONMENT="$1"

if [ "$ENVIRONMENT" = "production" ]; then
  SERVICE="app-prod"
else
  SERVICE="app-staging"
fi

docker compose --env-file .env.vps -f compose.vps.yml run --rm "$SERVICE" npx prisma migrate deploy
