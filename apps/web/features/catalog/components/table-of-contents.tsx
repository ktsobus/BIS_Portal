import { ArrowDownIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Inhaltsverzeichnis: Beschriftung (14 px) über einer Reihe weisser Pillen
 * mit rotem ↓, die zu den Abschnitten der Seite springen. Erst ab zwei
 * Einträgen sinnvoll.
 */
export function TableOfContents({
  items,
}: {
  items: { id: string; label: string }[]
}) {
  if (items.length < 2) return null
  return (
    <nav aria-labelledby="inhaltsverzeichnis" className="flex flex-col gap-3">
      <h2 id="inhaltsverzeichnis" className="type-body-sm font-normal">
        Inhaltsverzeichnis
      </h2>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {item.label}
              <ArrowDownIcon aria-hidden="true" strokeWidth={1.5} />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
