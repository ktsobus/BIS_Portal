import { PageTitle } from "@/components/site/page-title"

/** Seitentitel (rotes Quadrat), Einleitung und optionale Aktion rechts. */
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
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-end md:justify-between md:gap-8">
      <div className="flex min-w-0 flex-col gap-3">
        <PageTitle>{title}</PageTitle>
        {description ? (
          <p className="max-w-[70ch] text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
