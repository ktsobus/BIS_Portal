/**
 * Wird einmal pro Server-Instanz beim Start aufgerufen (Next.js
 * Instrumentation). Prüft die Katalog-Datenquelle und startet den
 * Katalog-Sync mit LeanIX – nur in der Node.js-Runtime und nicht während
 * `next build`.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (process.env.NEXT_PHASE === "phase-production-build") return

  const { catalogSource, env } = await import("@/lib/env")
  const { catalogSourceWarning } = await import("@/lib/catalog/startup-check")
  const warning = catalogSourceWarning({
    nodeEnv: env.NODE_ENV,
    catalogSource,
    configuredSource: process.env.CATALOG_SOURCE,
    tokenConfigured: Boolean(env.LEANIX_API_TOKEN),
  })
  if (warning) console.warn(warning)

  const { startCatalogScheduler } = await import("@/lib/catalog/scheduler")
  startCatalogScheduler()
}
