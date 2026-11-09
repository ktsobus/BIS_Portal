// PHASE-0-STUB (Besitz: öffentliche UI). Signatur beibehalten.
export interface BreadcrumbItem {
  label: string
  /** Ohne `href` = aktuelle Seite. */
  href?: string
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Brotkrumen">
      {items.map((item) => (
        <span key={item.label}>{item.label}</span>
      ))}
    </nav>
  )
}
