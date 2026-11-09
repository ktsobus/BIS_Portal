import type {
  CatalogFamilyPage,
  CatalogLeistungPage,
  CatalogLink,
  CatalogOverview,
  CatalogSearchIndex,
  CatalogServicePage,
  CatalogSnapshot,
  Family,
  Leistung,
  LeistungSummary,
  SearchEntry,
  Service,
  ServiceSummary,
} from "@workspace/api"

import { markdownToPlainText, plainExcerpt, truncateText } from "../text"
import { withFallbackAction } from "./fallback"

/**
 * Abfragen auf den Katalog-Snapshot für die öffentlichen Prozeduren. Reine
 * Funktionen (ohne Status, ohne Konfiguration), damit sie testbar bleiben.
 */

export interface ViewOptions {
  /** Standard-Aktion für Leistungen ohne Bestell-/Anfrageweg. */
  fallbackAction: CatalogLink | null
  /** Personen (Abonnements) ausliefern. */
  showPersons: boolean
}

interface CatalogIndex {
  families: Family[]
  services: Service[]
  leistungen: Leistung[]
  familyById: Map<string, Family>
  serviceById: Map<string, Service>
  leistungById: Map<string, Leistung>
}

const indexCache = new WeakMap<CatalogSnapshot, Map<string, CatalogIndex>>()

function prepareLeistung(leistung: Leistung, options: ViewOptions): Leistung {
  const withAction = withFallbackAction(leistung, options.fallbackAction)
  return options.showPersons || withAction.persons.length === 0
    ? withAction
    : { ...withAction, persons: [] }
}

function prepareService(service: Service, options: ViewOptions): Service {
  return options.showPersons || service.persons.length === 0
    ? service
    : { ...service, persons: [] }
}

function getIndex(snapshot: CatalogSnapshot, options: ViewOptions) {
  const key = `${options.fallbackAction?.url ?? ""}|${options.fallbackAction?.label ?? ""}|${options.showPersons}`
  let bySnapshot = indexCache.get(snapshot)
  if (!bySnapshot) {
    bySnapshot = new Map()
    indexCache.set(snapshot, bySnapshot)
  }
  const cached = bySnapshot.get(key)
  if (cached) return cached

  const services = snapshot.services.map((s) => prepareService(s, options))
  const leistungen = snapshot.leistungen.map((l) => prepareLeistung(l, options))
  const index: CatalogIndex = {
    families: snapshot.families,
    services,
    leistungen,
    familyById: new Map(snapshot.families.map((f) => [f.id, f])),
    serviceById: new Map(services.map((s) => [s.id, s])),
    leistungById: new Map(leistungen.map((l) => [l.id, l])),
  }
  bySnapshot.set(key, index)
  return index
}

/**
 * Sucht über den Slug; fällt auf die LeanIX-ID bzw. die Kurz-ID am Ende des
 * Slugs zurück (Slug = Name + 6 Zeichen der ID), damit Links nach einer
 * Umbenennung weiter funktionieren. Die Seite leitet dann auf den aktuellen
 * Slug um.
 */
export function findBySlug<T extends { id: string; slug: string }>(
  items: T[],
  slug: string
): T | undefined {
  const exact = items.find((item) => item.slug === slug)
  if (exact) return exact
  const byId = items.find((item) => item.id === slug)
  if (byId) return byId
  const shortId = /-([0-9a-f]{6})$/i.exec(slug)?.[1]?.toLowerCase()
  if (!shortId) return undefined
  const matches = items.filter((item) =>
    item.id.toLowerCase().startsWith(shortId)
  )
  return matches.length === 1 ? matches[0] : undefined
}

function existing<T>(ids: string[], map: Map<string, T>): T[] {
  return ids.flatMap((id) => {
    const item = map.get(id)
    return item ? [item] : []
  })
}

function familyOf(index: CatalogIndex, service: Service): Family | undefined {
  return (
    index.familyById.get(service.familyId) ??
    index.families.find((family) => family.serviceIds.includes(service.id))
  )
}

function toServiceSummary(
  index: CatalogIndex,
  service: Service
): ServiceSummary {
  return {
    id: service.id,
    slug: service.slug,
    name: service.name,
    definition: service.definition,
    familyId: service.familyId,
    responsible: service.responsible,
    leistungCount: existing(service.leistungIds, index.leistungById).length,
  }
}

function toLeistungSummary(leistung: Leistung): LeistungSummary {
  return {
    id: leistung.id,
    slug: leistung.slug,
    name: leistung.name,
    subtype: leistung.subtype,
    subtypeLabel: leistung.subtypeLabel,
    summary: leistung.summary,
    actions: leistung.actions,
  }
}

function placementsOf(index: CatalogIndex, leistung: Leistung) {
  return existing(leistung.serviceIds, index.serviceById).flatMap((service) => {
    const family = familyOf(index, service)
    return family ? [{ family, service }] : []
  })
}

type WithoutStatus<T> = Omit<T, "status">

