import Link from "next/link"

export interface BreadcrumbItem {
  label: string
  /** Ohne `href` = aktuelle Seite. */
  href?: string
}

/** Brotkrumen «Start › Familie › Service › Leistung». */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Brotkrumen" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li
              key={`${index}-${item.label}`}
              className="flex min-w-0 items-baseline gap-x-2"
            >
              {item.href && !isLast ? (
                <Link href={item.href} className="link-cd">
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "text-foreground" : undefined}
                >
                  {item.label}
                </span>
              )}
              {isLast ? null : (
                <span aria-hidden="true" className="text-foreground">
                  ›
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
