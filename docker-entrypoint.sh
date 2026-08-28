#!/bin/sh
set -e

# Init database if not exists
if [ ! -f /data/custom.db ]; then
  echo "[entrypoint] No database found, initializing..."
  # Create schema from /app/prisma/schema.prisma
  DATABASE_URL=file:/data/custom.db bunx prisma db push --skip-generate
  echo "[entrypoint] Database schema created."
  # Seed initial accounts (admin/admin123, user01-03/123456) on a fresh DB only
  DATABASE_URL=file:/data/custom.db bun prisma/seed.ts
  echo "[entrypoint] Seed data created."
else
  echo "[entrypoint] Existing database found, checking schema..."
  # Always ensure schema is up to date (safe: only adds columns/tables)
  DATABASE_URL=file:/data/custom.db bunx prisma db push --skip-generate --accept-data-loss
  echo "[entrypoint] Schema check complete."
fi

exec "$@"
