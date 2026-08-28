# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare bun@latest --activate
WORKDIR /app
COPY package.json bun.lock* .
RUN bun install --frozen-lockfile || npm install

# ---- Stage 2: Build ----
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare bun@latest --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Build Next.js (standalone)
RUN bun run build

# ---- Stage 3: Production ----
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare bun@latest --activate
WORKDIR /app

ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/custom.db
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone .
COPY --from=builder --chown=nextjs:nodejs /app/.next/static .next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma schema & client for migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Data directory for SQLite (persistent volume)
RUN mkdir -p /data && chown nextjs:nodejs /data

# Create db directory for schema reference
RUN mkdir -p /app/db && chown nextjs:nodejs /app/db

USER nextjs

EXPOSE 3000

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
