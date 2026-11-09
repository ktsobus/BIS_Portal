import type {
  CatalogSnapshot,
  CatalogStats,
  SyncRunStatus,
  SyncTrigger,
} from "@workspace/api"
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

/**
 * Katalog-Snapshots aus LeanIX (die letzten 20 Versionen). Der neueste
 * Eintrag (nach `created_at`) ist der aktive Katalog. Bleibt der Inhalt bei
 * einem Sync gleich, wird nur `generated_at` des aktiven Eintrags
 * nachgeführt, damit die Historie echte Änderungen zeigt.
 */
export const catalogSnapshot = pgTable(
  "catalog_snapshot",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Zeitpunkt, zu dem die Daten zuletzt aus LeanIX gelesen wurden. */
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    /** `leanix` oder `demo`. */
    source: text("source").$type<CatalogSnapshot["source"]["kind"]>().notNull(),
    stats: jsonb("stats").$type<CatalogStats>().notNull(),
    payload: jsonb("payload").$type<CatalogSnapshot>().notNull(),
  },
  (table) => [index("catalog_snapshot_created_at_idx").on(table.createdAt)]
)

/** Protokoll der Sync-Läufe (die letzten 200). */
export const catalogSyncRun = pgTable(
  "catalog_sync_run",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trigger: text("trigger").$type<SyncTrigger>().notNull(),
    status: text("status").$type<SyncRunStatus>().notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    /** Fehlermeldung, Grund der Ablehnung oder Hinweise (Teilfehler). */
    message: text("message"),
    stats: jsonb("stats").$type<CatalogStats>(),
    snapshotId: uuid("snapshot_id").references(() => catalogSnapshot.id, {
      onDelete: "set null",
    }),
  },
  (table) => [index("catalog_sync_run_started_at_idx").on(table.startedAt)]
)
