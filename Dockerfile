# ---- Stage 1: Install dependencies ----
FROM node:20 AS deps
RUN npm install -g bun
WORKDIR /app
COPY package.json bun.lock* .
RUN bun install --frozen-lockfile || npm install

# ---- Stage 2: Build ----
FROM node:20 AS builder
RUN npm install -g bun
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Build Next.js (standalone)
RUN bun run build

# ---- Stage 3: Production ----
FROM node:20 AS runner
RUN npm install -g bun
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

# Copy Prisma schema & seed script for migrations / initial data
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy full node_modules so entrypoint can run `prisma db push` (CLI) and
# `prisma/seed.ts` (needs @prisma/client + bcryptjs) at runtime.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Data directory for SQLite (persistent volume)
RUN mkdir -p /data && chown nextjs:nodejs /data

# Copy & mark the entrypoint executable as root (before dropping privileges)
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
