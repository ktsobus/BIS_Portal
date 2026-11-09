import type { CatalogLink, Leistung } from "@workspace/api"

/**
 * Standard-Aktion für Leistungen ohne Bestell- oder Anfrageweg
 * (`CATALOG_FALLBACK_REQUEST_URL`, z. B. Service Desk). Reine Funktionen,
 * die Konfiguration liest der Router.
 */
export const FALLBACK_ACTION_ID = "fallback"

/** Aktion aus der Konfiguration; `null`, wenn keine (gültige) URL gesetzt ist. */
export function createFallbackAction(
  url: string | undefined,
  label: string
): CatalogLink | null {
  if (!url || !/^https?:\/\//i.test(url)) return null
  return {
    id: FALLBACK_ACTION_ID,
    kind: "request",
    label,
    url,
    description: null,
    resourceType: "fallback",
  }
}

/** Hängt die Standard-Aktion an, wenn die Leistung keine Aktion order/request hat. */
export function withFallbackAction(
  leistung: Leistung,
  fallback: CatalogLink | null
): Leistung {
  if (!fallback) return leistung
  const hasOrderOrRequest = leistung.actions.some(
    (action) => action.kind === "order" || action.kind === "request"
  )
  if (hasOrderOrRequest) return leistung
  return { ...leistung, actions: [...leistung.actions, fallback] }
}
