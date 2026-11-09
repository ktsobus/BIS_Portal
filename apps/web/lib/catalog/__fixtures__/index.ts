import type {
  RawCatalogData,
  RawKategorie,
  RawLeistung,
} from "@/lib/leanix/types"

import kategorien from "./leanix-kategorien.json"
import leistungen from "./leanix-leistungen.json"

/**
 * Bereinigte LeanIX-Rohdaten aus der Discovery vom 9.11.2026 (Personen
 * pseudonymisiert) für Tests, den Demo-Snapshot und den LeanIX-Mock.
 * Gibt jedes Mal eine tiefe Kopie zurück, damit Tests sie verändern dürfen.
 */
export function loadFixtureRaw(): RawCatalogData {
  return structuredClone({
    leistungen: leistungen.nodes as unknown as RawLeistung[],
    kategorien: kategorien.nodes as unknown as RawKategorie[],
  })
}

/** Neuester `updatedAt`-Wert der Fixtures (für einen deterministischen Stand). */
export function fixtureLatestUpdate(raw: RawCatalogData): string | null {
  let latest: number | null = null
  for (const node of [...raw.leistungen, ...raw.kategorien]) {
    const time = node.updatedAt ? Date.parse(node.updatedAt) : NaN
    if (!Number.isNaN(time) && (latest === null || time > latest)) latest = time
  }
  return latest === null ? null : new Date(latest).toISOString()
}
