import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { PageHead } from "@/components/site/page-head"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { loadOverview } from "@/features/catalog/load"
import { countLabel } from "@/features/catalog/text"

export const metadata: Metadata = { title: "Seite nicht gefunden" }

export default async function NotFound() {
  const overview = await loadOverview()
  const families = overview.ok ? overview.data.families : []
  return (
    <>
      <PageHead
        title="Diese Seite gibt es nicht"
        lead="Die Leistung oder der Service wurde umbenannt, verschoben oder ist nicht mehr im Katalog veröffentlicht."
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="primary" size="lg">
            <Link href="/suche">Katalog durchsuchen</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/">Zur Startseite</Link>
          </Button>
        </div>
      </PageHead>
      {families.length > 0 ? (
        <div className="container-page py-8 md:py-10">
          <h2 className="text-2xl font-bold">Service-Familien</h2>
          <Card className="mt-4 max-w-[46rem]">
            <ul>
              {families.map((family) => (
                <li
                  key={family.id}
                  className="relative flex items-center gap-4 border-b border-line px-5 py-4 transition-colors duration-150 ease-out last:border-b-0 hover:bg-ground md:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/kategorie/${family.slug}`}
                      className="rounded-sm text-lg font-bold text-ink after:absolute after:inset-0"
                    >
                      {family.name}
                    </Link>
                    <p className="text-sm text-muted">
                      {countLabel(family.serviceCount, "Service", "Services")} ·{" "}
                      {countLabel(
                        family.leistungCount,
                        "Leistung",
                        "Leistungen"
                      )}
                    </p>
                  </div>
                  <ChevronRight
                    aria-hidden="true"
                    className="size-5 shrink-0 text-muted"
                  />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}
    </>
  )
}
