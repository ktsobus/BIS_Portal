/**
 * Textaufbereitung für den Katalog (rein, ohne Abhängigkeiten): Slugs,
 * Beschreibungen aus LeanIX (Markdown) und Kurzbeschreibungen.
 */

export const SUMMARY_MAX_LENGTH = 220

const UMLAUTS: Record<string, string> = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  ß: "ss",
}

/** «Service Multifunktionsgerät (MFG)/Drucker» → «service-multifunktionsgeraet-mfg-drucker». */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöüß]/g, (char) => UMLAUTS[char] ?? char)
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Slug aus Name und den ersten 6 Zeichen der ID (stabil bei gleichen Namen). */
export function slugWithId(name: string, id: string, idLength = 6): string {
  const base = slugify(name)
  const suffix = slugify(id).slice(0, idLength) || "x"
  return base ? `${base}-${suffix}` : suffix
}

/** Vergibt eindeutige Slugs (bei Kollision mit längerem ID-Teil). */
export function createSlugger() {
  const used = new Set<string>()
  return (name: string, id: string): string => {
    const idPart = slugify(id)
    for (let length = 6; length <= Math.max(6, idPart.length); length += 2) {
      const slug = slugWithId(name, id, length)
      if (!used.has(slug)) {
        used.add(slug)
        return slug
      }
    }
    // Gleiche ID doppelt (sollte nicht vorkommen): laufende Nummer anhängen.
    for (let n = 2; ; n++) {
      const slug = `${slugWithId(name, id, idPart.length)}-${n}`
      if (!used.has(slug)) {
        used.add(slug)
        return slug
      }
    }
  }
}

const QUOTE_PAIRS: Array<[string, string]> = [
  ['"', '"'],
  ["“", "”"],
  ["„", "“"],
  ["«", "»"],
]

/**
 * Beschreibung aus LeanIX: trimmen, umschliessende Anführungszeichen
 * entfernen, Markdown behalten. Leere Texte → `null`.
 */
export function cleanDescription(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") return null
  let text = value.replace(/\r\n?/g, "\n").trim()
  for (const [open, close] of QUOTE_PAIRS) {
    if (
      text.length >= 2 &&
      text.startsWith(open) &&
      text.endsWith(close) &&
      // Nur, wenn innen keine weiteren Anführungszeichen dieses Typs stehen
      // (sonst wäre es z. B. «"A" und "B"»).
      !text.slice(1, -1).includes(close)
    ) {
      text = text.slice(1, -1).trim()
      break
    }
  }
  return text === "" ? null : text
}

/** Markdown einer Zeile in Klartext umwandeln. */
function markdownLineToText(line: string): string {
  return (
    line
      // Überschriften, Zitate und Listenzeichen am Zeilenanfang
      .replace(/^\s{0,3}#{1,6}\s+/, "")
      .replace(/^\s*>\s?/, "")
      .replace(/^\s*(?:[-*+•–]|\d+[.)])\s+/, "")
      // Bilder und Links → Text
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/<((?:https?:|mailto:)[^>\s]+)>/g, "$1")
      // Hervorhebungen und Code
      .replace(/\*\*|__/g, "")
      .replace(/(?<![\p{L}\p{N}])[*_](?=\S)|(?<=\S)[*_](?![\p{L}\p{N}])/gu, "")
      .replace(/`+/g, "")
      // Markdown-Escapes (z. B. «\*»)
      .replace(/\\([\\`*_{}[\]()#+\-.!>|~])/g, "$1")
  )
}

/**
 * Kurzbeschreibung: erster Absatz der Beschreibung als Klartext, Whitespace
 * normalisiert, höchstens `max` Zeichen (an Wortgrenze gekürzt, mit « …»).
 */
export function extractSummary(
  description: string | null | undefined,
  max = SUMMARY_MAX_LENGTH
): string | null {
  const text = cleanDescription(description)
  if (!text) return null

  const paragraph: string[] = []
  for (const rawLine of text.split("\n")) {
    // Backslash am Zeilenende = harter Umbruch in Markdown; eine Zeile nur
    // aus «\» ist eine Leerzeile (Absatzwechsel).
    const line = rawLine.replace(/\\\s*$/, "").trim()
    if (line === "") {
      if (paragraph.length > 0) break
      continue
    }
    paragraph.push(markdownLineToText(line))
  }

  const plain = paragraph.join(" ").replace(/\s+/g, " ").trim()
  if (plain === "") return null
  return truncateAtWord(plain, max)
}

