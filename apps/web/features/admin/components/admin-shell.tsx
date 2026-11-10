import { SiteFooterFrame } from "@/components/site/site-footer-frame"
import { MetaLink, SiteHeader } from "@/components/site/site-header"

import { ADMIN_TABS } from "./admin-nav"

/**
 * Rahmen für den Admin-Bereich, die Anmeldeseiten und Fehlerseiten: Kopf
 * (im Admin-Bereich mit Reitern und angemeldetem Konto), Inhalt in der
 * Seitenbreite und Fusszeile mit Absender. Ohne Server-Aufrufe, damit er
 * auch in Fehlerseiten (Client Components) nutzbar ist.
 */
export function AdminShell({
  variant = "admin",
  withTabs = false,
  account,
  children,
}: {
  /** `public` z. B. für Fehlerseiten des öffentlichen Portals. */
  variant?: "admin" | "public"
  /** Reiter des Admin-Bereichs anzeigen (nur für angemeldete Admins). */
  withTabs?: boolean
  /** Angemeldetes Konto (Name, «Abmelden»), siehe `SiteHeader`. */
  account?: React.ReactNode
  children: React.ReactNode
}) {
  const isAdmin = variant === "admin"
  return (
    <div className="flex min-h-svh flex-col">
      {isAdmin ? (
        <SiteHeader
          variant="admin"
          tabs={withTabs ? ADMIN_TABS : []}
          tabsLabel="Administration"
          account={account}
          meta={[
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
      ) : (
        <SiteHeader />
      )}
      <main
        id="inhalt"
        tabIndex={-1}
        className="container-page flex-1 pt-8 outline-none lg:pt-12"
      >
        {children}
      </main>
      <SiteFooterFrame
        compact
        cta={
          isAdmin
            ? { href: "/", label: "Zum Portal" }
            : { href: "/suche", label: "Alle Leistungen" }
        }
      />
    </div>
  )
}
