import Link from "next/link"
import type { LeistungSummary } from "@workspace/api"

import { cn } from "@/lib/utils"

import { isFallbackAction } from "../server/fallback"
import { plainExcerpt } from "../text"
import { ActionLinks } from "./action-links"
import { ArrowCircle } from "./arrow-circle"
import {
  cardArrowClass,
  cardLayoutClass,
  cardSurfaceClass,
  CardList,
} from "./service-card"

/**
 * Leistung als Zeilenkarte: Name, Art, Kurzbeschreibung, roter Pfeilkreis.
 * Die ganze Fläche führt zur Leistung (gestreckter Titel-Link); hat die
 * Leistung eigene Bestell- oder Anfragewege, liegen sie als weisse Pillen
 * darüber. Der zentrale Kontakt (Standard-Aktion) erscheint hier nicht: Er
 * stünde auf jeder Karte gleich und gehört auf die Detailseite.
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
    <article
      className={cn(
        cardSurfaceClass,
        cardLayoutClass.row,
        "isolate bg-transparent"
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3">
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
        {summary ? (
          <p className="line-clamp-2 max-w-[70ch] type-body-md">{summary}</p>
        ) : null}
        {/* Über dem gestreckten Link, damit die Pillen ihr eigenes Ziel haben. */}
        <ActionLinks actions={actions} className="relative z-10 pt-1" />
      </div>
      <ArrowCircle
        className={cn(cardArrowClass.row, "group-hover:shadow-press-dark")}
      />
    </article>
  )
}

/** Liste aus Leistungskarten. */
export function LeistungGrid({
  leistungen,
  headingLevel = 3,
}: {
  leistungen: LeistungSummary[]
  headingLevel?: 2 | 3
}) {
  return (
    <CardList>
      {leistungen.map((leistung) => (
        <li key={leistung.id}>
          <LeistungCard leistung={leistung} headingLevel={headingLevel} />
        </li>
      ))}
    </CardList>
  )
}
