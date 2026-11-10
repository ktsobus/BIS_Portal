import type { ReactNode } from "react"
import ReactMarkdown, { type Components } from "react-markdown"

import { ExternalLink } from "@/components/site/external-link"
import { cn } from "@/lib/utils"

import { markdownOptions, prepareMarkdown } from "../markdown"

/*
 * Überschriften aus LeanIX beginnen unterhalb der Seitenstruktur (h1 Titel,
 * h2 Abschnitt), damit die Gliederung der Seite gültig bleibt.
 */
const components: Components = {
  h1: ({ children }) => <h3>{children}</h3>,
  h2: ({ children }) => <h3>{children}</h3>,
  h3: ({ children }) => <h4>{children}</h4>,
  h4: ({ children }) => <h4>{children}</h4>,
  h5: ({ children }) => <h4>{children}</h4>,
  h6: ({ children }) => <h4>{children}</h4>,
  a: ({ href, children }) =>
    href ? (
      <ExternalLink href={href}>{children as ReactNode}</ExternalLink>
    ) : (
      <span>{children}</span>
    ),
  // Bilder aus LeanIX sind ohne LeanIX-Konto nicht abrufbar.
  img: ({ alt }) => (alt ? <span>{alt}</span> : null),
}

/** Beschreibung aus LeanIX (Markdown) als Fliesstext. */
export function MarkdownText({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div className={cn("prose", className)}>
      <ReactMarkdown {...markdownOptions} components={components}>
        {prepareMarkdown(children)}
      </ReactMarkdown>
    </div>
  )
}
