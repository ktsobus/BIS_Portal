import path from "node:path"

import { defineConfig } from "vitest/config"

const root = import.meta.dirname

export default defineConfig({
  // tsconfig hat `jsx: preserve` (für Next.js); in Tests JSX selbst umwandeln.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: {
      "@": root,
      // Marker-Paket: ausserhalb von Next.js wäre der Import ein Fehler.
      "server-only": path.join(root, "node_modules/server-only/empty.js"),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.next/**"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
})
