import type { ReactNode } from "react"
import type { CatalogLink, OrgUnit, Person } from "@workspace/api"

import { ExternalLink } from "@/components/site/external-link"
import { cn } from "@/lib/utils"

import { safeHref } from "../links"

/** Abschnitt der Seitenspalte: Beschriftung und Inhalt. */
export function DetailSection({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn("border-t border-line pt-4", className)}>
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      <div className="mt-1.5 text-sm text-text">{children}</div>
    </section>
  )
}

/**
 * Verantwortliche Stellen: Kurzname, darunter der Pfad in der Organisation
 * (z. B. «Finanzdepartement (FD) / AIO / Business IT-Services»).
 */
export function OrgUnitList({ units }: { units: OrgUnit[] }) {
  return (
    <ul className="space-y-2">
      {units.map((unit) => {
        const parents = unit.path.split(" / ").slice(0, -1).join(" / ")
        return (
          <li key={unit.id}>
            <span className="font-bold text-ink">{unit.name}</span>
            {parents ? (
              <span className="block text-xs text-muted">{parents}</span>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

export function PersonList({ persons }: { persons: Person[] }) {
  return (
    <ul className="space-y-1">
      {persons.map((person) => (
        <li key={`${person.name}-${person.role ?? ""}`}>
          {person.name}
          {person.role ? (
            <span className="text-muted">, {person.role}</span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

/** Weitere Informationen: Links auf Webseiten, Dokumentation, Wiki. */
export function InfoLinkList({ links }: { links: CatalogLink[] }) {
  const usable = links.flatMap((link) => {
    const href = safeHref(link.url)
    return href ? [{ link, href }] : []
  })
  if (usable.length === 0) return null
  return (
    <ul className="space-y-2">
      {usable.map(({ link, href }) => (
        <li key={link.id}>
          <ExternalLink href={href} className="link break-words">
            {link.label}
          </ExternalLink>
          {link.description ? (
            <span className="block text-xs text-muted">{link.description}</span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
