import { CATALOG_SCHEMA_VERSION } from "@workspace/api"

/**
 * Hebt gespeicherte Snapshots älterer Schemaversionen auf die aktuelle an,
 * bevor sie geprüft werden. So zeigt das Portal nach einem Upgrade den
 * gespeicherten Stand weiter an, auch wenn LeanIX gerade nicht erreichbar
 * ist.
 *
 * Regel (AGENTS.md): Neue Snapshot-Felder mit `.optional()` oder
 * `.default()` einführen; `CATALOG_SCHEMA_VERSION` nur bei echten Brüchen
 * erhöhen und dann hier einen Schritt `n → n + 1` ergänzen.
 */

type Payload = Record<string, unknown>
export type SnapshotMigration = (payload: Payload) => Payload

/** Schritte je Ausgangsversion (heute keine: Version 1 ist die erste). */
export const SNAPSHOT_MIGRATIONS: Readonly<Record<number, SnapshotMigration>> =
  {}

/**
 * Wendet die Schritte ab der gespeicherten `schemaVersion` an. Unbekannte
 * oder neuere Versionen bleiben unverändert (die Prüfung lehnt sie ab).
 */
export function migrateSnapshotPayload(
  payload: unknown,
  migrations: Readonly<Record<number, SnapshotMigration>> = SNAPSHOT_MIGRATIONS,
  target: number = CATALOG_SCHEMA_VERSION
): unknown {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    return payload
  let current = payload as Payload
  // Höchstens so viele Schritte, wie es Versionen gibt (Schutz vor Zyklen).
  for (let steps = 0; steps <= target; steps++) {
    const version = current.schemaVersion
    if (typeof version !== "number" || version >= target) break
    const step = migrations[version]
    if (!step) break
    current = step(current)
  }
  return current
}
