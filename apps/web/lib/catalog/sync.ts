import "server-only"

import type { CatalogSnapshot, SyncRun, SyncTrigger } from "@workspace/api"
import { desc, eq, notInArray, sql } from "drizzle-orm"
import { ZodError } from "zod"

import { db, schema } from "@/db"
import { env } from "@/lib/env"
import { createLeanixClient, LeanixError } from "@/lib/leanix/client"
import { leanixModel } from "@/lib/leanix/model"
import { fetchCatalogRaw } from "@/lib/leanix/queries"

import { assessSnapshot } from "./assess"
import { buildSnapshot } from "./mapper"
import {
  loadLatestSnapshotRecord,
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
const ORPHAN_MESSAGE = "Lauf wurde nicht abgeschlossen (Prozess beendet?)"

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

export interface RunSyncOptions {
  /** Wird aufgerufen, sobald der Lauf protokolliert ist (Status `running`). */
  onStarted?: (run: SyncRun) => void
}

/**
 * Führt einen Sync aus und gibt den protokollierten Lauf zurück (auch bei
 * Status `failed` oder `rejected`). Wirft `SyncBusyError`, wenn bereits ein
 * Sync läuft.
 */
export async function runSync(
  trigger: SyncTrigger,
  options: RunSyncOptions = {}
): Promise<SyncRun> {
  const state = syncState()
  if (state.running) throw new SyncBusyError()
  const promise = runWithAdvisoryLock(trigger, options)
  state.running = promise
  try {
    return await promise
  } finally {
    state.running = null
  }
}

/**
 * Startet einen Sync im Hintergrund und liefert den Lauf, sobald er
 * protokolliert ist (Status `running`). Für «Jetzt synchronisieren»: Der
 * HTTP-Request wartet nicht auf LeanIX (bei hängendem LeanIX sonst über
 * 90 s, mehr als der Reverse Proxy erlaubt). Das Ergebnis erscheint im
 * Lauf-Protokoll.
 */
export function startSync(trigger: SyncTrigger): Promise<SyncRun> {
  return new Promise((resolve, reject) => {
    let started = false
    runSync(trigger, {
      onStarted: (run) => {
        started = true
        resolve(run)
      },
    })
      .then((run) => {
        if (!started) resolve(run)
      })
      .catch((error: unknown) => {
        if (!started) reject(error)
        else console.error(`[catalog] Sync (${trigger}) abgebrochen`, error)
      })
  })
}

/**
 * Führt `fn` aus, solange dieser Prozess das Advisory-Lock hält. Gibt
 * `{ locked: false }` zurück, wenn eine andere Sitzung es hält.
 */
async function withAdvisoryLock<T>(
  fn: () => Promise<T>
): Promise<{ locked: true; value: T } | { locked: false }> {
  // Session-Lock: Sperren und Freigeben auf derselben Verbindung.
  const connection = await db.$client.reserve()
  let locked = false
  try {
    const [row] = await connection<{ locked: boolean }[]>`
      select pg_try_advisory_lock(hashtext(${LOCK_NAME})) as locked`
    locked = row?.locked === true
    if (!locked) return { locked: false }
    return { locked: true, value: await fn() }
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

/** Setzt alle «running»-Läufe auf `failed` (nur unter dem Lock aufrufen). */
async function closeOrphanedRuns(): Promise<number> {
  const rows = await db
    .update(schema.catalogSyncRun)
    .set({ status: "failed", finishedAt: new Date(), message: ORPHAN_MESSAGE })
    .where(eq(schema.catalogSyncRun.status, "running"))
    .returning({ id: schema.catalogSyncRun.id })
  return rows.length
}

/**
 * Schliesst verwaiste «running»-Läufe ab (z. B. Prozess während eines Syncs
 * beendet). Nur wenn niemand das Advisory-Lock hält: Dann läuft
 * nachweislich auf keiner Instanz ein Sync. Für den Admin-Bereich, damit
 * der Sync-Knopf nicht bis zum nächsten Lauf gesperrt bleibt.
 */
export async function failOrphanedRuns(): Promise<number> {
  if (isSyncRunning()) return 0
  const result = await withAdvisoryLock(closeOrphanedRuns)
  return result.locked ? result.value : 0
}

async function runWithAdvisoryLock(
  trigger: SyncTrigger,
  options: RunSyncOptions
): Promise<SyncRun> {
  const result = await withAdvisoryLock(async () => {
    // Wer das Lock hält, ist der einzige laufende Sync: übrig gebliebene
    // «running»-Einträge stammen aus abgebrochenen Prozessen.
    await closeOrphanedRuns()
    return executeRun(trigger, options)
  })
  if (!result.locked) {
    throw new SyncBusyError("Ein Sync läuft bereits auf einer anderen Instanz")
  }
  return result.value
}

async function executeRun(
  trigger: SyncTrigger,
  options: RunSyncOptions
): Promise<SyncRun> {
  const startedAt = new Date()
  const [run] = await db
    .insert(schema.catalogSyncRun)
    .values({ trigger, status: "running", startedAt })
    .returning()
  if (!run) throw new Error("Sync-Lauf konnte nicht protokolliert werden")
  try {
    options.onStarted?.(toSyncRun(run))
  } catch (error) {
    console.error("[catalog] onStarted fehlgeschlagen", error)
  }

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
      showEmptyServices: env.CATALOG_SHOW_EMPTY_SERVICES,
      httpAllowedHosts: env.CATALOG_HTTP_ALLOWED_HOSTS,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    return finish({ status: "failed", message: describeError(error) })
  }
  const leanixNotes =
    warnings.length > 0
      ? `Hinweise von LeanIX: ${warnings.slice(0, 3).join(" | ")}`
      : null

  try {
    // Vergleich immer mit dem neuesten Snapshot in der DB (nicht mit dem
    // Speicher), damit auch mehrere Instanzen konsistent bleiben. Die
    // Kennzahlen stammen aus der Spalte `stats`: Sie gelten auch dann, wenn
    // der Payload nicht mehr zum aktuellen Schema passt.
    const previous = await loadLatestSnapshotRecord()
    const assessment = assessSnapshot(next, previous?.stats, {
      minRatio: env.CATALOG_MIN_RATIO,
      tolerance: env.CATALOG_SHRINK_TOLERANCE,
    })
    if (!assessment.ok) {
      return finish({
        status: "rejected",
        message: truncate(
          [
            assessment.reason,
            removedLeistungen(previous?.snapshot ?? null, next),
            leanixNotes,
          ]
            .filter(Boolean)
            .join(" ")
        ),
        stats: next.stats,
      })
    }

    const generatedAt = new Date(next.generatedAt)
    let snapshotId: string
    if (previous?.snapshot && sameContent(previous.snapshot, next)) {
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
      message: leanixNotes ? truncate(leanixNotes) : null,
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

/** «Nicht mehr enthalten: …» für die Meldung einer Ablehnung. */
function removedLeistungen(
  previous: CatalogSnapshot | null,
  next: CatalogSnapshot
): string | null {
  if (!previous) return null
  const kept = new Set(next.leistungen.map((l) => l.id))
  const removed = previous.leistungen
    .filter((l) => !kept.has(l.id))
    .map((l) => `«${l.name}»`)
  if (removed.length === 0) return null
  const shown = removed.slice(0, 10).join(", ")
  const more = removed.length > 10 ? ` und ${removed.length - 10} weitere` : ""
  return `Nicht mehr enthalten: ${shown}${more}.`
}

/**
 * Behält die letzten 20 Snapshots und 200 Läufe. Ist `CATALOG_SHOW_PERSONS`
 * aus, werden zudem Personen aus allen gespeicherten Snapshots entfernt.
 */
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

  await purgeStoredPersonsIfDisabled()
}

type PayloadWithPersons = {
  leistungen?: unknown
  services?: unknown
} & Record<string, unknown>

function withoutPersons(items: unknown): unknown {
  if (!Array.isArray(items)) return items
  return items.map((item: unknown) =>
    item && typeof item === "object" && "persons" in item
      ? { ...item, persons: [] }
      : item
  )
}

/**
 * Datensparsamkeit: Ist `CATALOG_SHOW_PERSONS` aus, enthalten auch ältere
 * gespeicherte Snapshots keine Personen mehr (sie können aus einer Zeit
 * stammen, als die Option an war). Gibt die Anzahl bereinigter Zeilen
 * zurück. Läuft beim Start und nach jedem erfolgreichen Sync.
 */
export async function purgeStoredPersonsIfDisabled(): Promise<number> {
  if (env.CATALOG_SHOW_PERSONS) return 0
  const rows = await db
    .select({
      id: schema.catalogSnapshot.id,
      payload: schema.catalogSnapshot.payload,
    })
    .from(schema.catalogSnapshot)
    .where(
      sql`jsonb_path_exists(${schema.catalogSnapshot.payload}, '$.leistungen[*].persons[*]') or jsonb_path_exists(${schema.catalogSnapshot.payload}, '$.services[*].persons[*]')`
    )
  for (const row of rows) {
    const payload = row.payload as unknown as PayloadWithPersons
    const cleaned = {
      ...payload,
      leistungen: withoutPersons(payload.leistungen),
      services: withoutPersons(payload.services),
    }
    await db
      .update(schema.catalogSnapshot)
      .set({ payload: cleaned as unknown as CatalogSnapshot })
      .where(eq(schema.catalogSnapshot.id, row.id))
  }
  if (rows.length > 0) {
    console.info(
      `[catalog] Personen aus ${rows.length} gespeicherten Snapshots entfernt (CATALOG_SHOW_PERSONS=false)`
    )
  }
  return rows.length
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
