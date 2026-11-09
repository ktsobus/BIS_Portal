import { catalogSnapshotSchema } from "@workspace/api"
import { describe, expect, it } from "vitest"

import { leanixModel } from "@/lib/leanix/model"
import type { RawDocument, RawLeistung } from "@/lib/leanix/types"

import { loadFixtureRaw } from "./__fixtures__"
import {
  buildSnapshot,
  checkResourceUrl,
  mapResources,
  normalizeResourceUrl,
  personsOf,
  type BuildSnapshotOptions,
} from "./mapper"

const options: BuildSnapshotOptions = {
  kind: "leanix",
  baseUrl: "https://ktso.leanix.net",
  workspace: "eamktsoLive",
  rootId: leanixModel.kategorie.rootId,
  showPersons: false,
  showEmptyServices: false,
  generatedAt: "2026-11-09T12:00:00.000Z",
}
/** Variante mit allen Services (auch ohne Leistung im Kanal). */
const allServices: BuildSnapshotOptions = {
  ...options,
  showEmptyServices: true,
}

const ID = {
  mobile: "2c212a22-0ca6-4f6b-a377-07f24b1fc941",
  mobileAbo: "93e91cb4-2cce-468a-8f97-cb9332b7587d",
  publizieren: "5a839ed9-19c3-40fe-b231-d211be3c95bd",
  serviceMobile: "aa84a92c",
  serviceElearning: "34be0167-938b-43a2-89f9-dc56cf9ab759",
  serviceItSupport: "a4ea3781",
}

function findLeistung(raw: ReturnType<typeof loadFixtureRaw>, id: string) {
  const node = raw.leistungen.find((l) => l.id === id)
  if (!node) throw new Error(`Fixture ${id} fehlt`)
  return node
}

function serviceRef(raw: ReturnType<typeof loadFixtureRaw>, prefix: string) {
  const node = raw.kategorien.find((k) => k.id.startsWith(prefix))
  if (!node) throw new Error(`Kategorie ${prefix} fehlt`)
  return {
    id: node.id,
    name: node.name,
    displayName: node.displayName,
    type: "Leistungskategorie",
  }
}

function setRelation(node: RawLeistung, relation: string, refs: object[]) {
  node[relation] = { edges: refs.map((factSheet) => ({ node: { factSheet } })) }
}

function setDocuments(node: RawLeistung, docs: RawDocument[]) {
  node.documents = { edges: docs.map((doc) => ({ node: doc })) }
}

