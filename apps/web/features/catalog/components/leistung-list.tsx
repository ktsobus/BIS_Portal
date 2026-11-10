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
 * Leistungen als Liste: Name, Art, Kurzbeschreibung und gleich daneben der
 * nächste Schritt. Niemand muss die Detailseite öffnen, um zu bestellen.
 */
export function LeistungList({ leistungen }: { leistungen: Item[] }) {
  return (
    <Card>
      <ul>
        {leistungen.map((leistung) => (
          <li
            key={leistung.id}
            className="grid gap-x-8 gap-y-4 border-b border-line px-5 py-5 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:px-6"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-lg font-bold">
                  <Link
                    href={`/leistung/${leistung.slug}`}
                    className="rounded-sm underline-offset-[0.18em] hover:underline"
                  >
                    {leistung.name}
                  </Link>
                </h3>
                {leistung.subtypeLabel ? (
                  <Badge>{leistung.subtypeLabel}</Badge>
                ) : null}
              </div>
              {leistung.summary ? (
                <p className="mt-1.5 max-w-[70ch] text-text">
                  {leistung.summary}
                </p>
              ) : null}
              <p className="mt-2">
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
              </p>
            </div>
            <ActionLinks
              actions={leistung.actions}
              className="md:max-w-64 md:flex-col md:items-stretch"
            />
          </li>
        ))}
      </ul>
    </Card>
  )
}
