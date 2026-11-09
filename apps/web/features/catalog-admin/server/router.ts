import "server-only"

import type { CatalogAdminOverview } from "@workspace/api"

import {
  countStoredSnapshots,
  getCatalogStatus,
  getStoredSnapshot,
  listSyncRuns,
} from "@/lib/catalog/store"
import {
  failOrphanedRuns,
  isSyncRunning,
  startSync,
  SyncBusyError,
} from "@/lib/catalog/sync"
import { catalogSource, env } from "@/lib/env"
import { leanixModel } from "@/lib/leanix/model"
import { adminOnly, os } from "@/server/orpc"

/**
 * Letzte Läufe. Steht einer auf «running», ohne dass irgendwo ein Sync
 * läuft (Prozess während des Laufs beendet), wird er gleich abgeschlossen:
 * Sonst bliebe der Sync-Knopf bis zum nächsten Lauf gesperrt.
 */
async function recentRuns() {
  const runs = await listSyncRuns(20)
  if (!runs.some((run) => run.status === "running") || isSyncRunning())
    return runs
  const closed = await failOrphanedRuns()
  return closed > 0 ? listSyncRuns(20) : runs
}

/** Admin: Sync-Status, Datenqualität und manueller Sync. */
export const catalogAdminRouter = {
  overview: os.catalogAdmin.overview
    .use(adminOnly)
    .handler(async (): Promise<CatalogAdminOverview> => {
      const [status, stored, runs] = await Promise.all([
        getCatalogStatus(),
        getStoredSnapshot(),
        recentRuns(),
      ])
      // Gespeichert, aber nicht lesbar (z. B. andere Schemaversion)?
      const unreadableSnapshots =
        !stored && catalogSource === "leanix" ? await countStoredSnapshots() : 0
      return {
        status,
        snapshot: stored
          ? {
              id: stored.id,
              generatedAt: stored.snapshot.generatedAt,
              source: stored.snapshot.source.kind,
              stats: stored.snapshot.stats,
            }
          : null,
        unreadableSnapshots,
        issues: stored?.snapshot.issues ?? [],
        runs,
        config: {
          source: catalogSource,
          leanixBaseUrl: env.LEANIX_BASE_URL,
          workspace: stored?.snapshot.source.workspace ?? env.LEANIX_WORKSPACE,
          // Nur ob ein Token gesetzt ist, nie der Wert.
          tokenConfigured: Boolean(env.LEANIX_API_TOKEN),
          syncIntervalMinutes: env.CATALOG_SYNC_INTERVAL_MINUTES,
          minRatio: env.CATALOG_MIN_RATIO,
          staleAfterHours: env.CATALOG_STALE_AFTER_HOURS,
          rootCategoryId: env.CATALOG_ROOT_ID ?? leanixModel.kategorie.rootId,
        },
      }
    }),

  /**
   * Startet einen Sync im Hintergrund und gibt den Lauf (Status `running`)
   * sofort zurück. Die Admin-Übersicht lädt den Status nach, solange ein
   * Lauf im Gang ist.
   */
  syncNow: os.catalogAdmin.syncNow
    .use(adminOnly)
    .handler(async ({ errors }) => {
      if (catalogSource === "demo") throw errors.PRECONDITION_FAILED()
      if (isSyncRunning()) throw errors.CONFLICT()
      try {
        return await startSync("manual")
      } catch (error) {
        if (error instanceof SyncBusyError) throw errors.CONFLICT()
        throw error
      }
    }),
}
