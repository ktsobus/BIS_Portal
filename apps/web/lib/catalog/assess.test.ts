import type { CatalogSnapshot } from "@workspace/api"
import { describe, expect, it } from "vitest"

import { assessSnapshot, type AssessOptions } from "./assess"

function snapshot(
  leistungen: number,
  families = 5,
  services = 29,
  actions?: number
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
      actions,
      issues: 0,
    },
  }
}

const strict: AssessOptions = { minRatio: 0.5, tolerance: 0 }

describe("assessSnapshot", () => {
  it("übernimmt einen plausiblen Snapshot", () => {
    expect(assessSnapshot(snapshot(7), null, strict)).toEqual({ ok: true })
    expect(assessSnapshot(snapshot(7), { leistungen: 10 }, strict)).toEqual({
      ok: true,
    })
    expect(assessSnapshot(snapshot(5), { leistungen: 10 }, strict)).toEqual({
      ok: true,
    })
    // Vorher keine Leistungen: jede Anzahl ist plausibel.
    expect(assessSnapshot(snapshot(0), { leistungen: 0 }, strict)).toEqual({
      ok: true,
    })
  })

  it("lehnt einen Snapshot ohne Familien oder Services ab", () => {
    const noFamilies = assessSnapshot(snapshot(7, 0, 0), null, strict)
    expect(noFamilies.ok).toBe(false)
    if (!noFamilies.ok) expect(noFamilies.reason).toContain("CATALOG_ROOT_ID")
    expect(assessSnapshot(snapshot(7, 5, 0), null, strict).ok).toBe(false)
  })

  it("lehnt einen stark geschrumpften Snapshot ab", () => {
    const result = assessSnapshot(snapshot(4), { leistungen: 10 }, strict)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toContain("nur 4 statt bisher 10 Leistungen")
      expect(result.reason).toContain("50 %")
      expect(result.reason).toContain("CATALOG_SHRINK_TOLERANCE")
    }
  })

  it("berücksichtigt den Mindestanteil", () => {
    const ratio = (minRatio: number) => ({ minRatio, tolerance: 0 })
    expect(assessSnapshot(snapshot(4), { leistungen: 10 }, ratio(0.3)).ok).toBe(
      true
    )
    expect(assessSnapshot(snapshot(0), { leistungen: 10 }, ratio(0)).ok).toBe(
      true
    )
  })

  it("lässt kleine Änderungen in kleinen Katalogen zu (Toleranz)", () => {
    const options = { minRatio: 0.5, tolerance: 5 }
    // 7 → 3: nur 4 weniger, unter der Toleranz.
    expect(assessSnapshot(snapshot(3), { leistungen: 7 }, options).ok).toBe(
      true
    )
    // 7 → 1: 6 weniger, über der Toleranz und unter 50 %.
    expect(assessSnapshot(snapshot(1), { leistungen: 7 }, options).ok).toBe(
      false
    )
    // 100 → 60: 40 weniger, aber über 50 %.
    expect(assessSnapshot(snapshot(60), { leistungen: 100 }, options).ok).toBe(
      true
    )
  })

  it("lehnt ab, wenn Bestell- und Anfragewege stark schrumpfen", () => {
    const result = assessSnapshot(
      snapshot(7, 5, 29, 0),
      { leistungen: 7, actions: 4 },
      strict
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toContain(
        "nur 0 statt bisher 4 Bestell- und Anfragewege"
      )
    }
    // Ohne Kennzahl beim Vorgänger (älterer Snapshot) keine Prüfung.
    expect(
      assessSnapshot(snapshot(7, 5, 29, 0), { leistungen: 7 }, strict).ok
    ).toBe(true)
    // Leichte Abnahme ist in Ordnung.
    expect(
      assessSnapshot(
        snapshot(7, 5, 29, 3),
        { leistungen: 7, actions: 4 },
        strict
      ).ok
    ).toBe(true)
  })
})
