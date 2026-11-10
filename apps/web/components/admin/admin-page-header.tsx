import type { ReactNode } from "react"

import { PageTitle } from "@/components/site/page-title"

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="min-w-0">
        <PageTitle size="md">{title}</PageTitle>
        {description ? (
          <p className="mt-2 max-w-[65ch] text-text">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-3">{actions}</div> : null}
    </header>
  )
}
