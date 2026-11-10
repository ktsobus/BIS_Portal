import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { PageHead } from "@/components/site/page-head"
import { Card } from "@/components/ui/card"
import { CatalogUnavailable } from "@/features/catalog/components/catalog-unavailable"
import { HelpPanel } from "@/features/catalog/components/help-panel"
import { loadFamily, loadStatus } from "@/features/catalog/load"
import { countLabel, plainExcerpt } from "@/features/catalog/text"

export async function generateMetadata({
  params,
}: PageProps<"/kategorie/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const page = await loadFamily(slug)
  if (!page.ok) return { title: "Katalog nicht verfügbar" }
  return {
    title: page.data.family.name,
    description: plainExcerpt(page.data.family.description, 160) ?? undefined,
  }
}

export default async function FamilyPage({
  params,
}: PageProps<"/kategorie/[slug]">) {
  const { slug } = await params
  const page = await loadFamily(slug)
  if (!page.ok) {
    const status = await loadStatus()
    return (
      <CatalogUnavailable
        contact={status?.contact}
        retryHref={`/kategorie/${slug}`}
      />
    )
  }
  const { family, services, status } = page.data

  return (
    <>
      <PageHead
        title={family.name}
        crumbs={[{ label: "Katalog", href: "/" }, { label: family.name }]}
        lead={plainExcerpt(family.description, 320) ?? undefined}
        meta={
          <span>
            {countLabel(family.serviceCount, "Service", "Services")} ·{" "}
            {countLabel(family.leistungCount, "Leistung", "Leistungen")}
          </span>
        }
      />
      <div className="container-page grid gap-8 py-8 md:py-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="services-titel">
          <h2 id="services-titel" className="text-2xl font-bold">
            Services
          </h2>
          {services.length > 0 ? (
            <Card className="mt-4">
              <ul>
                {services.map((service) => {
                  const excerpt = plainExcerpt(service.definition, 220)
                  return (
                    <li
                      key={service.id}
                      className="relative flex items-center gap-4 border-b border-line px-5 py-5 transition-colors duration-150 ease-out last:border-b-0 hover:bg-ground md:px-6"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-bold">
                          <Link
                            href={`/service/${service.slug}`}
                            className="rounded-sm after:absolute after:inset-0"
                          >
                            {service.name}
                          </Link>
                        </h3>
                        {excerpt ? (
                          <p className="mt-1.5 max-w-[70ch] text-text">
                            {excerpt}
                          </p>
                        ) : null}
                        <p className="mt-2 text-sm text-muted">
                          {countLabel(
                            service.leistungCount,
                            "Leistung",
                            "Leistungen"
                          )}
                          {service.responsible.length > 0
                            ? ` · ${service.responsible
                                .map((unit) => unit.name)
                                .join(", ")}`
                            : null}
                        </p>
                      </div>
                      <ChevronRight
                        aria-hidden="true"
                        className="size-5 shrink-0 text-muted"
                      />
                    </li>
                  )
                })}
              </ul>
            </Card>
          ) : (
            <Card className="mt-4 p-6">
              <p className="max-w-[60ch] text-text">
                Zu dieser Familie ist im Katalog noch kein Service
                veröffentlicht.
              </p>
            </Card>
          )}
        </section>
        <aside className="lg:pt-12">
          <HelpPanel contact={status.contact} />
        </aside>
      </div>
    </>
  )
}
