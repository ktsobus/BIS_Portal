import Link from "next/link"
import type { FamilySummary, ServiceSummary } from "@workspace/api"
import { ArrowRight } from "lucide-react"

import { Card } from "@/components/ui/card"

import { countLabel } from "../text"

const MAX_SERVICES = 6

/** Service-Familie auf der Startseite: Name, Umfang und ihre Services. */
export function FamilyCard({
  family,
  services,
}: {
  family: FamilySummary
  services: ServiceSummary[]
}) {
  const href = `/kategorie/${family.slug}`
  const shown = services.slice(0, MAX_SERVICES)
  const hidden = services.length - shown.length
  return (
    <Card className="flex flex-col p-6">
      <h3 className="text-xl font-extrabold">
        <Link
          href={href}
          className="rounded-sm underline-offset-[0.18em] hover:underline"
        >
          {family.name}
        </Link>
      </h3>
      <p className="mt-1 text-sm text-muted">
        {countLabel(family.serviceCount, "Service", "Services")} ·{" "}
        {countLabel(family.leistungCount, "Leistung", "Leistungen")}
      </p>
      {shown.length > 0 ? (
        <ul className="mt-4 border-t border-line">
          {shown.map((service) => (
            <li key={service.id} className="border-b border-line">
              <Link
                href={`/service/${service.slug}`}
                className="-mx-2 flex items-baseline justify-between gap-3 rounded-sm px-2 py-2.5 text-blue transition-colors duration-150 ease-out hover:bg-blue-tint hover:text-blue-strong"
              >
                <span className="min-w-0 break-words">{service.name}</span>
                <span className="shrink-0 text-sm text-muted tabular-nums">
                  {service.leistungCount}
                  <span className="sr-only">
                    {" "}
                    {service.leistungCount === 1 ? "Leistung" : "Leistungen"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-auto pt-4">
        <Link
          href={href}
          className="group inline-flex items-center gap-1.5 rounded-sm text-sm font-bold text-red underline-offset-[0.2em] hover:text-red-strong hover:underline"
        >
          {hidden > 0
            ? `Alle ${services.length} Services anzeigen`
            : "Alle anzeigen"}
          <span className="sr-only">: {family.name}</span>
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
          />
        </Link>
      </p>
    </Card>
  )
}
