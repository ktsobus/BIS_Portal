import Link from "next/link"
import type { LeistungSummary } from "@workspace/api"
import { ArrowRightIcon } from "lucide-react"

import { plainExcerpt } from "../text"
import { ActionLinks } from "./action-links"
import { SubtypeBadge } from "./subtype-badge"

/**
 * Leistung als blassgrüne Kachel: Subtyp, Name, Kurzbeschreibung, Aktionen
 * als weisse Pillen und «Details →». Nicht als Ganzes verlinkt, weil die
 * Aktionen eigene Ziele haben.
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

  return (
    <article className="flex h-full flex-col gap-3 rounded-tile bg-tile-service p-6">
      <Heading className="type-headline-sm text-pretty">
        <Link
          href={`/leistung/${leistung.slug}`}
          className="transition-colors duration-200 hover:text-primary"
        >
          {leistung.name}
        </Link>
      </Heading>
      {/* Visuell über dem Titel, im Lesefluss danach. */}
      <SubtypeBadge
        label={leistung.subtypeLabel}
        className="order-first self-start"
      />
      {summary ? <p className="type-body-md">{summary}</p> : null}
      <div className="mt-auto flex flex-col items-start gap-4 pt-2">
        <ActionLinks actions={leistung.actions} />
        <Link
          href={`/leistung/${leistung.slug}`}
          className="group/more inline-flex min-h-11 items-center gap-[0.35em] type-label-lg transition-colors duration-200 hover:text-primary"
        >
          Details
          <span className="sr-only"> zu «{leistung.name}»</span>
          <ArrowRightIcon
            aria-hidden="true"
            strokeWidth={1.5}
            className="size-[1.375rem] text-primary"
          />
        </Link>
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
