import "server-only"

import type { CatalogAdminOverview } from "@workspace/api"

import {
  getCatalogStatus,
  getStoredSnapshot,
  listSyncRuns,
} from "@/lib/catalog/store"
import { isSyncRunning, runSync, SyncBusyError } from "@/lib/catalog/sync"
import { catalogSource, env } from "@/lib/env"
import { leanixModel } from "@/lib/leanix/model"
import { adminOnly, os } from "@/server/orpc"

/** Admin: Sync-Status, Datenqualität und manueller Sync. */
export const catalogAdminRouter = {
  overview: os.catalogAdmin.overview
    .use(adminOnly)
    .handler(async (): Promise<CatalogAdminOverview> => {
      const [status, stored, runs] = await Promise.all([
        getCatalogStatus(),
        getStoredSnapshot(),
        listSyncRuns(20),
      ])
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

  syncNow: os.catalogAdmin.syncNow
    .use(adminOnly)
    .handler(async ({ errors }) => {
      if (catalogSource === "demo") throw errors.PRECONDITION_FAILED()
      if (isSyncRunning()) throw errors.CONFLICT()
      try {
        return await runSync("manual")
      } catch (error) {
        if (error instanceof SyncBusyError) throw errors.CONFLICT()
        throw error
      }
    }),
}
