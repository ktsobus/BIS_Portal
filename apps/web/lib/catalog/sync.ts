import "server-only"

import type { CatalogSnapshot, SyncRun, SyncTrigger } from "@workspace/api"
import { desc, eq, notInArray } from "drizzle-orm"
import { ZodError } from "zod"

import { db, schema } from "@/db"
import { env } from "@/lib/env"
import { createLeanixClient, LeanixError } from "@/lib/leanix/client"
import { leanixModel } from "@/lib/leanix/model"
import { fetchCatalogRaw } from "@/lib/leanix/queries"

import { assessSnapshot } from "./assess"
import { buildSnapshot } from "./mapper"
import {
  loadLatestSnapshotFromDb,
  setCurrentSnapshot,
  toSyncRun,
} from "./store"

/**
 * Katalog-Sync: LeanIX lesen → Snapshot bauen → plausibilisieren →
 * speichern → In-Memory-Katalog aktualisieren. Jeder Lauf wird in
 * `catalog_sync_run` protokolliert. Bei Fehlern bleibt der bisherige
 * Snapshot aktiv.
 *
 * Gleichzeitige Läufe verhindern eine Sperre im Prozess und ein
 * Postgres-Advisory-Lock (mehrere Instanzen).
 */

const LOCK_NAME = "bits-portal.catalog-sync"
const KEEP_SNAPSHOTS = 20
const KEEP_RUNS = 200
const MAX_MESSAGE_LENGTH = 1000

/** Ein Sync läuft bereits (in diesem Prozess oder einer anderen Instanz). */
export class SyncBusyError extends Error {
  constructor(message = "Ein Sync läuft bereits") {
    super(message)
    this.name = "SyncBusyError"
  }
}

const globalForSync = globalThis as unknown as {
  __bitsCatalogSync?: { running: Promise<SyncRun> | null }
}

function syncState() {
  globalForSync.__bitsCatalogSync ??= { running: null }
  return globalForSync.__bitsCatalogSync
}

/** Läuft in diesem Prozess gerade ein Sync? */
export function isSyncRunning(): boolean {
  return syncState().running !== null
}

/**
 * Führt einen Sync aus und gibt den protokollierten Lauf zurück (auch bei
 * Status `failed` oder `rejected`). Wirft `SyncBusyError`, wenn bereits ein
 * Sync läuft.
 */
export async function runSync(trigger: SyncTrigger): Promise<SyncRun> {
  const state = syncState()
  if (state.running) throw new SyncBusyError()
  const promise = runWithAdvisoryLock(trigger)
  state.running = promise
  try {
    return await promise
  } finally {
    state.running = null
  }
}

async function runWithAdvisoryLock(trigger: SyncTrigger): Promise<SyncRun> {
  // Session-Lock: Sperren und Freigeben auf derselben Verbindung.
  const connection = await db.$client.reserve()
  let locked = false
  try {
    const [row] = await connection<{ locked: boolean }[]>`
      select pg_try_advisory_lock(hashtext(${LOCK_NAME})) as locked`
    locked = row?.locked === true
    if (!locked) {
      throw new SyncBusyError(
        "Ein Sync läuft bereits auf einer anderen Instanz"
      )
    }
    // Wer das Lock hält, ist der einzige laufende Sync: übrig gebliebene
    // «running»-Einträge stammen aus abgebrochenen Prozessen.
    await db
      .update(schema.catalogSyncRun)
      .set({
        status: "failed",
        finishedAt: new Date(),
        message: "Lauf wurde nicht abgeschlossen (Prozess beendet?)",
      })
      .where(eq(schema.catalogSyncRun.status, "running"))
    return await executeRun(trigger)
  } finally {
    if (locked) {
      await connection`select pg_advisory_unlock(hashtext(${LOCK_NAME}))`.catch(
        (error: unknown) =>
          console.error("[catalog] Advisory-Lock nicht freigegeben", error)
      )
    }
    connection.release()
  }
}

