/** Abschnitt mit Haarlinie, H2 (24 px Black) und optionaler Aktion rechts. */
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
      className="flex scroll-mt-6 flex-col gap-6 border-t border-hairline pt-8"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
        <div className="flex min-w-0 flex-col gap-2">
          <h2 id={headingId} className="type-headline-md">
            {title}
          </h2>
          {description ? <p className="max-w-[70ch]">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}
