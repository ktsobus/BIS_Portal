import type { Metadata } from "next"

import { PageHead } from "@/components/site/page-head"
import { Card } from "@/components/ui/card"
import { ActionLinks } from "@/features/catalog/components/action-links"
import { CatalogUnavailable } from "@/features/catalog/components/catalog-unavailable"
import {
  DetailSection,
  InfoLinkList,
  OrgUnitList,
  PersonList,
} from "@/features/catalog/components/details"
import { LeistungList } from "@/features/catalog/components/leistung-list"
import { MarkdownText } from "@/features/catalog/components/markdown"
import { NoRequestPathHint } from "@/features/catalog/components/support-contact"
import { loadService, loadStatus } from "@/features/catalog/load"
import { countLabel, plainExcerpt } from "@/features/catalog/text"
import { formatDate } from "@/lib/format"

export async function generateMetadata({
  params,
}: PageProps<"/service/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const page = await loadService(slug)
  if (!page.ok) return { title: "Katalog nicht verfügbar" }
  return {
    title: page.data.service.name,
    description: plainExcerpt(page.data.service.definition, 160) ?? undefined,
  }
}

export default async function ServicePage({
  params,
}: PageProps<"/service/[slug]">) {
  const { slug } = await params
  const page = await loadService(slug)
  if (!page.ok) {
    const status = await loadStatus()
    return (
      <CatalogUnavailable
        contact={status?.contact}
        retryHref={`/service/${slug}`}
      />
    )
  }
  const { family, service, leistungen, status } = page.data
  const updated = formatDate(service.updatedAt)

  return (
    <>
      <PageHead
        title={service.name}
        crumbs={[
          { label: "Katalog", href: "/" },
          { label: family.name, href: `/kategorie/${family.slug}` },
          { label: service.name },
        ]}
        meta={
          <span>{countLabel(leistungen.length, "Leistung", "Leistungen")}</span>
        }
      />
      <div className="container-page grid gap-x-12 gap-y-10 py-8 md:py-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-10">
          {service.definition ? (
            <section aria-labelledby="definition-titel">
              <h2 id="definition-titel" className="text-2xl font-extrabold">
                Worum es geht
              </h2>
              <MarkdownText className="mt-3">{service.definition}</MarkdownText>
            </section>
          ) : null}

          <section aria-labelledby="leistungen-titel">
            <h2 id="leistungen-titel" className="text-2xl font-extrabold">
              Leistungen
            </h2>
            <div className="mt-4">
              {leistungen.length > 0 ? (
                <LeistungList leistungen={leistungen} />
              ) : (
                <Card className="p-6">
                  <NoRequestPathHint
                    message="Für diesen Service sind im Portal noch keine Leistungen erfasst."
                    responsible={service.responsible}
                    contact={status.contact}
                    className="text-base"
                  />
                </Card>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          {service.actions.length > 0 ? (
            <Card className="p-5">
              <h2 className="text-lg font-extrabold">Direkt zum Service</h2>
              <ActionLinks actions={service.actions} stretch className="mt-3" />
            </Card>
          ) : null}
          {service.responsible.length > 0 ? (
            <DetailSection title="Verantwortlich">
              <OrgUnitList units={service.responsible} />
            </DetailSection>
          ) : null}
          {service.persons.length > 0 ? (
            <DetailSection title="Ansprechpersonen">
              <PersonList persons={service.persons} />
            </DetailSection>
          ) : null}
          {service.links.length > 0 ? (
            <DetailSection title="Weitere Informationen">
              <InfoLinkList links={service.links} />
            </DetailSection>
          ) : null}
          {updated ? (
            <DetailSection title="Stand">
              <p>Zuletzt geändert am {updated}</p>
            </DetailSection>
          ) : null}
        </aside>
      </div>
    </>
  )
}
