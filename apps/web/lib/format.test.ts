import { describe, expect, it } from "vitest"

import {
  formatDate,
  formatDateShort,
  formatDateTime,
  formatDateTimeShort,
  formatRelative,
  currentYear,
  parseDate,
} from "./format"

// 14:16 in Zürich (MEZ, UTC+1).
const ISO = "2026-11-09T13:16:00.000Z"

describe("lib/format", () => {
  it("formatiert Datum und Zeit in de-CH, Zeitzone Zürich", () => {
    expect(formatDate(ISO)).toBe("09.11.2026")
    expect(formatDateShort(ISO)).toBe("09.11.2026")
    expect(formatDateTime(ISO)).toBe("09.11.2026, 14:16 Uhr")
    expect(formatDateTimeShort(ISO)).toBe("09.11.2026, 14:16")
    expect(formatDate(new Date(ISO))).toBe("09.11.2026")
  })

  it("liefert null bei fehlenden oder ungültigen Werten", () => {
    for (const value of [null, undefined, "", "kein Datum"]) {
      expect(parseDate(value)).toBeNull()
      expect(formatDate(value)).toBeNull()
      expect(formatDateTime(value)).toBeNull()
      expect(formatDateTimeShort(value)).toBeNull()
      expect(formatRelative(value)).toBeNull()
    }
  })

  it("liefert das Jahr in Zürich (Silvester UTC = Neujahr in Zürich)", () => {
    expect(currentYear(new Date("2026-12-31T23:30:00.000Z"))).toBe("2027")
  })

  it("formatiert relative Zeitangaben", () => {
    const now = Date.parse(ISO)
    expect(formatRelative(ISO, now + 30_000)).toBe("gerade eben")
    expect(formatRelative(ISO, now + 5 * 60_000)).toBe("vor 5 Minuten")
    expect(formatRelative(ISO, now + 86_400_000)).toBe("gestern")
  })
})
