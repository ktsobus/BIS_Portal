import Link from "next/link"

import { cn } from "@/lib/utils"

import { ArrowCircle } from "./arrow-circle"

/** Kachel einer verlinkten Karte: Mint, 10 px, hebt sich beim Überfahren. */
export const cardTileClass =
  "group relative flex h-full flex-col gap-3 rounded-tile bg-tile-service p-6 transition-[box-shadow,background-color] duration-200 hover:shadow-lift md:min-h-60"

/**
 * Servicekarte nach so.ch: blassgrüne Kachel (10 px, 24 px Innenabstand),
 * Titel 24 px Black, Stelle bzw. Metadaten 14 px, roter Pfeilkreis unten
 * rechts. Die ganze Karte ist der Link; besuchte Karten werden dunkler
 * grün. Beim Überfahren hebt sich die Karte und der Titel wird rot.
 *
 * Der Linkname ist nur der Titel (`aria-labelledby`), Metadaten folgen als
 * Beschreibung (`aria-describedby`).
 */
export function ServiceCard({
  id,
  href,
  title,
  meta,
  children,
  headingLevel = 3,
  className,
}: {
  /** Eindeutig auf der Seite; Grundlage der Element-IDs. */
  id: string
  href: string
  title: string
  /** Zeile unter dem Titel (14 px), z. B. die verantwortliche Stelle. */
  meta?: React.ReactNode
  /** Weiterer Inhalt (z. B. Kurzbeschreibung), auf drei Zeilen gekürzt. */
  children?: React.ReactNode
  headingLevel?: 2 | 3
  className?: string
}) {
  const Heading = `h${headingLevel}` as const
  const titleId = `${id}-titel`
  const metaId = meta ? `${id}-meta` : undefined

  return (
    <Link
      href={href}
      aria-labelledby={titleId}
      aria-describedby={metaId}
      className={cn(
        cardTileClass,
        "focus-inset visited:bg-tile-service-visited",
        className
      )}
    >
      <Heading
        id={titleId}
        className="type-headline-md text-pretty transition-colors duration-200 group-hover:text-primary"
      >
        {title}
      </Heading>
      {meta ? (
        <div id={metaId} className="type-body-sm">
          {meta}
        </div>
      ) : null}
      {children ? <div className="type-body-md">{children}</div> : null}
      <ArrowCircle className="mt-auto self-end group-hover:shadow-press-dark group-active:shadow-press-dark" />
    </Link>
  )
}

/** Raster aus Karten: mobil eine Spalte (12 px Abstand), sonst 2–3 Spalten. */
export function CardGrid({
  children,
  columns = 3,
  className,
}: {
  children: React.ReactNode
  /** Höchstzahl Spalten ab Desktop. */
  columns?: 2 | 3
  className?: string
}) {
  return (
    <ul
      className={cn(
        "grid gap-3 md:grid-cols-2 md:gap-6",
        columns === 3 && "xl:grid-cols-3 xl:gap-12",
        columns === 2 && "lg:gap-8",
        className
      )}
    >
      {children}
    </ul>
  )
}
