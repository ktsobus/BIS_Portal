import "server-only"

import type { CatalogStatus } from "@workspace/api"
import { sql } from "drizzle-orm"

import { db } from "@/db"
import { getCatalogStatus, listSyncRuns } from "@/lib/catalog/store"
import { catalogSource } from "@/lib/env"

import { os } from "@/server/orpc"

/** Eine Probe darf bei hängender Datenbank nicht blockieren. */
const PROBE_TIMEOUT_MS = 2000

async function withTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Zeitüberschreitung")),
          PROBE_TIMEOUT_MS
        )
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

async function checkDatabase(): Promise<"ok" | "error"> {
  try {
    await withTimeout(db.execute(sql`select 1`))
    return "ok"
  } catch {
    return "error"
  }
}

const unknownCatalog: CatalogStatus = {
  available: false,
  source: null,
  generatedAt: null,
  stale: false,
}

async function lastSyncRun() {
  if (catalogSource !== "leanix") return null
  try {
    const [run] = await withTimeout(listSyncRuns(1))
    return run
      ? {
          status: run.status,
          startedAt: run.startedAt,
          finishedAt: run.finishedAt,
        }
      : null
  } catch {
    return null
  }
}

export const healthRouter = {
  check: os.health.check.handler(() => ({ status: "ok", time: new Date() })),

  ready: os.health.ready.handler(async ({ errors }) => {
    const [dbStatus, catalog] = await Promise.all([
      checkDatabase(),
      withTimeout(getCatalogStatus()).catch(() => unknownCatalog),
    ])
    const lastSync = dbStatus === "ok" ? await lastSyncRun() : null

    const unavailable = dbStatus === "error" || !catalog.available
    const degraded =
      catalog.stale ||
      lastSync?.status === "failed" ||
      lastSync?.status === "rejected"

    const result = {
      status: unavailable ? "unavailable" : degraded ? "degraded" : "ok",
      time: new Date(),
      db: dbStatus,
      catalog,
      lastSync,
    } as const

    // 503, damit einfache HTTP-Proben (Docker, Monitoring) anschlagen.
    if (unavailable) throw errors.NOT_READY({ data: result })
    return result
  }),
}
