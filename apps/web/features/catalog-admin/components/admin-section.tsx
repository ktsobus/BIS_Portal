/** Abschnitt mit Haarlinie, Überschrift und optionaler Aktion rechts. */
export function AdminSection({
  id,
  title,
  description,
  action,
  children,
}: {
  id: string
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}) {
  const headingId = `${id}-titel`
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="flex scroll-mt-6 flex-col gap-5 border-t border-border pt-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={headingId} className="text-2xl leading-tight font-bold">
            {title}
          </h2>
          {description ? (
            <p className="max-w-[70ch] text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}
