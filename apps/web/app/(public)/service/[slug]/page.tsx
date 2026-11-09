import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Breadcrumbs } from "@/components/site/breadcrumbs"
import { PageTitle } from "@/components/site/page-title"
import { ActionLinks } from "@/features/catalog/components/action-links"
import { CatalogUnavailable } from "@/features/catalog/components/catalog-unavailable"
import { DashList } from "@/features/catalog/components/dash-list"
import {
  ExternalLink,
  safeHref,
} from "@/features/catalog/components/external-link"
import { LeistungGrid } from "@/features/catalog/components/leistung-card"
import { MarkdownText } from "@/features/catalog/components/markdown"
import {
  OrgUnitList,
  PersonList,
} from "@/features/catalog/components/org-units"
import { Section } from "@/features/catalog/components/section"
import { NoRequestPathHint } from "@/features/catalog/components/support-contact"
import { loadService } from "@/features/catalog/load"
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

  const infoLinks = service.links.filter((link) => safeHref(link.url))

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <Breadcrumbs
          items={[
            { label: "Start", href: "/" },
            { label: family.name, href: `/kategorie/${family.slug}` },
            { label: service.name },
          ]}
        />
        <PageTitle eyebrow={family.name}>{service.name}</PageTitle>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-10">
          {service.definition ? (
            <MarkdownText headingLevel={2} className="text-[1.0625rem]">
              {service.definition}
            </MarkdownText>
          ) : (
            <p className="text-so-graphite">
              Für diesen Service ist noch keine Beschreibung erfasst.
            </p>
          )}

          <Section
            id="leistungen"
            title={
              leistungen.length > 0
                ? `Leistungen (${leistungen.length})`
                : "Leistungen"
            }
          >
            {leistungen.length > 0 ? (
              <LeistungGrid leistungen={leistungen} />
            ) : (
              <div className="flex max-w-[70ch] flex-col gap-3 border-l-4 border-primary bg-so-surface p-5">
                <NoRequestPathHint
                  emphasize
                  message="Für diesen Service sind im Portal noch keine Leistungen erfasst."
                  responsible={service.responsible}
                  contact={result.data.status.contact}
                />
              </div>
            )}
          </Section>
        </div>

        <aside
          aria-label="Angaben zum Service"
          className="flex flex-col gap-8 lg:border-l lg:border-border lg:pl-8"
        >
          <div className="flex flex-col gap-3">
            <h2 className="text-xl leading-tight font-normal">
              Verantwortlich
            </h2>
            {service.responsible.length > 0 ? (
              <OrgUnitList units={service.responsible} />
            ) : (
              <p className="text-so-graphite">Keine Angabe</p>
            )}
            <PersonList persons={service.persons} />
          </div>

          {service.actions.length > 0 ? (
            <div className="flex flex-col gap-3">
              <h2 className="text-xl leading-tight font-normal">
                Nächste Schritte
              </h2>
              <ActionLinks actions={service.actions} layout="stacked" />
            </div>
          ) : null}

          {infoLinks.length > 0 ? (
            <div className="flex flex-col gap-3">
              <h2 className="text-xl leading-tight font-normal">
                Weitere Informationen
              </h2>
              <DashList
                items={infoLinks.map((link) => ({
                  key: link.id,
                  content: (
                    <ExternalLink href={link.url}>{link.label}</ExternalLink>
                  ),
                }))}
              />
            </div>
          ) : null}

          <p className="text-sm text-so-graphite">
            Service-Familie:{" "}
            <Link href={`/kategorie/${family.slug}`} className="link-cd">
              {family.name}
            </Link>
            {leistungen.length > 0 ? (
              <>
                <br />
                {countLabel(leistungen.length, "Leistung", "Leistungen")} im
                Portal
              </>
            ) : null}
          </p>
        </aside>
      </div>
    </div>
  )
}
