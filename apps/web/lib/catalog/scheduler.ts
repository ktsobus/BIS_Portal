import "server-only"

import type { SyncTrigger } from "@workspace/api"

import { catalogSource, env } from "@/lib/env"

import { refreshFromDb } from "./store"
import { runSync, SyncBusyError } from "./sync"

/**
 * Startet den periodischen Katalog-Sync (nur im LeanIX-Modus): ein erster
 * Lauf kurz nach dem Start, danach alle `CATALOG_SYNC_INTERVAL_MINUTES`.
 * Wird aus `instrumentation.ts` aufgerufen; ein zweiter Aufruf im selben
 * Prozess (z. B. nach Hot Reload) hat keine Wirkung.
 */

const STARTUP_DELAY_MS = 5_000

interface SchedulerState {
  startup: ReturnType<typeof setTimeout>
  interval: ReturnType<typeof setInterval>
}

const globalForScheduler = globalThis as unknown as {
  __bitsCatalogScheduler?: SchedulerState
}

async function tick(trigger: SyncTrigger) {
  try {
    await runSync(trigger)
  } catch (error) {
    if (error instanceof SyncBusyError) {
      // Eine andere Instanz synchronisiert: deren Ergebnis übernehmen.
      await refreshFromDb().catch((refreshError: unknown) =>
        console.error(
          "[catalog] Snapshot konnte nicht aus der Datenbank geladen werden",
          refreshError
        )
      )
      return
    }
    console.error(`[catalog] Sync (${trigger}) abgebrochen`, error)
  }
}

export function startCatalogScheduler(): boolean {
  if (globalForScheduler.__bitsCatalogScheduler) return false
  if (catalogSource !== "leanix") {
    console.info("[catalog] Demo-Modus: kein Sync mit LeanIX")
    return false
  }

  const intervalMs = env.CATALOG_SYNC_INTERVAL_MINUTES * 60_000
  const startup = setTimeout(() => void tick("startup"), STARTUP_DELAY_MS)
  const interval = setInterval(() => void tick("schedule"), intervalMs)
  // Timer sollen das Beenden des Prozesses nicht verhindern.
  startup.unref()
  interval.unref()
  globalForScheduler.__bitsCatalogScheduler = { startup, interval }

  console.info(
    `[catalog] Sync mit ${env.LEANIX_BASE_URL} in ${STARTUP_DELAY_MS / 1000} s, danach alle ${env.CATALOG_SYNC_INTERVAL_MINUTES} min`
  )
  return true
}

/** Stoppt den Scheduler (für Tests). */
export function stopCatalogScheduler() {
  const state = globalForScheduler.__bitsCatalogScheduler
  if (!state) return
  clearTimeout(state.startup)
  clearInterval(state.interval)
  delete globalForScheduler.__bitsCatalogScheduler
}