export function buildOverview(
  snapshot: CatalogSnapshot,
  options: ViewOptions
): WithoutStatus<CatalogOverview> {
  const index = getIndex(snapshot, options)
  return {
    families: index.families.map((family) => {
      const services = existing(family.serviceIds, index.serviceById)
      const leistungIds = new Set(
        services.flatMap((service) =>
          service.leistungIds.filter((id) => index.leistungById.has(id))
        )
      )
      return {
        ...family,
        serviceCount: services.length,
        leistungCount: leistungIds.size,
      }
    }),
  }
}

export function buildFamilyPage(
  snapshot: CatalogSnapshot,
  options: ViewOptions,
  slug: string
): WithoutStatus<CatalogFamilyPage> | null {
  const index = getIndex(snapshot, options)
  const family = findBySlug(index.families, slug)
  if (!family) return null
  return {
    family,
    services: existing(family.serviceIds, index.serviceById).map((service) =>
      toServiceSummary(index, service)
    ),
  }
}

export function buildServicePage(
  snapshot: CatalogSnapshot,
  options: ViewOptions,
  slug: string
): WithoutStatus<CatalogServicePage> | null {
  const index = getIndex(snapshot, options)
  const service = findBySlug(index.services, slug)
  if (!service) return null
  const family = familyOf(index, service)
  if (!family) return null
  return {
    family,
    service,
    leistungen: existing(service.leistungIds, index.leistungById),
  }
}

export function buildLeistungPage(
  snapshot: CatalogSnapshot,
  options: ViewOptions,
  slug: string
): WithoutStatus<CatalogLeistungPage> | null {
  const index = getIndex(snapshot, options)
  const leistung = findBySlug(index.leistungen, slug)
  if (!leistung) return null
  const parent = leistung.parentId
    ? index.leistungById.get(leistung.parentId)
    : undefined
  return {
    leistung,
    placements: placementsOf(index, leistung),
    parent: parent ? toLeistungSummary(parent) : null,
    children: existing(leistung.childIds, index.leistungById).map(
      toLeistungSummary
    ),
  }
}

const collator = new Intl.Collator("de-CH", { sensitivity: "base" })

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort(collator.compare)
}

/** Kontext einer Leistung, z. B. «Unterstützungs-Services › Service eLearning». */
function leistungContext(
  index: CatalogIndex,
  leistung: Leistung,
  depth = 0
): string {
  const placements = placementsOf(index, leistung)
  if (placements.length > 0) {
    return placements
      .map(({ family, service }) => `${family.name} › ${service.name}`)
      .join(" · ")
  }
  const parent = leistung.parentId
    ? index.leistungById.get(leistung.parentId)
    : undefined
  // Tiefe begrenzen, falls die Hierarchie in LeanIX einen Zyklus enthält.
  if (parent && depth < 5) {
    const parentContext = leistungContext(index, parent, depth + 1)
    return parentContext ? `${parentContext} › ${parent.name}` : parent.name
  }
  return ""
}

const KEYWORD_TEXT_LENGTH = 400

export function buildSearchIndex(
  snapshot: CatalogSnapshot,
  options: ViewOptions
): WithoutStatus<CatalogSearchIndex> {
  const index = getIndex(snapshot, options)

  const leistungEntries: SearchEntry[] = index.leistungen.map((leistung) => ({
    kind: "leistung",
    id: leistung.id,
    slug: leistung.slug,
    name: leistung.name,
    summary:
      plainExcerpt(leistung.summary, 240) ?? plainExcerpt(leistung.description),
    subtypeLabel: leistung.subtypeLabel,
    context: leistungContext(index, leistung),
    keywords: [
      ...leistung.applications.map((app) => app.name),
      ...leistung.audiences.map((audience) => audience.name),
      ...leistung.responsible.map((unit) => unit.name),
      truncateText(
        markdownToPlainText(leistung.description),
        KEYWORD_TEXT_LENGTH
      ),
    ]
      .filter(Boolean)
      .join(" "),
    audiences: leistung.audiences.map((audience) => audience.name),
  }))

  const serviceEntries: SearchEntry[] = index.services.flatMap((service) => {
    const family = familyOf(index, service)
    if (!family) return []
    const leistungen = existing(service.leistungIds, index.leistungById)
    return [
      {
        kind: "service",
        id: service.id,
        slug: service.slug,
        name: service.name,
        summary: plainExcerpt(service.definition),
        subtypeLabel: null,
        context: family.name,
        keywords: [
          ...service.responsible.map((unit) => unit.name),
          ...leistungen.map((leistung) => leistung.name),
          truncateText(
            markdownToPlainText(service.definition),
            KEYWORD_TEXT_LENGTH
          ),
        ]
          .filter(Boolean)
          .join(" "),
        audiences: uniqueSorted(
          leistungen.flatMap((leistung) =>
            leistung.audiences.map((audience) => audience.name)
          )
        ),
      },
    ]
  })

  return {
    entries: [...leistungEntries, ...serviceEntries],
    facets: {
      subtypes: uniqueSorted(
        index.leistungen.flatMap((leistung) =>
          leistung.subtypeLabel ? [leistung.subtypeLabel] : []
        )
      ),
      audiences: uniqueSorted(
        index.leistungen.flatMap((leistung) =>
          leistung.audiences.map((audience) => audience.name)
        )
      ),
    },
  }
}
