/**
 * Wird einmal pro Server-Instanz beim Start aufgerufen (Next.js
 * Instrumentation). Startet den Katalog-Sync mit LeanIX – nur in der
 * Node.js-Runtime und nicht während `next build`.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (process.env.NEXT_PHASE === "phase-production-build") return

  const { startCatalogScheduler } = await import("@/lib/catalog/scheduler")
  startCatalogScheduler()
}
