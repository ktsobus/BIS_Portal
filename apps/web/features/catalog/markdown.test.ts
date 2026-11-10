import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { MarkdownText } from "./components/markdown"
import { prepareMarkdown } from "./markdown"

const render = (text: string) =>
  renderToStaticMarkup(createElement(MarkdownText, null, text))

const count = (html: string, pattern: RegExp) =>
  html.match(new RegExp(pattern, "g"))?.length ?? 0

// Rohwerte aus LeanIX (Service Telefonie, Service Domain).
const TELEFONIE =
  "Bereitstellung der Infrastruktur und Sicherstellung des Betriebs der Telefonieinfrastruktur.\n• Bereitstellung Telefonanschluss Telefoniedienst am Arbeitsplatz und mobil analog oder digital TVA\n• Telefonapparat, Voice-Mail, Web basierende Telefonieunterstützung, Mobile Integration One Number,\nCall Center Funktionen\n• Betrieb und Unterhalt der TVA nach Standard SLA\n• Erstellen und Pflege des Telefonverzeichnisses inkl. Publikation im Intranet\n• Mutationen der Teilnehmerverwaltung im Rahmen der natürlichen Fluktuation, Reorganisationen und\nUmzügen\n• Schulungen (nur auf Anfrage)"
const DOMAIN =
  "Bewirtschaftung aller Domains der kantonalen Verwaltung.\nTop-Level-Domains werden aus Kostengründen keine mehr erstellt oder bestehende umbenennt (xxx.so.ch)!\n\nDie Verwaltung der Domains erfolgt über my.metanet und SwissSign."

describe("MarkdownText", () => {
  it("erhält einfache Zeilenumbrüche als <br>", () => {
    const html = render(DOMAIN)
    expect(html).toMatch(
      /Bewirtschaftung aller Domains der kantonalen Verwaltung\.<br\/>\s*Top-Level-Domains/
    )
    expect(count(html, /<p>/)).toBe(2)
  })

  it("liest «•»-Zeilen als Aufzählung, Umbrüche darin bleiben erhalten", () => {
    const html = render(TELEFONIE)
    // Einleitung als eigener Absatz, nicht mit der Aufzählung zusammengezogen.
    expect(html).toContain(
      "<p>Bereitstellung der Infrastruktur und Sicherstellung des Betriebs der Telefonieinfrastruktur.</p>"
    )
    expect(count(html, /<li/)).toBe(6)
    expect(html).not.toContain("•")
    // Umbrochene Zeilen innerhalb eines Punkts.
    expect(count(html, /<br\/>/)).toBe(2)
    expect(html).toMatch(/One Number,<br\/>\s*Call Center Funktionen/)
  })

  it("ändert harte Umbrüche, Listen und Code nicht", () => {
    const html = render("**Beschreibung:**\\\nText\n\n- eins\n- zwei\n\n`a\nb`")
    expect(count(html, /<br\/>/)).toBe(1)
    expect(count(html, /<li/)).toBe(2)
    expect(html).toContain("<code")
  })

  it("rendert kein HTML und keine unsicheren Links", () => {
    const html = render('<b>fett</b> [x](javascript:alert(1)) "zitat"')
    expect(html).not.toContain("<b>")
    expect(html).not.toContain("javascript:")
  })
})

describe("prepareMarkdown", () => {
  it("entfernt einfassende Anführungszeichen und wandelt «•» in Listenpunkte", () => {
    expect(prepareMarkdown('"Text\n• eins\n  • zwei"')).toBe(
      "Text\n- eins\n  - zwei"
    )
    expect(prepareMarkdown("Preis • 5 Fr.")).toBe("Preis • 5 Fr.")
  })
})
