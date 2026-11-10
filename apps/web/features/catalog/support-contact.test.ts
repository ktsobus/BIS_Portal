import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import type { OrgUnit, SupportContact } from "@workspace/api"
import { describe, expect, it } from "vitest"

import {
  hasSupportContact,
  NoRequestPathHint,
  SupportContactLinks,
} from "./components/support-contact"
import { createSupportContact } from "./server/fallback"

const contactWith = (
  patch: Partial<Parameters<typeof createSupportContact>[0]>
) =>
  createSupportContact({
    requestUrl: undefined,
    requestLabel: "Anfrage an den Service Desk",
    email: undefined,
    phone: undefined,
    ...patch,
  })

const serviceManagement: OrgUnit = {
  id: "om",
  name: "Service-Management",
  path: "AIO / Business IT-Services / Service-Management",
}

/** Hinweis «Service ohne Leistungen» wie auf der Service-Seite. */
const renderServiceHint = (
  contact: SupportContact | null,
  responsible: OrgUnit[] = []
) =>
  renderToStaticMarkup(
    createElement(NoRequestPathHint, {
      message:
        "Für diesen Service sind im Portal noch keine Leistungen erfasst.",
      responsible,
      contact,
    })
  )

describe("Kontaktweg ohne eigenen Bestell- oder Anfrageweg", () => {
  it("Service ohne Leistungen zeigt bei gesetzter URL einen Link", () => {
    const html = renderServiceHint(
      contactWith({ requestUrl: "https://example.org/ticket" }),
      [serviceManagement]
    )
    expect(html).toContain('href="https://example.org/ticket"')
    expect(html).toContain("Anfrage an den Service Desk")
    expect(html).toContain('target="_blank"')
    expect(html).toContain("<strong>Service-Management</strong>")
    expect(html).toContain("oder an den Service Desk des AIO:")
    expect(html).toContain("öffnet in neuem Tab")
  })

  it("zeigt E-Mail und Telefon als mailto- bzw. tel-Link", () => {
    const html = renderServiceHint(
      contactWith({
        email: "servicedesk@example.org",
        phone: "032 000 00 00",
      })
    )
    expect(html).toContain('href="mailto:servicedesk@example.org"')
    expect(html).toContain('href="tel:0320000000"')
    expect(html).toContain("Bitte wenden Sie sich an den Service Desk des AIO:")
  })

  it("ohne Konfiguration nur Text, ohne Link", () => {
    const html = renderServiceHint(null, [serviceManagement])
    expect(html).not.toContain("<a ")
    expect(html).toContain(
      "Bitte wenden Sie sich an die verantwortliche Stelle:"
    )
    expect(html).toContain("<strong>Service-Management</strong>")
  })

  it("Telefon als Standard-Aktion erscheint mit Telefon-Symbol", () => {
    const contact = contactWith({ requestUrl: "tel:+41 32 000 00 00" })!
    const html = renderToStaticMarkup(
      createElement(SupportContactLinks, { contact })
    )
    expect(html).toContain('href="tel:+41320000000"')
    expect(html).toContain('data-kind="contact"')
    expect(html).toContain("lucide-phone")
  })

  it("erkennt nutzbare Kontakte", () => {
    expect(hasSupportContact(null)).toBe(false)
    expect(hasSupportContact(contactWith({ phone: "032 000 00 00" }))).toBe(
      true
    )
    expect(
      hasSupportContact({
        request: {
          id: "x",
          kind: "request",
          label: "x",
          url: "javascript:alert(1)",
          description: null,
          resourceType: "fallback",
        },
        email: null,
        phone: null,
      })
    ).toBe(false)
  })
})
