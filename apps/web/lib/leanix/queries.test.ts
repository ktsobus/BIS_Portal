import { describe, expect, it } from "vitest"

import type { GraphqlResult } from "./client"
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

/** Liefert `nodes` in Seiten zu `size` Einträgen. */
function pagedExecutor(
  nodes: Array<{ id: string }>,
  size: number,
  errors: string[] = []
) {
  const calls: Array<Record<string, unknown> | undefined> = []
  const executor: GraphqlExecutor = {
    async graphql<TData>(_query: string, variables?: Record<string, unknown>) {
      calls.push(variables)
      const start = variables?.after ? Number(variables.after) : 0
      const page = nodes.slice(start, start + size)
      const end = start + page.length
      return {
        data: {
          allFactSheets: {
            totalCount: nodes.length,
            pageInfo: {
              hasNextPage: end < nodes.length,
              endCursor: String(end),
            },
            edges: [...page.map((node) => ({ node })), { node: {} }],
          },
        },
        errors: errors.map((message) => ({ message })),
      } as GraphqlResult<TData>
    },
  }
  return { executor, calls }
}

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

  it("sammelt Teilfehler als Hinweise", async () => {
    const { executor } = pagedExecutor([{ id: "a" }], 10, ["Teilfehler"])
    const result = await fetchCatalogRaw(executor, { showPersons: false })
    expect(result.warnings).toEqual([
      "Leistungen: Teilfehler",
      "Leistungskategorien: Teilfehler",
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
