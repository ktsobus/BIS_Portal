import type {
  LeistungSummary,
  OrgUnit,
  Person,
  PublicLeistung,
  ServiceSummary,
} from "@workspace/api"

import { Arrow } from "@/components/ui/arrow"

import { countLabel, plainExcerpt } from "../text"

/** Services einer Kategorie: jede Zeile führt zum Service. */
export function ServiceEntries({ services }: { services: ServiceSummary[] }) {
  return (
    <ul className="entries">
      {services.map((service) => (
        <li className="entry" key={service.id}>
          <h3 className="entry__name">
            <a href={`/service/${service.slug}`}>{service.name}</a>
          </h3>
          {plainExcerpt(service.definition, 200) ? (
            <p className="entry__text">
              {plainExcerpt(service.definition, 200)}
            </p>
          ) : null}
          {service.responsible.length > 0 ? (
            <p className="entry__meta">
              {service.responsible.map((unit) => unit.name).join(", ")}
            </p>
          ) : null}
          <span className="entry__side">
            {countLabel(service.leistungCount, "Leistung", "Leistungen")}
            <Arrow />
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Leistungen eines Services (oder über-/untergeordnete Leistungen). */
export function LeistungEntries({
  leistungen,
}: {
  leistungen: (PublicLeistung | LeistungSummary)[]
}) {
  return (
    <ul className="entries">
      {leistungen.map((leistung) => (
        <li className="entry" key={leistung.id}>
          <h3 className="entry__name">
            <a href={`/leistung/${leistung.slug}`}>{leistung.name}</a>
          </h3>
          {leistung.summary ? (
            <p className="entry__text">{plainExcerpt(leistung.summary, 220)}</p>
          ) : null}
          <span className="entry__side">
            {leistung.subtypeLabel ? (
              <span className="tag">{leistung.subtypeLabel}</span>
            ) : null}
            <Arrow />
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Verantwortliche Stellen mit ihrem Pfad in der Organisation. */
export function OrgUnits({ units }: { units: OrgUnit[] }) {
  if (units.length === 0) return <dd className="muted">Keine Angabe</dd>
  return (
    <>
      {units.map((unit) => (
        <dd key={unit.id}>
          {unit.name}
          {unit.path && unit.path !== unit.name ? (
            <small>{unit.path}</small>
          ) : null}
        </dd>
      ))}
    </>
  )
}

/** Personen (nur, wenn in der Konfiguration freigeschaltet). */
export function Persons({ persons }: { persons: Person[] }) {
  if (persons.length === 0) return null
  return (
    <>
      {persons.map((person, index) => (
        <dd key={`${index}-${person.name}`}>
          {person.name}
          {person.role ? <small>{person.role}</small> : null}
        </dd>
      ))}
    </>
  )
}
