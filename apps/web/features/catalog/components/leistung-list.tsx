import Link from "next/link"
import type { LeistungSummary, PublicLeistung } from "@workspace/api"
import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

import { ActionLinks } from "./action-links"

type Item = Pick<
  PublicLeistung | LeistungSummary,
  "id" | "slug" | "name" | "subtypeLabel" | "summary" | "actions"
>

/**
 * Leistungen als Liste: Name, Art, Kurzbeschreibung und gleich darunter der
 * nächste Schritt. Niemand muss die Detailseite öffnen, um zu bestellen.
 * Jede Zeile hat denselben Aufbau, unabhängig von der Länge des Namens.
 */
export function LeistungList({ leistungen }: { leistungen: Item[] }) {
  return (
    <Card>
      <ul>
        {leistungen.map((leistung) => (
          <li
            key={leistung.id}
            className="border-b border-line px-5 py-5 last:border-b-0 md:px-6"
          >
            <h3 className="text-lg font-bold">
              <Link
                href={`/leistung/${leistung.slug}`}
                className="rounded-sm underline-offset-[0.18em] hover:underline"
              >
                {leistung.name}
              </Link>
            </h3>
            {leistung.subtypeLabel ? (
              <p className="mt-1.5">
                <Badge>{leistung.subtypeLabel}</Badge>
              </p>
            ) : null}
            {leistung.summary ? (
              <p className="mt-2 max-w-[70ch] text-text">{leistung.summary}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
              <ActionLinks actions={leistung.actions} />
              <Link
                href={`/leistung/${leistung.slug}`}
                className="group inline-flex items-center gap-1.5 rounded-sm text-sm font-bold text-blue underline-offset-[0.2em] hover:text-blue-strong hover:underline"
              >
                Details
                <span className="sr-only">: {leistung.name}</span>
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
