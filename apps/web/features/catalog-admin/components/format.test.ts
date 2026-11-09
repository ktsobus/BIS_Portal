import { describe, expect, it } from "vitest"

import {
  factSheetTypeLabel,
  formatDateTime,
  formatDuration,
  formatHours,
  formatInterval,
  formatRelative,
} from "./format"

describe("Formatierung im Admin-Bereich", () => {
  it("formatInterval", () => {
    expect(formatInterval(1)).toBe("jede Minute")
    expect(formatInterval(15)).toBe("alle 15 Minuten")
    expect(formatInterval(60)).toBe("stündlich")
    expect(formatInterval(120)).toBe("alle 2 Stunden")
    expect(formatInterval(90)).toBe("alle 90 Minuten")
  })

  it("formatDuration", () => {
    expect(formatDuration(null)).toBe("–")
    expect(formatDuration(undefined)).toBe("–")
    expect(formatDuration(0)).toBe("0 ms")
    expect(formatDuration(850)).toBe("850 ms")
    expect(formatDuration(12_340)).toBe("12.3 s")
    expect(formatDuration(60_000)).toBe("1 min")
    expect(formatDuration(125_000)).toBe("2 min 5 s")
  })

  describe("formatRelative", () => {
    const now = Date.parse("2026-11-09T12:00:00.000Z")
    const ago = (ms: number) => new Date(now - ms).toISOString()

    it("ohne gültiges Datum", () => {
      expect(formatRelative(null, now)).toBeNull()
      expect(formatRelative("kein Datum", now)).toBeNull()
    })

    it("Sekunden, Minuten, Stunden, Tage", () => {
      expect(formatRelative(ago(30_000), now)).toBe("gerade eben")
      expect(formatRelative(ago(5 * 60_000), now)).toBe("vor 5 Minuten")
      expect(formatRelative(ago(3 * 3_600_000), now)).toBe("vor 3 Stunden")
      expect(formatRelative(ago(24 * 3_600_000), now)).toBe("gestern")
      expect(formatRelative(ago(3 * 86_400_000), now)).toBe("vor 3 Tagen")
      // Zukunft (z. B. Uhrzeit-Abweichung zwischen Servern).
      expect(formatRelative(ago(-10 * 60_000), now)).toBe("in 10 Minuten")
    })
  })

  it("formatDateTime in Zürcher Zeit", () => {
    expect(formatDateTime("2026-11-09T13:16:00.000Z")).toBe("09.11.2026, 14:16")
    expect(formatDateTime(null)).toBe("–")
  })

  it("formatHours und Fact-Sheet-Typen", () => {
    expect(formatHours(1)).toBe("1 Stunde")
    expect(formatHours(24)).toBe("24 Stunden")
    expect(formatHours(1.5)).toBe("1.5 Stunden")
    expect(factSheetTypeLabel("behoerdenLeistungen")).toBe("Leistung")
    expect(factSheetTypeLabel("UserGroup")).toBe("Leistungsbezüger")
    expect(factSheetTypeLabel("Unbekannt")).toBe("Unbekannt")
  })
})
