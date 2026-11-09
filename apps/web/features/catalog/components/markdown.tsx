import Markdown, { type Components, type UrlTransform } from "react-markdown"

import { cn } from "@/lib/utils"

import { stripEnclosingQuotes } from "../text"
import { ExternalLinkHint, isExternalUrl } from "./external-link"

/** Nur diese Protokolle werden als Link dargestellt, alles andere als Text. */
const SAFE_URL = /^(?:https?:\/\/|mailto:|tel:)/i

const urlTransform: UrlTransform = (url, key) => {
  if (key !== "href") return ""
  const trimmed = url.trim()
  return SAFE_URL.test(trimmed) ? trimmed : ""
}

type HeadingLevel = 2 | 3 | 4 | 5 | 6

/** Inhaltstext nach so.ch: H2 24 px, H3 20 px, H4 18 px (alle Black). */
const headingClass: Record<HeadingLevel, string> = {
  2: "mt-2 type-headline-md",
  3: "mt-2 type-headline-sm",
  4: "mt-1 type-title-sm",
  5: "mt-1 type-title-sm",
  6: "mt-1 type-title-sm",
}

function createComponents(baseLevel: HeadingLevel): Components {
  const heading = (depth: number) => {
    const level = Math.min(6, baseLevel + depth - 1) as HeadingLevel
    const Tag = `h${level}` as const
    function Heading({ children }: { children?: React.ReactNode }) {
      return <Tag className={headingClass[level]}>{children}</Tag>
    }
    return Heading
  }

  return {
    h1: heading(1),
    h2: heading(2),
    h3: heading(3),
    h4: heading(4),
    h5: heading(5),
    h6: heading(6),
    p: ({ children }) => <p>{children}</p>,
    a: ({ href, children }) => {
      if (!href) return <span>{children}</span>
      if (isExternalUrl(href)) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="link-text"
          >
            {children}
            <ExternalLinkHint />
          </a>
        )
      }
      return (
        <a href={href} className="link-text">
          {children}
        </a>
      )
    },
    // Aufzählungen mit Halbgeviertstrich (CD-Manual), 24 px Einzug.
    ul: ({ children }) => (
      <ul className="list-dash flex flex-col gap-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="flex list-decimal flex-col gap-1 pl-6 marker:text-foreground">
        {children}
      </ol>
    ),
    li: ({ children }) => <li>{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l border-hairline pl-6">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="rounded-sm bg-tile-teaser px-1 font-mono text-[0.9em]">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="overflow-x-auto rounded-tile bg-tile-teaser p-4 text-sm">
        {children}
      </pre>
    ),
    hr: () => <hr className="border-hairline" />,
    // Bilder werden nicht geladen; der Alternativtext bleibt lesbar.
    img: ({ alt }) => (alt ? <span>{alt}</span> : null),
  }
}

const componentsByLevel: Record<HeadingLevel, Components> = {
  2: createComponents(2),
  3: createComponents(3),
  4: createComponents(4),
  5: createComponents(5),
  6: createComponents(6),
}

/**
 * Beschreibungen aus LeanIX sicher als Markdown darstellen: kein rohes HTML,
 * keine Bilder, Links nur http(s)/mailto/tel. Überschriften im Text beginnen
 * bei `headingLevel` (Standard h3, unter einem h2-Abschnitt).
 */
export function MarkdownText({
  children,
  headingLevel = 3,
  className,
}: {
  children: string | null | undefined
  headingLevel?: HeadingLevel
  className?: string
}) {
  if (!children || !children.trim()) return null
  return (
    <div
      className={cn(
        // Lesebreite max. ~70 Zeichen (CD-Manual), linksbündig.
        "flex max-w-[70ch] flex-col gap-4 [overflow-wrap:anywhere]",
        className
      )}
    >
      <Markdown
        skipHtml
        urlTransform={urlTransform}
        components={componentsByLevel[headingLevel]}
      >
        {stripEnclosingQuotes(children)}
      </Markdown>
    </div>
  )
}
