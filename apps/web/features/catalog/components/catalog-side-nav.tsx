import type { Family, FamilySummary, ServiceSummary } from "@workspace/api"

import { SideNav, type SideNavItem } from "@/components/site/side-nav"

/** Seitennavigation der Familienseite: alle Service-Familien. */
export function FamiliesSideNav({
  families,
  currentId,
}: {
  families: FamilySummary[]
  currentId: string
}) {
  return (
    <SideNav
      label="Service-Familien"
      root={{ label: "Service-Familien", href: "/" }}
      items={families.map((family) => ({
        key: family.id,
        label: family.name,
        href: `/kategorie/${family.slug}`,
        current: family.id === currentId,
      }))}
    />
  )
}

/**
 * Seitennavigation für Service- und Leistungsseiten: Wurzel ist die
 * Service-Familie, darunter ihre Services; der aktuelle Service ist mit
 * seinen Leistungen aufgeklappt.
 */
export function ServiceTreeSideNav({
  family,
  services,
  currentServiceId,
  leistungen,
  currentLeistungId,
}: {
  family: Pick<Family, "name" | "slug">
  services: Pick<ServiceSummary, "id" | "name" | "slug">[]
  currentServiceId: string
  leistungen: { id: string; name: string; slug: string }[]
  currentLeistungId?: string
}) {
  const items: SideNavItem[] = services.map((service) => {
    const isCurrent = service.id === currentServiceId
    return {
      key: service.id,
      label: service.name,
      href: `/service/${service.slug}`,
      current: isCurrent && !currentLeistungId,
      children: isCurrent
        ? leistungen.map((leistung) => ({
            key: leistung.id,
            label: leistung.name,
            href: `/leistung/${leistung.slug}`,
            current: leistung.id === currentLeistungId,
          }))
        : undefined,
    }
  })

  return (
    <SideNav
      label={`Services der Familie ${family.name}`}
      root={{ label: family.name, href: `/kategorie/${family.slug}` }}
      items={items}
    />
  )
}
