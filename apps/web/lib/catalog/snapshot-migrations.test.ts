import { CATALOG_SCHEMA_VERSION } from "@workspace/api"
import { describe, expect, it } from "vitest"

import { migrateSnapshotPayload } from "./snapshot-migrations"

describe("migrateSnapshotPayload", () => {
  it("lässt aktuelle und unbekannte Versionen unverändert", () => {
    const current = { schemaVersion: CATALOG_SCHEMA_VERSION, families: [] }
    expect(migrateSnapshotPayload(current)).toBe(current)
    const future = { schemaVersion: CATALOG_SCHEMA_VERSION + 1 }
    expect(migrateSnapshotPayload(future)).toBe(future)
    expect(migrateSnapshotPayload(null)).toBeNull()
    expect(migrateSnapshotPayload("x")).toBe("x")
  })

  it("wendet die Schritte bis zur Zielversion nacheinander an", () => {
    const migrations = {
      1: (p: Record<string, unknown>) => ({ ...p, schemaVersion: 2, a: 1 }),
      2: (p: Record<string, unknown>) => ({ ...p, schemaVersion: 3, b: 2 }),
    }
    expect(migrateSnapshotPayload({ schemaVersion: 1 }, migrations, 3)).toEqual(
      { schemaVersion: 3, a: 1, b: 2 }
    )
    // Fehlt ein Schritt, bleibt der Stand (die Prüfung lehnt ihn dann ab).
    expect(migrateSnapshotPayload({ schemaVersion: 0 }, migrations, 3)).toEqual(
      { schemaVersion: 0 }
    )
  })
})
