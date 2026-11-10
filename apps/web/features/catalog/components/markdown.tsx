import Markdown, { type Components } from "react-markdown"

import { isExternalUrl } from "../links"
import { markdownOptions, prepareMarkdown } from "../markdown"

type HeadingLevel = 2 | 3 | 4 | 5 | 6

function createComponents(baseLevel: HeadingLevel): Components {
  const heading = (depth: number) => {
    const level = Math.min(6, baseLevel + depth - 1) as HeadingLevel
    const Tag = `h${level}` as const
    function Heading({ children }: { children?: React.ReactNode }) {
      return <Tag>{children}</Tag>
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
    a: ({ href, children }) => {
      if (!href) return <span>{children}</span>
      if (isExternalUrl(href)) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="ext"
          >
            {children}
            <span className="sr-only"> (öffnet in neuem Tab)</span>
          </a>
        )
      }
      return <a href={href}>{children}</a>
    },
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
 * keine Bilder, Links nur http(s)/mailto/tel, einfache Zeilenumbrüche bleiben
 * erhalten. Überschriften im Text beginnen bei `headingLevel`.
 */
export function MarkdownText({
  children,
  headingLevel = 3,
}: {
  children: string | null | undefined
  headingLevel?: HeadingLevel
}) {
  if (!children || !children.trim()) return null
  return (
    <div className="prose">
      <Markdown
        {...markdownOptions}
        components={componentsByLevel[headingLevel]}
      >
        {prepareMarkdown(children)}
      </Markdown>
    </div>
  )
}
