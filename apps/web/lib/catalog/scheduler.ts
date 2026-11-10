import "server-only"

import type { SyncTrigger } from "@workspace/api"

import { catalogSource, env } from "@/lib/env"

import { refreshFromDb } from "./store"
import {
  isSyncRunning,
  purgeStoredPersonsIfDisabled,
  runSync,
  SyncBusyError,
} from "./sync"

/**
 * Startet den periodischen Katalog-Sync (nur im LeanIX-Modus): ein erster
 * Lauf kurz nach dem Start, danach alle `CATALOG_SYNC_INTERVAL_MINUTES`.
 * Zusätzlich gleicht jede Instanz ihren Speicher jede Minute mit der
 * Datenbank ab, damit Läufe anderer Instanzen (oder ein manueller Sync dort)
 * überall rasch sichtbar werden.
 * Wird aus `instrumentation.ts` aufgerufen; ein zweiter Aufruf im selben
 * Prozess (z. B. nach Hot Reload) hat keine Wirkung.
 */

const STARTUP_DELAY_MS = 5_000
/** Abgleich mit der Datenbank (nur `id` und `generated_at` der neuesten Zeile). */
export const REFRESH_INTERVAL_MS = 60_000

interface SchedulerState {
  startup: ReturnType<typeof setTimeout>
  interval: ReturnType<typeof setInterval>
  refresh: ReturnType<typeof setInterval>
}

const globalForScheduler = globalThis as unknown as {
  __bitsCatalogScheduler?: SchedulerState
}

let refreshFailing = false

/** Übernimmt einen neueren Stand aus der DB; Fehler nur beim Wechsel loggen. */
async function refreshQuietly() {
  try {
    await refreshFromDb()
    if (refreshFailing)
      console.info("[catalog] Abgleich mit der Datenbank wieder möglich")
    refreshFailing = false
  } catch (error) {
    if (!refreshFailing) {
      console.error(
        "[catalog] Snapshot konnte nicht aus der Datenbank geladen werden",
        error
      )
    }
    refreshFailing = true
  }
}

async function tick(trigger: SyncTrigger) {
  try {
    const run = await runSync(trigger)
    // Fehlgeschlagen oder abgelehnt: Eine andere Instanz kann trotzdem
    // einen gültigen, neueren Stand gespeichert haben.
    if (run.status !== "success") await refreshQuietly()
  } catch (error) {
    if (error instanceof SyncBusyError) {
      // Eine andere Instanz synchronisiert: deren Ergebnis übernimmt der
      // regelmässige Abgleich, sobald es gespeichert ist.
      await refreshQuietly()
      return
    }
    console.error(`[catalog] Sync (${trigger}) abgebrochen`, error)
  }
}

async function startupTick() {
  await purgeStoredPersonsIfDisabled().catch((error: unknown) =>
    console.error("[catalog] Personen konnten nicht entfernt werden", error)
  )
  await tick("startup")
}

export function startCatalogScheduler(): boolean {
  if (globalForScheduler.__bitsCatalogScheduler) return false
  if (catalogSource !== "leanix") {
    console.info("[catalog] Demo-Modus: kein Sync mit LeanIX")
    return false
  }

  const intervalMs = env.CATALOG_SYNC_INTERVAL_MINUTES * 60_000
  const startup = setTimeout(() => void startupTick(), STARTUP_DELAY_MS)
  const interval = setInterval(() => void tick("schedule"), intervalMs)
  const refresh = setInterval(() => {
    if (!isSyncRunning()) void refreshQuietly()
  }, REFRESH_INTERVAL_MS)
  // Timer sollen das Beenden des Prozesses nicht verhindern.
  startup.unref()
  interval.unref()
  refresh.unref()
  globalForScheduler.__bitsCatalogScheduler = { startup, interval, refresh }

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
  clearInterval(state.refresh)
  delete globalForScheduler.__bitsCatalogScheduler
}
