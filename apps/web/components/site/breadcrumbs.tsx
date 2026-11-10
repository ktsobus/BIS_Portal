import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface Crumb {
  label: string
  href?: string
}

const linkClass =
  "rounded-sm underline-offset-[0.2em] transition-colors duration-150 hover:text-ink hover:underline"

/**
 * Pfad im Katalog: Katalog › Familie › Service › Leistung. Auf schmalen
 * Bildschirmen steht nur der Weg zurück zur übergeordneten Seite; der Titel
 * der aktuellen Seite folgt direkt darunter.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const parent = [...items].reverse().find((item) => item.href)
  return (
    <nav aria-label="Brotkrumen" className="text-sm text-muted">
      {parent?.href ? (
        <Link
          href={parent.href}
          className={`${linkClass} -ml-1 inline-flex items-center gap-1 md:hidden`}
        >
          <ChevronLeft aria-hidden="true" className="size-4 shrink-0" />
          {parent.label}
        </Link>
      ) : null}
      <ol className="hidden flex-wrap items-center gap-x-1.5 gap-y-1 md:flex">
        {items.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className="flex items-center gap-1.5"
          >
            {index > 0 ? (
              <ChevronRight aria-hidden="true" className="size-3.5 shrink-0" />
            ) : null}
            {item.href ? (
              <Link href={item.href} className={linkClass}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-text">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
