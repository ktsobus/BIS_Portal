import "server-only"

import {
  catalogSnapshotSchema,
  type CatalogSnapshot,
  type CatalogStatus,
  type SyncRun,
} from "@workspace/api"
import { desc } from "drizzle-orm"

import demo from "@/data/demo-catalog.json"
import { db, schema } from "@/db"
import { catalogSource, env } from "@/lib/env"

/**
 * Katalog-Store: hält den aktiven Snapshot im Speicher. Seiten lesen nur
 * hieraus; LeanIX wird nie im Request-Pfad aufgerufen.
 *
 * - Demo-Modus: mitgelieferter Snapshot (`data/demo-catalog.json`).
 * - LeanIX-Modus: Snapshot aus dem Sync; bei leerem Speicher (z. B. nach
 *   einem Neustart) einmalig der neueste Snapshot aus der Datenbank.
 *
 * Der Zustand liegt in `globalThis`, weil Next.js Module mehrfach laden kann
 * (Instrumentation/Scheduler und Routen teilen sonst keinen Cache).
 *
 * Kein `connection()` hier: Der Store wird auch ausserhalb von Requests
 * genutzt (Scheduler, Tests). Aufrufer im Request-Pfad sind oRPC-Prozeduren
 * (`/rpc` bzw. `serverClient`, der `headers()` liest) und damit dynamisch.
 */

export interface StoredSnapshot {
  /** DB-ID oder `demo`. */
  id: string
  snapshot: CatalogSnapshot
}

interface StoreState {
  current: StoredSnapshot | null
  demo: StoredSnapshot | null
  /** Laufender Ladevorgang aus der DB (gleichzeitige Aufrufe teilen ihn). */
  loading: Promise<StoredSnapshot | null> | null
  /** DB wurde erfolgreich abgefragt (auch wenn noch kein Snapshot da war). */
  loadedFromDb: boolean
  /** Letzter fehlgeschlagener DB-Zugriff (für eine Wartezeit vor dem nächsten). */
  lastDbError: number | null
}

const DB_RETRY_AFTER_MS = 30_000

const globalForStore = globalThis as unknown as {
  __bitsCatalogStore?: StoreState
}

function state(): StoreState {
  globalForStore.__bitsCatalogStore ??= {
    current: null,
    demo: null,
    loading: null,
    loadedFromDb: false,
    lastDbError: null,
  }
  return globalForStore.__bitsCatalogStore
}

function demoSnapshot(): StoredSnapshot {
  const s = state()
  s.demo ??= { id: "demo", snapshot: catalogSnapshotSchema.parse(demo) }
  return s.demo
}

/** Liest den neuesten gültigen Snapshot aus der Datenbank. */
export async function loadLatestSnapshotFromDb(): Promise<StoredSnapshot | null> {
  const [row] = await db
    .select({
      id: schema.catalogSnapshot.id,
      payload: schema.catalogSnapshot.payload,
    })
    .from(schema.catalogSnapshot)
    .orderBy(desc(schema.catalogSnapshot.createdAt))
    .limit(1)
  if (!row) return null
  const parsed = catalogSnapshotSchema.safeParse(row.payload)
  if (!parsed.success) {
    console.error(
      `[catalog] Snapshot ${row.id} in der Datenbank ist ungültig und wird ignoriert: ${parsed.error.message.slice(0, 300)}`
    )
    return null
  }
  return { id: row.id, snapshot: parsed.data }
}

