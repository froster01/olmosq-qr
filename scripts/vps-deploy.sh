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
  SERVICE="app-prod"
else
  SERVICE="app-staging"
fi

git fetch origin "$GIT_REF"
git checkout --detach FETCH_HEAD

docker compose --env-file .env.vps -f compose.vps.yml build "$SERVICE"
scripts/vps-migrate.sh "$ENVIRONMENT"
docker compose --env-file .env.vps -f compose.vps.yml up -d "$SERVICE" reverse-proxy
