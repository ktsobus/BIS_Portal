import Link from "next/link"
import type { FamilySummary } from "@workspace/api"
import { ArrowRightIcon } from "lucide-react"

import { countLabel } from "../text"

export interface FamilyTileData {
  family: FamilySummary
  /** Services in LeanIX-Reihenfolge. */
  services: { name: string; leistungCount: number }[]
}

const PREVIEW_COUNT = 3

/** Vorschau: Services mit Leistungen zuerst, sonst LeanIX-Reihenfolge. */
function previewNames(services: FamilyTileData["services"]): string[] {
  return [
    ...services.filter((service) => service.leistungCount > 0),
    ...services.filter((service) => service.leistungCount === 0),
  ]
    .slice(0, PREVIEW_COUNT)
    .map((service) => service.name)
}

/** Service-Familien als Kacheln (ganze Kachel klickbar, Link im Titel). */
export function FamilyTiles({ items }: { items: FamilyTileData[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ family, services }) => {
        const preview = previewNames(services)
        const more = services.length - preview.length
        return (
          <li
            key={family.id}
            className="group relative flex flex-col gap-3 border-t-4 border-primary bg-so-surface p-5"
          >
            <h3 className="text-xl leading-tight font-bold">
              <Link
                href={`/kategorie/${family.slug}`}
                className="group-hover:underline after:absolute after:inset-0"
              >
                {family.name}
              </Link>
            </h3>
            <p className="text-sm text-so-graphite">
              {countLabel(family.serviceCount, "Service", "Services")} ·{" "}
              {family.leistungCount === 0
                ? "noch keine Leistungen"
                : countLabel(family.leistungCount, "Leistung", "Leistungen")}
            </p>
            {preview.length > 0 ? (
              <ul className="flex flex-col gap-0.5 text-[0.9375rem]">
                {preview.map((name, index) => (
                  <li
                    key={`${index}-${name}`}
                    className="relative pl-4 before:absolute before:left-0 before:content-['–']"
                  >
                    {name}
                  </li>
                ))}
                {more > 0 ? (
                  <li className="pl-4 text-so-graphite">
                    und {more} {more === 1 ? "weiterer" : "weitere"}
                  </li>
                ) : null}
              </ul>
            ) : null}
            <ArrowRightIcon
              aria-hidden="true"
              strokeWidth={1.25}
              className="mt-auto size-7 self-end text-primary transition-transform group-hover:translate-x-1"
            />
          </li>
        )
      })}
    </ul>
  )
}
