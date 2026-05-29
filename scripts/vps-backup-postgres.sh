#!/usr/bin/env sh
set -eu

if [ "${1:-}" != "staging" ] && [ "${1:-}" != "production" ]; then
  echo "Usage: scripts/vps-backup-postgres.sh <staging|production>" >&2
  exit 1
fi

ENVIRONMENT="$1"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$BACKUP_DIR"

if [ "$ENVIRONMENT" = "production" ]; then
  CONTAINER="olmosq-postgres-prod"
  DB_KEY="PROD_POSTGRES_DB"
  USER_KEY="PROD_POSTGRES_USER"
else
  CONTAINER="olmosq-postgres-staging"
  DB_KEY="STAGING_POSTGRES_DB"
  USER_KEY="STAGING_POSTGRES_USER"
fi

POSTGRES_DB="$(awk -F= -v key="$DB_KEY" '$1 == key { print $2 }' .env.vps)"
POSTGRES_USER="$(awk -F= -v key="$USER_KEY" '$1 == key { print $2 }' .env.vps)"
OUTPUT_FILE="$BACKUP_DIR/${ENVIRONMENT}-${POSTGRES_DB}-${TIMESTAMP}.dump"

docker exec "$CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$OUTPUT_FILE"

echo "Wrote $OUTPUT_FILE"
