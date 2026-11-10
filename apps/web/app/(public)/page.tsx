import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { PageTitle } from "@/components/site/page-title"
import { buttonVariants } from "@/components/ui/button"
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
    <div className="container-page flex flex-col gap-16 pt-10 lg:gap-20 lg:pt-16">
      {/* Einstieg: Titel und Suche als eine Aufgabe (so.ch: Suche zuerst). */}
      <div className="flex max-w-reading flex-col gap-8 lg:gap-10">
        <PageTitle
          size="large"
          lead="Das Amt für Informatik und Organisation erbringt diese IT-Leistungen für die kantonale Verwaltung. Suchen Sie eine Leistung oder wählen Sie eine Service-Familie."
        >
          Business-IT-Services
        </PageTitle>
        <StartSearch />
      </div>

      <Section
        id="familien"
        title="Service-Familien"
        size="lg"
        footer={
          <Link
            href="/suche"
            className={buttonVariants({ variant: "secondary" })}
          >
            Alle Leistungen
            <ArrowRightIcon aria-hidden="true" strokeWidth={1.5} />
          </Link>
        }
      >
        <FamilyTiles items={items} />
      </Section>
    </div>
  )
}
