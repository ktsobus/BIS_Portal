import { ORPCError } from "@orpc/client"
import { describe, expect, it } from "vitest"

import { errorMessage, GENERIC_ERROR_MESSAGE } from "./messages"

describe("errorMessage", () => {
  it("übersetzt oRPC-Fehlercodes", () => {
    expect(errorMessage(new ORPCError("UNAUTHORIZED"))).toBe(
      "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an."
    )
    expect(errorMessage(new ORPCError("FORBIDDEN"))).toBe(
      "Für diese Aktion sind Adminrechte nötig."
    )
    expect(errorMessage({ code: "TOO_MANY_REQUESTS" })).toContain(
      "Zu viele Versuche"
    )
  })

  it("übersetzt better-auth-Fehlercodes", () => {
    expect(errorMessage({ code: "INVALID_EMAIL_OR_PASSWORD" })).toBe(
      "E-Mail-Adresse oder Passwort ist falsch."
    )
    expect(errorMessage({ code: "ADMIN_ACCOUNT_LINK_FORBIDDEN" })).toContain(
      "Admin-Konto mit Passwort"
    )
  })

  it("Overrides je Prozedur haben Vorrang vor den Standardmeldungen", () => {
    expect(
      errorMessage(new ORPCError("CONFLICT"), {
        CONFLICT: "Ein Sync läuft bereits.",
      })
    ).toBe("Ein Sync läuft bereits.")
    expect(
      errorMessage(new ORPCError("UNAUTHORIZED"), { UNAUTHORIZED: "Eigen" })
    ).toBe("Eigen")
  })

  it("fällt bei unbekanntem Code auf den HTTP-Status zurück", () => {
    expect(errorMessage({ code: "UNBEKANNT", status: 403 })).toBe(
      "Für diese Aktion sind Adminrechte nötig."
    )
    expect(errorMessage({ status: 401 })).toContain("Sitzung ist abgelaufen")
    expect(errorMessage({ status: 429 })).toContain("Zu viele Versuche")
    // Unbekannter Status: allgemeine Meldung.
    expect(errorMessage({ status: 418 })).toBe(GENERIC_ERROR_MESSAGE)
  })

  it("meldet einen nicht erreichbaren Server (fetch-TypeError)", () => {
    expect(errorMessage(new TypeError("Failed to fetch"))).toBe(
      "Der Server ist nicht erreichbar. Bitte prüfen Sie die Verbindung."
    )
  })

  it("zeigt nie die englische Originalmeldung, sondern den Fallback", () => {
    expect(errorMessage(new Error("Something went wrong"))).toBe(
      GENERIC_ERROR_MESSAGE
    )
    expect(errorMessage(null)).toBe(GENERIC_ERROR_MESSAGE)
    expect(errorMessage("text")).toBe(GENERIC_ERROR_MESSAGE)
    expect(errorMessage(undefined, {}, "Eigener Fallback")).toBe(
      "Eigener Fallback"
    )
    // Code ist kein String: ignoriert.
    expect(errorMessage({ code: 42 })).toBe(GENERIC_ERROR_MESSAGE)
  })
})
