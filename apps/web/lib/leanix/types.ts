/**
 * Rohdaten, wie sie die LeanIX-GraphQL-API für die Katalog-Abfragen liefert
 * (siehe `queries.ts`). Relationen heissen wie in LeanIX (z. B.
 * `relbehoerdenLeistungenToLeistungskategorie`, siehe `model.ts`) und werden
 * deshalb über die Index-Signatur gelesen.
 *
 * Alle Felder sind bewusst tolerant typisiert (optional/nullable): Der Mapper
 * soll auch bei unvollständigen Antworten nicht abstürzen, sondern melden.
 */

export interface RawFactSheetRef {
  id: string
  name: string
  displayName?: string | null
  type?: string | null
}

export interface RawEdge<TNode> {
  node?: TNode | null
}

export interface RawConnection<TNode> {
  edges?: Array<RawEdge<TNode> | null> | null
  totalCount?: number | null
}

/** Relation zu einem anderen Fact Sheet (z. B. `relToParent`). */
export type RawRelation = RawConnection<{
  factSheet?: RawFactSheetRef | null
}>

/** Ressource («Weitere Informationen», GraphQL `documents`). */
export interface RawDocument {
  id: string
  name?: string | null
  url?: string | null
  description?: string | null
  /** Ressourcentyp, z. B. `ordering_form`. */
  documentType?: string | null
  /** Herkunft, z. B. Link oder Datei. */
  origin?: string | null
}

/** Abonnement (nur abgefragt, wenn `CATALOG_SHOW_PERSONS=true`). */
export interface RawSubscription {
  type?: string | null
  roles?: Array<{ name?: string | null } | null> | null
  user?: { displayName?: string | null } | null
}

export interface RawFactSheet {
  id: string
  name: string
  displayName?: string | null
  type?: string | null
  description?: string | null
  /** `ACTIVE` oder `ARCHIVED`. */
  status?: string | null
  level?: number | null
  updatedAt?: string | null
  documents?: RawConnection<RawDocument> | null
  subscriptions?: RawConnection<RawSubscription> | null
  /** Relationen und typspezifische Felder (Schlüssel aus `model.ts`). */
  [field: string]: unknown
}

/** Leistung (Typ `behoerdenLeistungen`). */
export interface RawLeistung extends RawFactSheet {
  /** Subtyp, z. B. `verwaltungsLeistungen`. */
  category?: string | null
  /** Mehrfachauswahl «Kanal». */
  kanal?: string[] | string | null
}

/** Leistungskategorie (Ebene 1–3). */
export type RawKategorie = RawFactSheet

/** Alles, was der Mapper für einen Snapshot braucht. */
export interface RawCatalogData {
  leistungen: RawLeistung[]
  kategorien: RawKategorie[]
}
