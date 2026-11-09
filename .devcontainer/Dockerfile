FROM mcr.microsoft.com/devcontainers/typescript-node:5-24-trixie

# pnpm comes from corepack, pinned by "packageManager" in package.json.
RUN corepack enable \
  && apt-get update \
  && apt-get install -y --no-install-recommends postgresql-client \
  && rm -rf /var/lib/apt/lists/*
