import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

export interface BreadcrumbItem {
  label: string
  /** Ohne `href` = aktuelle Seite. */
  href?: string
}

/**
 * Brotkrumen «Start › Familie › Service › Leistung»: 14 px Schiefer, rote
 * Winkel, 24 px Abstand. Mobil nur ein Rücklink auf die übergeordnete Seite.
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null
  const parent = [...items]
    .reverse()
    .find((item, index) => index > 0 && item.href)

  return (
    <nav aria-label="Brotkrumen" className="py-6 type-body-sm">
      <ol className="hidden flex-wrap items-center gap-x-2 gap-y-1 md:flex">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li
              key={`${index}-${item.label}`}
              className="flex min-w-0 items-center gap-x-2"
            >
              {item.href && !isLast ? (
                <Link href={item.href} className="link-text">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {isLast ? null : (
                <ChevronRightIcon
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4 shrink-0 text-primary"
                />
              )}
            </li>
          )
        })}
      </ol>
      {parent?.href ? (
        <Link
          href={parent.href}
          className="inline-flex min-h-11 items-center gap-1 transition-colors duration-200 hover:text-primary md:hidden"
        >
          <ChevronLeftIcon
            aria-hidden="true"
            strokeWidth={1.5}
            className="size-5 shrink-0 text-primary"
          />
          <span className="sr-only">Zurück zu </span>
          {parent.label}
        </Link>
      ) : null}
    </nav>
  )
}
