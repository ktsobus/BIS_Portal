import { describe, expect, it } from "vitest"

import {
  cleanDescription,
  cleanLabel,
  createSlugger,
  extractSummary,
  findHttpLinkHosts,
  findLeanixLinks,
  sanitizeLeanixLinks,
  slugify,
  slugWithId,
  stripLeanixSessionParams,
  stripUrlCredentials,
  truncateAtWord,
} from "./text"

describe("slugify", () => {
  it("ersetzt Umlaute und entfernt Diakritika", () => {
    expect(slugify("Unterstützungs-Services")).toBe("unterstuetzungs-services")
    expect(slugify("Grösse ÄÖÜ ß")).toBe("groesse-aeoeue-ss")
    expect(slugify("Café Crème à la carte")).toBe("cafe-creme-a-la-carte")
    expect(slugify("  SO!Desk – Team/Admin  ")).toBe("so-desk-team-admin")
    expect(slugify("!!!")).toBe("")
  })

  it("hängt die ersten 6 Zeichen der ID an", () => {
    expect(
      slugWithId("Service eLearning", "34be0167-938b-43a2-89f9-dc56cf9ab759")
    ).toBe("service-elearning-34be01")
    expect(slugWithId("???", "34be0167-938b")).toBe("34be01")
  })

  it("macht Slugs eindeutig", () => {
    const slug = createSlugger()
    expect(slug("Test", "abcdef12-1")).toBe("test-abcdef")
    expect(slug("Test", "abcdef34-2")).toBe("test-abcdef34")
    expect(slug("Anders", "abcdef12-1")).toBe("anders-abcdef")
  })
})

describe("cleanDescription", () => {
  it("trimmt und entfernt umschliessende Anführungszeichen", () => {
    expect(cleanDescription('  "Text mit\nZeilen"  ')).toBe("Text mit\nZeilen")
    expect(cleanDescription("«Zitat»")).toBe("Zitat")
    expect(cleanDescription('"A" und "B"')).toBe('"A" und "B"')
    expect(cleanDescription("   ")).toBeNull()
    expect(cleanDescription('""')).toBeNull()
    expect(cleanDescription(null)).toBeNull()
  })

  it("behält Markdown", () => {
    expect(cleanDescription("**fett**\\\nweiter")).toBe("**fett**\\\nweiter")
  })
})

describe("extractSummary", () => {
  it("nimmt den ersten Absatz als Klartext", () => {
    expect(
      extractSummary(
        "Erster **Absatz** mit [Link](https://example.org) und _Betonung_.\n\nZweiter Absatz."
      )
    ).toBe("Erster Absatz mit Link und Betonung.")
  })

  it("behandelt Backslash-Umbrüche", () => {
    expect(
      extractSummary("Einleitung.\\\n\\\n**Beschreibung:**\\\nDetails")
    ).toBe("Einleitung.")
    expect(extractSummary("Zeile eins\\\nZeile zwei\n\nRest")).toBe(
      "Zeile eins Zeile zwei"
    )
  })

  it("entfernt Listenzeichen und Überschriften", () => {
    expect(extractSummary("- Punkt eins\n- Punkt zwei\n\nRest")).toBe(
      "Punkt eins Punkt zwei"
    )
    expect(extractSummary("## Titel\nText")).toBe("Titel Text")
    expect(extractSummary("• Aufzählung")).toBe("Aufzählung")
  })

  it("lässt Unterstriche in Wörtern stehen", () => {
    expect(extractSummary("Feld snake_case bleibt")).toBe(
      "Feld snake_case bleibt"
    )
  })

  it("kürzt an einer Wortgrenze auf höchstens 220 Zeichen", () => {
    const long = Array.from({ length: 60 }, (_, i) => `Wort${i}`).join(" ")
    const summary = extractSummary(long)!
    expect(summary.length).toBeLessThanOrEqual(220)
    expect(summary.endsWith(" …")).toBe(true)
    expect(long.startsWith(summary.slice(0, -2))).toBe(true)
    expect(summary.slice(0, -2)).toMatch(/Wort\d+$/)
  })

  it("liefert null ohne Text", () => {
    expect(extractSummary(null)).toBeNull()
    expect(extractSummary("\\\n\\\n")).toBeNull()
  })
})

