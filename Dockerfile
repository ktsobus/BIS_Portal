# Production image for apps/web (Next.js standalone output).
#
#   docker build -t app .                   # runtime image (default target)
#   docker build -t app-migrate --target migrate .
#
# See docker-compose.prod.yml for a full self-hosted setup.

ARG NODE_VERSION=24

# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS base
# pnpm comes from corepack, pinned by "packageManager" in package.json.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# ---------------------------------------------------------------------------
# All workspace dependencies (dev included: needed to build and to migrate).
# `pnpm fetch` downloads everything from the lockfile alone, so this layer
# stays cached until the lockfile changes and no per-package package.json
# list has to be kept in sync. Root package.json only pins pnpm via corepack.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch
COPY . .
RUN pnpm install --frozen-lockfile --offline

# ---------------------------------------------------------------------------
FROM deps AS builder
# NEXT_PUBLIC_* variables are inlined into the bundle at build time.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
# lib/env.ts validates server env when modules load, which `next build` does
# while collecting page data. Placeholders satisfy it; they only exist for
# this RUN step and never reach the runtime image.
RUN DATABASE_URL=postgres://build:build@localhost:5432/build \
    BETTER_AUTH_SECRET=build-placeholder-secret-at-least-32-chars \
    BETTER_AUTH_URL=http://localhost:3000 \
    pnpm --filter web build

# ---------------------------------------------------------------------------
# One-off job that applies Drizzle migrations (needs DATABASE_URL at runtime).
FROM deps AS migrate
COPY apps/web/drizzle.config.ts apps/web/
COPY apps/web/db apps/web/db
WORKDIR /app/apps/web
CMD ["pnpm", "exec", "drizzle-kit", "migrate"]

# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

# The standalone server keeps the monorepo layout: server.js is in apps/web.
COPY --from=builder --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:3000/rpc/health/check || exit 1
# Run node directly (no npm/pnpm wrapper) so SIGTERM reaches the server and it
# can drain in-flight requests.
CMD ["node", "apps/web/server.js"]