/** Aktiver Snapshot im LeanIX-Modus (Speicher, sonst einmalig aus der DB). */
async function currentLeanixSnapshot(): Promise<StoredSnapshot | null> {
  const s = state()
  if (s.current) return s.current
  if (s.loadedFromDb) return null
  if (s.lastDbError && Date.now() - s.lastDbError < DB_RETRY_AFTER_MS)
    return null

  s.loading ??= loadLatestSnapshotFromDb()
    .then((loaded) => {
      // Ein Sync kann inzwischen einen neueren Snapshot gesetzt haben.
      s.current ??= loaded
      s.loadedFromDb = true
      s.lastDbError = null
      return s.current
    })
    .catch((error: unknown) => {
      s.lastDbError = Date.now()
      console.error(
        `[catalog] Snapshot konnte nicht aus der Datenbank geladen werden: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
      return null
    })
    .finally(() => {
      s.loading = null
    })
  return s.loading
}

/** Aktueller Katalog-Snapshot oder `null`, wenn noch keiner vorhanden ist. */
export async function getCatalog(): Promise<CatalogSnapshot | null> {
  if (catalogSource === "demo") return demoSnapshot().snapshot
  return (await currentLeanixSnapshot())?.snapshot ?? null
}

/** Ist der Stand älter als `CATALOG_STALE_AFTER_HOURS`? */
export function isStale(generatedAt: string, now = Date.now()): boolean {
  const time = Date.parse(generatedAt)
  if (Number.isNaN(time)) return true
  return now - time > env.CATALOG_STALE_AFTER_HOURS * 60 * 60 * 1000
}

/** Status für Fusszeile und Hinweise (verfügbar, Stand, veraltet). */
export async function getCatalogStatus(): Promise<CatalogStatus> {
  const snapshot = await getCatalog()
  if (!snapshot) {
    return { available: false, source: null, generatedAt: null, stale: false }
  }
  return {
    available: true,
    source: snapshot.source.kind,
    generatedAt: snapshot.generatedAt,
    // Der Demo-Snapshot ist absichtlich fix und gilt nie als veraltet.
    stale:
      snapshot.source.kind === "leanix" ? isStale(snapshot.generatedAt) : false,
  }
}

// ---------------------------------------------------------------------------
// Für Sync und Admin-Bereich

/** Aktiver Snapshot mit ID (Demo-Modus: `demo`). */
export async function getStoredSnapshot(): Promise<StoredSnapshot | null> {
  if (catalogSource === "demo") return demoSnapshot()
  return currentLeanixSnapshot()
}

/** Setzt den aktiven Snapshot (nach einem erfolgreichen Sync). */
export function setCurrentSnapshot(stored: StoredSnapshot) {
  const s = state()
  s.current = stored
  s.loadedFromDb = true
}

/**
 * Lädt den neuesten Snapshot aus der DB, falls er neuer ist als der im
 * Speicher (z. B. wenn eine andere Instanz synchronisiert hat).
 */
export async function refreshFromDb(): Promise<void> {
  if (catalogSource === "demo") return
  const s = state()
  const [latest] = await db
    .select({
      id: schema.catalogSnapshot.id,
      generatedAt: schema.catalogSnapshot.generatedAt,
    })
    .from(schema.catalogSnapshot)
    .orderBy(desc(schema.catalogSnapshot.createdAt))
    .limit(1)
  if (!latest) return
  if (
    s.current?.id === latest.id &&
    s.current.snapshot.generatedAt === latest.generatedAt.toISOString()
  )
    return
  const loaded = await loadLatestSnapshotFromDb()
  if (loaded) setCurrentSnapshot(loaded)
}

type SyncRunRow = typeof schema.catalogSyncRun.$inferSelect

export function toSyncRun(row: SyncRunRow): SyncRun {
  return {
    id: row.id,
    trigger: row.trigger,
    status: row.status,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
    durationMs: row.durationMs,
    message: row.message,
    stats: row.stats ?? null,
  }
}

/** Die letzten Sync-Läufe, neueste zuerst. */
export async function listSyncRuns(limit = 20): Promise<SyncRun[]> {
  const rows = await db
    .select()
    .from(schema.catalogSyncRun)
    .orderBy(desc(schema.catalogSyncRun.startedAt))
    .limit(limit)
  return rows.map(toSyncRun)
}