describe("truncateAtWord", () => {
  it("lässt kurze Texte unverändert", () => {
    expect(truncateAtWord("kurz", 10)).toBe("kurz")
  })

  it("entfernt Satzzeichen vor der Auslassung", () => {
    expect(truncateAtWord("eins, zwei, drei, vier", 14)).toBe("eins, zwei …")
  })
})

describe("findLeanixLinks", () => {
  it("findet Links auf LeanIX", () => {
    expect(
      findLeanixLinks(
        "Siehe [hier](https://ktso.leanix.net/eamktsoLive/factsheet/X/1) und https://example.org"
      )
    ).toEqual(["https://ktso.leanix.net/eamktsoLive/factsheet/X/1"])
    expect(findLeanixLinks("Kein Link")).toEqual([])
  })
})

describe("LeanIX-Links bereinigen", () => {
  const copied =
    "https://ktso.leanix.net/eamktsosandbox/portals/Leistungen?transientUser=true#state=5f52&session_state=TV2N&iss=https://ch-signin.leanix.net/realms/sp&code=df7c.TV2N"

  it("entfernt Fragment und OAuth-Parameter", () => {
    expect(stripLeanixSessionParams(copied)).toBe(
      "https://ktso.leanix.net/eamktsosandbox/portals/Leistungen?transientUser=true"
    )
    expect(
      stripLeanixSessionParams(
        "https://eu.leanix.net/x?a=1&state=s&code=c&iss=i&session_state=t"
      )
    ).toBe("https://eu.leanix.net/x?a=1")
  })

  it("lässt andere Links, nackte Hosts und saubere Links unverändert", () => {
    expect(stripLeanixSessionParams("https://example.org/?code=1#x")).toBe(
      "https://example.org/?code=1#x"
    )
    expect(stripLeanixSessionParams("ktso.leanix.net/x#state=1")).toBe(
      "ktso.leanix.net/x#state=1"
    )
    const clean = "https://ktso.leanix.net/eamktsoLive/factsheet/X/1"
    expect(stripLeanixSessionParams(clean)).toBe(clean)
  })

  it("ersetzt alle Vorkommen in Markdown und behält Satzzeichen", () => {
    expect(
      sanitizeLeanixLinks(
        `Siehe [hier](${copied}), oder ${copied}. Ohne Schema: ktso.leanix.net`
      )
    ).toBe(
      "Siehe [hier](https://ktso.leanix.net/eamktsosandbox/portals/Leistungen?transientUser=true), oder https://ktso.leanix.net/eamktsosandbox/portals/Leistungen?transientUser=true. Ohne Schema: ktso.leanix.net"
    )
    expect(sanitizeLeanixLinks(null)).toBeNull()
  })
})

describe("Links in Beschreibungen", () => {
  it("entfernt Zugangsdaten aus http(s)-Links", () => {
    expect(
      stripUrlCredentials(
        "[a](https://user:pass@host.example/x) und http://u@h.example, mailto:a@b.ch"
      )
    ).toBe("[a](https://host.example/x) und http://h.example, mailto:a@b.ch")
  })

  it("findet die Hosts unverschlüsselter Links", () => {
    expect(
      findHttpLinkHosts(
        "[A](http://Mitwirken.so.ch/x), http://mitwirken.so.ch:8080 und https://sicher.ch"
      )
    ).toEqual(["mitwirken.so.ch"])
    expect(findHttpLinkHosts(null)).toEqual([])
  })
})

describe("cleanLabel", () => {
  it("entfernt Steuer- und Bidi-Zeichen", () => {
    expect(cleanLabel("Bidi ‮gnp.exe")).toBe("Bidi gnp.exe")
    expect(cleanLabel(" A⁦B⁩\nC\t ")).toBe("AB C")
    expect(cleanLabel("‮ ")).toBeNull()
    expect(cleanLabel(null)).toBeNull()
  })
})
