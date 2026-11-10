import type { Options, UrlTransform } from "react-markdown"

import { safeHref } from "./links"
import { stripEnclosingQuotes } from "./text"

/**
 * Markdown-Verarbeitung für Beschreibungen aus LeanIX (ohne React-Komponenten,
 * damit sie ohne JSX testbar bleibt). Die Darstellung liegt in
 * `components/markdown.tsx`.
 */

/** Nur http(s), mailto und tel werden als Link dargestellt, alles andere als Text. */
export const urlTransform: UrlTransform = (url, key) => {
  if (key !== "href") return ""
  return safeHref(url) ?? ""
}

/** Minimaler mdast-Knoten (nur was das Plugin braucht). */
interface MdNode {
  type: string
  value?: string
  children?: MdNode[]
}

function splitLines(node: MdNode): MdNode[] {
  const lines = (node.value ?? "").split(/\r?\n|\r/)
  return lines.flatMap((line, i) => {
    const text = line ? [{ type: "text", value: line }] : []
    return i === 0 ? text : [{ type: "break" }, ...text]
  })
}

function softBreaksToBreaks(node: MdNode) {
  if (!node.children) return
  node.children = node.children.flatMap((child) => {
    if (child.type === "text" && child.value && /[\r\n]/.test(child.value)) {
      return splitLines(child)
    }
    softBreaksToBreaks(child)
    return [child]
  })
}

/**
 * Remark-Plugin (wie `remark-breaks`): Einfache Zeilenumbrüche in Textknoten
 * werden zu `<br>`. Ältere Beschreibungen in LeanIX setzen Zeilen ohne
 * Leerzeile ab; ohne das Plugin liefen sie zu einem Absatz zusammen. Code
 * (`code`, `inlineCode`) bleibt unberührt, weil es keine Textknoten sind.
 */
export function remarkSoftBreaks() {
  return (tree: MdNode) => softBreaksToBreaks(tree)
}

/**
 * Vorbereitung des Rohtexts: Anführungszeichen um den ganzen Text entfernen
 * und Zeilen, die mit «•» beginnen, als Aufzählung lesen (Darstellung mit
 * Halbgeviertstrich gemäss CD).
 */
export function prepareMarkdown(text: string): string {
  return stripEnclosingQuotes(text).replace(/^([ \t]*)•[ \t]+/gm, "$1- ")
}

/** Gemeinsame Optionen für `react-markdown`: kein HTML, sichere Links, Umbrüche. */
export const markdownOptions: Pick<
  Options,
  "skipHtml" | "remarkPlugins" | "urlTransform"
> = {
  skipHtml: true,
  remarkPlugins: [remarkSoftBreaks],
  urlTransform,
}
