import { describe, expect, it } from "vitest"

import {
  channelOptionCandidates,
  fieldsWithOption,
  formatCandidate,
} from "../../../scripts/leanix-discovery.mjs"

// Fundstellen in der Form, wie sie die Discovery vom 9.11.2026 in
// models/languages/de gefunden hat (findPaths: «Pfad = "Wert"»).
const PATHS = [
  'data.dataModel.factSheets.BusinessCapability.fields.category.values.itServiceCatalog.label = "Business IT-Servicekatalog"',
  'data.dataModel.factSheets.behoerdenLeistungen.fields.kanal.values.Business_IT_Servicekatalog.label = "Business IT-Servicekatalog"',
  // Andere Fundstelle (z. B. Hilfetext) ohne Optionsschlüssel
  'data.dataModel.factSheets.behoerdenLeistungen.fields.kanal.help = "… Business IT-Servicekatalog …"',
]

describe("leanix-discovery: Kanal-Optionsschlüssel", () => {
  it("nimmt den Optionsschlüssel (vorletztes Segment), nicht «label»", () => {
    const candidates = channelOptionCandidates(PATHS)
    expect(candidates).toEqual([
      {
        type: "BusinessCapability",
        field: "category",
        option: "itServiceCatalog",
      },
      {
        type: "behoerdenLeistungen",
        field: "kanal",
        option: "Business_IT_Servicekatalog",
      },
    ])
    expect(candidates.map((c) => c.option)).not.toContain("label")
    expect(candidates.map(formatCandidate)).toContain(
      "behoerdenLeistungen.kanal = Business_IT_Servicekatalog"
    )
  })

  it("erkennt Leistungen im Kanal (Mehrfachauswahl mit weiteren Kanälen)", () => {
    const candidates = channelOptionCandidates(PATHS)
    const leistung = {
      id: "1",
      type: "behoerdenLeistungen",
      kanal: ["mail", "Business_IT_Servicekatalog", "mySO"],
      category: "verwaltungsLeistungen",
    }
    expect(fieldsWithOption(leistung, candidates)).toEqual([
      "kanal = Business_IT_Servicekatalog",
    ])
    expect(
      fieldsWithOption(
        { ...leistung, kanal: ["schalter", "telefon"] },
        candidates
      )
    ).toEqual([])
  })

  it("wertet Optionen anderer Typen oder Felder nicht als Kanal", () => {
    const candidates = channelOptionCandidates(PATHS)
    const leistung = {
      id: "2",
      kanal: [],
      // Schlüssel der BusinessCapability-Option, aber im falschen Typ
      category: "itServiceCatalog",
      // Optionsschlüssel des Kanals, aber in einem anderen Feld
      tags: ["Business_IT_Servicekatalog"],
    }
    expect(
      fieldsWithOption(leistung, candidates, "behoerdenLeistungen")
    ).toEqual([])
  })

  it("akzeptiert als Rückfall das Label selbst", () => {
    expect(
      fieldsWithOption(
        { id: "3", kanal: ["Business IT-Servicekatalog"] },
        [],
        "behoerdenLeistungen"
      )
    ).toEqual(["kanal = Business IT-Servicekatalog"])
  })
})
