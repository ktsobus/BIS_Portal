import type { FamilySummary } from "@workspace/api"

import { countLabel } from "../text"
import { CardGrid, ServiceCard } from "./service-card"

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

/** Service-Familien als Servicekarten (Startseite). */
export function FamilyTiles({ items }: { items: FamilyTileData[] }) {
  return (
    <CardGrid>
      {items.map(({ family, services }) => {
        const preview = previewNames(services)
        const more = services.length - preview.length
        return (
          <li key={family.id}>
            <ServiceCard
              id={`familie-${family.id}`}
              href={`/kategorie/${family.slug}`}
              title={family.name}
              meta={
                <>
                  {countLabel(family.serviceCount, "Service", "Services")}
                  {family.leistungCount === 0
                    ? ", noch keine Leistungen"
                    : ` mit ${countLabel(
                        family.leistungCount,
                        "Leistung",
                        "Leistungen"
                      )}`}
                </>
              }
            >
              {preview.length > 0 ? (
                <ul className="list-dash flex flex-col gap-0.5">
                  {preview.map((name, index) => (
                    <li key={`${index}-${name}`}>{name}</li>
                  ))}
                  {more > 0 ? (
                    <li>
                      und {more} {more === 1 ? "weiterer" : "weitere"}
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </ServiceCard>
          </li>
        )
      })}
    </CardGrid>
  )
}
