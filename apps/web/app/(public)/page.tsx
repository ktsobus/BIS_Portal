import { PageTitle } from "@/components/site/page-title"
import { CatalogUnavailable } from "@/features/catalog/components/catalog-unavailable"
import {
  FamilyTiles,
  type FamilyTileData,
} from "@/features/catalog/components/family-tiles"
import { Section } from "@/features/catalog/components/section"
import { StartSearch } from "@/features/catalog/components/start-search"
import { loadFamily, loadOverview } from "@/features/catalog/load"

export default async function HomePage() {
  const overview = await loadOverview()
  if (!overview.ok) return <CatalogUnavailable />

  // Service-Namen für die Kacheln (Abfragen laufen im Speicher, parallel).
  const items: FamilyTileData[] = await Promise.all(
    overview.data.families.map(async (family) => {
      const page = await loadFamily(family.slug)
      return {
        family,
        services: page.ok
          ? page.data.services.map(({ name, leistungCount }) => ({
              name,
              leistungCount,
            }))
          : [],
      }
    })
  )

  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      <div className="flex flex-col gap-5">
        <PageTitle eyebrow="Amt für Informatik und Organisation">
          Business-IT-Services
        </PageTitle>
        <p className="max-w-[70ch] text-lg">
          Hier finden Sie die IT-Leistungen, die das Amt für Informatik und
          Organisation (AIO) für die kantonale Verwaltung erbringt: was Sie
          beziehen können, wer dafür verantwortlich ist und wie Sie eine
          Leistung bestellen oder eine Anfrage stellen.
        </p>
      </div>

      <StartSearch />

      <Section id="familien" title="Service-Familien">
        <FamilyTiles items={items} />
      </Section>
    </div>
  )
}
