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
            <div className={cn(cardSurfaceClass, cardLayoutClass.tile)}>
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <h3 className="type-headline-md text-pretty">
                  <Link
                    href={`/kategorie/${family.slug}`}
                    aria-describedby={metaId}
                    className="transition-colors duration-200 group-hover:text-primary after:absolute after:inset-0 after:rounded-tile"
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
                {shown.length > 0 ? (
                  <ul className="list-dash flex flex-col gap-1 type-body-md">
                    {shown.map((service) => (
                      <li key={service.id}>
                        <Link
                          href={`/service/${service.slug}`}
                          className="relative z-10 link-text"
                        >
                          {service.name}
                        </Link>
                      </li>
                    ))}
                    {more > 0 ? (
                      <li>
                        und {more} {more === 1 ? "weiterer" : "weitere"}
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </div>
              <ArrowCircle
                className={cn(
                  cardArrowClass.tile,
                  "group-hover:shadow-press-dark group-active:shadow-press-dark"
                )}
              />
            </div>
          </li>
        )
      })}
    </CardGrid>
  )
}
