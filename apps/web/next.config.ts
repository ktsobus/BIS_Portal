import path from "node:path"

import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Self-contained server in .next/standalone, used by the root Dockerfile.
  output: "standalone",
  // Trace from the monorepo root so workspace packages (and pnpm's hoisted
  // node_modules) end up in the standalone output.
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  // The API contract package ships TypeScript source.
  transpilePackages: ["@workspace/api"],
  // Behind nginx (nginx-proxy in production), disable response buffering so
  // streaming and Suspense work.
  async headers() {
    return [
      {
        source: "/:path*{/}?",
        headers: [{ key: "X-Accel-Buffering", value: "no" }],
      },
    ]
  },
}

export default nextConfig
