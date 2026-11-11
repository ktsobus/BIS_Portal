import type { Metadata } from "next"

import { ContentPage } from "@/components/site/content-page"
import { PageTitle } from "@/components/site/page-title"
import { CatalogSearch } from "@/features/catalog/components/catalog-search"
import { CatalogSearchList } from "@/features/catalog/components/catalog-search-list"
import { SearchViewSwitch } from "@/features/catalog/components/search-view-switch"

export const metadata: Metadata = {
  title: "Suche",
  description:
    "Business-IT-Services und Leistungen des AIO durchsuchen und filtern.",
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.slice(0, 200) ?? ""
}

export default async function SearchPage({
  searchParams,
}: PageProps<"/suche">) {
  const params = await searchParams
  const query = first(params.q)
  const subtype = first(params.art)
  const audience = first(params.bezueger)
  // Zwei Darstellungen zum Vergleich: Liste (tasteskill) und Kacheln (so.ch).
  const view = first(params.ansicht) === "kacheln" ? "kacheln" : "liste"
  const Search = view === "kacheln" ? CatalogSearch : CatalogSearchList

  return (
    <ContentPage
      wide
      breadcrumbs={[{ label: "Start", href: "/" }, { label: "Suche" }]}
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <PageTitle>Suche</PageTitle>
        <SearchViewSwitch view={view} />
      </div>
      {/* Neu aufbauen, wenn die Suche über das Kopf-Suchfeld neu startet. */}
      <Search
        key={`${query}|${subtype}|${audience}`}
        initialQuery={query}
        initialSubtype={subtype}
        initialAudience={audience}
      />
    </ContentPage>
  )
}
