import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { ActionButtons, TextLink } from "@/features/catalog/components/actions"
import {
  LeistungEntries,
  OrgUnits,
  Persons,
} from "@/features/catalog/components/lists"
import { MarkdownText } from "@/features/catalog/components/markdown"
import { CatalogFrame, Crumbs } from "@/features/catalog/components/page-frame"
import {
  CatalogUnavailable,
  NoRequestPathHint,
} from "@/features/catalog/components/support-contact"
import { safeHref } from "@/features/catalog/links"
import { loadService, loadStatus } from "@/features/catalog/load"
import { countLabel, plainExcerpt } from "@/features/catalog/text"

export async function generateMetadata({
  params,
}: PageProps<"/service/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const result = await loadService(slug)
  if (!result.ok) return { title: "Katalog nicht verfügbar" }
  const { service } = result.data
  return {
    title: service.name,
    description: plainExcerpt(service.definition, 160) ?? undefined,
  }
}

export default async function ServicePage({
  params,
}: PageProps<"/service/[slug]">) {
  const { slug } = await params
  const result = await loadService(slug)
  if (!result.ok) {
    return (
      <CatalogFrame>
        <CatalogUnavailable contact={(await loadStatus())?.contact} />
      </CatalogFrame>
    )
  }

  const { family, service, leistungen, status } = result.data
  if (service.slug !== slug) redirect(`/service/${service.slug}`)

  const infoLinks = service.links.filter((link) => safeHref(link.url))
  const actions = service.actions.filter((action) => safeHref(action.url))

  return (
    <CatalogFrame>
      <div className="wrap">
        <div className="page-head">
          <Crumbs
            items={[
              { label: "Katalog", href: "/#kategorien" },
              { label: family.name, href: `/kategorie/${family.slug}` },
              { label: service.name },
            ]}
          />
          <h1>{service.name}</h1>
        </div>
      </div>

      <div className="wrap grid grid--top">
        <div className="span-7">
          {service.definition ? (
            <MarkdownText headingLevel={2}>{service.definition}</MarkdownText>
          ) : (
            <p className="muted">
              Für diesen Service ist noch keine Beschreibung erfasst.
            </p>
          )}
        </div>
        <aside className="span-4 start-9" aria-label="Angaben zum Service">
          <div className="aside-card">
            <dl className="facts">
              <div>
                <dt>Verantwortlich</dt>
                <OrgUnits units={service.responsible} />
                <Persons persons={service.persons} />
              </div>
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
            </dl>
            {actions.length > 0 ? (
              <div style={{ marginTop: "var(--s-5)" }}>
                <ActionButtons actions={actions} />
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      <div className="wrap" id="leistungen">
        <div className="block-head">
          <h2>Leistungen</h2>
          {leistungen.length > 0 ? (
            <p>{countLabel(leistungen.length, "Leistung", "Leistungen")}</p>
          ) : null}
        </div>
        {leistungen.length > 0 ? (
          <LeistungEntries leistungen={leistungen} />
        ) : (
          <div className="note">
            <NoRequestPathHint
              emphasize
              message="Für diesen Service sind im Portal noch keine Leistungen erfasst."
              responsible={service.responsible}
              contact={status.contact}
            />
          </div>
        )}
      </div>
    </CatalogFrame>
  )
}
