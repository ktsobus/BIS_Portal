/**
 * Seitentitel mit rotem Quadrat gemäss CD-Manual: das Quadrat steht links vom
 * Titel auf der Grundlinie der ersten Zeile; ab Desktop-Breite hängt es in
 * den Seitenrand, damit der Titeltext mit dem Inhalt fluchtet.
 */
export function PageTitle({
  children,
  eyebrow,
}: {
  children: React.ReactNode
  /** Kleine Zeile über dem Titel, z. B. die Service-Familie. */
  eyebrow?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      {eyebrow ? (
        <p className="text-sm tracking-[0.06em] text-muted-foreground uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="flex items-baseline gap-[0.3em] text-[2rem] leading-[1.12] font-normal text-balance text-foreground sm:text-[2.5rem] lg:-ml-[0.72em] lg:text-5xl">
        <span
          aria-hidden="true"
          className="inline-block size-[0.42em] shrink-0 bg-primary"
        />
        <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
      </h1>
    </div>
  )
}
