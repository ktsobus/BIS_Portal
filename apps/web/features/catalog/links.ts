/**
 * Prüfung von Link-Zielen (Server und Browser). Erlaubt sind nur
 * http(s), mailto und tel; alles andere (z. B. `javascript:`) wird verworfen.
 */

const SAFE_URL = /^(?:https?:\/\/|mailto:|tel:)/i

/** http(s)-Links führen aus dem Portal hinaus und öffnen in neuem Tab. */
export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim())
}

/** Nur http(s), mailto und tel sind als Ziel erlaubt; sonst `null`. */
export function safeHref(url: string | null | undefined): string | null {
  if (!url) return null
  const trimmed = url.trim()
  return SAFE_URL.test(trimmed) ? trimmed : null
}

/** `tel:`-Link aus einer Telefonnummer zur Anzeige, z. B. «032 627 00 00». */
export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`
}
