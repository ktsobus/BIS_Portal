import { describe, expect, it } from "vitest"

import {
  LeanixError,
  type GraphqlErrorInfo,
  type GraphqlResult,
} from "./client"
import {
  buildKategorienQuery,
  buildLeistungenQuery,
  fetchAllPages,
  fetchCatalogRaw,
  type GraphqlExecutor,
} from "./queries"

describe("Abfragen", () => {
  it("lädt Personen nur auf Wunsch (Datensparsamkeit)", () => {
    expect(buildLeistungenQuery({ showPersons: false })).not.toContain(
      "subscriptions"
    )
    expect(buildKategorienQuery({ showPersons: false })).not.toContain(
      "subscriptions"
    )
    expect(buildLeistungenQuery({ showPersons: true })).toContain(
      "subscriptions { edges { node { type roles { name } user { displayName } } } }"
    )
  })

  it("fragt die Leistungen mit Relationen und Ressourcen ab", () => {
    const query = buildLeistungenQuery({ showPersons: false })
    expect(query).toContain('keys: ["behoerdenLeistungen"]')
    expect(query).toContain("... on behoerdenLeistungen {")
    for (const field of [
      "category",
      "kanal",
      "relbehoerdenLeistungenToLeistungskategorie",
      "relbehoerdenLeistungenToOrganisationseinheit",
      "relbehoerdenLeistungenToUserGroup",
      "relbehoerdenLeistungenToApplication",
      "relToParent",
      "relToChild",
      "documents { edges { node { id name url description documentType origin } } }",
    ]) {
      expect(query).toContain(field)
    }
  })

  it("fragt die Leistungskategorien ab", () => {
    const query = buildKategorienQuery({ showPersons: false })
    expect(query).toContain('keys: ["Leistungskategorie"]')
    expect(query).toContain("relLeistungskategorieToOrganisationseinheit")
    expect(query).toContain("relToParent")
  })
})

/**
 * Liefert `nodes` in Seiten zu `size` Einträgen. `stopAfter`: meldet nach
 * so vielen Einträgen `hasNextPage: false` (unvollständiges Paging).
 */
function pagedExecutor(
  nodes: Array<{ id: string }>,
  size: number,
  errors: GraphqlErrorInfo[] = [],
  options: { stopAfter?: number; totalCount?: number } = {}
) {
  const calls: Array<Record<string, unknown> | undefined> = []
  const executor: GraphqlExecutor = {
    async graphql<TData>(_query: string, variables?: Record<string, unknown>) {
      calls.push(variables)
      const start = variables?.after ? Number(variables.after) : 0
      const page = nodes.slice(start, start + size)
      const end = start + page.length
      const last = Math.min(nodes.length, options.stopAfter ?? nodes.length)
      return {
        data: {
          allFactSheets: {
            totalCount: options.totalCount ?? nodes.length,
            pageInfo: {
              hasNextPage: end < last,
              endCursor: String(end),
            },
            edges: [...page.map((node) => ({ node })), { node: {} }],
          },
        },
        errors,
      } as GraphqlResult<TData>
    },
  }
  return { executor, calls }
}

const nodePath = (field: string) => ["allFactSheets", "edges", 0, "node", field]

describe("fetchAllPages", () => {
  it("lädt alle Seiten und ignoriert leere Knoten", async () => {
    const nodes = Array.from({ length: 5 }, (_, i) => ({ id: `n${i}` }))
    const { executor, calls } = pagedExecutor(nodes, 2)
    const result = await fetchAllPages(executor, "q", "Test")
    expect(result.nodes.map((n) => n.id)).toEqual([
      "n0",
      "n1",
      "n2",
      "n3",
      "n4",
    ])
    expect(result.totalCount).toBe(5)
    expect(result.warnings).toEqual([])
    expect(calls.map((v) => v?.after)).toEqual([null, "2", "4"])
  })

  it("sammelt tolerierbare Teilfehler als Hinweise (z. B. Personen)", async () => {
    const { executor } = pagedExecutor([{ id: "a" }], 10, [
      { message: "Teilfehler", path: nodePath("subscriptions") },
    ])
    const result = await fetchCatalogRaw(executor, { showPersons: true })
    expect(result.warnings).toEqual([
      "Leistungen: Teilfehler (allFactSheets/edges/0/node/subscriptions)",
      "Leistungskategorien: Teilfehler (allFactSheets/edges/0/node/subscriptions)",
    ])
  })

  it("bricht bei Teilfehlern auf Ressourcen ab (documents)", async () => {
    const message =
      "Exception while fetching data (/allFactSheets/edges[0]/node/documents) : Access denied"
    const { executor } = pagedExecutor([{ id: "a" }], 10, [
      { message, path: nodePath("documents") },
    ])
    const error = await fetchAllPages(executor, "q", "Leistungen").catch(
      (e: unknown) => e
    )
    expect(error).toBeInstanceOf(LeanixError)
    expect((error as LeanixError).kind).toBe("graphql")
    expect((error as LeanixError).message).toContain(
      "Leistungen: LeanIX meldet Teilfehler"
    )
    expect((error as LeanixError).message).toContain("Access denied")
  })

  it("bricht bei Teilfehlern auf Kanal, Relationen, Knoten oder ohne Pfad ab", async () => {
    for (const path of [
      nodePath("kanal"),
      nodePath("status"),
      nodePath("relbehoerdenLeistungenToLeistungskategorie"),
      ["allFactSheets", "edges", 0, "node"],
      undefined,
    ]) {
      const { executor } = pagedExecutor([{ id: "a" }], 10, [
        { message: "Fehler", path },
      ])
      await expect(fetchAllPages(executor, "q", "Test")).rejects.toThrow(
        /Teilfehler/
      )
    }
  })

  it("bricht bei unvollständigem Paging ab", async () => {
    const nodes = Array.from({ length: 18 }, (_, i) => ({ id: `n${i}` }))
    // Erste Seite meldet hasNextPage=false, obwohl totalCount 18 ist.
    const { executor } = pagedExecutor(nodes, 14, [], { stopAfter: 14 })
    await expect(fetchAllPages(executor, "q", "Leistungen")).rejects.toThrow(
      "Leistungen: nur 14 von 18 Einträgen geladen (unvollständige Antwort)"
    )
  })

  it("entfernt doppelte Einträge und meldet mehr Einträge als erwartet", async () => {
    const nodes = [{ id: "a" }, { id: "b" }, { id: "a" }, { id: "c" }]
    const { executor } = pagedExecutor(nodes, 2, [], { totalCount: 2 })
    const result = await fetchAllPages(executor, "q", "Test")
    expect(result.nodes.map((n) => n.id)).toEqual(["a", "b", "c"])
    expect(result.warnings).toEqual([
      "Test: 1 doppelte Einträge ignoriert",
      "Test: 3 Einträge geladen, LeanIX meldet 2",
    ])
  })

  it("bricht ab, wenn der Cursor nicht weiterkommt", async () => {
    const executor: GraphqlExecutor = {
      async graphql<TData>() {
        return {
          data: {
            allFactSheets: {
              totalCount: 10,
              pageInfo: { hasNextPage: true, endCursor: "x" },
              edges: [],
            },
          },
          errors: [],
        } as unknown as GraphqlResult<TData>
      },
    }
    await expect(fetchAllPages(executor, "q", "Test")).rejects.toThrow(/Cursor/)
  })
})
