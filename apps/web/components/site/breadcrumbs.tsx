import Link from "next/link"
import { ChevronRight } from "lucide-react"

export interface Crumb {
  label: string
  href?: string
}

/** Pfad im Katalog: Katalog › Familie › Service › Leistung. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Brotkrumen" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className="flex items-center gap-1.5"
          >
            {index > 0 ? (
              <ChevronRight aria-hidden="true" className="size-3.5 shrink-0" />
            ) : null}
            {item.href ? (
              <Link
                href={item.href}
                className="rounded-sm underline-offset-[0.2em] transition-colors duration-150 hover:text-ink hover:underline"
              >
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
