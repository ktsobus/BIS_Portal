import Link from "next/link"
import type { ServiceSummary } from "@workspace/api"

import { countLabel, plainExcerpt } from "../text"
import { orgUnitNames } from "./org-units"

/** Services einer Familie als Liste mit Haarlinien (Familienseite). */
export function ServiceList({ services }: { services: ServiceSummary[] }) {
  if (services.length === 0) {
    return (
      <p className="max-w-[70ch]">
        In dieser Service-Familie sind noch keine Services erfasst.
      </p>
    )
  }

  return (
    <ul className="flex flex-col border-b border-border">
      {services.map((service) => {
        const excerpt = plainExcerpt(service.definition, 240)
        const responsible = orgUnitNames(service.responsible)
        return (
          <li
            key={service.id}
            className="group relative flex flex-col gap-1.5 border-t border-border py-5"
          >
            <h2 className="text-xl leading-tight font-bold">
              <Link
                href={`/service/${service.slug}`}
                className="group-hover:underline after:absolute after:inset-0"
              >
                {service.name}
              </Link>
            </h2>
            <p className="text-sm text-so-graphite">
              {service.leistungCount === 0 ? (
                "Noch keine Leistungen erfasst"
              ) : (
                <strong>
                  {countLabel(service.leistungCount, "Leistung", "Leistungen")}
                </strong>
              )}
              {responsible ? <> · Verantwortlich: {responsible}</> : null}
            </p>
            {excerpt ? <p className="max-w-[70ch]">{excerpt}</p> : null}
          </li>
        )
      })}
    </ul>
  )
}
