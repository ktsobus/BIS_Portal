import type { OrgUnit, Person } from "@workspace/api"

/** Verantwortliche Stellen mit vollem Pfad aus LeanIX. */
export function OrgUnitList({ units }: { units: OrgUnit[] }) {
  if (units.length === 0) return null
  return (
    <ul className="flex flex-col gap-3">
      {units.map((unit) => (
        <li key={unit.id} className="flex flex-col">
          <span className="font-bold">{unit.name}</span>
          {unit.path && unit.path !== unit.name ? (
            <span className="text-sm text-muted-foreground">{unit.path}</span>
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
    <ul className="flex flex-col gap-1">
      {persons.map((person, index) => (
        <li key={`${index}-${person.name}`}>
          {person.name}
          {person.role ? (
            <span className="text-muted-foreground"> – {person.role}</span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
