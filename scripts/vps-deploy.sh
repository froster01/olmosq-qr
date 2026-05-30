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

if [ "$ENVIRONMENT" = "production" ]; then
  APP_SERVICE="app-prod"
  WORKER_SERVICE="worker-prod"
else
  APP_SERVICE="app-staging"
  WORKER_SERVICE="worker-staging"
fi

echo "Deploying $ENVIRONMENT with app service $APP_SERVICE and worker service $WORKER_SERVICE"

git fetch origin "$GIT_REF"
git checkout --detach FETCH_HEAD

docker compose --env-file .env.vps -f compose.vps.yml config --services | grep -x "$APP_SERVICE" >/dev/null
docker compose --env-file .env.vps -f compose.vps.yml config --services | grep -x "$WORKER_SERVICE" >/dev/null

docker compose --env-file .env.vps -f compose.vps.yml build "$APP_SERVICE" "$WORKER_SERVICE"
scripts/vps-migrate.sh "$ENVIRONMENT"
docker compose --env-file .env.vps -f compose.vps.yml up -d "$APP_SERVICE" "$WORKER_SERVICE" reverse-proxy
docker compose --env-file .env.vps -f compose.vps.yml ps "$APP_SERVICE" "$WORKER_SERVICE"
docker compose --env-file .env.vps -f compose.vps.yml ps --status running "$WORKER_SERVICE" | grep "$WORKER_SERVICE" >/dev/null
