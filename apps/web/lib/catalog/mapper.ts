import {
  CATALOG_SCHEMA_VERSION,
  catalogSnapshotSchema,
  type CatalogLink,
  type CatalogSnapshot,
  type Family,
  type Leistung,
  type LinkKind,
  type NamedRef,
  type OrgUnit,
  type Person,
  type QualityIssue,
  type Service,
} from "@workspace/api"

import { leanixModel, resourceTypeRules } from "@/lib/leanix/model"
import type {
  RawCatalogData,
  RawDocument,
  RawFactSheet,
  RawFactSheetRef,
  RawLeistung,
} from "@/lib/leanix/types"

import {
  cleanDescription,
  createSlugger,
  extractSummary,
  findLeanixLinks,
} from "./text"

/**
 * Mapper LeanIX-Rohdaten → Katalog-Snapshot (reine Funktion, getestet mit
 * den Fixtures aus der Discovery).
 *
 * Publikationsregel (Konzept, Kapitel 2.2):
 * - Familien = aktive Kategorien Ebene 2 direkt unter der Wurzel
 * - Services = aktive Kategorien Ebene 3 unter einer Familie
 * - Leistungen = aktiv, Kanal enthält «Business IT-Servicekatalog», einem
 *   Service zugeordnet (eigene Kategorie oder geerbt von der Parent-Leistung)
 */

export interface BuildSnapshotOptions {
  kind: "leanix" | "demo"
  /** Basis-URL der Instanz (für Links ins Fact Sheet). */
  baseUrl: string
  workspace: string | null
  /** LeanIX-ID der Ebene-1-Kategorie «Business IT-Servicekatalog». */
  rootId: string
  /** Personen (Abonnements) übernehmen. */
  showPersons: boolean
  /** Zeitpunkt des Abrufs (ISO). */
  generatedAt: string
}

const CHANNEL_LABEL = "Business IT-Servicekatalog"
const ACTIVE = "ACTIVE"
const ALLOWED_PROTOCOLS = new Set(["https:", "http:", "mailto:", "tel:"])
const KIND_ORDER: Record<LinkKind, number> = {
  order: 0,
  request: 1,
  contact: 2,
  info: 3,
}
const SEVERITY_ORDER: Record<QualityIssue["severity"], number> = {
  error: 0,
  warning: 1,
  info: 2,
}

const collator = new Intl.Collator("de-CH", { sensitivity: "base" })
const byName = <T extends { name: string }>(a: T, b: T) =>
  collator.compare(a.name, b.name)

// ---------------------------------------------------------------------------
// Zugriff auf Rohdaten (tolerant gegenüber fehlenden Feldern)

/** Verknüpfte Fact Sheets einer Relation (z. B. `relToParent`). */
export function relationRefs(
  node: RawFactSheet,
  relationName: string
): RawFactSheetRef[] {
  const connection = node[relationName] as
    | {
        edges?: Array<{
          node?: { factSheet?: RawFactSheetRef | null } | null
        } | null> | null
      }
    | null
    | undefined
  const refs: RawFactSheetRef[] = []
  for (const edge of connection?.edges ?? []) {
    const ref = edge?.node?.factSheet
    if (ref && typeof ref.id === "string") refs.push(ref)
  }
  return refs
}

function documentsOf(node: RawFactSheet): RawDocument[] {
  return (node.documents?.edges ?? [])
    .map((edge) => edge?.node)
    .filter((doc): doc is RawDocument => !!doc && typeof doc.id === "string")
}

function channelsOf(node: RawLeistung): string[] {
  const value = node[leanixModel.leistung.channelField]
  if (Array.isArray(value))
    return value.filter((v): v is string => typeof v === "string")
  return typeof value === "string" ? [value] : []
}

const isActive = (node: RawFactSheet) => node.status === ACTIVE

export function leanixFactSheetUrl(
  baseUrl: string,
  workspace: string | null,
  type: string,
  id: string
): string {
  const base = baseUrl.replace(/\/+$/, "")
  return workspace
    ? `${base}/${encodeURIComponent(workspace)}/factsheet/${type}/${id}`
    : `${base}/factsheet/${type}/${id}`
}

