import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { ContentPage } from "@/components/site/content-page"
import { formatDate } from "@/components/site/format"
import { PageTitle } from "@/components/site/page-title"
import { CatalogUnavailable } from "@/features/catalog/components/catalog-unavailable"
import { ServiceTreeSideNav } from "@/features/catalog/components/catalog-side-nav"
import {
  ContactBox,
  ResponsibleBox,
  ServiceUseBox,
} from "@/features/catalog/components/info-boxes"
import {
  InfoLinks,
  visibleLinks,
} from "@/features/catalog/components/info-links"
import { LeistungGrid } from "@/features/catalog/components/leistung-card"
import { MarkdownText } from "@/features/catalog/components/markdown"
import { Section } from "@/features/catalog/components/section"
import { NoRequestPathHint } from "@/features/catalog/components/support-contact"
import { TableOfContents } from "@/features/catalog/components/table-of-contents"
import { loadFamily, loadService } from "@/features/catalog/load"
import { countLabel, plainExcerpt } from "@/features/catalog/text"

export async function generateMetadata({
  params,
}: PageProps<"/service/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const result = await loadService(slug)
  if (!result.ok) return { title: "Katalog nicht verfügbar" }
  const { service, family } = result.data
  return {
    title: service.name,
    description:
      plainExcerpt(service.definition, 160) ??
      `${service.name} (${family.name})`,
  }
}

export default async function ServicePage({
  params,
}: PageProps<"/service/[slug]">) {
  const { slug } = await params
  const result = await loadService(slug)
  if (!result.ok) return <CatalogUnavailable />

  const { family, service, leistungen } = result.data
  if (service.slug !== slug) redirect(`/service/${service.slug}`)

  const familyPage = await loadFamily(family.slug)
  const siblings = familyPage.ok ? familyPage.data.services : [service]
  const hasActions = visibleLinks(service.actions).length > 0
  const hasInfoLinks = visibleLinks(service.links).length > 0
  const updatedAt = formatDate(service.updatedAt)

  const toc = [
    { id: "leistungen", label: "Leistungen" },
    { id: "verantwortlich", label: "Zuständigkeit" },
    ...(hasInfoLinks
      ? [{ id: "weitere-informationen", label: "Weitere Informationen" }]
      : []),
  ]

  return (
    <ContentPage
      breadcrumbs={[
        { label: "Start", href: "/" },
        { label: family.name, href: `/kategorie/${family.slug}` },
        { label: service.name },
      ]}
      sideNav={
        <ServiceTreeSideNav
          family={family}
          services={siblings}
          currentServiceId={service.id}
          leistungen={leistungen}
        />
      }
    >
      <div className="flex flex-col gap-6">
        <PageTitle eyebrow="Service">{service.name}</PageTitle>
        {service.definition ? (
          <MarkdownText headingLevel={2}>{service.definition}</MarkdownText>
        ) : (
          <p>Für diesen Service ist noch keine Beschreibung erfasst.</p>
        )}
      </div>

      <TableOfContents items={toc} />

      {hasActions ? (
        <ServiceUseBox actions={service.actions} fallback={null} />
      ) : null}

      <Section id="leistungen" title="Leistungen">
        {leistungen.length > 0 ? (
          <>
            <p>{countLabel(leistungen.length, "Leistung", "Leistungen")}</p>
            <LeistungGrid leistungen={leistungen} />
          </>
        ) : (
          <ContactBox
            id="keine-leistungen"
            title="Noch keine Leistungen erfasst"
            headingLevel={3}
          >
            <NoRequestPathHint
              message="Für diesen Service sind im Portal noch keine Leistungen erfasst."
              responsible={service.responsible}
              contact={result.data.status.contact}
            />
          </ContactBox>
        )}
      </Section>

      <ResponsibleBox units={service.responsible} persons={service.persons} />

      {hasInfoLinks ? (
        <Section id="weitere-informationen" title="Weitere Informationen">
          <InfoLinks links={service.links} />
        </Section>
      ) : null}

      {updatedAt ? (
        <p className="type-body-sm">
          Stand:{" "}
          <time dateTime={service.updatedAt ?? undefined}>{updatedAt}</time>
        </p>
      ) : null}
    </ContentPage>
  )
}
