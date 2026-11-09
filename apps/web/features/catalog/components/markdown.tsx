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

const headingClass: Record<HeadingLevel, string> = {
  2: "mt-6 text-2xl font-normal",
  3: "mt-5 text-xl font-normal",
  4: "mt-4 text-lg font-bold",
  5: "mt-4 text-base font-bold",
  6: "mt-4 text-base font-bold",
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
            className="link-cd"
          >
            {children}
            <ExternalLinkHint />
          </a>
        )
      }
      return (
        <a href={href} className="link-cd">
          {children}
        </a>
      )
    },
    ul: ({ children }) => (
      <ul className="flex flex-col gap-1 pl-5">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="flex list-decimal flex-col gap-1 pl-6">{children}</ol>
    ),
    li: ({ children }) => (
      // Aufzählungen mit Halbgeviertstrich (CD).
      <li className="relative [ul>&]:before:absolute [ul>&]:before:-left-5 [ul>&]:before:content-['–']">
        {children}
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-so-line-strong pl-4 text-so-graphite">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="bg-so-surface px-1 font-mono text-[0.9em]">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="overflow-x-auto bg-so-surface p-3 text-sm">
        {children}
      </pre>
    ),
    hr: () => <hr className="border-border" />,
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
        "flex max-w-[70ch] flex-col gap-3 [overflow-wrap:anywhere]",
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
