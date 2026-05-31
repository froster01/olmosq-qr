#!/usr/bin/env sh
set -eu

if [ "${1:-}" != "staging" ] && [ "${1:-}" != "production" ]; then
  echo "Usage: scripts/vps-deploy.sh <staging|production> <git-ref>" >&2
  exit 1
fi

if [ -z "${2:-}" ]; then
  echo "Usage: scripts/vps-deploy.sh <staging|production> <git-ref>" >&2
  exit 1
fi

ENVIRONMENT="$1"
GIT_REF="$2"
ENV_FILE=".env.vps"

require_env_file() {
  if [ ! -f "$ENV_FILE" ]; then
    echo "Missing $ENV_FILE. Add it on the VPS or configure the VPS_ENV_FILE GitHub secret." >&2
    exit 1
  fi
}

require_env_key() {
  KEY="$1"
  if ! awk -F= -v key="$KEY" '
    $1 == key {
      value = substr($0, length(key) + 2)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
      gsub(/^"|"$/, "", value)
      gsub(/^'\''|'\''$/, "", value)
      if (value != "") found = 1
    }
    END { exit found ? 0 : 1 }
  ' "$ENV_FILE"; then
    echo "Missing required $ENV_FILE key: $KEY" >&2
    exit 1
  fi
}

if [ "$ENVIRONMENT" = "production" ]; then
  APP_SERVICE="app-prod"
  WORKER_SERVICE="worker-prod"
  REQUIRED_PREFIX="PROD"
else
  APP_SERVICE="app-staging"
  WORKER_SERVICE="worker-staging"
  REQUIRED_PREFIX="STAGING"
fi

echo "Deploying $ENVIRONMENT with app service $APP_SERVICE and worker service $WORKER_SERVICE"

git fetch origin "$GIT_REF"
git checkout --detach FETCH_HEAD

require_env_file
require_env_key "${REQUIRED_PREFIX}_DOMAIN"
require_env_key "${REQUIRED_PREFIX}_POSTGRES_DB"
require_env_key "${REQUIRED_PREFIX}_POSTGRES_USER"
require_env_key "${REQUIRED_PREFIX}_POSTGRES_PASSWORD"
require_env_key "${REQUIRED_PREFIX}_LOYVERSE_ACCESS_TOKEN"
require_env_key "${REQUIRED_PREFIX}_LOYVERSE_STORE_ID"
require_env_key "${REQUIRED_PREFIX}_STAFF_JWT_SECRET"
require_env_key "${REQUIRED_PREFIX}_NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY"
require_env_key "${REQUIRED_PREFIX}_WEB_PUSH_VAPID_PRIVATE_KEY"
require_env_key "${REQUIRED_PREFIX}_WEB_PUSH_CONTACT_EMAIL"

docker compose --env-file "$ENV_FILE" -f compose.vps.yml config --services | grep -x "$APP_SERVICE" >/dev/null
docker compose --env-file "$ENV_FILE" -f compose.vps.yml config --services | grep -x "$WORKER_SERVICE" >/dev/null

docker compose --env-file "$ENV_FILE" -f compose.vps.yml build "$APP_SERVICE" "$WORKER_SERVICE"
scripts/vps-migrate.sh "$ENVIRONMENT"
docker compose --env-file "$ENV_FILE" -f compose.vps.yml up -d "$APP_SERVICE" "$WORKER_SERVICE" reverse-proxy
docker compose --env-file "$ENV_FILE" -f compose.vps.yml ps "$APP_SERVICE" "$WORKER_SERVICE"
docker compose --env-file "$ENV_FILE" -f compose.vps.yml ps --status running "$WORKER_SERVICE" | grep "$WORKER_SERVICE" >/dev/null
