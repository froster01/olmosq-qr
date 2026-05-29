#!/usr/bin/env sh
set -eu

echo "Running Prisma migrations against local Docker database..."
docker compose exec app-local npx prisma migrate deploy
echo "Done."
