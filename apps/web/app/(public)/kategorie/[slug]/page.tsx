import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { Breadcrumbs } from "@/components/site/breadcrumbs"
import { PageTitle } from "@/components/site/page-title"
import { CatalogUnavailable } from "@/features/catalog/components/catalog-unavailable"
import { MarkdownText } from "@/features/catalog/components/markdown"
import { ServiceList } from "@/features/catalog/components/service-list"
import { loadFamily } from "@/features/catalog/load"
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
  const result = await loadFamily(slug)
  if (!result.ok) return <CatalogUnavailable />

  const { family, services } = result.data
  // Alter Slug (z. B. nach Umbenennung in LeanIX): auf den aktuellen umleiten.
  if (family.slug !== slug) redirect(`/kategorie/${family.slug}`)

  const leistungCount = services.reduce(
    (sum, service) => sum + service.leistungCount,
    0
  )

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <Breadcrumbs
          items={[{ label: "Start", href: "/" }, { label: family.name }]}
        />
        <PageTitle eyebrow="Service-Familie">{family.name}</PageTitle>
        <p className="text-so-graphite">
          {countLabel(services.length, "Service", "Services")}
          {leistungCount > 0
            ? ` · ${countLabel(leistungCount, "Leistung", "Leistungen")} im Portal`
            : null}
        </p>
        <MarkdownText headingLevel={2}>{family.description}</MarkdownText>
      </div>
      <ServiceList services={services} />
    </div>
  )
}
