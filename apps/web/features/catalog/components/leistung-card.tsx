import Link from "next/link"
import type { LeistungSummary } from "@workspace/api"

import { cn } from "@/lib/utils"

import { isFallbackAction } from "../server/fallback"
import { plainExcerpt } from "../text"
import { ActionLinks } from "./action-links"
import { ArrowCircle } from "./arrow-circle"
import { cardTileClass } from "./service-card"

/**
 * Leistung als Servicekarte: Name, Art, Kurzbeschreibung, roter Pfeilkreis.
 * Die ganze Kachel führt zur Leistung (gestreckter Titel-Link); hat die
 * Leistung eigene Bestell- oder Anfragewege, liegen sie als weisse Pillen
 * darüber. Der zentrale Kontakt (Standard-Aktion) erscheint hier nicht: Er
 * stünde auf jeder Kachel gleich und gehört auf die Detailseite.
 */
export function LeistungCard({
  leistung,
  headingLevel = 3,
}: {
  leistung: LeistungSummary
  headingLevel?: 2 | 3
}) {
  const Heading = `h${headingLevel}` as const
  const summary = plainExcerpt(leistung.summary, 200)
  const actions = leistung.actions.filter((action) => !isFallbackAction(action))

  return (
    // Die Fläche zeichnet der Link (::before), damit besuchte Leistungen
    // dunkler erscheinen können; `isolate` hält sie hinter dem Inhalt.
    <article className={cn(cardTileClass, "isolate bg-transparent")}>
      <Heading className="type-headline-sm text-pretty transition-colors duration-200 group-hover:text-primary">
        <Link
          href={`/leistung/${leistung.slug}`}
          className="card-link before:absolute before:inset-0 before:-z-10 before:rounded-tile before:bg-tile-service before:transition-colors before:duration-200 after:absolute after:inset-0 after:rounded-tile visited:before:bg-tile-service-visited"
        >
          {leistung.name}
        </Link>
      </Heading>
      {leistung.subtypeLabel ? (
        <p className="type-body-sm">{leistung.subtypeLabel}</p>
      ) : null}
      {summary ? <p className="line-clamp-4 type-body-md">{summary}</p> : null}
      <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pt-2">
        {/* Über dem gestreckten Link, damit die Pillen ihr eigenes Ziel haben. */}
        <ActionLinks actions={actions} className="relative z-10" />
        <ArrowCircle className="ml-auto group-hover:shadow-press-dark" />
      </div>
    </article>
  )
}

/** Raster aus Leistungskarten. */
export function LeistungGrid({
  leistungen,
  headingLevel = 3,
}: {
  leistungen: LeistungSummary[]
  headingLevel?: 2 | 3
}) {
  return (
    <ul className="grid gap-3 md:grid-cols-2 md:gap-6">
      {leistungen.map((leistung) => (
        <li key={leistung.id}>
          <LeistungCard leistung={leistung} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  )
}
