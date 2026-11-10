import type { CatalogLink, Leistung, SupportContact } from "@workspace/api"

import { phoneHref, safeHref } from "../links"

/**
 * Standard-Aktion für Leistungen ohne Bestell- oder Anfrageweg
 * (`CATALOG_FALLBACK_REQUEST_URL`, z. B. Service Desk) und zentraler
 * Kontakt. Reine Funktionen, die Konfiguration liest der Router.
 */
export const FALLBACK_ACTION_ID = "fallback"

/** Ist der Link die Standard-Aktion aus der Konfiguration (nicht aus LeanIX)? */
export function isFallbackAction(link: Pick<CatalogLink, "id">): boolean {
  return link.id === FALLBACK_ACTION_ID
}

/**
 * Aktion aus der Konfiguration; `null`, wenn keine (gültige) URL gesetzt ist.
 * Erlaubt sind https/http, mailto und tel (wie bei Ressourcen-Links). Eine
 * Telefonnummer erscheint als Kontakt mit Telefon-Symbol.
 */
export function createFallbackAction(
  url: string | null | undefined,
  label: string
): CatalogLink | null {
  const href = safeHref(url)
  if (!href) return null
  const phone = /^tel:/i.test(href)
  return {
    id: FALLBACK_ACTION_ID,
    kind: phone ? "contact" : "request",
    label,
    url: phone ? phoneHref(href.slice(4)) : href,
    description: null,
    resourceType: "fallback",
  }
}

export interface SupportContactConfig {
  requestUrl: string | null | undefined
  requestLabel: string
  email: string | null | undefined
  phone: string | null | undefined
}

/** Zentraler Kontakt; `null`, wenn nichts davon konfiguriert ist. */
export function createSupportContact(
  config: SupportContactConfig
): SupportContact | null {
  const request = createFallbackAction(config.requestUrl, config.requestLabel)
  const email = config.email?.trim() || null
  const phone = config.phone?.trim() || null
  if (!request && !email && !phone) return null
  return { request, email, phone }
}

/** Hängt die Standard-Aktion an, wenn die Leistung keine Aktion order/request hat. */
export function withFallbackAction<T extends Pick<Leistung, "actions">>(
  leistung: T,
  fallback: CatalogLink | null
): T {
  if (!fallback) return leistung
  const hasOrderOrRequest = leistung.actions.some(
    (action) => action.kind === "order" || action.kind === "request"
  )
  if (hasOrderOrRequest) return leistung
  return { ...leistung, actions: [...leistung.actions, fallback] }
}
