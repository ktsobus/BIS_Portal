import { PageHead } from "@/components/site/page-head"
import { CatalogUnavailable } from "@/features/catalog/components/catalog-unavailable"
import { FamilyCard } from "@/features/catalog/components/family-card"
import { HelpPanel } from "@/features/catalog/components/help-panel"
import { SearchBox } from "@/features/catalog/components/search-box"
import { loadFamily, loadOverview, loadStatus } from "@/features/catalog/load"

export default async function StartPage() {
  const overview = await loadOverview()
  if (!overview.ok) {
    const status = await loadStatus()
    return <CatalogUnavailable contact={status?.contact} retryHref="/" />
  }
  const { families, status } = overview.data
  // Die Karten zeigen die Services jeder Familie (gleiche Prozedur wie die Familienseite).
  const pages = await Promise.all(
    families.map((family) => loadFamily(family.slug))
  )

  return (
    <>
      <PageHead
        spacious
        title="Business IT-Servicekatalog"
        lead="Die IT-Services des Amts für Informatik und Organisation: finden, bestellen, anfragen."
      >
        <SearchBox />
      </PageHead>

      <div className="container-page py-10 md:py-12">
        <h2 className="text-2xl font-bold">Service-Familien</h2>
        {families.length > 0 ? (
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {families.map((family, index) => {
              const page = pages[index]
              return (
                <FamilyCard
                  key={family.id}
                  family={family}
                  services={page?.ok ? page.data.services : []}
                />
              )
            })}
            <HelpPanel contact={status.contact} />
          </div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="rounded-lg border border-line bg-white p-6">
              <h3 className="text-lg font-bold">
                Im Katalog ist noch keine Leistung veröffentlicht
              </h3>
              <p className="mt-2 max-w-[60ch] text-sm text-text">
                Leistungen erscheinen hier, sobald sie in LeanIX für den Kanal
                «Business IT-Servicekatalog» freigegeben sind.
              </p>
            </div>
            <HelpPanel contact={status.contact} />
          </div>
        )}
      </div>
    </>
  )
}
