import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import type { BreadcrumbItem } from "@/components/site/breadcrumbs"
import { ContentPage } from "@/components/site/content-page"
import { formatDate } from "@/components/site/format"
import { PageTitle } from "@/components/site/page-title"
import { CatalogUnavailable } from "@/features/catalog/components/catalog-unavailable"
import { ServiceTreeSideNav } from "@/features/catalog/components/catalog-side-nav"
import { DashList } from "@/features/catalog/components/dash-list"
import {
  ResponsibleBox,
  ServiceUseBox,
} from "@/features/catalog/components/info-boxes"
import {
  InfoLinks,
  visibleLinks,
} from "@/features/catalog/components/info-links"
import { LeistungGrid } from "@/features/catalog/components/leistung-card"
import { MarkdownText } from "@/features/catalog/components/markdown"
import { orgUnitNames } from "@/features/catalog/components/org-units"
import { Section } from "@/features/catalog/components/section"
import { TableOfContents } from "@/features/catalog/components/table-of-contents"
import { loadFamily, loadLeistung, loadService } from "@/features/catalog/load"
import { markdownToPlainText, plainExcerpt } from "@/features/catalog/text"

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

/**
 * Kurzbeschreibung als Lead, sofern die Beschreibung nicht ohnehin damit
 * beginnt (in LeanIX ist sie oft der gekürzte Anfang der Beschreibung).
 */
function leadText(summary: string | null, description: string | null) {
  const lead = markdownToPlainText(summary)
  if (!lead) return null
  const start = lead.replace(/\s*(?:…|\.\.\.)$/, "")
  return markdownToPlainText(description).startsWith(start) ? null : lead
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

  // Seitennavigation: Services der Familie, der eigene Service aufgeklappt.
  const [servicePage, familyPage] = primary
    ? await Promise.all([
        loadService(primary.service.slug),
        loadFamily(primary.family.slug),
      ])
    : [null, null]

  // Ohne eigene Stelle gilt die verantwortliche Stelle des Services.
  const ownResponsible = leistung.responsible.length > 0
  const responsible = ownResponsible
    ? leistung.responsible
    : (primary?.service.responsible ?? [])
  const hasInfoLinks = visibleLinks(leistung.links).length > 0
  const updatedAt = formatDate(leistung.updatedAt)
  const lead = leadText(leistung.summary, leistung.description)

  const toc = [
    { id: "beschreibung", label: "Beschreibung" },
    ...(leistung.audiences.length > 0 || leistung.applications.length > 0
      ? [{ id: "eckdaten", label: "Eckdaten" }]
      : []),
    { id: "verantwortlich", label: "Zuständigkeit" },
    ...(hasInfoLinks
      ? [{ id: "weitere-informationen", label: "Weitere Informationen" }]
      : []),
  ]

  return (
    <ContentPage
      breadcrumbs={breadcrumbs}
      sideNav={
        primary ? (
          <ServiceTreeSideNav
            family={primary.family}
            services={
              familyPage?.ok ? familyPage.data.services : [primary.service]
            }
            currentServiceId={primary.service.id}
            leistungen={
              servicePage?.ok ? servicePage.data.leistungen : [leistung]
            }
            currentLeistungId={leistung.id}
          />
        ) : null
      }
    >
      <PageTitle eyebrow={leistung.subtypeLabel ?? "Leistung"} lead={lead}>
        {leistung.name}
      </PageTitle>

      {/* Hauptaufgabe der Seite: bestellen bzw. anfragen. */}
      <ServiceUseBox
        actions={leistung.actions}
        fallback={
          <p>
            Für diese Leistung ist im Portal noch kein Bestell- oder Anfrageweg
            hinterlegt.{" "}
            {responsible.length > 0 ? (
              <>
                Bitte wenden Sie sich an die verantwortliche Stelle:{" "}
                <strong>{orgUnitNames(responsible)}</strong>.
              </>
            ) : (
              "Bitte wenden Sie sich an den Service Desk des AIO."
            )}
          </p>
        }
      />

      <TableOfContents items={toc} />

      <Section id="beschreibung" title="Beschreibung">
        {leistung.description ? (
          <MarkdownText headingLevel={3}>{leistung.description}</MarkdownText>
        ) : (
          <p>Für diese Leistung ist noch keine Beschreibung erfasst.</p>
        )}
      </Section>

      {leistung.audiences.length > 0 || leistung.applications.length > 0 ? (
        <Section id="eckdaten" title="Eckdaten">
          <dl className="grid gap-x-12 gap-y-6 sm:grid-cols-2">
            {leistung.audiences.length > 0 ? (
              <div className="flex flex-col gap-2">
                <dt className="type-title-sm">Leistungsbezüger</dt>
                <dd>
                  <DashList
                    items={leistung.audiences.map((audience) => ({
                      key: audience.id,
                      content: audience.name,
                    }))}
                  />
                </dd>
              </div>
            ) : null}
            {leistung.applications.length > 0 ? (
              <div className="flex flex-col gap-2">
                <dt className="type-title-sm">Anwendungen</dt>
                <dd>
                  <DashList
                    items={leistung.applications.map((application) => ({
                      key: application.id,
                      content: application.name,
                    }))}
                  />
                </dd>
              </div>
            ) : null}
          </dl>
        </Section>
      ) : null}

      <ResponsibleBox
        units={responsible}
        persons={leistung.persons}
        note={
          !ownResponsible && responsible.length > 0
            ? "Verantwortliche Stelle des Services"
            : undefined
        }
      />

      {hasInfoLinks ? (
        <Section id="weitere-informationen" title="Weitere Informationen">
          <InfoLinks links={leistung.links} />
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
                    className="link-text"
                  >
                    {family.name}
                  </Link>
                  {" › "}
                  <Link href={`/service/${service.slug}`} className="link-text">
                    {service.name}
                  </Link>
                </>
              ),
            }))}
          />
        </Section>
      ) : null}

      {updatedAt ? (
        <p className="type-body-sm">
          Stand:{" "}
          <time dateTime={leistung.updatedAt ?? undefined}>{updatedAt}</time>
        </p>
      ) : null}
    </ContentPage>
  )
}
