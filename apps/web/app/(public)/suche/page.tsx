import type { Metadata } from "next"
import { ORPCError } from "@orpc/server"

import { PageHead } from "@/components/site/page-head"
import { CatalogUnavailable } from "@/features/catalog/components/catalog-unavailable"
import { SearchView } from "@/features/catalog/components/search-view"
import { loadStatus } from "@/features/catalog/load"
import { serverClient } from "@/lib/orpc-server"

export const metadata: Metadata = { title: "Suche" }

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? ""
}

async function loadSearchIndex() {
  try {
    return await serverClient.catalog.searchIndex()
  } catch (error) {
    if (error instanceof ORPCError && error.code === "CATALOG_UNAVAILABLE") {
      return null
    }
    throw error
  }
}

export default async function SearchPage({
  searchParams,
}: PageProps<"/suche">) {
  const [params, index] = await Promise.all([searchParams, loadSearchIndex()])
  if (!index) {
    const status = await loadStatus()
    return <CatalogUnavailable contact={status?.contact} retryHref="/suche" />
  }
  const subtype = first(params.typ)
  const audience = first(params.fuer)

  return (
    <>
      <PageHead
        title="Suche"
        crumbs={[{ label: "Katalog", href: "/" }, { label: "Suche" }]}
        lead="Durchsucht Namen, Beschreibungen, Services und Anwendungen aller Leistungen."
      />
      <SearchView
        entries={index.entries}
        facets={index.facets}
        contact={index.status.contact}
        initial={{
          query: first(params.q).slice(0, 200),
          subtype: index.facets.subtypes.includes(subtype) ? subtype : "",
          audience: index.facets.audiences.includes(audience) ? audience : "",
        }}
      />
    </>
  )
}
