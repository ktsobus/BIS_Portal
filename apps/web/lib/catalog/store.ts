import "server-only"

import {
  catalogSnapshotSchema,
  type CatalogSnapshot,
  type CatalogStatus,
  type SyncRun,
} from "@workspace/api"
import { count, desc, eq } from "drizzle-orm"

import demo from "@/data/demo-catalog.json"
import { db, schema } from "@/db"
import { catalogSource, env } from "@/lib/env"

import type { PreviousStats } from "./assess"
import { migrateSnapshotPayload } from "./snapshot-migrations"

/**
 * Katalog-Store: hält den aktiven Snapshot im Speicher. Seiten lesen nur
 * hieraus; LeanIX wird nie im Request-Pfad aufgerufen.
 *
 * - Demo-Modus: mitgelieferter Snapshot (`data/demo-catalog.json`).
 * - LeanIX-Modus: Snapshot aus dem Sync; bei leerem Speicher (z. B. nach
 *   einem Neustart) der neueste gültige Snapshot aus der Datenbank. Ist die
 *   Datenbank leer, wird sie nach einer Wartezeit erneut abgefragt (eine
 *   andere Instanz kann inzwischen synchronisiert haben). Zusätzlich gleicht
 *   der Scheduler den Speicher regelmässig mit der Datenbank ab
 *   (`refreshFromDb`), damit alle Instanzen denselben Stand zeigen.
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
  /**
   * Letzte DB-Abfrage ohne Ergebnis (leer, ungültig oder Fehler). Vor dem
   * nächsten Versuch gilt eine Wartezeit, damit nicht jede Anfrage die DB
   * belastet.
   */
  lastMiss: number | null
  /** Zuletzt in `refreshFromDb` gesehene neueste Zeile (`id|generatedAt`). */
  lastSeenRow: string | null
}

/** Wartezeit nach einer erfolglosen DB-Abfrage. */
export const DB_RETRY_AFTER_MS = 30_000
/** So viele der neuesten Zeilen werden nach einem gültigen Snapshot durchsucht. */
const CANDIDATE_ROWS = 5

const globalForStore = globalThis as unknown as {
  __bitsCatalogStore?: StoreState
}

function state(): StoreState {
  globalForStore.__bitsCatalogStore ??= {
    current: null,
    demo: null,
    loading: null,
    lastMiss: null,
    lastSeenRow: null,
  }
  return globalForStore.__bitsCatalogStore
}

function demoSnapshot(): StoredSnapshot {
  const s = state()
  s.demo ??= { id: "demo", snapshot: catalogSnapshotSchema.parse(demo) }
  return s.demo
}

/** Gespeicherten Payload (ggf. migriert) gegen das aktuelle Schema prüfen. */
function parseStoredPayload(payload: unknown) {
  return catalogSnapshotSchema.safeParse(migrateSnapshotPayload(payload))
}

/**
 * Liest den neuesten gültigen Snapshot aus der Datenbank. Ältere
 * Schemaversionen werden migriert; eine einzelne defekte Zeile wird
 * übersprungen (es zählen die neuesten fünf).
 */
export async function loadLatestSnapshotFromDb(): Promise<StoredSnapshot | null> {
  const candidates = await db
    .select({ id: schema.catalogSnapshot.id })
    .from(schema.catalogSnapshot)
    .orderBy(desc(schema.catalogSnapshot.createdAt))
    .limit(CANDIDATE_ROWS)
  for (const { id } of candidates) {
    const [row] = await db
      .select({ payload: schema.catalogSnapshot.payload })
      .from(schema.catalogSnapshot)
      .where(eq(schema.catalogSnapshot.id, id))
    if (!row) continue
    const parsed = parseStoredPayload(row.payload)
    if (parsed.success) return { id, snapshot: parsed.data }
    console.error(
      `[catalog] Snapshot ${id} in der Datenbank ist ungültig (z. B. andere Schemaversion) und wird übersprungen: ${parsed.error.message.slice(0, 300)}`
    )
  }
  return null
}

export interface LatestSnapshotRecord {
  id: string
  /** Kennzahlen der Zeile (Spalte `stats`), auch wenn der Payload ungültig ist. */
  stats: PreviousStats | null
  /** Gültiger Snapshot dieser Zeile oder `null` (z. B. andere Schemaversion). */
  snapshot: CatalogSnapshot | null
}

