import { PageTitle } from "@/components/site/page-title"

/** Seitentitel (H1 36 px), Einleitung und optionale Aktion rechts. */
export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12 lg:mb-12">
      <div className="flex min-w-0 flex-col gap-4">
        <PageTitle>{title}</PageTitle>
        {description ? <p className="max-w-[70ch]">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
