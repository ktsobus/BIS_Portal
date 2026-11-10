import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

import { Breadcrumbs, type Crumb } from "./breadcrumbs"
import { PageTitle } from "./page-title"

/**
 * Weisser Seitenkopf: Brotkrumen, Titel mit rotem Quadrat, Einleitung und
 * was die Seite sonst als Erstes braucht (z. B. das Suchfeld).
 */
export function PageHead({
  title,
  crumbs,
  lead,
  meta,
  children,
  spacious = false,
}: {
  title: ReactNode
  crumbs?: Crumb[]
  lead?: ReactNode
  /** Kennzeichnungen direkt unter dem Titel, z. B. Subtyp oder Anzahl. */
  meta?: ReactNode
  children?: ReactNode
  spacious?: boolean
}) {
  return (
    <div className="border-b border-line bg-white">
      <div
        className={cn(
          "container-page",
          spacious ? "pt-10 pb-10 md:pt-14 md:pb-12" : "pt-6 pb-8 md:pb-10"
        )}
      >
        {crumbs ? (
          <div className="mb-6">
            <Breadcrumbs items={crumbs} />
          </div>
        ) : null}
        <PageTitle>{title}</PageTitle>
        {meta ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
            {meta}
          </div>
        ) : null}
        {lead ? (
          <p className="mt-3 max-w-[40rem] text-lg text-text">{lead}</p>
        ) : null}
        {children ? <div className="mt-7">{children}</div> : null}
      </div>
    </div>
  )
}
