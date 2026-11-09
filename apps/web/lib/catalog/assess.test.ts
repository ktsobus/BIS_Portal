import type { CatalogSnapshot } from "@workspace/api"
import { describe, expect, it } from "vitest"

import { assessSnapshot } from "./assess"

function snapshot(
  leistungen: number,
  families = 5,
  services = 29
): Pick<CatalogSnapshot, "families" | "services" | "stats"> {
  return {
    families: Array.from({ length: families }) as CatalogSnapshot["families"],
    services: Array.from({ length: services }) as CatalogSnapshot["services"],
    stats: {
      families,
      services,
      leistungen,
      leistungenInChannel: leistungen,
      leistungenSkipped: 0,
      issues: 0,
    },
  }
}

describe("assessSnapshot", () => {
  it("übernimmt einen plausiblen Snapshot", () => {
    expect(assessSnapshot(snapshot(7), null, 0.5)).toEqual({ ok: true })
    expect(assessSnapshot(snapshot(7), snapshot(10), 0.5)).toEqual({ ok: true })
    expect(assessSnapshot(snapshot(5), snapshot(10), 0.5)).toEqual({ ok: true })
    // Vorher keine Leistungen: jede Anzahl ist plausibel.
    expect(assessSnapshot(snapshot(0), snapshot(0), 0.5)).toEqual({ ok: true })
  })

  it("lehnt einen Snapshot ohne Familien oder Services ab", () => {
    const noFamilies = assessSnapshot(snapshot(7, 0, 0), null, 0.5)
    expect(noFamilies.ok).toBe(false)
    if (!noFamilies.ok) expect(noFamilies.reason).toContain("CATALOG_ROOT_ID")
    expect(assessSnapshot(snapshot(7, 5, 0), null, 0.5).ok).toBe(false)
  })

  it("lehnt einen stark geschrumpften Snapshot ab", () => {
    const result = assessSnapshot(snapshot(4), snapshot(10), 0.5)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toContain("nur 4 statt bisher 10 Leistungen")
      expect(result.reason).toContain("50 %")
    }
  })

  it("berücksichtigt den Mindestanteil", () => {
    expect(assessSnapshot(snapshot(4), snapshot(10), 0.3).ok).toBe(true)
    expect(assessSnapshot(snapshot(0), snapshot(10), 0).ok).toBe(true)
  })
})
