import { SiteFooter } from "@/components/site/site-footer"
import {
  MetaLink,
  SiteHeader,
  type MetaItem,
} from "@/components/site/site-header"

import { ADMIN_TABS } from "./admin-nav"

/**
 * Rahmen für den Admin-Bereich und die Anmeldeseiten: Kopf mit
 * Admin-Kennzeichnung, im Admin-Bereich die Reiter (Katalog, Benutzer, …)
 * und die Angaben zur angemeldeten Person; Inhalt in der Seitenbreite.
 */
export function AdminShell({
  withTabs = false,
  meta,
  children,
}: {
  /** Reiter des Admin-Bereichs anzeigen (nur für angemeldete Admins). */
  withTabs?: boolean
  /** Zusätzliche Einträge der Meta-Navigation (vor «Zum Portal»). */
  meta?: MetaItem[]
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader
        variant="admin"
        tabs={withTabs ? ADMIN_TABS : []}
        tabsLabel="Administration"
        meta={[
          ...(meta ?? []),
          {
            key: "portal",
            node: (
              <MetaLink href="/" icon={false}>
                Zum Portal
              </MetaLink>
            ),
          },
        ]}
      />
      <main
        id="inhalt"
        tabIndex={-1}
        className="container-page flex-1 pt-8 outline-none lg:pt-12"
      >
        {children}
      </main>
      <SiteFooter variant="admin" />
    </div>
  )
}