function readStats(value: unknown): PreviousStats | null {
  if (!value || typeof value !== "object") return null
  const { leistungen, actions } = value as Record<string, unknown>
  if (typeof leistungen !== "number") return null
  return typeof actions === "number" ? { leistungen, actions } : { leistungen }
}

/**
 * Neueste Zeile für den Vergleich im Sync: Die Plausibilisierung nutzt die
 * schemaunabhängige Spalte `stats`, damit sie auch nach einem Upgrade mit
 * neuer Schemaversion greift.
 */
export async function loadLatestSnapshotRecord(): Promise<LatestSnapshotRecord | null> {
  const [row] = await db
    .select({
      id: schema.catalogSnapshot.id,
      stats: schema.catalogSnapshot.stats,
      payload: schema.catalogSnapshot.payload,
    })
    .from(schema.catalogSnapshot)
    .orderBy(desc(schema.catalogSnapshot.createdAt))
    .limit(1)
  if (!row) return null
  const parsed = parseStoredPayload(row.payload)
  return {
    id: row.id,
    stats: readStats(row.stats),
    snapshot: parsed.success ? parsed.data : null,
  }
}

/** Anzahl gespeicherter Snapshots (für den Admin-Bereich). */
export async function countStoredSnapshots(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(schema.catalogSnapshot)
  return row?.value ?? 0
}

/** Aktiver Snapshot im LeanIX-Modus (Speicher, sonst aus der DB). */
async function currentLeanixSnapshot(): Promise<StoredSnapshot | null> {
  const s = state()
  if (s.current) return s.current
  if (s.lastMiss && Date.now() - s.lastMiss < DB_RETRY_AFTER_MS) return null

  s.loading ??= loadLatestSnapshotFromDb()
    .then((loaded) => {
      // Ein Sync kann inzwischen einen neueren Snapshot gesetzt haben.
      s.current ??= loaded
      // Leer oder ungültig: nicht endgültig merken, später erneut fragen.
      s.lastMiss = s.current ? null : Date.now()
      return s.current
    })
    .catch((error: unknown) => {
      s.lastMiss = Date.now()
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
  s.lastMiss = null
}

/**
 * Gleicht den Speicher mit der Datenbank ab: Lädt den neuesten gültigen
 * Snapshot, wenn eine andere Instanz (oder ein manueller Sync dort) einen
 * neueren Stand gespeichert hat. Billig, solange sich nichts ändert (nur
 * `id` und `generated_at` der neuesten Zeile). Gibt `true` zurück, wenn
 * der Speicher aktualisiert wurde.
 */
export async function refreshFromDb(): Promise<boolean> {
  if (catalogSource === "demo") return false
  const s = state()
  const [latest] = await db
    .select({
      id: schema.catalogSnapshot.id,
      generatedAt: schema.catalogSnapshot.generatedAt,
    })
    .from(schema.catalogSnapshot)
    .orderBy(desc(schema.catalogSnapshot.createdAt))
    .limit(1)
  if (!latest) return false
  const marker = `${latest.id}|${latest.generatedAt.toISOString()}`
  const current = s.current
  if (
    current?.id === latest.id &&
    current.snapshot.generatedAt === latest.generatedAt.toISOString()
  ) {
    s.lastSeenRow = marker
    return false
  }
  // Schon geprüft und nicht übernommen (z. B. ungültige Zeile): nicht bei
  // jedem Abgleich erneut laden.
  if (current && s.lastSeenRow === marker) return false

  const loaded = await loadLatestSnapshotFromDb()
  s.lastSeenRow = marker
  if (!loaded) return false
  // Nie einen älteren Stand über einen neueren legen (z. B. wenn ein Sync in
  // diesem Prozess gerade einen neuen Snapshot gesetzt hat).
  const now = s.current
  if (
    now &&
    now.id !== loaded.id &&
    Date.parse(loaded.snapshot.generatedAt) <
      Date.parse(now.snapshot.generatedAt)
  )
    return false
  setCurrentSnapshot(loaded)
  return true
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
