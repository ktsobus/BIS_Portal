import Link from "next/link"

import { cn } from "@/lib/utils"

import { ArrowCircle } from "./arrow-circle"

/**
 * Fläche einer verlinkten Karte: Mint, 10 px, 24 px Innenabstand. Beim
 * Überfahren hebt sie sich 2 px mit dem einen Schatten des Systems.
 */
export const cardSurfaceClass =
  "group relative rounded-tile bg-tile-service p-6 transition-[box-shadow,background-color,translate] duration-200 ease-ui hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0"

/**
 * Anordnung des Karteninhalts:
 * - `tile`: Kachel im Raster (Startseite, Suche), Pfeilkreis unten rechts.
 * - `row`: Zeile über die ganze Inhaltsbreite (Listen auf Inhaltsseiten),
 *   Text links, Pfeilkreis rechts auf Mitte; mobil wie eine Kachel.
 */
export type CardLayout = "tile" | "row"

export const cardLayoutClass: Record<CardLayout, string> = {
  tile: "flex h-full flex-col gap-3 md:min-h-60",
  row: "flex flex-col gap-3 md:flex-row md:items-center md:gap-8",
}

/** Pfeilkreis je Anordnung (unten rechts bzw. rechts auf Mitte). */
export const cardArrowClass: Record<CardLayout, string> = {
  tile: "mt-auto self-end",
  row: "self-end md:self-center",
}

/**
 * Servicekarte nach so.ch: blassgrüne Fläche, Titel in Black, Stelle bzw.
 * Metadaten 14 px, roter Pfeilkreis. Die ganze Karte ist der Link; besuchte
 * Karten werden dunkler grün. Beim Überfahren hebt sich die Karte, der
 * Titel wird rot und der Pfeil rückt in Laufrichtung.
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
  layout = "tile",
  headingLevel = 3,
  className,
}: {
  /** Eindeutig auf der Seite; Grundlage der Element-IDs. */
  id: string
  href: string
  title: string
  /** Zeile unter dem Titel (14 px), z. B. die verantwortliche Stelle. */
  meta?: React.ReactNode
  /** Weiterer Inhalt (z. B. Kurzbeschreibung). */
  children?: React.ReactNode
  layout?: CardLayout
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
        cardSurfaceClass,
        cardLayoutClass[layout],
        "focus-inset visited:bg-tile-service-visited",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <Heading
          id={titleId}
          className={cn(
            "text-pretty transition-colors duration-200 group-hover:text-primary",
            layout === "tile" ? "type-headline-md" : "type-headline-sm"
          )}
        >
          {title}
        </Heading>
        {meta ? (
          <div id={metaId} className="type-body-sm">
            {meta}
          </div>
        ) : null}
        {children ? (
          <div className="max-w-[70ch] type-body-md">{children}</div>
        ) : null}
      </div>
      <ArrowCircle
        className={cn(
          cardArrowClass[layout],
          "group-hover:shadow-press-dark group-active:shadow-press-dark"
        )}
      />
    </Link>
  )
}

/** Raster aus Kacheln: mobil eine Spalte (12 px Abstand), sonst 2–3 Spalten. */
export function CardGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <ul
      className={cn(
        "grid gap-3 md:grid-cols-2 md:gap-6 xl:grid-cols-3 xl:gap-12",
        className
      )}
    >
      {children}
    </ul>
  )
}

/** Liste aus Zeilenkarten über die Inhaltsbreite (12 px Abstand). */
export function CardList({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <ul className={cn("flex flex-col gap-3", className)}>{children}</ul>
}