describe("buildSnapshot mit den Discovery-Fixtures", () => {
  const snapshot = buildSnapshot(loadFixtureRaw(), options)

  it("liefert einen gültigen Snapshot", () => {
    expect(() => catalogSnapshotSchema.parse(snapshot)).not.toThrow()
    expect(snapshot.source).toEqual({
      kind: "leanix",
      baseUrl: "https://ktso.leanix.net",
      workspace: "eamktsoLive",
    })
    expect(snapshot.generatedAt).toBe(options.generatedAt)
  })

  it("zeigt nur Services mit Leistung im Kanal (Standard)", () => {
    expect(snapshot.families.map((f) => f.name)).toEqual([
      "Arbeitsplatz-Services",
      "Unterstützungs-Services",
    ])
    expect(snapshot.services.map((s) => s.name)).toEqual([
      "Service Kollaboration",
      "Digitales Mitwirkungsverfahren",
      "Service eLearning",
    ])
    expect(snapshot.services.every((s) => s.leistungIds.length > 0)).toBe(true)
    for (const service of snapshot.services) {
      const family = snapshot.families.find((f) => f.id === service.familyId)
      expect(family?.serviceIds).toContain(service.id)
    }
    // Ausgeblendete Services und Familien bleiben im Bericht sichtbar.
    const withoutLeistung = snapshot.issues.filter(
      (i) => i.code === "SERVICE_WITHOUT_LEISTUNG"
    )
    expect(withoutLeistung).toHaveLength(26)
    expect(withoutLeistung.every((i) => i.severity === "warning")).toBe(true)
    expect(withoutLeistung[0]?.message).toContain("nicht im Portal angezeigt")
    expect(
      snapshot.issues
        .filter((i) => i.code === "FAMILY_WITHOUT_LEISTUNG")
        .map((i) => i.factSheetName)
    ).toEqual([
      "Business IT-Servicekatalog / Backend-Services",
      "Business IT-Servicekatalog / Kommunikations-Services",
      "Business IT-Servicekatalog / Managed Application-Services",
    ])
  })

  it("bildet mit showEmptyServices 5 Familien und 29 Services ab", () => {
    const full = buildSnapshot(loadFixtureRaw(), allServices)
    expect(full.families.map((f) => f.name)).toEqual([
      "Arbeitsplatz-Services",
      "Backend-Services",
      "Kommunikations-Services",
      "Managed Application-Services",
      "Unterstützungs-Services",
    ])
    expect(full.services).toHaveLength(29)
    const total = full.families.reduce((sum, f) => sum + f.serviceIds.length, 0)
    expect(total).toBe(29)
    for (const service of full.services) {
      const family = full.families.find((f) => f.id === service.familyId)
      expect(family?.serviceIds).toContain(service.id)
    }
    expect(full.stats).toMatchObject({ families: 5, services: 29 })
    const withoutLeistung = full.issues.filter(
      (i) => i.code === "SERVICE_WITHOUT_LEISTUNG"
    )
    expect(withoutLeistung).toHaveLength(26)
    expect(withoutLeistung.every((i) => i.severity === "info")).toBe(true)
    expect(full.issues.some((i) => i.code === "FAMILY_WITHOUT_LEISTUNG")).toBe(
      false
    )
    // Gleiche Leistungen wie im Standard.
    expect(full.leistungen).toEqual(snapshot.leistungen)
  })

  it("zeigt 7 von 13 Leistungen im Kanal", () => {
    expect(snapshot.stats).toMatchObject({
      families: 2,
      services: 3,
      leistungen: 7,
      leistungenInChannel: 13,
      leistungenSkipped: 6,
      actions: 0,
      issues: snapshot.issues.length,
    })
    expect(snapshot.leistungen.map((l) => l.name)).toEqual([
      "Digitale Mitwirkungs- und Vernehmlassungsverfahren starten",
      "eLearning Bedarf anmelden",
      "eLearning Inhalte publizieren",
      "eLearning Inhalte selbständig erstellen",
      "eLearning Publisher Ausbildung absolvieren",
      "SO!Desk Teamadministrator festlegen",
      "Zugang zur Mitwirkungsplattform beantragen",
    ])
  })

  it("übernimmt Relationen, Subtyp und Links ins Fact Sheet", () => {
    const leistung = snapshot.leistungen.find((l) => l.id === ID.publizieren)!
    expect(leistung.subtype).toBe("verwaltungsleistung")
    expect(leistung.subtypeLabel).toBe("Verwaltungsleistung")
    expect(leistung.serviceIds).toEqual([ID.serviceElearning])
    expect(leistung.responsible.map((o) => o.path)).toEqual([
      "Finanzdepartement (FD) / Amt für Informatik und Organisation (AIO) / Business IT-Services / Service-Management",
      "Finanzdepartement (FD) / Personalamt (PA) / Personalentwicklung und Information",
    ])
    expect(leistung.audiences.map((a) => a.name)).toEqual([
      "Kantonale Verwaltung",
    ])
    expect(leistung.applications.map((a) => a.name)).toEqual([
      "Articulate",
      "easylearn",
    ])
    expect(leistung.persons).toEqual([])
    expect(leistung.leanixUrl).toBe(
      `https://ktso.leanix.net/eamktsoLive/factsheet/behoerdenLeistungen/${ID.publizieren}`
    )
    const service = snapshot.services.find((s) => s.id === ID.serviceElearning)!
    expect(service.leistungIds).toContain(ID.publizieren)
    expect(service.leistungIds).toHaveLength(4)
  })

  it("übernimmt Personen nur mit showPersons", () => {
    const withPersons = buildSnapshot(loadFixtureRaw(), {
      ...options,
      showPersons: true,
    })
    const leistung = withPersons.leistungen.find(
      (l) => l.id === ID.publizieren
    )!
    expect(leistung.persons).toEqual([
      { name: "Person 1", role: "Leistungsverantwortliche/r" },
    ])
    // Abos auf Kategorien haben heute keine Rolle: keine Personen.
    expect(withPersons.services.every((s) => s.persons.length === 0)).toBe(true)
  })

  it("erzeugt eindeutige Slugs aus Name und ID", () => {
    const full = buildSnapshot(loadFixtureRaw(), allServices)
    const slugs = full.services.map((s) => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(slugs).toContain("service-kollaboration-08781d")
    expect(slugs).toContain("service-kollaboration-35da4c")
    expect(slugs).toContain("service-multifunktionsgeraet-mfg-drucker-0edf9a")
    // Slugs angezeigter Services hängen nicht vom Filter ab.
    for (const service of snapshot.services) {
      expect(slugs).toContain(service.slug)
    }
    expect(snapshot.families.map((f) => f.slug)).toContain(
      "unterstuetzungs-services-e5a717"
    )
    expect(snapshot.leistungen.map((l) => l.slug)).toContain(
      "so-desk-teamadministrator-festlegen-a0456a"
    )
  })

  it("bereinigt Beschreibungen und bildet Kurzbeschreibungen", () => {
    const telefonie = buildSnapshot(
      loadFixtureRaw(),
      allServices
    ).services.find((s) => s.name.startsWith("Service Telefonie"))!
    expect(telefonie.definition?.startsWith("Bereitstellung")).toBe(true)
    expect(telefonie.definition?.endsWith("(nur auf Anfrage)")).toBe(true)

    const mitwirkung = snapshot.leistungen.find((l) =>
      l.name.startsWith("Digitale Mitwirkungs")
    )!
    expect(mitwirkung.summary).toBe(
      "Vernehmlassung oder Mitwirkung online durchführen – mit der Unterstützung, die zu Ihrem Vorhaben passt."
    )
    // Markdown bleibt in der vollen Beschreibung erhalten.
    expect(mitwirkung.description).toContain("**Beschreibung:**")

    for (const leistung of snapshot.leistungen) {
      if (leistung.summary) {
        expect(leistung.summary.length).toBeLessThanOrEqual(220)
        expect(leistung.summary).not.toMatch(/\*\*|\]\(|\\$/)
      }
    }
  })

  it("meldet Auffälligkeiten", () => {
    const codes = (code: string) =>
      snapshot.issues.filter((i) => i.code === code)
    expect(codes("LEISTUNG_WITHOUT_SERVICE").map((i) => i.factSheetId)).toEqual(
      expect.arrayContaining([ID.mobile, ID.mobileAbo])
    )
    expect(codes("LEISTUNG_WITHOUT_SERVICE")).toHaveLength(6)
    expect(codes("LEISTUNG_WITHOUT_SERVICE")[0]?.severity).toBe("warning")
    // Nur «eLearning Inhalte publizieren» hat eine verantwortliche Stelle.
    expect(codes("LEISTUNG_WITHOUT_RESPONSIBLE")).toHaveLength(6)
    expect(codes("LEISTUNG_WITHOUT_ACTION")).toHaveLength(7)
    expect(
      codes("SERVICE_WITHOUT_DEFINITION").map((i) => i.factSheetName)
    ).toEqual([
      "Business IT-Servicekatalog / Unterstützungs-Services / Service IT-Support",
    ])
    // Leistungen gibt es nur bei Mitwirkungsverfahren, eLearning und Kollaboration.
    expect(codes("SERVICE_WITHOUT_LEISTUNG")).toHaveLength(29 - 3)
    expect(codes("LEISTUNG_LINKED_OUTSIDE_CATALOG")).toHaveLength(0)
    // Eine echte Beschreibung verlinkt auf ein LeanIX-Portal.
    const leanixLinks = codes("DESCRIPTION_LINKS_TO_LEANIX")
    expect(leanixLinks).toHaveLength(1)
    expect(leanixLinks[0]?.message).toContain("(ktso.leanix.net)")
    expect(leanixLinks[0]?.message).not.toContain("session_state")
    // «SO!Desk Teamadministrator festlegen» hat wortgleich die Beschreibung
    // von «Digitale Mitwirkungs- und Vernehmlassungsverfahren starten».
    const duplicates = codes("DUPLICATE_DESCRIPTION").filter(
      (i) => i.factSheetType === leanixModel.leistung.type
    )
    expect(duplicates.map((i) => i.factSheetName).sort()).toEqual([
      "Digitale Mitwirkungs- und Vernehmlassungsverfahren starten",
      "SO!Desk Teamadministrator festlegen",
    ])
    expect(duplicates.every((i) => i.severity === "warning")).toBe(true)
    const soDesk = duplicates.find((i) => i.factSheetName.startsWith("SO!Desk"))
    expect(soDesk?.message).toContain(
      "«Digitale Mitwirkungs- und Vernehmlassungsverfahren starten» (https://ktso.leanix.net/eamktsoLive/factsheet/behoerdenLeistungen/2f483a4f"
    )
    expect(soDesk?.leanixUrl).toContain("a0456a21")
    // Auch Service-Definitionen werden verglichen (alle Services, auch
    // ausgeblendete): zwei Arbeitsplatz-Services teilen sich einen Text.
    expect(
      codes("DUPLICATE_DESCRIPTION")
        .filter((i) => i.factSheetType === leanixModel.kategorie.type)
        .map((i) => i.factSheetName.split(" / ").at(-1))
        .sort()
    ).toEqual(["Service IT-Arbeitsplatzinfrastruktur", "Service SO!Workplace"])
    // Sortiert nach Schweregrad.
    const order = { error: 0, warning: 1, info: 2 }
    const severities = snapshot.issues.map((i) => order[i.severity])
    expect(severities).toEqual([...severities].sort((a, b) => a - b))
  })
})

describe("buildSnapshot mit veränderten Daten", () => {
  it("vererbt den Service der Parent-Leistung", () => {
    const raw = loadFixtureRaw()
    const mobile = findLeistung(raw, ID.mobile)
    setRelation(mobile, leanixModel.leistung.relations.kategorie, [
      serviceRef(raw, ID.serviceMobile),
    ])
    const snapshot = buildSnapshot(raw, options)

    const parent = snapshot.leistungen.find((l) => l.id === ID.mobile)!
    const child = snapshot.leistungen.find((l) => l.id === ID.mobileAbo)!
    expect(child.serviceIds).toEqual(parent.serviceIds)
    expect(child.parentId).toBe(ID.mobile)
    expect(parent.childIds).toContain(ID.mobileAbo)
    expect(parent.childIds).toHaveLength(2)
    expect(snapshot.stats.leistungen).toBe(10)
    expect(snapshot.stats.leistungenSkipped).toBe(3)
  })

  it("zeigt Parent/Child nur zwischen angezeigten Leistungen", () => {
    const raw = loadFixtureRaw()
    // Kind bekommt einen eigenen Service, der Parent bleibt ohne.
    const child = findLeistung(raw, ID.mobileAbo)
    setRelation(child, leanixModel.leistung.relations.kategorie, [
      serviceRef(raw, ID.serviceMobile),
    ])
    const snapshot = buildSnapshot(raw, options)
    const shown = snapshot.leistungen.find((l) => l.id === ID.mobileAbo)!
    expect(shown.parentId).toBeNull()
    expect(snapshot.leistungen.some((l) => l.id === ID.mobile)).toBe(false)
  })

  it("meldet Kategorien ausserhalb des Katalogs", () => {
    const raw = loadFixtureRaw()
    const node = findLeistung(raw, ID.publizieren)
    setRelation(node, leanixModel.leistung.relations.kategorie, [
      serviceRef(raw, ID.serviceElearning.slice(0, 8)),
      // Familie (Ebene 2) statt Service
      serviceRef(raw, "e5a71732"),
      { id: "fremd-1", name: "Fremde Kategorie", type: "Leistungskategorie" },
    ])
    const snapshot = buildSnapshot(raw, options)
    const outside = snapshot.issues.filter(
      (i) => i.code === "LEISTUNG_LINKED_OUTSIDE_CATALOG"
    )
    expect(outside).toHaveLength(2)
    expect(outside.every((i) => i.severity === "info")).toBe(true)
    expect(outside[0]?.message).toContain("Ebene 2")
    const leistung = snapshot.leistungen.find((l) => l.id === ID.publizieren)!
    expect(leistung.serviceIds).toEqual([ID.serviceElearning])
  })

  it("ignoriert archivierte Leistungen und Kategorien", () => {
    const raw = loadFixtureRaw()
    findLeistung(raw, ID.publizieren).status = "ARCHIVED"
    const service = raw.kategorien.find((k) => k.id === ID.serviceElearning)!
    service.status = "ARCHIVED"
    const snapshot = buildSnapshot(raw, allServices)
    expect(snapshot.services).toHaveLength(28)
    expect(snapshot.stats.leistungenInChannel).toBe(12)
    // Die übrigen eLearning-Leistungen haben keinen Service mehr.
    expect(snapshot.stats.leistungen).toBe(3)
  })

  it("liefert keine Familien bei falscher Wurzel-ID", () => {
    const snapshot = buildSnapshot(loadFixtureRaw(), {
      ...options,
      rootId: "gibt-es-nicht",
    })
    expect(snapshot.families).toHaveLength(0)
    expect(snapshot.services).toHaveLength(0)
    expect(snapshot.leistungen).toHaveLength(0)
  })

  it("meldet LeanIX-Links in Beschreibungen", () => {
    const raw = loadFixtureRaw()
    findLeistung(raw, ID.publizieren).description =
      "Siehe [Fact Sheet](https://ktso.leanix.net/eamktsoLive/factsheet/Application/123)."
    const snapshot = buildSnapshot(raw, options)
    const found = snapshot.issues.filter(
      (i) =>
        i.code === "DESCRIPTION_LINKS_TO_LEANIX" &&
        i.factSheetId === ID.publizieren
    )
    expect(found).toHaveLength(1)
    expect(found[0]?.severity).toBe("warning")
  })

  it("entfernt Sitzungsparameter aus LeanIX-Links (Fixture)", () => {
    const snapshot = buildSnapshot(loadFixtureRaw(), options)
    const zugang = snapshot.leistungen.find((l) =>
      l.name.startsWith("Zugang zur Mitwirkungsplattform")
    )!
    expect(zugang.description).not.toContain("session_state")
    expect(zugang.description).not.toContain("code=")
    expect(zugang.description).not.toContain("#state")
    // Der Link selbst bleibt (Datenpflege korrigiert ihn in LeanIX).
    expect(zugang.description).toContain(
      "[digitales Mitwirkungsverfahren](https://ktso.leanix.net/eamktsosandbox/portals/Leistungen?transientUser=true)"
    )
    // Kein Snapshot-Text enthält noch Sitzungsartefakte.
    const text = JSON.stringify(snapshot)
    expect(text).not.toContain("session_state")
    expect(text).not.toMatch(/[?&#]code=/)
  })

  it("meldet http-Links und entfernt Zugangsdaten aus Beschreibungen", () => {
    const fixture = buildSnapshot(loadFixtureRaw(), options)
    // Echte Daten: Links auf http://mitwirken.so.ch und http://lernwelt.so.ch.
    const insecure = fixture.issues.filter(
      (i) => i.code === "DESCRIPTION_INSECURE_LINK"
    )
    expect(insecure.length).toBeGreaterThan(0)
    expect(insecure.every((i) => i.severity === "warning")).toBe(true)
    expect(insecure.map((i) => i.message).join(" ")).toContain(
      "mitwirken.so.ch"
    )
    // Freigegebene Hosts werden nicht gemeldet.
    const allowed = buildSnapshot(loadFixtureRaw(), {
      ...options,
      httpAllowedHosts: ["so.ch"],
    })
    expect(
      allowed.issues.some((i) => i.code === "DESCRIPTION_INSECURE_LINK")
    ).toBe(false)

    const raw = loadFixtureRaw()
    findLeistung(raw, ID.publizieren).description =
      "Login über [Portal](https://user:geheim@portal.example/start)."
    const snapshot = buildSnapshot(raw, options)
    const leistung = snapshot.leistungen.find((l) => l.id === ID.publizieren)!
    expect(leistung.description).toBe(
      "Login über [Portal](https://portal.example/start)."
    )
    expect(JSON.stringify(snapshot)).not.toContain("geheim")
    expect(
      snapshot.issues.some(
        (i) =>
          i.code === "DESCRIPTION_LINK_CREDENTIALS" &&
          i.factSheetId === ID.publizieren
      )
    ).toBe(true)
  })

  it("bereinigt LeanIX-Links in Service- und Familienbeschreibungen", () => {
    const raw = loadFixtureRaw()
    const elearning = raw.kategorien.find((k) => k.id === ID.serviceElearning)!
    elearning.description =
      "Siehe https://ktso.leanix.net/eamktsoLive/factsheet/Application/1?state=a&code=b&x=1."
    const family = raw.kategorien.find((k) => k.id.startsWith("e5a71732"))!
    family.description =
      "[Portal](https://ktso.leanix.net/p#session_state=geheim) und ktso.leanix.net"
    const snapshot = buildSnapshot(raw, options)
    expect(
      snapshot.services.find((s) => s.id === ID.serviceElearning)?.definition
    ).toBe(
      "Siehe https://ktso.leanix.net/eamktsoLive/factsheet/Application/1?x=1."
    )
    expect(snapshot.families.find((f) => f.id === family.id)?.description).toBe(
      "[Portal](https://ktso.leanix.net/p) und ktso.leanix.net"
    )
  })

  it("bildet Ressourcen auf Aktionen und Links ab", () => {
    const raw = loadFixtureRaw()
    setDocuments(findLeistung(raw, ID.publizieren), [
      {
        id: "d1",
        name: "Dokumentation",
        url: "https://example.org/doku",
        documentType: "documentation",
      },
      {
        id: "d2",
        name: "",
        url: "https://example.org/ky2help",
        documentType: "ky2help",
      },
      {
        id: "d3",
        name: "Bestellformular",
        url: "https://example.org/bestellen",
        documentType: "ordering_form",
        description: "  Formular  ",
      },
      {
        id: "d4",
        name: "Telefon",
        url: "tel:+41326270000",
        documentType: "phone_contact",
      },
      {
        id: "d5",
        name: "Böse",
        url: "javascript:alert(1)",
        documentType: "website",
      },
      { id: "d6", name: "Datei", url: null, documentType: "faq" },
      {
        id: "d7",
        name: "Richtlinie",
        url: "https://example.org/policy",
        documentType: "policy",
      },
    ])
    const snapshot = buildSnapshot(raw, options)
    const leistung = snapshot.leistungen.find((l) => l.id === ID.publizieren)!
    expect(leistung.actions.map((a) => [a.kind, a.label])).toEqual([
      ["order", "Bestellformular"],
      ["order", "In ky2help beantragen"],
      ["contact", "Telefon"],
    ])
    expect(leistung.actions[0]?.description).toBe("Formular")
    expect(leistung.links.map((l) => [l.kind, l.label, l.url])).toEqual([
      ["info", "Dokumentation", "https://example.org/doku"],
    ])

    const forLeistung = snapshot.issues.filter(
      (i) => i.factSheetId === ID.publizieren
    )
    const invalid = forLeistung.filter((i) => i.code === "RESOURCE_INVALID_URL")
    expect(invalid).toHaveLength(1)
    expect(invalid.every((i) => i.severity === "error")).toBe(true)
    // Ohne URL (z. B. Datei): bewusst nicht angezeigt, nur zur Information.
    const files = forLeistung.filter(
      (i) => i.code === "RESOURCE_FILE_NOT_SHOWN"
    )
    expect(files).toHaveLength(1)
    expect(files[0]?.severity).toBe("info")
    expect(
      forLeistung.filter((i) => i.code === "RESOURCE_TYPE_NOT_SHOWN")
    ).toHaveLength(1)
    expect(snapshot.stats.actions).toBe(3)
    expect(forLeistung.some((i) => i.code === "LEISTUNG_WITHOUT_ACTION")).toBe(
      false
    )
    // Fehler stehen zuoberst.
    expect(snapshot.issues[0]?.severity).toBe("error")
  })
})

describe("Ressourcen", () => {
  it("prüft URL-Schemata", () => {
    expect(normalizeResourceUrl("https://example.org/a b")).toBe(
      "https://example.org/a%20b"
    )
    // http nur für freigegebene Hosts (und deren Subdomains).
    expect(normalizeResourceUrl(" http://example.org ")).toBeNull()
    expect(checkResourceUrl("http://example.org")).toEqual({
      ok: false,
      reason: "insecure",
    })
    expect(normalizeResourceUrl(" http://example.org ", ["example.org"])).toBe(
      "http://example.org/"
    )
    expect(
      normalizeResourceUrl("http://intra.example.org/x", ["example.org"])
    ).toBe("http://intra.example.org/x")
    expect(
      normalizeResourceUrl("http://badexample.org/", ["example.org"])
    ).toBeNull()
    // Zugangsdaten in der URL und Links auf LeanIX werden abgelehnt.
    expect(checkResourceUrl("https://user:pass@evil.example/")).toEqual({
      ok: false,
      reason: "credentials",
    })
    expect(checkResourceUrl("https://ktso.leanix.net/eamktsoLive/x")).toEqual({
      ok: false,
      reason: "leanix",
    })
    expect(normalizeResourceUrl("mailto:servicedesk@so.ch")).toBe(
      "mailto:servicedesk@so.ch"
    )
    expect(normalizeResourceUrl("tel:+41326270000")).toBe("tel:+41326270000")
    expect(normalizeResourceUrl("javascript:alert(1)")).toBeNull()
    expect(normalizeResourceUrl("ftp://example.org")).toBeNull()
    expect(normalizeResourceUrl("example.org")).toBeNull()
    expect(normalizeResourceUrl("")).toBeNull()
    expect(normalizeResourceUrl(null)).toBeNull()
  })

  it("sortiert nach Art, Regel-Reihenfolge und Beschriftung", () => {
    const result = mapResources([
      { id: "1", name: "Z", url: "https://a.ch", documentType: "website" },
      {
        id: "2",
        name: "B",
        url: "https://a.ch",
        documentType: "ordering_form",
      },
      { id: "3", name: "A", url: "https://a.ch", documentType: "ky2help" },
      {
        id: "4",
        name: "Ticket",
        url: "https://a.ch",
        documentType: "support_ticket",
      },
      { id: "5", name: "A", url: "https://a.ch", documentType: "website" },
    ])
    expect(result.actions.map((a) => a.id)).toEqual(["2", "3", "4"])
    expect(result.links.map((a) => a.id)).toEqual(["5", "1"])
    expect(result.problems).toEqual([])
  })

  it("unterscheidet Dateien, LeanIX-Links und ungültige URLs", () => {
    const result = mapResources(
      [
        {
          id: "file",
          name: "Handbuch.pdf",
          url: "https://ktso.leanix.net/services/storage/file/1",
          documentType: "documentation",
          origin: "LX_STORAGE",
        },
        {
          id: "lx",
          name: "Fact Sheet",
          url: "https://ktso.leanix.net/eamktsoLive/factsheet/Application/1",
          documentType: "website",
          origin: "CUSTOM_LINK",
        },
        {
          id: "http",
          name: "Bestellen",
          url: "http://insecure.example/bestellen",
          documentType: "ordering_form",
          origin: "CUSTOM_LINK",
        },
        {
          id: "creds",
          name: "Login",
          url: "https://user:pass@evil.example/",
          documentType: "website",
        },
        {
          id: "ok",
          name: "Bidi ‮gnp.exe",
          url: "https://example.org/ok",
          documentType: "website",
          description: "Zeile 1\nZeile‮ 2",
        },
      ],
      []
    )
    expect(result.actions).toEqual([])
    expect(result.links.map((l) => [l.id, l.label, l.description])).toEqual([
      ["ok", "Bidi gnp.exe", "Zeile 1 Zeile 2"],
    ])
    expect(result.problems.map((p) => p.code)).toEqual([
      "RESOURCE_FILE_NOT_SHOWN",
      "RESOURCE_LINKS_TO_LEANIX",
      "RESOURCE_INVALID_URL",
      "RESOURCE_INVALID_URL",
    ])
    expect(result.problems[2]?.message).toContain("http (unverschlüsselt)")
    expect(result.problems[3]?.message).toContain("Zugangsdaten")
    expect(JSON.stringify(result)).not.toContain("pass@")

    // Mit Freigabe des Hosts wird der http-Link übernommen.
    const allowed = mapResources(
      [
        {
          id: "http",
          name: "Bestellen",
          url: "http://insecure.example/bestellen",
          documentType: "ordering_form",
        },
      ],
      ["insecure.example"]
    )
    expect(allowed.actions.map((a) => a.url)).toEqual([
      "http://insecure.example/bestellen",
    ])
  })

  it("meldet Dateien als Hinweis, ungültige URLs als Fehler", () => {
    const raw = loadFixtureRaw()
    setDocuments(findLeistung(raw, ID.publizieren), [
      {
        id: "f",
        name: "Datei",
        url: null,
        documentType: "faq",
        origin: "LX_STORAGE",
      },
      { id: "x", name: "Kaputt", url: "nicht-url", documentType: "website" },
    ])
    const snapshot = buildSnapshot(raw, options)
    const severities = Object.fromEntries(
      snapshot.issues
        .filter((i) => i.factSheetId === ID.publizieren)
        .filter((i) => i.code.startsWith("RESOURCE_"))
        .map((i) => [i.code, i.severity])
    )
    expect(severities).toEqual({
      RESOURCE_FILE_NOT_SHOWN: "info",
      RESOURCE_INVALID_URL: "error",
    })
  })
})

describe("Personen", () => {
  const sub = (type: string, roles: string[], name: string) => ({
    node: {
      type,
      roles: roles.map((r) => ({ name: r })),
      user: { displayName: name },
    },
  })
  const node = {
    id: "n",
    name: "N",
    subscriptions: {
      edges: [
        sub("RESPONSIBLE", ["Leistungsverantwortliche/r"], "Anna"),
        sub("RESPONSIBLE", [], "Bruno"),
        sub("RESPONSIBLE", ["Stellvertretung"], "Chris"),
        sub("OBSERVER", ["Leistungsverantwortliche/r"], "Dora"),
      ],
    },
  }

  it("übernimmt nur Abos mit der konfigurierten Rolle", () => {
    expect(personsOf(node, leanixModel.responsiblePersons.leistung)).toEqual([
      { name: "Anna", role: "Leistungsverantwortliche/r" },
    ])
    // Für Services ist eine eigene Rolle konfiguriert.
    expect(personsOf(node, leanixModel.responsiblePersons.kategorie)).toEqual(
      []
    )
  })

  it("übernimmt Abos ohne Rolle nur, wenn ausdrücklich so konfiguriert", () => {
    expect(
      personsOf(node, { subscriptionType: "RESPONSIBLE", role: null }).map(
        (p) => p.name
      )
    ).toEqual(["Anna", "Bruno", "Chris"])
  })
})
