import { cn } from "@/lib/utils"

import { Breadcrumbs, type BreadcrumbItem } from "./breadcrumbs"

/**
 * Rahmen einer Inhaltsseite: Brotkrumen über die ganze Breite, darunter
 * optional die Seitennavigation (250 px) und die Inhaltsspalte (max. 912 px).
 */
export function ContentPage({
  breadcrumbs,
  sideNav,
  children,
  wide = false,
}: {
  breadcrumbs?: BreadcrumbItem[]
  sideNav?: React.ReactNode
  children: React.ReactNode
  /** Inhalt über die ganze Seitenbreite (z. B. Kartenraster der Suche). */
  wide?: boolean
}) {
  return (
    <div className="container-page">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumbs items={breadcrumbs} />
      ) : (
        <div aria-hidden="true" className="h-8 lg:h-12" />
      )}
      <div
        className={cn(
          sideNav &&
            "lg:grid lg:grid-cols-[var(--spacing-sidenav)_minmax(0,1fr)] lg:gap-x-12 xl:gap-x-16"
        )}
      >
        {sideNav}
        <div
          className={cn(
            "flex min-w-0 flex-col gap-12 pt-2 lg:pt-0",
            !wide && "max-w-reading"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
