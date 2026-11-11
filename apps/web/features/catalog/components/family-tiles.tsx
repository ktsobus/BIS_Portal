import Link from "next/link"
import type { FamilySummary, ServiceSummary } from "@workspace/api"

import { cn } from "@/lib/utils"

import { countLabel } from "../text"
import { ArrowCircle } from "./arrow-circle"
import {
  CardGrid,
  cardArrowClass,
  cardLayoutClass,
  cardSurfaceClass,
} from "./service-card"

export interface FamilyTileData {
  family: FamilySummary
  /** Services in LeanIX-Reihenfolge. */
  services: Pick<ServiceSummary, "id" | "slug" | "name" | "leistungCount">[]
}

const PREVIEW_COUNT = 6

/** Vorschau: Services mit Leistungen zuerst, sonst LeanIX-Reihenfolge. */
function preview(services: FamilyTileData["services"]) {
  return [
    ...services.filter((service) => service.leistungCount > 0),
    ...services.filter((service) => service.leistungCount === 0),
  ].slice(0, PREVIEW_COUNT)
}

/**
 * Service-Familien als Servicekarten (Startseite). Die Karte führt zur
 * Familie (Titel-Link über die ganze Fläche); die Services darin sind eigene
 * Links direkt zum Service (aus `impeccable-frontend`).
 */
export function FamilyTiles({ items }: { items: FamilyTileData[] }) {
  return (
    <CardGrid>
      {items.map(({ family, services }) => {
        const shown = preview(services)
        const more = services.length - shown.length
        const metaId = `familie-${family.id}-meta`
        return (
          <li key={family.id}>
            <div
              className={cn(
                cardSurfaceClass,
                cardLayoutClass.tile,
                // Über einem Service-Link reagiert nur die Zeile, nicht die Karte.
                "has-[li_a:hover]:translate-y-0 has-[li_a:hover]:shadow-none"
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <h3 className="type-headline-md text-pretty">
                  <Link
                    href={`/kategorie/${family.slug}`}
                    aria-describedby={metaId}
                    className="transition-colors duration-200 group-hover:text-primary group-has-[li_a:hover]:text-inherit after:absolute after:inset-0 after:rounded-tile"
                  >
                    {family.name}
                  </Link>
                </h3>
                <div id={metaId} className="type-body-sm">
                  {countLabel(family.serviceCount, "Service", "Services")}
                  {family.leistungCount === 0
                    ? ", noch keine Leistungen"
                    : ` mit ${countLabel(
                        family.leistungCount,
                        "Leistung",
                        "Leistungen"
                      )}`}
                </div>
                {/* Zeilen wie in impeccable: Linien, Anzahl rechts, Blau aus dem CD (chart-2). */}
                {shown.length > 0 ? (
                  <ul className="mt-1 border-t border-hairline type-body-md">
                    {shown.map((service) => (
                      <li key={service.id} className="border-b border-hairline">
                        <Link
                          href={`/service/${service.slug}`}
                          className="relative z-10 -mx-2 flex items-baseline justify-between gap-3 rounded-sm px-2 py-2.5 text-chart-2 transition-colors duration-150 hover:bg-background"
                        >
                          <span className="min-w-0 break-words">
                            {service.name}
                          </span>
                          <span className="shrink-0 type-body-sm text-secondary tabular-nums">
                            {service.leistungCount}
                            <span className="sr-only">
                              {service.leistungCount === 1
                                ? " Leistung"
                                : " Leistungen"}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {more > 0 ? (
                  <p className="type-body-sm">
                    und {more} {more === 1 ? "weiterer" : "weitere"}
                  </p>
                ) : null}
              </div>
              <ArrowCircle
                className={cn(
                  cardArrowClass.tile,
                  "group-hover:shadow-press-dark group-active:shadow-press-dark group-has-[li_a:hover]:shadow-none"
                )}
              />
            </div>
          </li>
        )
      })}
    </CardGrid>
  )
}