/** Kürzt an einer Wortgrenze; Ergebnis inkl. « …» höchstens `max` Zeichen. */
export function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text
  const ellipsis = " …"
  const limit = Math.max(1, max - ellipsis.length)
  let cut = text.slice(0, limit + 1)
  const lastSpace = cut.lastIndexOf(" ")
  cut = lastSpace > limit / 2 ? cut.slice(0, lastSpace) : cut.slice(0, limit)
  cut = cut.replace(/[\s,;:–—-]+$/u, "")
  return `${cut}${ellipsis}`
}

const LEANIX_LINK_PATTERN =
  /\b(?:https?:\/\/)?(?:[a-z0-9-]+\.)*leanix\.net(?:[/?#:][^\s)\]>"']*)?/gi

/** Findet Links auf LeanIX (für Portalnutzende ohne LeanIX-Konto unbrauchbar). */
export function findLeanixLinks(text: string | null | undefined): string[] {
  if (!text) return []
  return [...new Set(text.match(LEANIX_LINK_PATTERN) ?? [])]
}

/** Anmelde-/Sitzungsparameter, die in kopierten LeanIX-Links stecken können. */
const LEANIX_SESSION_PARAMS = ["state", "session_state", "code", "iss"]

/**
 * Bereinigt einen Link auf `*.leanix.net`: Fragment und OAuth-Parameter
 * (`state`, `session_state`, `code`, `iss`) entfernen. Andere Links und
 * nackte Hosts ohne Schema bleiben unverändert.
 */
export function stripLeanixSessionParams(link: string): string {
  if (!/^https?:\/\//i.test(link)) return link
  // Satzzeichen am Ende gehören zum Text, nicht zur URL.
  const trailing = /[.,;:!?]+$/.exec(link)?.[0] ?? ""
  const core = trailing ? link.slice(0, -trailing.length) : link
  let url: URL
  try {
    url = new URL(core)
  } catch {
    return link
  }
  if (!/(?:^|\.)leanix\.net$/i.test(url.hostname)) return link
  const params = LEANIX_SESSION_PARAMS.filter((name) =>
    url.searchParams.has(name)
  )
  if (!url.hash && params.length === 0) return link
  url.hash = ""
  for (const name of params) url.searchParams.delete(name)
  return `${url.href}${trailing}`
}

/**
 * Entfernt Sitzungsartefakte (Fragment, OAuth-Parameter) aus allen
 * LeanIX-Links eines Textes. Solche Links entstehen, wenn jemand die
 * Adresse nach dem Login aus dem Browser kopiert; sie sollen nicht an alle
 * Besucherinnen und Besucher ausgeliefert werden.
 */
export function sanitizeLeanixLinks(text: string | null): string | null {
  if (!text) return text
  return text.replace(LEANIX_LINK_PATTERN, (match) =>
    stripLeanixSessionParams(match)
  )
}

/** Zugangsdaten (`user:pass@`) in http(s)-Links. */
const URL_CREDENTIALS = /\b(https?:\/\/)[^\s/?#@()<>[\]"']+@/gi

/** Entfernt Zugangsdaten (`https://user:pass@host` → `https://host`) aus Links. */
export function stripUrlCredentials(text: string | null): string | null {
  if (!text) return text
  return text.replace(URL_CREDENTIALS, "$1")
}

/** Hosts aller unverschlüsselten Links (`http://…`) in einem Text. */
export function findHttpLinkHosts(text: string | null | undefined): string[] {
  if (!text) return []
  const hosts = [...text.matchAll(/\bhttp:\/\/([^\s/?#:()<>[\]"']+)/gi)].map(
    (match) => match[1]!.toLowerCase()
  )
  return [...new Set(hosts)]
}

/** Steuerzeichen (C0/C1, inkl. Zeilenumbrüche). */
// eslint-disable-next-line no-control-regex -- Steuerzeichen sollen gefunden werden
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g
/** Bidi-Steuerzeichen (z. B. U+202E), die die Leserichtung umkehren können. */
const BIDI_CHARS = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g

/** Einzeilige Beschriftung: Steuer- und Bidi-Zeichen entfernen, Leerraum normalisieren. */
export function cleanLabel(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null
  const text = value
    .replace(BIDI_CHARS, "")
    .replace(CONTROL_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim()
  return text === "" ? null : text
}
