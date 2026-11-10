import type { Metadata } from "next"

import { CatalogFrame } from "@/features/catalog/components/page-frame"
import { CatalogSearch } from "@/features/catalog/components/search"

export const metadata: Metadata = {
  title: "Leistung suchen",
  description:
    "Den Katalog der Business-IT-Services nach Stichwort, Art und Leistungsbezüger durchsuchen.",
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
    <CatalogFrame search>
      <div className="wrap">
        <div className="page-head">
          <h1>Leistung suchen</h1>
        </div>
      </div>
      <div className="wrap">
        <CatalogSearch
          key={`${query}|${subtype}|${audience}`}
          initialQuery={query}
          initialSubtype={subtype}
          initialAudience={audience}
        />
      </div>
    </CatalogFrame>
  )
}
