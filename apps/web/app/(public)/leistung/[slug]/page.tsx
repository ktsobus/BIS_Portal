import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { ActionButtons, TextLink } from "@/features/catalog/components/actions"
import {
  LeistungEntries,
  OrgUnits,
  Persons,
} from "@/features/catalog/components/lists"
import { MarkdownText } from "@/features/catalog/components/markdown"
import {
  CatalogFrame,
  Crumbs,
  type Crumb,
} from "@/features/catalog/components/page-frame"
import {
  CatalogUnavailable,
  NoRequestPathHint,
} from "@/features/catalog/components/support-contact"
import { safeHref } from "@/features/catalog/links"
import { loadLeistung, loadStatus } from "@/features/catalog/load"
import { markdownToPlainText, plainExcerpt } from "@/features/catalog/text"
import { formatDate } from "@/lib/format"

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
  if (!result.ok) {
    return (
      <CatalogFrame>
        <CatalogUnavailable contact={(await loadStatus())?.contact} />
      </CatalogFrame>
    )
  }

  const { leistung, placements, parent, children, status } = result.data
  if (leistung.slug !== slug) redirect(`/leistung/${leistung.slug}`)

  const primary = placements[0]
  const crumbs: Crumb[] = [{ label: "Katalog", href: "/#kategorien" }]
  if (primary) {
    crumbs.push(
      { label: primary.family.name, href: `/kategorie/${primary.family.slug}` },
      { label: primary.service.name, href: `/service/${primary.service.slug}` }
    )
  } else if (parent) {
    crumbs.push({ label: parent.name, href: `/leistung/${parent.slug}` })
  }
  crumbs.push({ label: leistung.name })

  // Ohne eigene Stelle gilt die verantwortliche Stelle des Services.
  const responsible =
    leistung.responsible.length > 0
      ? leistung.responsible
      : (primary?.service.responsible ?? [])
  const infoLinks = leistung.links.filter((link) => safeHref(link.url))
  const actions = leistung.actions.filter((action) => safeHref(action.url))
  const updatedAt = formatDate(leistung.updatedAt)
  // Die Kurzbeschreibung ist oft der Anfang der Beschreibung: dann nicht doppelt zeigen.
  const summaryStart = markdownToPlainText(leistung.summary).slice(0, 80)
  const showLead =
    Boolean(summaryStart) &&
    !markdownToPlainText(leistung.description).startsWith(summaryStart)

  return (
    <CatalogFrame>
      <div className="wrap">
        <div className="page-head">
          <Crumbs items={crumbs} />
          <h1>{leistung.name}</h1>
          {showLead ? <p className="t-lead">{leistung.summary}</p> : null}
          {actions.length > 0 ? (
            <div className="btn-row">
              <ActionButtons actions={actions} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="wrap grid grid--top">
        <div className="span-7">
          {actions.length === 0 ? (
            <div className="note" style={{ marginBottom: "var(--s-6)" }}>
              <NoRequestPathHint
                message="Für diese Leistung ist im Portal noch kein Bestell- oder Anfrageweg hinterlegt."
                responsible={responsible}
                contact={status.contact}
              />
            </div>
          ) : null}
          {leistung.description ? (
            <MarkdownText headingLevel={2}>{leistung.description}</MarkdownText>
          ) : (
            <p className="muted">
              Für diese Leistung ist noch keine Beschreibung erfasst.
            </p>
          )}
        </div>
        <aside className="span-4 start-9" aria-label="Angaben zur Leistung">
          <div className="aside-card">
            <dl className="facts">
              <div>
                <dt>Art</dt>
                <dd>{leistung.subtypeLabel ?? "Leistung"}</dd>
              </div>
              <div>
                <dt>Verantwortlich</dt>
                <OrgUnits units={responsible} />
                <Persons persons={leistung.persons} />
              </div>
              {leistung.audiences.length > 0 ? (
                <div>
                  <dt>Leistungsbezüger</dt>
                  {leistung.audiences.map((audience) => (
                    <dd key={audience.id}>{audience.name}</dd>
                  ))}
                </div>
              ) : null}
              {leistung.applications.length > 0 ? (
                <div>
                  <dt>Anwendungen</dt>
                  {leistung.applications.map((application) => (
                    <dd key={application.id}>{application.name}</dd>
                  ))}
                </div>
              ) : null}
              {infoLinks.length > 0 ? (
                <div>
                  <dt>Weitere Informationen</dt>
                  {infoLinks.map((link) => (
                    <dd key={link.id} className="linklist">
                      <TextLink href={link.url}>{link.label}</TextLink>
                      {link.description ? (
                        <small>{link.description}</small>
                      ) : null}
                    </dd>
                  ))}
                </div>
              ) : null}
              {placements.length > 1 ? (
                <div>
                  <dt>Auch zu finden unter</dt>
                  {placements.map(({ family, service }) => (
                    <dd key={service.id} className="linklist">
                      <a href={`/service/${service.slug}`}>{service.name}</a>
                      <small>{family.name}</small>
                    </dd>
                  ))}
                </div>
              ) : null}
              {updatedAt ? (
                <div>
                  <dt>Zuletzt geändert</dt>
                  <dd>
                    <time dateTime={leistung.updatedAt ?? undefined}>
                      {updatedAt}
                    </time>
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </aside>
      </div>

      {parent ? (
        <div className="wrap">
          <div className="block-head">
            <h2>Übergeordnete Leistung</h2>
          </div>
          <LeistungEntries leistungen={[parent]} />
        </div>
      ) : null}
      {children.length > 0 ? (
        <div className="wrap">
          <div className="block-head">
            <h2>Untergeordnete Leistungen</h2>
            <p>{children.length}</p>
          </div>
          <LeistungEntries leistungen={children} />
        </div>
      ) : null}
    </CatalogFrame>
  )
}
