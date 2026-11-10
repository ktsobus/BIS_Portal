import type { Metadata } from "next"
import Link from "next/link"

import { PageHead } from "@/components/site/page-head"
import { Badge } from "@/components/ui/badge"
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
import { loadLeistung, loadStatus } from "@/features/catalog/load"
import { FALLBACK_ACTION_ID } from "@/features/catalog/server/fallback"
import { formatDate } from "@/lib/format"

export async function generateMetadata({
  params,
}: PageProps<"/leistung/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const page = await loadLeistung(slug)
  if (!page.ok) return { title: "Katalog nicht verfügbar" }
  return {
    title: page.data.leistung.name,
    description: page.data.leistung.summary ?? undefined,
  }
}

export default async function LeistungPage({
  params,
}: PageProps<"/leistung/[slug]">) {
  const { slug } = await params
  const page = await loadLeistung(slug)
  if (!page.ok) {
    const status = await loadStatus()
    return (
      <CatalogUnavailable
        contact={status?.contact}
        retryHref={`/leistung/${slug}`}
      />
    )
  }
  const { leistung, placements, parent, children, status } = page.data
  const [home] = placements
  const updated = formatDate(leistung.updatedAt)
  // Die Standard-Aktion (Service Desk) steht für «kein eigener Bestellweg».
  const onlyFallback =
    leistung.actions.length > 0 &&
    leistung.actions.every((action) => action.id === FALLBACK_ACTION_ID)

  return (
    <>
      <PageHead
        title={leistung.name}
        crumbs={[
          { label: "Katalog", href: "/" },
          ...(home
            ? [
                {
                  label: home.family.name,
                  href: `/kategorie/${home.family.slug}`,
                },
                {
                  label: home.service.name,
                  href: `/service/${home.service.slug}`,
                },
              ]
            : []),
          { label: leistung.name },
        ]}
        meta={
          leistung.subtypeLabel ? <Badge>{leistung.subtypeLabel}</Badge> : null
        }
      />
      {/*
        Schmal: «Nächster Schritt» zuerst, dann die Beschreibung, dann die
        übrigen Angaben. Breit: Beschreibung links, alles andere rechts.
      */}
      <div className="container-page grid gap-x-12 gap-y-8 py-8 md:py-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-y-10">
        <div className="min-w-0 space-y-10 max-lg:order-2">
          <Card className="p-5 md:p-8">
            <section aria-labelledby="beschreibung-titel">
              <h2 id="beschreibung-titel" className="sr-only">
                Beschreibung
              </h2>
              {leistung.description ? (
                <MarkdownText className="text-[1.0625rem]">
                  {leistung.description}
                </MarkdownText>
              ) : (
                <p className="max-w-[60ch] text-muted">
                  Für diese Leistung ist in LeanIX noch keine Beschreibung
                  erfasst.
                </p>
              )}
            </section>
          </Card>

          {parent ? (
            <section aria-labelledby="teil-von-titel">
              <h2 id="teil-von-titel" className="text-2xl font-bold">
                Teil der Leistung
              </h2>
              <div className="mt-4">
                <LeistungList leistungen={[parent]} />
              </div>
            </section>
          ) : null}

          {children.length > 0 ? (
            <section aria-labelledby="teilleistungen-titel">
              <h2 id="teilleistungen-titel" className="text-2xl font-bold">
                Dazu gehören
              </h2>
              <div className="mt-4">
                <LeistungList leistungen={children} />
              </div>
            </section>
          ) : null}
        </div>

        <aside className="max-lg:contents lg:sticky lg:top-6 lg:space-y-5 lg:self-start">
          <Card className="p-5 max-lg:order-1">
            <h2 className="text-lg font-bold">Nächster Schritt</h2>
            {leistung.actions.length > 0 ? (
              <>
                {onlyFallback ? (
                  <p className="mt-1.5 text-sm text-text">
                    Für diese Leistung gibt es kein eigenes Formular. Der
                    Service Desk nimmt Ihr Anliegen entgegen.
                  </p>
                ) : null}
                <ActionLinks
                  actions={leistung.actions}
                  size="lg"
                  stretch
                  fallbackPrimary
                  className="mt-3"
                />
              </>
            ) : (
              <NoRequestPathHint
                message="Für diese Leistung ist kein Bestell- oder Anfrageweg erfasst."
                responsible={leistung.responsible}
                contact={status.contact}
                className="mt-1.5"
              />
            )}
          </Card>

          <div className="space-y-5 max-lg:order-3">
            {leistung.responsible.length > 0 ? (
              <DetailSection title="Verantwortlich">
                <OrgUnitList units={leistung.responsible} />
              </DetailSection>
            ) : null}
            {leistung.persons.length > 0 ? (
              <DetailSection title="Ansprechpersonen">
                <PersonList persons={leistung.persons} />
              </DetailSection>
            ) : null}
            {leistung.audiences.length > 0 ? (
              <DetailSection title="Leistungsbezüger">
                <p>{leistung.audiences.map((item) => item.name).join(", ")}</p>
              </DetailSection>
            ) : null}
            {leistung.applications.length > 0 ? (
              <DetailSection title="Anwendungen">
                <p>
                  {leistung.applications.map((item) => item.name).join(", ")}
                </p>
              </DetailSection>
            ) : null}
            {placements.length > 0 ? (
              <DetailSection
                title={
                  placements.length > 1
                    ? "Gehört zu den Services"
                    : "Gehört zum Service"
                }
              >
                <ul className="space-y-1">
                  {placements.map(({ service, family }) => (
                    <li key={service.id}>
                      <Link href={`/service/${service.slug}`} className="link">
                        {service.name}
                      </Link>
                      <span className="block text-xs text-muted">
                        {family.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </DetailSection>
            ) : null}
            {leistung.links.length > 0 ? (
              <DetailSection title="Weitere Informationen">
                <InfoLinkList links={leistung.links} />
              </DetailSection>
            ) : null}
            {updated ? (
              <DetailSection title="Stand">
                <p>Zuletzt geändert am {updated}</p>
              </DetailSection>
            ) : null}
          </div>
        </aside>
      </div>
    </>
  )
}
