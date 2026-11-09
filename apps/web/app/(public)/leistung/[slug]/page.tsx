import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Breadcrumbs, type BreadcrumbItem } from "@/components/site/breadcrumbs"
import { formatDate } from "@/components/site/format"
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
  orgUnitNames,
  PersonList,
} from "@/features/catalog/components/org-units"
import { Section } from "@/features/catalog/components/section"
import { loadLeistung } from "@/features/catalog/load"
import { plainExcerpt } from "@/features/catalog/text"

export async function generateMetadata({
  params,
}: PageProps<"/leistung/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const result = await loadLeistung(slug)
  if (!result.ok) return { title: "Katalog nicht verfügbar" }
  const { leistung } = result.data
  return {
    title: leistung.name,
    description:
      plainExcerpt(leistung.summary, 160) ??
      plainExcerpt(leistung.description, 160) ??
      undefined,
  }
}

export default async function LeistungPage({
  params,
}: PageProps<"/leistung/[slug]">) {
  const { slug } = await params
  const result = await loadLeistung(slug)
  if (!result.ok) return <CatalogUnavailable />

  const { leistung, placements, parent, children } = result.data
  if (leistung.slug !== slug) redirect(`/leistung/${leistung.slug}`)

  const primary = placements[0]
  const breadcrumbs: BreadcrumbItem[] = [{ label: "Start", href: "/" }]
  if (primary) {
    breadcrumbs.push(
      { label: primary.family.name, href: `/kategorie/${primary.family.slug}` },
      { label: primary.service.name, href: `/service/${primary.service.slug}` }
    )
  } else if (parent) {
    breadcrumbs.push({ label: parent.name, href: `/leistung/${parent.slug}` })
  }
  breadcrumbs.push({ label: leistung.name })

  // Ohne eigene Stelle gilt die verantwortliche Stelle des Services.
  const ownResponsible = leistung.responsible.length > 0
  const responsible = ownResponsible
    ? leistung.responsible
    : (primary?.service.responsible ?? [])
  const infoLinks = leistung.links.filter((link) => safeHref(link.url))
  const updatedAt = formatDate(leistung.updatedAt)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <Breadcrumbs items={breadcrumbs} />
        <PageTitle eyebrow={leistung.subtypeLabel ?? "Leistung"}>
          {leistung.name}
        </PageTitle>
      </div>

      <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[auto_1fr] lg:gap-x-12">
        {/* Mobil: Nächste Schritte zuerst, Eckdaten nach der Beschreibung. */}
        <div className="contents lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:flex lg:flex-col lg:gap-8">
          <section
            aria-labelledby="naechste-schritte"
            className="order-1 flex flex-col gap-4 border-t-4 border-primary bg-so-surface p-5"
          >
            <h2
              id="naechste-schritte"
              className="text-xl leading-tight font-normal"
            >
              Nächste Schritte
            </h2>
            {leistung.actions.length > 0 ? (
              <ActionLinks actions={leistung.actions} layout="stacked" />
            ) : (
              <p>
                Für diese Leistung ist im Portal noch kein Bestell- oder
                Anfrageweg hinterlegt.{" "}
                {responsible.length > 0 ? (
                  <>
                    Bitte wenden Sie sich an die verantwortliche Stelle:{" "}
                    <strong>{orgUnitNames(responsible)}</strong>.
                  </>
                ) : (
                  "Bitte wenden Sie sich an den Service Desk des AIO."
                )}
              </p>
            )}
          </section>

          <div className="order-3 flex flex-col gap-8">
            <FactBlock title="Verantwortlich">
              {responsible.length > 0 ? (
                <>
                  <OrgUnitList units={responsible} />
                  {ownResponsible ? null : (
                    <p className="text-sm text-so-graphite">
                      Verantwortliche Stelle des Services
                    </p>
                  )}
                </>
              ) : (
                <p className="text-so-graphite">Keine Angabe</p>
              )}
              <PersonList persons={leistung.persons} />
            </FactBlock>

            {leistung.audiences.length > 0 ? (
              <FactBlock title="Leistungsbezüger">
                <DashList
                  items={leistung.audiences.map((audience) => ({
                    key: audience.id,
                    content: audience.name,
                  }))}
                />
              </FactBlock>
            ) : null}

            {leistung.applications.length > 0 ? (
              <FactBlock title="Anwendungen">
                <DashList
                  items={leistung.applications.map((application) => ({
                    key: application.id,
                    content: application.name,
                  }))}
                />
              </FactBlock>
            ) : null}
          </div>
        </div>

        <div className="order-2 flex min-w-0 flex-col gap-10 lg:col-start-1 lg:row-start-1">
          <Section id="beschreibung" title="Beschreibung">
            {leistung.description ? (
              <MarkdownText headingLevel={3}>
                {leistung.description}
              </MarkdownText>
            ) : (
              <p className="text-so-graphite">
                Für diese Leistung ist noch keine Beschreibung erfasst.
              </p>
            )}
          </Section>
        </div>

        <div className="order-4 flex min-w-0 flex-col gap-10 lg:col-start-1 lg:row-start-2">
          {infoLinks.length > 0 ? (
            <Section id="weitere-informationen" title="Weitere Informationen">
              <ul className="flex max-w-[70ch] flex-col gap-3">
                {infoLinks.map((link) => (
                  <li key={link.id} className="flex flex-col gap-0.5">
                    <ExternalLink href={link.url}>{link.label}</ExternalLink>
                    {link.description ? (
                      <span className="text-sm text-so-graphite">
                        {link.description}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {parent ? (
            <Section id="uebergeordnet" title="Übergeordnete Leistung">
              <LeistungGrid leistungen={[parent]} />
            </Section>
          ) : null}

          {children.length > 0 ? (
            <Section
              id="untergeordnet"
              title={`Untergeordnete Leistungen (${children.length})`}
            >
              <LeistungGrid leistungen={children} />
            </Section>
          ) : null}

          {placements.length > 1 ? (
            <Section id="einordnungen" title="Auch zu finden unter">
              <DashList
                items={placements.map(({ family, service }) => ({
                  key: service.id,
                  content: (
                    <>
                      <Link
                        href={`/kategorie/${family.slug}`}
                        className="link-cd"
                      >
                        {family.name}
                      </Link>
                      {" › "}
                      <Link
                        href={`/service/${service.slug}`}
                        className="link-cd"
                      >
                        {service.name}
                      </Link>
                    </>
                  ),
                }))}
              />
            </Section>
          ) : null}

          {updatedAt ? (
            <p className="text-sm text-so-graphite">
              Stand:{" "}
              <time dateTime={leistung.updatedAt ?? undefined}>
                {updatedAt}
              </time>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function FactBlock({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl leading-tight font-normal">{title}</h2>
      {children}
    </section>
  )
}
