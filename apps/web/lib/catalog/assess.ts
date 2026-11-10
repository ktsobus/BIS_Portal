import type { CatalogSnapshot } from "@workspace/api"

/**
 * Plausibilisierung eines neuen Snapshots gegenüber dem aktiven (Konzept,
 * Kapitel 4.1): schützt vor Teilantworten und versehentlichem
 * Massen-Entfernen in LeanIX. Ein abgelehnter Snapshot wird nicht übernommen;
 * der bisherige bleibt aktiv.
 *
 * Geprüft werden die Anzahl Leistungen und die Anzahl Aktionen
 * (Bestell-/Anfragewege). Abgelehnt wird nur, wenn weniger als `minRatio`
 * des Vorgängers übrig bleibt **und** mehr als `tolerance` wegfallen. So
 * blockieren kleine, gewollte Änderungen in einem kleinen Katalog nicht.
 */

export type SnapshotAssessment = { ok: true } | { ok: false; reason: string }

type SnapshotCounts = Pick<CatalogSnapshot, "families" | "services" | "stats">

/** Kennzahlen des Vorgängers (aus der Spalte `stats`, schemaunabhängig). */
export interface PreviousStats {
  leistungen: number
  /** Fehlt bei Snapshots, die vor dieser Kennzahl gespeichert wurden. */
  actions?: number
}

export interface AssessOptions {
  /** Mindestanteil (0–1) gegenüber dem Vorgänger. */
  minRatio: number
  /** So viele Einträge dürfen ohne Prüfung des Anteils wegfallen. */
  tolerance: number
}

function shrinksTooMuch(
  before: number,
  after: number,
  { minRatio, tolerance }: AssessOptions
) {
  return before > 0 && after < before * minRatio && before - after > tolerance
}

export function assessSnapshot(
  next: SnapshotCounts,
  previous: PreviousStats | null | undefined,
  options: AssessOptions
): SnapshotAssessment {
  if (next.families.length === 0 || next.services.length === 0) {
    return {
      ok: false,
      reason: `Der neue Snapshot enthält ${next.families.length} Service-Familien und ${next.services.length} Services. Wurzel-Kategorie (CATALOG_ROOT_ID), Kanal der Leistungen und Leserechte in LeanIX prüfen.`,
    }
  }
  if (!previous) return { ok: true }

  const percent = Math.round(options.minRatio * 100)
  const hint = `Er wird nicht übernommen; bei gewollter Änderung CATALOG_MIN_RATIO senken oder CATALOG_SHRINK_TOLERANCE erhöhen (heute ${options.tolerance}).`

  const before = previous.leistungen
  const after = next.stats.leistungen
  if (shrinksTooMuch(before, after, options)) {
    return {
      ok: false,
      reason: `Der neue Snapshot enthält nur ${after} statt bisher ${before} Leistungen (Mindestanteil ${percent} %). ${hint}`,
    }
  }

  const actionsBefore = previous.actions
  const actionsAfter = next.stats.actions
  if (
    actionsBefore != null &&
    actionsAfter != null &&
    shrinksTooMuch(actionsBefore, actionsAfter, options)
  ) {
    return {
      ok: false,
      reason: `Der neue Snapshot enthält nur ${actionsAfter} statt bisher ${actionsBefore} Bestell- und Anfragewege (Mindestanteil ${percent} %). Möglicherweise fehlen Ressourcen in der Antwort von LeanIX (Leserechte). ${hint}`,
    }
  }

  return { ok: true }
}
