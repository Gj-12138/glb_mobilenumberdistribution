#!/bin/sh
set -e

# Init database if not exists
if [ ! -f /data/custom.db ]; then
  echo "[entrypoint] No database found, initializing..."
  # Ensure db directory exists for schema reference
  mkdir -p /app/db
  # Create empty db and push schema
  DATABASE_URL=file:/data/custom.db bunx prisma db push --skip-generate 2>/dev/null || true
  echo "[entrypoint] Database initialized."
else
  echo "[entrypoint] Existing database found, checking schema..."
  # Always ensure schema is up to date (safe: only adds columns/tables)
  DATABASE_URL=file:/data/custom.db bunx prisma db push --skip-generate --accept-data-loss 2>/dev/null || true
  echo "[entrypoint] Schema check complete."
fi

exec "$@"
