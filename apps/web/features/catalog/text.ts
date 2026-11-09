/**
 * Texthilfen für Inhalte aus LeanIX (Server und Browser). Beschreibungen sind
 * Markdown; für Teaser, Suche und Metadaten braucht es Klartext.
 */

/** Entfernt gerade Anführungszeichen, die den ganzen Text einfassen. */
export function stripEnclosingQuotes(text: string): string {
  const trimmed = text.trim()
  if (
    trimmed.length >= 2 &&
    trimmed.startsWith('"') &&
    trimmed.endsWith('"') &&
    !trimmed.slice(1, -1).includes('"')
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

/** Markdown (wie in LeanIX gepflegt) als einzeiliger Klartext. */
export function markdownToPlainText(
  markdown: string | null | undefined
): string {
  if (!markdown) return ""
  return (
    stripEnclosingQuotes(markdown)
      // Autolinks <https://…> → URL
      .replace(/<((?:https?|mailto|tel):[^>\s]+)>/gi, "$1")
      // HTML-Tags
      .replace(/<\/?[a-z][^>]*>/gi, " ")
      // Bilder → Alternativtext, Links → Linktext
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      // Code
      .replace(/`+([^`]*)`+/g, "$1")
      // Überschriften, Zitate, Listenpunkte, Trennlinien
      .replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, "")
      .replace(/^[ \t]{0,3}>[ \t]?/gm, "")
      .replace(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]+/gm, "")
      .replace(/^[ \t]*(?:[-*_][ \t]*){3,}$/gm, " ")
      // Hervorhebungen
      .replace(/(\*\*|__)(.+?)\1/g, "$2")
      .replace(/(^|[\s(])[*_](\S(?:.*?\S)?)[*_](?=[\s).,;:!?]|$)/gm, "$1$2")
      // Backslash-Zeilenumbrüche und maskierte Zeichen
      .replace(/\\(?=\r?\n|$)/g, "")
      .replace(/\\([\\`*_{}[\]()#+\-.!>|])/g, "$1")
      .replace(/\s+/g, " ")
      .trim()
  )
}

/** Kürzt an einer Wortgrenze und hängt «…» an. */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  const slice = text.slice(0, maxLength + 1)
  const lastSpace = slice.lastIndexOf(" ")
  const cut = lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice
  return `${cut.slice(0, maxLength).replace(/[\s,;:.–-]+$/, "")} …`
}

/** Markdown als gekürzter Klartext (Teaser); `null`, wenn leer. */
export function plainExcerpt(
  markdown: string | null | undefined,
  maxLength = 220
): string | null {
  const text = markdownToPlainText(markdown)
  return text ? truncateText(text, maxLength) : null
}

/** «1 Leistung» / «4 Leistungen». */
export function countLabel(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}