async function executeRun(trigger: SyncTrigger): Promise<SyncRun> {
  const startedAt = new Date()
  const [run] = await db
    .insert(schema.catalogSyncRun)
    .values({ trigger, status: "running", startedAt })
    .returning({ id: schema.catalogSyncRun.id })
  if (!run) throw new Error("Sync-Lauf konnte nicht protokolliert werden")

  const finish = async (
    patch: Partial<typeof schema.catalogSyncRun.$inferInsert>
  ): Promise<SyncRun> => {
    const finishedAt = new Date()
    const [row] = await db
      .update(schema.catalogSyncRun)
      .set({
        ...patch,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      })
      .where(eq(schema.catalogSyncRun.id, run.id))
      .returning()
    if (!row) throw new Error("Sync-Lauf nicht gefunden")
    const result = toSyncRun(row)
    const log = result.status === "success" ? console.info : console.warn
    log(
      `[catalog] Sync (${trigger}) ${result.status} in ${result.durationMs} ms${
        result.stats ? `, ${result.stats.leistungen} Leistungen` : ""
      }${result.message ? `: ${result.message}` : ""}`
    )
    return result
  }

  let next: CatalogSnapshot
  let warnings: string[]
  try {
    if (!env.LEANIX_API_TOKEN) {
      throw new Error("Kein LeanIX-API-Token konfiguriert (LEANIX_API_TOKEN)")
    }
    const client = createLeanixClient({
      baseUrl: env.LEANIX_BASE_URL,
      apiToken: env.LEANIX_API_TOKEN,
      workspace: env.LEANIX_WORKSPACE,
    })
    const raw = await fetchCatalogRaw(client, {
      showPersons: env.CATALOG_SHOW_PERSONS,
    })
    warnings = raw.warnings
    next = buildSnapshot(raw, {
      kind: "leanix",
      baseUrl: env.LEANIX_BASE_URL,
      workspace: await client.getWorkspace(),
      rootId: env.CATALOG_ROOT_ID ?? leanixModel.kategorie.rootId,
      showPersons: env.CATALOG_SHOW_PERSONS,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    return finish({ status: "failed", message: describeError(error) })
  }

  try {
    // Vergleich immer mit dem neuesten Snapshot in der DB (nicht mit dem
    // Speicher), damit auch mehrere Instanzen konsistent bleiben.
    const previous = await loadLatestSnapshotFromDb()
    const assessment = assessSnapshot(
      next,
      previous?.snapshot,
      env.CATALOG_MIN_RATIO
    )
    if (!assessment.ok) {
      return finish({
        status: "rejected",
        message: assessment.reason,
        stats: next.stats,
      })
    }

    const generatedAt = new Date(next.generatedAt)
    let snapshotId: string
    if (previous && sameContent(previous.snapshot, next)) {
      // Unverändert: nur den Stand des aktiven Snapshots nachführen.
      await db
        .update(schema.catalogSnapshot)
        .set({ generatedAt, payload: next, stats: next.stats })
        .where(eq(schema.catalogSnapshot.id, previous.id))
      snapshotId = previous.id
    } else {
      const [row] = await db
        .insert(schema.catalogSnapshot)
        .values({
          generatedAt,
          source: next.source.kind,
          stats: next.stats,
          payload: next,
        })
        .returning({ id: schema.catalogSnapshot.id })
      if (!row) throw new Error("Snapshot konnte nicht gespeichert werden")
      snapshotId = row.id
    }
    setCurrentSnapshot({ id: snapshotId, snapshot: next })

    const result = await finish({
      status: "success",
      message:
        warnings.length > 0
          ? truncate(`Hinweise von LeanIX: ${warnings.slice(0, 3).join(" | ")}`)
          : null,
      stats: next.stats,
      snapshotId,
    })
    await cleanup().catch((error: unknown) =>
      console.error("[catalog] Aufräumen alter Snapshots fehlgeschlagen", error)
    )
    return result
  } catch (error) {
    return finish({ status: "failed", message: describeError(error) })
  }
}

/** Behält die letzten 20 Snapshots und 200 Läufe. */
async function cleanup() {
  const keepSnapshots = db
    .select({ id: schema.catalogSnapshot.id })
    .from(schema.catalogSnapshot)
    .orderBy(desc(schema.catalogSnapshot.createdAt))
    .limit(KEEP_SNAPSHOTS)
  await db
    .delete(schema.catalogSnapshot)
    .where(notInArray(schema.catalogSnapshot.id, keepSnapshots))

  const keepRuns = db
    .select({ id: schema.catalogSyncRun.id })
    .from(schema.catalogSyncRun)
    .orderBy(desc(schema.catalogSyncRun.startedAt))
    .limit(KEEP_RUNS)
  await db
    .delete(schema.catalogSyncRun)
    .where(notInArray(schema.catalogSyncRun.id, keepRuns))
}

/** Gleicher Inhalt, abgesehen vom Abrufzeitpunkt? */
export function sameContent(a: CatalogSnapshot, b: CatalogSnapshot): boolean {
  return (
    stableStringify({ ...a, generatedAt: "" }) ===
    stableStringify({ ...b, generatedAt: "" })
  )
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([x], [y]) =>
            x < y ? -1 : x > y ? 1 : 0
          )
        )
      : v
  )
}

function truncate(text: string) {
  return text.length > MAX_MESSAGE_LENGTH
    ? `${text.slice(0, MAX_MESSAGE_LENGTH - 2)} …`
    : text
}

/** Fehlermeldung für das Protokoll (enthält nie Token). */
function describeError(error: unknown): string {
  if (error instanceof LeanixError) return truncate(error.message)
  if (error instanceof ZodError) {
    const first = error.issues
      .slice(0, 3)
      .map((issue) => `${issue.path.join(".") || "(Wurzel)"}: ${issue.message}`)
      .join("; ")
    return truncate(`Snapshot ungültig: ${first}`)
  }
  if (error instanceof Error) return truncate(error.message)
  return truncate(String(error))
}
