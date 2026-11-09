import "server-only"

import {
  catalogSnapshotSchema,
  type CatalogSnapshot,
  type CatalogStatus,
} from "@workspace/api"

import demo from "@/data/demo-catalog.json"

// PHASE-0-STUB: liefert nur den Demo-Snapshot. Wird durch den DB-gestützten
// Store mit Sync ersetzt (gleiche Signaturen beibehalten).
const demoSnapshot = catalogSnapshotSchema.parse(demo)

/** Aktueller Katalog-Snapshot oder `null`, wenn noch keiner vorhanden ist. */
export async function getCatalog(): Promise<CatalogSnapshot | null> {
  return demoSnapshot
}

/** Status für Fusszeile und Hinweise (verfügbar, Stand, veraltet). */
export async function getCatalogStatus(): Promise<CatalogStatus> {
  return {
    available: true,
    source: demoSnapshot.source.kind,
    generatedAt: demoSnapshot.generatedAt,
    stale: false,
  }
}
