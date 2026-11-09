import "server-only"

import type { GraphqlResult } from "./client"
import { leanixModel } from "./model"
import type { RawCatalogData, RawKategorie, RawLeistung } from "./types"

/**
 * GraphQL-Abfragen für den Katalog-Sync: alle Leistungen und alle
 * Leistungskategorien, jeweils paginiert. Der Kanal-Filter wird im Mapper
 * angewendet (robuster als ein Facettenfilter, die Datenmenge ist klein).
 */

export const PAGE_SIZE = 100
/** Schutz vor Endlosschleifen bei fehlerhaftem Paging (100 × 100 Einträge). */
const MAX_PAGES = 100

export interface QueryOptions {
  /** Abonnements (Personen) mitladen. Nur wenn `CATALOG_SHOW_PERSONS=true`. */
  showPersons: boolean
}

/** Schnittstelle des Clients, die die Abfragen brauchen (für Tests mockbar). */
export interface GraphqlExecutor {
  graphql<TData>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<GraphqlResult<TData>>
}

const FACT_SHEET_REF = "id name displayName type"

const relation = (name: string) =>
  `${name} { edges { node { factSheet { ${FACT_SHEET_REF} } } } }`

const DOCUMENTS =
  "documents { edges { node { id name url description documentType origin } } }"

const SUBSCRIPTIONS =
  "subscriptions { edges { node { type roles { name } user { displayName } } } }"

function pagedQuery(operation: string, type: string, selection: string) {
  return `query ${operation}($after: String) {
  allFactSheets(
    first: ${PAGE_SIZE}
    after: $after
    filter: { facetFilters: [{ facetKey: "FactSheetTypes", operator: OR, keys: ["${type}"] }] }
  ) {
    totalCount
    pageInfo { hasNextPage endCursor }
    edges { node { ... on ${type} { ${selection} } } }
  }
}`
}

/** Alle Leistungen (Typ `behoerdenLeistungen`) mit Relationen und Ressourcen. */
export function buildLeistungenQuery(options: QueryOptions): string {
  const { leistung } = leanixModel
  const fields = [
    "id name displayName type description status level updatedAt",
    leistung.subtypeField,
    leistung.channelField,
    relation(leistung.relations.kategorie),
    relation(leistung.relations.organisation),
    relation(leistung.relations.bezueger),
    relation(leistung.relations.anwendung),
    relation(leistung.relations.parent),
    relation(leistung.relations.child),
    DOCUMENTS,
    ...(options.showPersons ? [SUBSCRIPTIONS] : []),
  ]
  return pagedQuery("BitsLeistungen", leistung.type, fields.join("\n      "))
}

/** Alle Leistungskategorien (Ebene 1–3) mit Parent, Stellen und Ressourcen. */
export function buildKategorienQuery(options: QueryOptions): string {
  const { kategorie } = leanixModel
  const fields = [
    "id name displayName type description level status updatedAt",
    relation(kategorie.relations.parent),
    relation(kategorie.relations.organisation),
    DOCUMENTS,
    ...(options.showPersons ? [SUBSCRIPTIONS] : []),
  ]
  return pagedQuery(
    "BitsLeistungskategorien",
    kategorie.type,
    fields.join("\n      ")
  )
}

interface AllFactSheetsPage<TNode> {
  allFactSheets?: {
    totalCount?: number | null
    pageInfo?: { hasNextPage?: boolean; endCursor?: string | null } | null
    edges?: Array<{ node?: TNode | null } | null> | null
  } | null
}

export interface FetchResult<TNode> {
  nodes: TNode[]
  totalCount: number
  /** Teilfehler und Auffälligkeiten (für das Sync-Protokoll). */
  warnings: string[]
}

/** Lädt alle Seiten einer `allFactSheets`-Abfrage. */
export async function fetchAllPages<TNode extends { id?: unknown }>(
  client: GraphqlExecutor,
  query: string,
  label: string
): Promise<FetchResult<TNode>> {
  const nodes: TNode[] = []
  const warnings: string[] = []
  let after: string | null = null
  let totalCount = 0

  for (let page = 0; ; page++) {
    if (page >= MAX_PAGES) {
      throw new Error(
        `${label}: mehr als ${MAX_PAGES} Seiten, Abfrage abgebrochen`
      )
    }
    const result: GraphqlResult<AllFactSheetsPage<TNode>> =
      await client.graphql<AllFactSheetsPage<TNode>>(query, { after })
    if (result.errors.length > 0) {
      warnings.push(
        `${label}: ${result.errors
          .slice(0, 3)
          .map((e) => e.message)
          .join(" | ")}`
      )
    }
    const connection = result.data.allFactSheets
    if (!connection) {
      throw new Error(`${label}: Antwort enthält kein allFactSheets`)
    }
    totalCount = connection.totalCount ?? totalCount
    for (const edge of connection.edges ?? []) {
      // Leere Knoten entstehen, wenn der Typ nicht passt (Fragment).
      if (edge?.node && typeof edge.node.id === "string") nodes.push(edge.node)
    }
    const next = connection.pageInfo
    if (!next?.hasNextPage) break
    if (!next.endCursor || next.endCursor === after) {
      throw new Error(`${label}: Paging liefert keinen neuen Cursor`)
    }
    after = next.endCursor
  }

  if (totalCount > 0 && nodes.length !== totalCount) {
    warnings.push(
      `${label}: ${nodes.length} von ${totalCount} Einträgen geladen`
    )
  }
  return { nodes, totalCount, warnings }
}

/** Lädt alle Rohdaten für einen Katalog-Snapshot aus LeanIX. */
export async function fetchCatalogRaw(
  client: GraphqlExecutor,
  options: QueryOptions
): Promise<RawCatalogData & { warnings: string[] }> {
  const leistungen = await fetchAllPages<RawLeistung>(
    client,
    buildLeistungenQuery(options),
    "Leistungen"
  )
  const kategorien = await fetchAllPages<RawKategorie>(
    client,
    buildKategorienQuery(options),
    "Leistungskategorien"
  )
  return {
    leistungen: leistungen.nodes,
    kategorien: kategorien.nodes,
    warnings: [...leistungen.warnings, ...kategorien.warnings],
  }
}
