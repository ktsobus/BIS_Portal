import type { OrgUnit, Person } from "@workspace/api"

/** Verantwortliche Stellen: Name in 18 px Black, voller Pfad aus LeanIX. */
export function OrgUnitList({ units }: { units: OrgUnit[] }) {
  if (units.length === 0) return null
  return (
    <ul className="flex flex-col gap-4">
      {units.map((unit) => (
        <li key={unit.id} className="flex flex-col gap-1">
          <span className="type-title-sm">{unit.name}</span>
          {unit.path && unit.path !== unit.name ? (
            <span className="type-body-sm">{unit.path}</span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

/** Kurzform für Listen: «Service-Management, Personalentwicklung …». */
export function orgUnitNames(units: OrgUnit[]): string | null {
  return units.length > 0 ? units.map((unit) => unit.name).join(", ") : null
}

/** Ansprechpersonen (nur, wenn im Portal freigeschaltet). */
export function PersonList({ persons }: { persons: Person[] }) {
  if (persons.length === 0) return null
  return (
    <ul className="list-dash flex flex-col gap-1">
      {persons.map((person, index) => (
        <li key={`${index}-${person.name}`}>
          {person.name}
          {person.role ? <> – {person.role}</> : null}
        </li>
      ))}
    </ul>
  )
}
