import Link from "next/link"
import type { LeistungSummary } from "@workspace/api"
import { ArrowRightIcon } from "lucide-react"

import { plainExcerpt } from "../text"
import { ActionLinks } from "./action-links"
import { SubtypeBadge } from "./subtype-badge"

/** Leistung als Karte: Subtyp, Name, Kurzbeschreibung, Aktionen. */
export function LeistungCard({
  leistung,
  headingLevel = 3,
}: {
  leistung: LeistungSummary
  headingLevel?: 2 | 3
}) {
  const Heading = `h${headingLevel}` as const
  const summary = plainExcerpt(leistung.summary, 240)

  return (
    <article className="flex h-full flex-col gap-3 border border-border bg-background p-5">
      <Heading className="text-xl leading-tight font-bold">
        <Link
          href={`/leistung/${leistung.slug}`}
          className="hover:text-primary hover:underline"
        >
          {leistung.name}
        </Link>
      </Heading>
      {/* Visuell über dem Titel, im Lesefluss danach. */}
      <SubtypeBadge
        label={leistung.subtypeLabel}
        className="order-first self-start"
      />
      {summary ? <p className="text-so-graphite">{summary}</p> : null}
      <div className="mt-auto flex flex-col items-start gap-3 pt-2">
        <ActionLinks actions={leistung.actions} />
        <Link
          href={`/leistung/${leistung.slug}`}
          className="inline-flex items-center gap-1.5 text-base hover:underline"
        >
          Details
          <span className="sr-only"> zu «{leistung.name}»</span>
          <ArrowRightIcon
            aria-hidden="true"
            strokeWidth={1.5}
            className="size-4 text-primary"
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
    <ul className="grid gap-4 md:grid-cols-2">
      {leistungen.map((leistung) => (
        <li key={leistung.id}>
          <LeistungCard leistung={leistung} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  )
}
