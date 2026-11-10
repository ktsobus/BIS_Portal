import type { ServiceSummary } from "@workspace/api"

import { countLabel, plainExcerpt } from "../text"
import { orgUnitNames } from "./org-units"
import { CardList, ServiceCard } from "./service-card"

/** Services einer Familie als Zeilenkarten (Familienseite). */
export function ServiceList({
  services,
  headingLevel = 3,
}: {
  services: ServiceSummary[]
  headingLevel?: 2 | 3
}) {
  if (services.length === 0) {
    return <p>In dieser Service-Familie sind noch keine Services erfasst.</p>
  }

  return (
    <CardList>
      {services.map((service) => {
        const excerpt = plainExcerpt(service.definition, 160)
        const responsible = orgUnitNames(service.responsible)
        return (
          <li key={service.id}>
            <ServiceCard
              id={`service-${service.id}`}
              href={`/service/${service.slug}`}
              title={service.name}
              layout="row"
              headingLevel={headingLevel}
              meta={
                <>
                  {service.leistungCount === 0
                    ? "Noch keine Leistungen erfasst"
                    : countLabel(
                        service.leistungCount,
                        "Leistung",
                        "Leistungen"
                      )}
                  {responsible ? (
                    <>
                      <br />
                      {responsible}
                    </>
                  ) : null}
                </>
              }
            >
              {excerpt ? <p className="line-clamp-2">{excerpt}</p> : null}
            </ServiceCard>
          </li>
        )
      })}
    </CardList>
  )
}
