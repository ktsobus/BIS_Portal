import type { SearchEntry } from "@workspace/api"

/**
 * Clientseitige Suche über den Suchindex (kleine Datenmenge). Tolerant
 * gegenüber Gross-/Kleinschreibung, Umlauten (ä = ae), Akzenten und
 * Bindestrichen; mehrere Wörter sind UND-verknüpft.
 */

function base(text: string): string {
  return text
    .toLocaleLowerCase("de-CH")
    .replace(/ß/g, "ss")
    .replace(/[­\-‐‑–]/g, "")
}

function stripMarks(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "")
}

/** Umlaute ausgeschrieben: «Unterstützung» → «unterstuetzung». */
export function expandForSearch(text: string): string {
  return stripMarks(
    base(text).replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
  )
}

/** Umlaute ohne e: «Unterstützung» → «unterstutzung». */
export function foldForSearch(text: string): string {
  return stripMarks(base(text))
}

interface Variants {
  expanded: string
  folded: string
}

function variants(text: string): Variants {
  return { expanded: expandForSearch(text), folded: foldForSearch(text) }
}

function includes(field: Variants, token: Variants): boolean {
  return (
    field.expanded.includes(token.expanded) ||
    field.folded.includes(token.folded)
  )
}

function startsWord(field: Variants, token: Variants): boolean {
  const pattern = (value: string) =>
    new RegExp(`(^|[^a-z0-9])${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)
  return (
    pattern(token.expanded).test(field.expanded) ||
    pattern(token.folded).test(field.folded)
  )
}

/** Suchwörter aus der Eingabe (ohne Anführungszeichen und Satzzeichen). */
export function tokenize(query: string): string[] {
  return query
    .split(/[\s,;:/«»"'„“”()]+/)
    .map((token) => token.trim())
    .filter((token) => base(token).length > 0)
}

export interface PreparedEntry {
  entry: SearchEntry
  name: Variants
  context: Variants
  summary: Variants
  keywords: Variants
}

export function prepareEntries(entries: SearchEntry[]): PreparedEntry[] {
  return entries.map((entry) => ({
    entry,
    name: variants(entry.name),
    context: variants(entry.context),
    summary: variants(entry.summary ?? ""),
    keywords: variants(
      [entry.keywords, entry.subtypeLabel ?? "", ...entry.audiences].join(" ")
    ),
  }))
}

export interface SearchFilter {
  query: string
  /** Anzeigename des Subtyps, z. B. «Verwaltungsleistung»; leer = alle. */
  subtype?: string
  /** Leistungsbezüger; leer = alle. */
  audience?: string
}

const collator = new Intl.Collator("de-CH", { sensitivity: "base" })

function scoreToken(item: PreparedEntry, token: Variants): number {
  if (includes(item.name, token)) return startsWord(item.name, token) ? 12 : 8
  if (includes(item.context, token)) return 4
  if (includes(item.summary, token)) return 2
  if (includes(item.keywords, token)) return 1
  return 0
}

/** Treffer, nach Relevanz sortiert (ohne Suchwort: Leistungen zuerst, alphabetisch). */
export function searchEntries(
  prepared: PreparedEntry[],
  { query, subtype, audience }: SearchFilter
): SearchEntry[] {
  const tokens = tokenize(query).map(variants)

  const scored: { entry: SearchEntry; score: number }[] = []
  for (const item of prepared) {
    if (subtype && item.entry.subtypeLabel !== subtype) continue
    if (audience && !item.entry.audiences.includes(audience)) continue

    let score = 0
    let matchesAll = true
    for (const token of tokens) {
      const tokenScore = scoreToken(item, token)
      if (tokenScore === 0) {
        matchesAll = false
        break
      }
      score += tokenScore
    }
    if (!matchesAll) continue
    if (item.entry.kind === "leistung") score += 0.5
    scored.push({ entry: item.entry, score })
  }

  return scored
    .sort(
      (a, b) =>
        b.score - a.score || collator.compare(a.entry.name, b.entry.name)
    )
    .map((item) => item.entry)
}

/**
 * Hält den Suchzustand in der Adresse (`q`, `art`, `bezueger`), ohne neuen
 * Verlaufseintrag. Andere Parameter (z. B. `ansicht`) bleiben erhalten.
 */
export function writeSearchUrl({ query, subtype, audience }: SearchFilter) {
  const params = new URLSearchParams(window.location.search)
  for (const [key, value] of [
    ["q", query.trim()],
    ["art", subtype],
    ["bezueger", audience],
  ] as const) {
    if (value) params.set(key, value)
    else params.delete(key)
  }
  const search = params.toString()
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${search ? `?${search}` : ""}`
  )
}
