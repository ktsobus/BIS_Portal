import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { ServiceEntries } from "@/features/catalog/components/lists"
import { MarkdownText } from "@/features/catalog/components/markdown"
import { CatalogFrame, Crumbs } from "@/features/catalog/components/page-frame"
import { CatalogUnavailable } from "@/features/catalog/components/support-contact"
import { loadFamily, loadStatus } from "@/features/catalog/load"
import { countLabel, plainExcerpt } from "@/features/catalog/text"

export async function generateMetadata({
  params,
}: PageProps<"/kategorie/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const result = await loadFamily(slug)
  if (!result.ok) return { title: "Katalog nicht verfügbar" }
  const { family } = result.data
  return {
    title: family.name,
    description:
      plainExcerpt(family.description, 160) ??
      `Services und Leistungen der Kategorie ${family.name}.`,
  }
}

export default async function FamilyPage({
  params,
}: PageProps<"/kategorie/[slug]">) {
  const { slug } = await params
  const result = await loadFamily(slug)
  if (!result.ok) {
    return (
      <CatalogFrame>
        <CatalogUnavailable contact={(await loadStatus())?.contact} />
      </CatalogFrame>
    )
  }

  const { family, services } = result.data
  if (family.slug !== slug) redirect(`/kategorie/${family.slug}`)

  return (
    <CatalogFrame>
      <div className="wrap">
        <div className="page-head">
          <Crumbs
            items={[
              { label: "Katalog", href: "/#kategorien" },
              { label: family.name },
            ]}
          />
          <h1>{family.name}</h1>
          {family.description ? (
            <MarkdownText headingLevel={2}>{family.description}</MarkdownText>
          ) : null}
        </div>
      </div>
      <div className="wrap">
        <div className="block-head">
          <h2>Services dieser Kategorie</h2>
          <p>
            {countLabel(family.serviceCount, "Service", "Services")},{" "}
            {countLabel(family.leistungCount, "Leistung", "Leistungen")}
          </p>
        </div>
        <ServiceEntries services={services} />
      </div>
    </CatalogFrame>
  )
}
