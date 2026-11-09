import "server-only"

import { parseServerEnv, resolveCatalogSource } from "./env-schema"

/** Geprüfte Umgebungsvariablen (Schema in `lib/env-schema.ts`). */
export const env = parseServerEnv(process.env)

/** Effektive Datenquelle: ohne Token immer Demo. */
export const catalogSource: "leanix" | "demo" = resolveCatalogSource(env)
