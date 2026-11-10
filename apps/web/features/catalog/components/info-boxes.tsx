import type { CatalogLink, OrgUnit, Person } from "@workspace/api"

import { safeHref } from "../links"
import { ActionLinks } from "./action-links"
import { OrgUnitList, PersonList } from "./org-units"

/**
 * «Service nutzen» (so.ch): blassgrüne Box mit 16 px Innenabstand, H2 und
 * untereinander die roten Aktionsschaltflächen – die Hauptaufgabe der Seite.
 * Ohne Aktion steht ein Hinweis, an wen man sich wenden kann.
 */
export function ServiceUseBox({
  id = "service-nutzen",
  actions,
  fallback,
}: {
  id?: string
  actions: CatalogLink[]
  /** Text, wenn keine Aktion hinterlegt ist. */
  fallback: React.ReactNode
}) {
  const headingId = `${id}-titel`
  // Nur Aktionen mit erlaubtem Ziel zählen, sonst bliebe die Box leer.
  const visible = actions.filter((action) => safeHref(action.url))
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="flex scroll-mt-6 flex-col gap-4 rounded-tile bg-tile-service p-4 sm:p-6"
    >
      <h2 id={headingId} className="type-headline-md">
        Service nutzen
      </h2>
      {visible.length > 0 ? (
        <ActionLinks actions={visible} layout="stacked" />
      ) : (
        fallback
      )}
    </section>
  )
}

/** Gibt es eine Zuständigkeit anzuzeigen (Stelle oder Ansprechperson)? */
export function hasResponsible(units: OrgUnit[], persons: Person[] = []) {
  return units.length > 0 || persons.length > 0
}

/**
 * Zuständigkeit: blassgrüne Box (24 px) mit der verantwortlichen Stelle in
 * 24 px Black, darunter der Pfad aus LeanIX und ggf. Ansprechpersonen. Ohne
 * Angabe entfällt die Box (die Lücke meldet der Datenqualitätsbericht).
 */
export function ResponsibleBox({
  id = "verantwortlich",
  units,
  persons = [],
  note,
}: {
  id?: string
  units: OrgUnit[]
  persons?: Person[]
  /** Zusatz, z. B. «Verantwortliche Stelle des Services». */
  note?: React.ReactNode
}) {
  if (!hasResponsible(units, persons)) return null
  const headingId = `${id}-titel`
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="flex scroll-mt-6 flex-col gap-4 rounded-tile bg-tile-service p-6"
    >
      <h2 id={headingId} className="type-body-sm font-normal">
        Zuständigkeit
      </h2>
      <OrgUnitList units={units} />
      {note ? <p className="type-body-sm">{note}</p> : null}
      <PersonList persons={persons} />
    </section>
  )
}

/**
 * Kontakt- und Hinweisbox in kühlem Grau (so.ch «Kontaktbox»), 24 px
 * Innenabstand, unten 48 px.
 */
export function ContactBox({
  id,
  title,
  headingLevel = 2,
  children,
}: {
  id: string
  title: React.ReactNode
  /** 3, wenn die Box in einem Abschnitt mit eigener H2 steht. */
  headingLevel?: 2 | 3
  children: React.ReactNode
}) {
  const headingId = `${id}-titel`
  const Heading = `h${headingLevel}` as const
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="flex scroll-mt-6 flex-col gap-4 rounded-tile bg-tile-contact p-6 pb-12"
    >
      <Heading id={headingId} className="type-headline-md">
        {title}
      </Heading>
      {children}
    </section>
  )
}
