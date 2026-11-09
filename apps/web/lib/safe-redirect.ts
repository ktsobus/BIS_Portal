/** Platzhalter-Origin, gegen den relative Pfade aufgelöst werden. */
const BASE = "http://internal.invalid"

/**
 * Lässt nur Pfade auf dieselbe Origin zu, damit keine offene Weiterleitung
 * entsteht.
 *
 * Browser behandeln `\` wie `/` und entfernen Tabs und Zeilenumbrüche aus
 * URLs: `/\host` oder `/<Tab>/host` würden so zu `//host`, also zu einem
 * fremden Host. Solche Werte (und alle Steuerzeichen) führen deshalb zum
 * `fallback`. Zusätzlich wird der Wert wie im Browser aufgelöst und muss auf
 * der Platzhalter-Origin bleiben.
 */
export function safeRedirectPath(
  value: string | null | undefined,
  fallback = "/admin"
) {
  if (
    !value ||
    !value.startsWith("/") ||
    // eslint-disable-next-line no-control-regex -- Steuerzeichen gezielt ablehnen
    /[\\\u0000-\u001f\u007f]/.test(value)
  ) {
    return fallback
  }
  let url: URL
  try {
    url = new URL(value, BASE)
  } catch {
    return fallback
  }
  if (url.origin !== BASE) return fallback
  return url.pathname + url.search + url.hash
}