// ---------------------------------------------------------------------------
// Ressourcen → Aktionen und Links

/** Prüft eine Ressourcen-URL (nur https, http, mailto, tel). */
export function normalizeResourceUrl(
  value: string | null | undefined
): string | null {
  const text = value?.trim()
  if (!text) return null
  let url: URL
  try {
    url = new URL(text)
  } catch {
    return null
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) return null
  if ((url.protocol === "https:" || url.protocol === "http:") && !url.hostname)
    return null
  return url.href
}

interface ResourceResult {
  actions: CatalogLink[]
  links: CatalogLink[]
  problems: Array<{
    code: "RESOURCE_INVALID_URL" | "RESOURCE_TYPE_NOT_SHOWN"
    message: string
  }>
}

export function mapResources(documents: RawDocument[]): ResourceResult {
  const entries: Array<{ link: CatalogLink; order: number }> = []
  const problems: ResourceResult["problems"] = []

  for (const doc of documents) {
    const type = doc.documentType?.trim() || null
    const name = doc.name?.trim() || null
    const rule = type ? resourceTypeRules[type] : undefined
    if (!type || !rule) {
      problems.push({
        code: "RESOURCE_TYPE_NOT_SHOWN",
        message: `Ressource «${name ?? doc.id}» hat ${
          type ? `den Ressourcentyp «${type}»` : "keinen Ressourcentyp"
        } und wird im Portal nicht angezeigt.`,
      })
      continue
    }
    const url = normalizeResourceUrl(doc.url)
    if (!url) {
      problems.push({
        code: "RESOURCE_INVALID_URL",
        message: doc.url?.trim()
          ? `Ressource «${name ?? rule.fallbackLabel}» hat eine ungültige oder nicht erlaubte URL (erlaubt: https, http, mailto, tel) und wird nicht angezeigt.`
          : `Ressource «${name ?? rule.fallbackLabel}» hat keine URL (z. B. hochgeladene Datei) und wird nicht angezeigt.`,
      })
      continue
    }
    entries.push({
      order: rule.order,
      link: {
        id: doc.id,
        label: name ?? rule.fallbackLabel,
        url,
        description: doc.description?.trim() || null,
        resourceType: type,
        kind: rule.kind,
      },
    })
  }

  entries.sort(
    (a, b) =>
      KIND_ORDER[a.link.kind] - KIND_ORDER[b.link.kind] ||
      a.order - b.order ||
      collator.compare(a.link.label, b.link.label)
  )
  const links = entries.map((entry) => entry.link)
  return {
    actions: links.filter((link) => link.kind !== "info"),
    links: links.filter((link) => link.kind === "info"),
    problems,
  }
}

// ---------------------------------------------------------------------------
// Personen und Referenzen

function personsOf(node: RawFactSheet): Person[] {
  const persons = new Map<string, Person>()
  for (const edge of node.subscriptions?.edges ?? []) {
    const sub = edge?.node
    const name = sub?.user?.displayName?.trim()
    if (!sub || !name) continue
    const roles = (sub.roles ?? [])
      .map((role) => role?.name?.trim())
      .filter((role): role is string => !!role)
    const isResponsible =
      roles.includes(leanixModel.responsibleRole) || sub.type === "RESPONSIBLE"
    if (!isResponsible) continue
    const role = roles.includes(leanixModel.responsibleRole)
      ? leanixModel.responsibleRole
      : (roles[0] ?? null)
    if (!persons.has(name)) persons.set(name, { name, role })
  }
  return [...persons.values()].sort(byName)
}

function orgUnits(refs: RawFactSheetRef[]): OrgUnit[] {
  const units = new Map<string, OrgUnit>()
  for (const ref of refs) {
    units.set(ref.id, {
      id: ref.id,
      name: ref.name,
      path: ref.displayName?.trim() || ref.name,
    })
  }
  return [...units.values()].sort((a, b) => collator.compare(a.path, b.path))
}

function namedRefs(refs: RawFactSheetRef[]): NamedRef[] {
  const items = new Map<string, NamedRef>()
  for (const ref of refs) items.set(ref.id, { id: ref.id, name: ref.name })
  return [...items.values()].sort(byName)
}

