import { CatalogFooter } from "@/features/catalog/components/catalog-footer"
import { SiteHeader, SkipLink } from "@/components/site/site-header"
import { SiteNav } from "@/components/site/site-nav"
import { Notice } from "@/components/ui/notice"
import { loadStatus } from "@/features/catalog/load"
import { formatDateTime } from "@/lib/format"

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const status = await loadStatus()
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <SiteHeader>
        <SiteNav />
      </SiteHeader>
      {status?.available && status.stale ? (
        <div className="border-b border-line bg-white">
          <div className="container-page py-3">
            <Notice tone="warning" title="Der Katalog ist nicht aktuell">
              Der letzte Abgleich mit LeanIX war am{" "}
              {formatDateTime(status.generatedAt) ?? "unbekannten Datum"}.
              Einzelne Angaben können überholt sein.
            </Notice>
          </div>
        </div>
      ) : null}
      <main id="inhalt" className="flex-1">
        {children}
      </main>
      <CatalogFooter status={status} />
    </div>
  )
}
