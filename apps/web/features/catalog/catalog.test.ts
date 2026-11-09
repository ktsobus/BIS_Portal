import { describe, expect, it } from "vitest"
import {
  catalogSnapshotSchema,
  type CatalogSnapshot,
  type Leistung,
} from "@workspace/api"

import { loadFixtureRaw } from "@/lib/catalog/__fixtures__"
import { buildSnapshot } from "@/lib/catalog/mapper"
import { leanixModel } from "@/lib/leanix/model"

import demo from "../../data/demo-catalog.json"
import { prepareEntries, searchEntries } from "./search"
import {
  createFallbackAction,
  createSupportContact,
  withFallbackAction,
} from "./server/fallback"
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

/** Wie der Demo-Snapshot, aber mit allen Services (CATALOG_SHOW_EMPTY_SERVICES=true). */
const fullSnapshot = buildSnapshot(loadFixtureRaw(), {
  kind: "demo",
  baseUrl: "https://ktso.leanix.net",
  workspace: "eamktsoLive",
  rootId: leanixModel.kategorie.rootId,
  showPersons: false,
  showEmptyServices: true,
  generatedAt: snapshot.generatedAt,
})

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

  it("nur mit https, mailto oder tel", () => {
    expect(createFallbackAction(undefined, "x")).toBeNull()
    expect(createFallbackAction("", "x")).toBeNull()
    expect(createFallbackAction("javascript:alert(1)", "x")).toBeNull()
    expect(createFallbackAction("servicedesk.example.org", "x")).toBeNull()
    expect(fallback?.kind).toBe("request")
    expect(
      createFallbackAction("mailto:servicedesk@example.org", "x")
    ).toMatchObject({ kind: "request", url: "mailto:servicedesk@example.org" })
    // Telefon: Kontakt (Telefon-Symbol), Nummer ohne Leerzeichen im Link.
    expect(createFallbackAction("tel:+41 32 000 00 00", "x")).toMatchObject({
      kind: "contact",
      url: "tel:+41320000000",
    })
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

describe("Zentraler Kontakt", () => {
  const base = {
    requestUrl: undefined,
    requestLabel: "Anfrage an den Service Desk",
    email: undefined,
    phone: undefined,
  }

  it("ist null ohne Konfiguration (kein erfundener Standardwert)", () => {
    expect(createSupportContact(base)).toBeNull()
    expect(createSupportContact({ ...base, requestUrl: "ftp://x" })).toBeNull()
  })

  it("übernimmt Anfrageweg, E-Mail und Telefon", () => {
    expect(
      createSupportContact({
        ...base,
        requestUrl: "https://example.org/ticket",
        email: " servicedesk@example.org ",
        phone: "032 000 00 00",
      })
    ).toEqual({
      request: expect.objectContaining({
        url: "https://example.org/ticket",
        label: "Anfrage an den Service Desk",
      }),
      email: "servicedesk@example.org",
      phone: "032 000 00 00",
    })
    expect(createSupportContact({ ...base, phone: "032 000 00 00" })).toEqual({
      request: null,
      email: null,
      phone: "032 000 00 00",
    })
  })
})

describe("Katalog-Abfragen", () => {
  it("Übersicht zählt Services und Leistungen je Familie", () => {
    // Demo-Snapshot: nur Services mit Leistung (CATALOG_SHOW_EMPTY_SERVICES).
    const { families } = buildOverview(snapshot, options)
    expect(families).toHaveLength(2)
    const support = families.find((f) => f.name === "Unterstützungs-Services")
    expect(support?.serviceCount).toBe(2)
    expect(support?.leistungCount).toBe(6)
  })

  it("Familie, Service und Leistung über den Slug", () => {
    expect(
      buildFamilyPage(snapshot, options, "unterstuetzungs-services-e5a717")
        ?.services
    ).toHaveLength(2)
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

  it("Familienseite zählt Leistungen mit mehreren Services einmal", () => {
    // Szenario: «eLearning Inhalte publizieren» zusätzlich unter Service Schulung.
    const multi = structuredClone(fullSnapshot)
    const leistung = multi.leistungen.find(
      (l) => l.name === "eLearning Inhalte publizieren"
    )!
    const schulung = multi.services.find((s) => s.name === "Service Schulung")!
    schulung.leistungIds.push(leistung.id)
    leistung.serviceIds.push(schulung.id)

    const page = buildFamilyPage(
      multi,
      options,
      "unterstuetzungs-services-e5a717"
    )!
    const sum = page.services.reduce((n, s) => n + s.leistungCount, 0)
    expect(sum).toBe(7)
    expect(page.family.leistungCount).toBe(6)
    expect(page.family.serviceCount).toBe(6)
    const overview = buildOverview(multi, options).families.find(
      (f) => f.id === page.family.id
    )
    expect(overview?.leistungCount).toBe(6)
  })

  it("liefert öffentlich keine Links ins LeanIX-Fact-Sheet", () => {
    const json = JSON.stringify([
      buildOverview(snapshot, options),
      buildFamilyPage(snapshot, options, "unterstuetzungs-services-e5a717"),
      buildServicePage(snapshot, options, "service-elearning-34be01"),
      buildLeistungPage(
        snapshot,
        options,
        "zugang-zur-mitwirkungsplattform-beantragen-760039"
      ),
      buildSearchIndex(snapshot, options),
    ])
    expect(json).not.toContain("leanixUrl")
    expect(json).not.toContain("/factsheet/")
    // Der Snapshot selbst (Admin-Bericht) behält die Links.
    expect(snapshot.leistungen[0]?.leanixUrl).toContain("/factsheet/")
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

  it("durchsucht den vollen Text von Beschreibung und Definition", () => {
    // Beide Begriffe stehen weit hinten (nach Zeichen 900). Service
    // Penetrationstesting hat keine Leistung und erscheint nur, wenn leere
    // Services eingeblendet sind.
    const full = prepareEntries(buildSearchIndex(fullSnapshot, options).entries)
    expect(
      searchEntries(full, { query: "ISO27001" }).map((e) => e.name)
    ).toEqual(["Service Penetrationstesting"])
    expect(names("ISO27001")).toEqual([])
    expect(names("Personenberechtigungsantrag")).toContain(
      "Zugang zur Mitwirkungsplattform beantragen"
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

describe("Datenschutz und Hierarchie (Snapshot aus den Fixtures)", () => {
  const ID = {
    mobile: "2c212a22-0ca6-4f6b-a377-07f24b1fc941",
    mobileAbo: "93e91cb4-2cce-468a-8f97-cb9332b7587d",
    serviceMobile: "aa84a92c",
  }

  /** Snapshot mit Personen; «Mobile» einem Service zugeordnet (Kinder erben). */
  function fixtureSnapshot(): CatalogSnapshot {
    const raw = loadFixtureRaw()
    const mobile = raw.leistungen.find((l) => l.id === ID.mobile)!
    const service = raw.kategorien.find((k) =>
      k.id.startsWith(ID.serviceMobile)
    )!
    mobile[leanixModel.leistung.relations.kategorie] = {
      edges: [
        {
          node: {
            factSheet: {
              id: service.id,
              name: service.name,
              displayName: service.displayName,
              type: "Leistungskategorie",
            },
          },
        },
      ],
    }
    return buildSnapshot(raw, {
      kind: "leanix",
      baseUrl: "https://ktso.leanix.net",
      workspace: "eamktsoLive",
      rootId: leanixModel.kategorie.rootId,
      showPersons: true,
      showEmptyServices: true,
      generatedAt: "2026-11-09T12:00:00.000Z",
    })
  }

  const withPersons = fixtureSnapshot()
  const hidden: ViewOptions = { fallbackAction: null, showPersons: false }
  const shown: ViewOptions = { fallbackAction: null, showPersons: true }

  it("entfernt Personen, wenn sie nicht freigeschaltet sind", () => {
    const leistung = withPersons.leistungen.find((l) => l.persons.length > 0)!
    expect(leistung).toBeDefined()
    expect(
      buildLeistungPage(withPersons, hidden, leistung.slug)?.leistung.persons
    ).toEqual([])
    expect(
      buildLeistungPage(withPersons, shown, leistung.slug)?.leistung.persons
    ).toEqual(leistung.persons)

    // Services: Personen künstlich setzen (die Fixtures haben keine).
    const withServicePersons = structuredClone(withPersons)
    const service = withServicePersons.services[0]!
    service.persons = [{ name: "Muster Petra", role: "Service Owner" }]
    expect(
      buildServicePage(withServicePersons, hidden, service.slug)?.service
        .persons
    ).toEqual([])
    expect(
      buildServicePage(withServicePersons, shown, service.slug)?.service.persons
    ).toEqual(service.persons)
    // Auch die Leistungen auf der Service-Seite (Karten) ohne Personen.
    const serviceOfLeistung = withPersons.services.find(
      (s) => s.id === leistung.serviceIds[0]
    )!
    const page = buildServicePage(withPersons, hidden, serviceOfLeistung.slug)
    expect(page?.leistungen.length).toBeGreaterThan(0)
    expect(page?.leistungen.every((l) => l.persons.length === 0)).toBe(true)
  })

  it("zeigt Eltern- und Kind-Leistungen («Mobile» → «Geschäftliches Mobile Abo»)", () => {
    const parent = withPersons.leistungen.find((l) => l.id === ID.mobile)!
    const child = withPersons.leistungen.find((l) => l.id === ID.mobileAbo)!

    const parentPage = buildLeistungPage(withPersons, hidden, parent.slug)!
    expect(parentPage.parent).toBeNull()
    expect(parentPage.children.map((c) => c.id)).toContain(ID.mobileAbo)
    expect(parentPage.children).toHaveLength(parent.childIds.length)

    const childPage = buildLeistungPage(withPersons, hidden, child.slug)!
    expect(childPage.parent).toMatchObject({ id: ID.mobile, name: parent.name })
    // Das Kind erbt den Service der Eltern-Leistung.
    expect(childPage.placements.map((p) => p.service.id)).toEqual(
      parentPage.placements.map((p) => p.service.id)
    )
  })

  it("begrenzt den Suchkontext bei einem Zyklus in der Hierarchie", () => {
    const cyclic = structuredClone(withPersons)
    const [a, b] = cyclic.leistungen.filter((l) => l.id !== ID.mobile)
    for (const leistung of [a!, b!]) leistung.serviceIds = []
    a!.parentId = b!.id
    b!.parentId = a!.id
    const entry = buildSearchIndex(cyclic, hidden).entries.find(
      (e) => e.id === a!.id
    )!
    // Endet nach wenigen Ebenen statt endlos.
    expect(entry.context.split(" › ").length).toBeLessThanOrEqual(6)
    expect(entry.context).toContain(b!.name)
  })

  it("cacht den Index je Snapshot und Ansichtsoptionen", () => {
    const fallback = createFallbackAction("https://example.org/anfrage", "X")
    const slug = withPersons.leistungen.find(
      (l) => l.actions.length === 0
    )!.slug
    const first = buildLeistungPage(withPersons, hidden, slug)!
    // Gleiche Optionen (auch als neues Objekt): dasselbe Objekt aus dem Cache.
    expect(buildLeistungPage(withPersons, { ...hidden }, slug)!.leistung).toBe(
      first.leistung
    )
    // Andere Optionen: eigener Index, Fallback-Aktion angehängt.
    const other = buildLeistungPage(
      withPersons,
      { ...hidden, fallbackAction: fallback },
      slug
    )!
    expect(other.leistung).not.toBe(first.leistung)
    expect(other.leistung.actions.map((a) => a.id)).toEqual(["fallback"])
    expect(first.leistung.actions).toEqual([])
  })
})
