import type { Metadata } from "next"

import { ContentPage } from "@/components/site/content-page"
import { PageTitle } from "@/components/site/page-title"
import { CatalogSearch } from "@/features/catalog/components/catalog-search"

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

  return (
    <ContentPage
      wide
      breadcrumbs={[{ label: "Start", href: "/" }, { label: "Suche" }]}
    >
      <PageTitle>Suche</PageTitle>
      {/* Neu aufbauen, wenn die Suche über das Kopf-Suchfeld neu startet. */}
      <CatalogSearch
        key={`${query}|${subtype}|${audience}`}
        initialQuery={query}
        initialSubtype={subtype}
        initialAudience={audience}
      />
    </ContentPage>
  )
}