// ---------------------------------------------------------------------------

export function buildSnapshot(
  raw: RawCatalogData,
  options: BuildSnapshotOptions
): CatalogSnapshot {
  const { leistung: leistungModel, kategorie: kategorieModel } = leanixModel
  const issues: QualityIssue[] = []
  const urlFor = (type: string, id: string) =>
    leanixFactSheetUrl(options.baseUrl, options.workspace, type, id)
  const issue = (
    severity: QualityIssue["severity"],
    code: string,
    message: string,
    node: RawFactSheet,
    type: string
  ) =>
    issues.push({
      severity,
      code,
      message,
      factSheetId: node.id,
      factSheetName: node.displayName?.trim() || node.name,
      factSheetType: type,
      leanixUrl: urlFor(type, node.id),
    })
  const reportLeanixLinks = (
    text: string | null,
    node: RawFactSheet,
    type: string
  ) => {
    const found = findLeanixLinks(text)
    if (found.length > 0) {
      // Nur Hosts nennen: solche Links enthalten teils Sitzungsparameter.
      const hosts = [
        ...new Set(
          found.map(
            (link) => link.replace(/^https?:\/\//i, "").split(/[/?#:]/)[0]
          )
        ),
      ]
      issue(
        "warning",
        "DESCRIPTION_LINKS_TO_LEANIX",
        `Beschreibung enthält ${found.length === 1 ? "einen Link" : `${found.length} Links`} auf LeanIX (${hosts.join(", ")}). Solche Links funktionieren für Portalnutzende ohne LeanIX-Konto nicht.`,
        node,
        type
      )
    }
  }
  const reportResourceProblems = (
    problems: ResourceResult["problems"],
    node: RawFactSheet,
    type: string
  ) => {
    for (const problem of problems) {
      issue(
        problem.code === "RESOURCE_INVALID_URL" ? "error" : "info",
        problem.code,
        problem.message,
        node,
        type
      )
    }
  }

  // --- Kategorien: Familien (Ebene 2) und Services (Ebene 3) --------------
  const kategorien = raw.kategorien.filter(
    (k) =>
      typeof k?.id === "string" && (!k.type || k.type === kategorieModel.type)
  )
  const familyNodes = kategorien
    .filter(
      (k) =>
        isActive(k) &&
        k.level === kategorieModel.familyLevel &&
        relationRefs(k, kategorieModel.relations.parent).some(
          (p) => p.id === options.rootId
        )
    )
    .sort(byName)
  const familyIds = new Set(familyNodes.map((f) => f.id))

  const familyOfService = new Map<string, string>()
  const serviceNodes = kategorien
    .filter((k) => {
      if (!isActive(k) || k.level !== kategorieModel.serviceLevel) return false
      const parent = relationRefs(k, kategorieModel.relations.parent).find(
        (p) => familyIds.has(p.id)
      )
      if (parent) familyOfService.set(k.id, parent.id)
      return !!parent
    })
    .sort(
      (a, b) =>
        familyNodes.findIndex((f) => f.id === familyOfService.get(a.id)) -
          familyNodes.findIndex((f) => f.id === familyOfService.get(b.id)) ||
        byName(a, b)
    )
  const serviceIds = new Set(serviceNodes.map((s) => s.id))
  const serviceOrder = new Map(serviceNodes.map((s, i) => [s.id, i]))
  const kategorieById = new Map(kategorien.map((k) => [k.id, k]))

  // --- Leistungen: Kanal, Status, Zuordnung zu Services --------------------
  const leistungenRaw = raw.leistungen.filter(
    (l) =>
      typeof l?.id === "string" && (!l.type || l.type === leistungModel.type)
  )
  const leistungById = new Map(leistungenRaw.map((l) => [l.id, l]))
  const inChannel = leistungenRaw
    .filter(
      (l) => isActive(l) && channelsOf(l).includes(leistungModel.channelOption)
    )
    .sort(byName)

  /** Eigene Services einer Leistung (Kategorie-Relationen ∩ Services). */
  const ownServices = (node: RawLeistung) =>
    relationRefs(node, leistungModel.relations.kategorie)
      .map((ref) => ref.id)
      .filter((id) => serviceIds.has(id))

  /** Eigene Services oder – falls keine – die der Parent-Leistung (rekursiv). */
  const resolveServices = (node: RawLeistung): string[] => {
    const visited = new Set<string>()
    let current: RawLeistung | undefined = node
    while (current && !visited.has(current.id)) {
      visited.add(current.id)
      const own = ownServices(current)
      if (own.length > 0) return own
      const parentRef: RawFactSheetRef | undefined = relationRefs(
        current,
        leistungModel.relations.parent
      )[0]
      const parent: RawLeistung | undefined = parentRef
        ? leistungById.get(parentRef.id)
        : undefined
      current = parent && isActive(parent) ? parent : undefined
    }
    return []
  }

  const slugLeistung = createSlugger()
  const shown: Array<{ node: RawLeistung; leistung: Leistung }> = []
  let skipped = 0

  for (const node of inChannel) {
    // Verknüpfungen ausserhalb des BITS-Baums (oder nicht Ebene 3) melden.
    for (const ref of relationRefs(node, leistungModel.relations.kategorie)) {
      if (serviceIds.has(ref.id)) continue
      const target = kategorieById.get(ref.id)
      const where =
        target && target.level != null ? ` (Ebene ${target.level})` : ""
      issue(
        "info",
        "LEISTUNG_LINKED_OUTSIDE_CATALOG",
        `Leistung ist mit der Leistungskategorie «${
          ref.displayName?.trim() || ref.name
        }»${where} verknüpft, die kein Service (Ebene ${
          kategorieModel.serviceLevel
        }) im ${CHANNEL_LABEL} ist. Diese Zuordnung wird nicht angezeigt.`,
        node,
        leistungModel.type
      )
    }

    const services = [...new Set(resolveServices(node))].sort(
      (a, b) => (serviceOrder.get(a) ?? 0) - (serviceOrder.get(b) ?? 0)
    )
    if (services.length === 0) {
      skipped++
      issue(
        "warning",
        "LEISTUNG_WITHOUT_SERVICE",
        `Leistung ist im Kanal «${CHANNEL_LABEL}», aber keinem Service im Katalog zugeordnet und wird nicht angezeigt.`,
        node,
        leistungModel.type
      )
      continue
    }

    const description = cleanDescription(node.description)
    const resources = mapResources(documentsOf(node))
    const subtype = node.category
      ? (
          leistungModel.subtypes as Record<
            string,
            { key: Leistung["subtype"]; label: string } | undefined
          >
        )[node.category]
      : undefined

    const leistung: Leistung = {
      id: node.id,
      slug: slugLeistung(node.name, node.id),
      name: node.name,
      subtype: subtype?.key ?? null,
      subtypeLabel: subtype?.label ?? null,
      summary: extractSummary(description),
      description,
      serviceIds: services,
      responsible: orgUnits(
        relationRefs(node, leistungModel.relations.organisation)
      ),
      persons: options.showPersons ? personsOf(node) : [],
      audiences: namedRefs(
        relationRefs(node, leistungModel.relations.bezueger)
      ),
      applications: namedRefs(
        relationRefs(node, leistungModel.relations.anwendung)
      ),
      actions: resources.actions,
      links: resources.links,
      parentId: null,
      childIds: [],
      updatedAt: node.updatedAt ?? null,
      leanixUrl: urlFor(leistungModel.type, node.id),
    }
    shown.push({ node, leistung })

    if (!description) {
      issue(
        "warning",
        "LEISTUNG_WITHOUT_DESCRIPTION",
        "Leistung hat keine Beschreibung.",
        node,
        leistungModel.type
      )
    }
    reportLeanixLinks(description, node, leistungModel.type)
    if (leistung.responsible.length === 0) {
      issue(
        "warning",
        "LEISTUNG_WITHOUT_RESPONSIBLE",
        "Leistung hat keine verantwortliche Organisationseinheit.",
        node,
        leistungModel.type
      )
    }
    reportResourceProblems(resources.problems, node, leistungModel.type)
    if (leistung.actions.length === 0) {
      issue(
        "info",
        "LEISTUNG_WITHOUT_ACTION",
        "Leistung hat keine Ressource für einen nächsten Schritt (z. B. Bestellen, Support-Ticket).",
        node,
        leistungModel.type
      )
    }
  }

  // Parent/Child nur zwischen angezeigten Leistungen.
  const shownById = new Map(shown.map((s) => [s.leistung.id, s]))
  for (const { node, leistung } of shown) {
    const parentRef = relationRefs(node, leistungModel.relations.parent)[0]
    if (
      parentRef &&
      parentRef.id !== leistung.id &&
      shownById.has(parentRef.id)
    )
      leistung.parentId = parentRef.id
  }
  for (const { node, leistung } of shown) {
    const childIds = new Set(
      relationRefs(node, leistungModel.relations.child)
        .map((ref) => ref.id)
        .filter((id) => id !== leistung.id && shownById.has(id))
    )
    for (const other of shown) {
      if (other.leistung.parentId === leistung.id)
        childIds.add(other.leistung.id)
    }
    leistung.childIds = [...childIds].sort((a, b) =>
      byName(shownById.get(a)!.leistung, shownById.get(b)!.leistung)
    )
  }
  const leistungen = shown.map((s) => s.leistung)

  // --- Services ------------------------------------------------------------
  const slugService = createSlugger()
  const services: Service[] = serviceNodes.map((node) => {
    const definition = cleanDescription(node.description)
    const resources = mapResources(documentsOf(node))
    const leistungIds = leistungen
      .filter((l) => l.serviceIds.includes(node.id))
      .sort(byName)
      .map((l) => l.id)

    if (!definition) {
      issue(
        "warning",
        "SERVICE_WITHOUT_DEFINITION",
        "Service hat keine Beschreibung (Service-Definition).",
        node,
        kategorieModel.type
      )
    }
    reportLeanixLinks(definition, node, kategorieModel.type)
    reportResourceProblems(resources.problems, node, kategorieModel.type)
    if (leistungIds.length === 0) {
      issue(
        "info",
        "SERVICE_WITHOUT_LEISTUNG",
        `Service hat keine Leistung im Kanal «${CHANNEL_LABEL}».`,
        node,
        kategorieModel.type
      )
    }

    return {
      id: node.id,
      slug: slugService(node.name, node.id),
      name: node.name,
      definition,
      familyId: familyOfService.get(node.id)!,
      responsible: orgUnits(
        relationRefs(node, kategorieModel.relations.organisation)
      ),
      persons: options.showPersons ? personsOf(node) : [],
      actions: resources.actions,
      links: resources.links,
      leistungIds,
      updatedAt: node.updatedAt ?? null,
      leanixUrl: urlFor(kategorieModel.type, node.id),
    }
  })

  // --- Familien ------------------------------------------------------------
  const slugFamily = createSlugger()
  const families: Family[] = familyNodes.map((node) => {
    const description = cleanDescription(node.description)
    reportLeanixLinks(description, node, kategorieModel.type)
    return {
      id: node.id,
      slug: slugFamily(node.name, node.id),
      name: node.name,
      description,
      serviceIds: services
        .filter((s) => s.familyId === node.id)
        .map((s) => s.id),
      leanixUrl: urlFor(kategorieModel.type, node.id),
    }
  })

  issues.sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      collator.compare(a.factSheetName, b.factSheetName) ||
      a.code.localeCompare(b.code) ||
      a.message.localeCompare(b.message)
  )

  return catalogSnapshotSchema.parse({
    schemaVersion: CATALOG_SCHEMA_VERSION,
    generatedAt: options.generatedAt,
    source: {
      kind: options.kind,
      baseUrl: options.baseUrl.replace(/\/+$/, ""),
      workspace: options.workspace,
    },
    families,
    services,
    leistungen,
    issues,
    stats: {
      families: families.length,
      services: services.length,
      leistungen: leistungen.length,
      leistungenInChannel: inChannel.length,
      leistungenSkipped: skipped,
      issues: issues.length,
    },
  } satisfies CatalogSnapshot)
}
