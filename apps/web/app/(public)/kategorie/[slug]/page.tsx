import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { ContentPage } from "@/components/site/content-page"
import { PageTitle } from "@/components/site/page-title"
import { CatalogUnavailable } from "@/features/catalog/components/catalog-unavailable"
import { FamiliesSideNav } from "@/features/catalog/components/catalog-side-nav"
import { MarkdownText } from "@/features/catalog/components/markdown"
import { Section } from "@/features/catalog/components/section"
import { ServiceList } from "@/features/catalog/components/service-list"
import { loadFamily, loadOverview } from "@/features/catalog/load"
import { countLabel, plainExcerpt } from "@/features/catalog/text"

export async function generateMetadata({
  params,
}: PageProps<"/kategorie/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const result = await loadFamily(slug)
  if (!result.ok) return { title: "Katalog nicht verfügbar" }
  const { family, services } = result.data
  return {
    title: family.name,
    description:
      plainExcerpt(family.description, 160) ??
      `${family.name}: ${countLabel(services.length, "Service", "Services")} des AIO.`,
  }
}

export default async function FamilyPage({
  params,
}: PageProps<"/kategorie/[slug]">) {
  const { slug } = await params
  const [result, overview] = await Promise.all([
    loadFamily(slug),
    loadOverview(),
  ])
  if (!result.ok) return <CatalogUnavailable />

  const { family, services } = result.data
  // Alter Slug (z. B. nach Umbenennung in LeanIX): auf den aktuellen umleiten.
  if (family.slug !== slug) redirect(`/kategorie/${family.slug}`)

  const leistungCount = services.reduce(
    (sum, service) => sum + service.leistungCount,
    0
  )

  return (
    <ContentPage
      breadcrumbs={[{ label: "Start", href: "/" }, { label: family.name }]}
      sideNav={
        overview.ok ? (
          <FamiliesSideNav
            families={overview.data.families}
            currentId={family.id}
          />
        ) : null
      }
    >
      <div className="flex flex-col gap-6">
        <PageTitle eyebrow="Service-Familie">{family.name}</PageTitle>
        <MarkdownText headingLevel={2}>{family.description}</MarkdownText>
      </div>

      <Section id="services" title="Services">
        <p>
          {countLabel(services.length, "Service", "Services")}
          {leistungCount > 0
            ? ` · ${countLabel(leistungCount, "Leistung", "Leistungen")} im Portal`
            : null}
        </p>
        <ServiceList services={services} />
      </Section>
    </ContentPage>
  )
}
