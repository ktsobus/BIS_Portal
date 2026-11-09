import { describe, expect, it } from "vitest"
import { catalogSnapshotSchema, type Leistung } from "@workspace/api"

import demo from "../../data/demo-catalog.json"
import { prepareEntries, searchEntries } from "./search"
import { createFallbackAction, withFallbackAction } from "./server/fallback"
import {
  buildFamilyPage,
  buildLeistungPage,
  buildOverview,
  buildSearchIndex,
  buildServicePage,
  findBySlug,
  type ViewOptions,
} from "./server/views"
import { markdownToPlainText, truncateText } from "./text"

const snapshot = catalogSnapshotSchema.parse(demo)
const options: ViewOptions = { fallbackAction: null, showPersons: false }

describe("markdownToPlainText", () => {
  it("entfernt Markdown, Links und Backslash-Umbrüche", () => {
    const text = markdownToPlainText(
      '"Erster Satz.\\\n\\\n**Beschreibung:**\\\nSiehe [mitwirken.so.ch](http://mitwirken.so.ch).\n\n- **Coaching:** begleitet"'
    )
    expect(text).toBe(
      "Erster Satz. Beschreibung: Siehe mitwirken.so.ch. Coaching: begleitet"
    )
  })

  it("kürzt an Wortgrenzen mit Auslassungspunkten", () => {
    expect(truncateText("eins zwei drei vier", 12)).toBe("eins zwei …")
  })
})

describe("Fallback-Aktion", () => {
  const fallback = createFallbackAction(
    "https://example.org/anfrage",
    "Anfrage an den Service Desk"
  )
  const leistung = snapshot.leistungen[0] as Leistung

  it("nur mit gültiger http(s)-URL", () => {
    expect(createFallbackAction(undefined, "x")).toBeNull()
    expect(createFallbackAction("javascript:alert(1)", "x")).toBeNull()
    expect(fallback?.kind).toBe("request")
  })

  it("wird nur ohne order/request-Aktion angehängt", () => {
    expect(withFallbackAction(leistung, fallback).actions).toHaveLength(1)
    const withOrder: Leistung = {
      ...leistung,
      actions: [{ ...fallback!, id: "x", kind: "order" }],
    }
    expect(withFallbackAction(withOrder, fallback).actions).toHaveLength(1)
    const withContact: Leistung = {
      ...leistung,
      actions: [{ ...fallback!, id: "x", kind: "contact" }],
    }
    expect(withFallbackAction(withContact, fallback).actions).toHaveLength(2)
  })
})

describe("Katalog-Abfragen", () => {
  it("Übersicht zählt Services und Leistungen je Familie", () => {
    const { families } = buildOverview(snapshot, options)
    expect(families).toHaveLength(5)
    const support = families.find((f) => f.name === "Unterstützungs-Services")
    expect(support?.serviceCount).toBe(6)
    expect(support?.leistungCount).toBe(6)
  })

  it("Familie, Service und Leistung über den Slug", () => {
    expect(
      buildFamilyPage(snapshot, options, "unterstuetzungs-services-e5a717")
        ?.services
    ).toHaveLength(6)
    const service = buildServicePage(
      snapshot,
      options,
      "service-elearning-34be01"
    )
    expect(service?.leistungen.map((l) => l.id)).toEqual(
      service?.service.leistungIds
    )
    const leistung = buildLeistungPage(
      snapshot,
      options,
      "zugang-zur-mitwirkungsplattform-beantragen-760039"
    )
    expect(leistung?.placements[0]?.service.name).toBe(
      "Digitales Mitwirkungsverfahren"
    )
    expect(buildLeistungPage(snapshot, options, "unbekannt")).toBeNull()
  })

  it("findet umbenannte Slugs über die Kurz-ID", () => {
    expect(findBySlug(snapshot.leistungen, "alter-name-760039")?.slug).toBe(
      "zugang-zur-mitwirkungsplattform-beantragen-760039"
    )
  })

  it("hängt die Fallback-Aktion in allen Antworten an", () => {
    const withFallback: ViewOptions = {
      ...options,
      fallbackAction: createFallbackAction("https://example.org/anfrage", "X"),
    }
    const page = buildServicePage(
      snapshot,
      withFallback,
      "service-elearning-34be01"
    )
    expect(page?.leistungen.every((l) => l.actions.length === 1)).toBe(true)
  })
})

describe("Suche", () => {
  const index = buildSearchIndex(snapshot, options)
  const prepared = prepareEntries(index.entries)
  const names = (query: string, extra = {}) =>
    searchEntries(prepared, { query, ...extra }).map((e) => e.name)

  it("enthält Leistungen und Services mit Kontext", () => {
    const entry = index.entries.find(
      (e) => e.name === "eLearning Inhalte publizieren"
    )
    expect(entry?.context).toBe("Unterstützungs-Services › Service eLearning")
    expect(entry?.keywords).toContain("easylearn")
    expect(index.facets.subtypes).toEqual(["Verwaltungsleistung"])
  })

  it("ist tolerant bei Gross-/Kleinschreibung, Umlauten und Bindestrichen", () => {
    expect(names("ELEARNING")).toHaveLength(5)
    expect(names("e-learning")).toHaveLength(5)
    expect(names("selbstaendig")).toContain(
      "eLearning Inhalte selbständig erstellen"
    )
    expect(names("selbstandig")).toContain(
      "eLearning Inhalte selbständig erstellen"
    )
  })

  it("verknüpft mehrere Wörter mit UND und filtert", () => {
    // Der Service trifft über die Namen seiner Leistungen, rangiert aber tiefer.
    expect(names("elearning publizieren")).toEqual([
      "eLearning Inhalte publizieren",
      "Service eLearning",
    ])
    expect(names("elearning telefonie")).toHaveLength(0)
    expect(names("easylearn")).toContain("eLearning Inhalte publizieren")
    expect(
      names("", { audience: "Kantonale Verwaltung" }).length
    ).toBeGreaterThan(0)
    expect(names("elearning", { subtype: "Behördenleistung" })).toHaveLength(0)
  })
})
