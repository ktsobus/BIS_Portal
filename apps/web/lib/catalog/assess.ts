import type { CatalogSnapshot } from "@workspace/api"

/**
 * Plausibilisierung eines neuen Snapshots gegenüber dem aktiven (Konzept,
 * Kapitel 4.1): schützt vor Teilantworten und versehentlichem
 * Massen-Entfernen in LeanIX. Ein abgelehnter Snapshot wird nicht übernommen;
 * der bisherige bleibt aktiv.
 */

export type SnapshotAssessment = { ok: true } | { ok: false; reason: string }

type SnapshotCounts = Pick<CatalogSnapshot, "families" | "services" | "stats">

export function assessSnapshot(
  next: SnapshotCounts,
  previous: Pick<CatalogSnapshot, "stats"> | null | undefined,
  minRatio: number
): SnapshotAssessment {
  if (next.families.length === 0 || next.services.length === 0) {
    return {
      ok: false,
      reason: `Der neue Snapshot enthält ${next.families.length} Service-Familien und ${next.services.length} Services. Wurzel-Kategorie (CATALOG_ROOT_ID) und Leserechte in LeanIX prüfen.`,
    }
  }

  const before = previous?.stats.leistungen ?? 0
  const after = next.stats.leistungen
  if (before > 0 && after < before * minRatio) {
    const percent = Math.round(minRatio * 100)
    return {
      ok: false,
      reason: `Der neue Snapshot enthält nur ${after} statt bisher ${before} Leistungen (Mindestanteil ${percent} %). Er wird nicht übernommen; bei gewollter Änderung CATALOG_MIN_RATIO senken.`,
    }
  }

  return { ok: true }
}
