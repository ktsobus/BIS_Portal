import "server-only"

import {
  LeanixError,
  type GraphqlErrorInfo,
  type GraphqlResult,
} from "./client"
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
  /** Tolerierte Teilfehler und Auffälligkeiten (für das Sync-Protokoll). */
  warnings: string[]
}

/**
 * Felder eines Fact Sheets, deren Teilfehler (GraphQL `errors` neben `data`)
 * nur als Hinweis gelten: Sie betreffen Zusatzangaben (Personen nur mit
 * `CATALOG_SHOW_PERSONS`, Berechtigungen). Ein Teilfehler auf jedem anderen
 * Feld (z. B. `documents`, `kanal`, `status`, Relationen) würde Aktionen
 * oder ganze Leistungen still verschwinden lassen und bricht den Sync ab;
 * der bisherige Snapshot bleibt dann aktiv.
 */
export const TOLERATED_ERROR_FIELDS: ReadonlySet<string> = new Set([
  "subscriptions",
  "permittedReadACL",
  "permittedWriteACL",
])

/**
 * Feld des Fact Sheets, auf das sich ein Teilfehler bezieht, z. B.
 * `documents` für `["allFactSheets", "edges", 0, "node", "documents"]`.
 * `null`, wenn der Fehler keinen Pfad hat oder das Fact Sheet selbst bzw.
 * die Abfrage als Ganzes betrifft.
 */
export function errorField(path: GraphqlErrorInfo["path"]): string | null {
  if (!path || path[0] !== "allFactSheets") return null
  if (path[1] !== "edges" || path[3] !== "node") return null
  const field = path[4]
  return typeof field === "string" ? field : null
}

function describeGraphqlError(error: GraphqlErrorInfo) {
  const path = error.path?.join("/")
  return path && !error.message.includes(path)
    ? `${error.message} (${path})`
    : error.message
}

/**
 * Lädt alle Seiten einer `allFactSheets`-Abfrage. Wirft einen
 * `LeanixError`, wenn LeanIX Teilfehler auf relevanten Feldern meldet oder
 * weniger Einträge liefert als `totalCount` angibt: Ein unvollständiger
 * Stand soll nie als Erfolg übernommen werden.
 */
export async function fetchAllPages<TNode extends { id?: unknown }>(
  client: GraphqlExecutor,
  query: string,
  label: string
): Promise<FetchResult<TNode>> {
  const nodes = new Map<string, TNode>()
  const warnings: string[] = []
  let duplicates = 0
  let after: string | null = null
  let totalCount = 0

  for (let page = 0; ; page++) {
    if (page >= MAX_PAGES) {
      throw new LeanixError(
        `${label}: mehr als ${MAX_PAGES} Seiten, Abfrage abgebrochen`,
        { kind: "response" }
      )
    }
    const result: GraphqlResult<AllFactSheetsPage<TNode>> =
      await client.graphql<AllFactSheetsPage<TNode>>(query, { after })
    if (result.errors.length > 0) {
      const fatal = result.errors.filter((error) => {
        const field = errorField(error.path)
        return !field || !TOLERATED_ERROR_FIELDS.has(field)
      })
      if (fatal.length > 0) {
        throw new LeanixError(
          `${label}: LeanIX meldet Teilfehler, Stand wird nicht übernommen: ${fatal
            .slice(0, 3)
            .map(describeGraphqlError)
            .join(" | ")}`,
          { kind: "graphql" }
        )
      }
      warnings.push(
        `${label}: ${result.errors
          .slice(0, 3)
          .map(describeGraphqlError)
          .join(" | ")}`
      )
    }
    const connection = result.data.allFactSheets
    if (!connection) {
      throw new LeanixError(`${label}: Antwort enthält kein allFactSheets`, {
        kind: "response",
      })
    }
    totalCount = connection.totalCount ?? totalCount
    for (const edge of connection.edges ?? []) {
      // Leere Knoten ({}) entstehen, wenn der Typ nicht passt (Fragment).
      const node = edge?.node
      if (!node || typeof node.id !== "string") continue
      if (nodes.has(node.id)) duplicates++
      else nodes.set(node.id, node)
    }
    const next = connection.pageInfo
    if (!next?.hasNextPage) break
    if (!next.endCursor || next.endCursor === after) {
      throw new LeanixError(`${label}: Paging liefert keinen neuen Cursor`, {
        kind: "response",
      })
    }
    after = next.endCursor
  }

  if (totalCount > 0 && nodes.size < totalCount) {
    throw new LeanixError(
      `${label}: nur ${nodes.size} von ${totalCount} Einträgen geladen (unvollständige Antwort)`,
      { kind: "response" }
    )
  }
  if (duplicates > 0) {
    warnings.push(`${label}: ${duplicates} doppelte Einträge ignoriert`)
  }
  if (totalCount > 0 && nodes.size > totalCount) {
    // Z. B. Änderungen in LeanIX während des Pagings: unkritisch.
    warnings.push(
      `${label}: ${nodes.size} Einträge geladen, LeanIX meldet ${totalCount}`
    )
  }
  return { nodes: [...nodes.values()], totalCount, warnings }
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
