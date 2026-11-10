import Link from "next/link"
import { CircleUserRoundIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { BrandLogo } from "./brand-logo"
import { HeaderSearch } from "./header-search"
import { MobileMenu } from "./mobile-menu"
import { PrimaryTabs, type PrimaryTab } from "./primary-tabs"

/** Pfad des Original-Logos (wird separat bereitgestellt, nicht nachgebaut). */
const LOGO_SRC = "/brand/kanton-solothurn-logo.svg"

/** Reiter des öffentlichen Portals: Katalog und Suche. */
const PUBLIC_TABS: PrimaryTab[] = [
  {
    href: "/",
    label: "Services",
    match: ["/", "/kategorie", "/service", "/leistung"],
  },
  { href: "/suche", label: "Suche" },
]

/** Einträge der Meta-Navigation (oben rechts bzw. im mobilen Menü). */
export interface MetaItem {
  key: string
  node: React.ReactNode
}

/**
 * Seitenkopf nach so.ch: Logo oben links, Meta-Navigation oben rechts,
 * Hauptreiter unten links, Suchfeld unten rechts; weiss mit Haarlinie. Der
 * Kopf steht in derselben Seitenbreite wie Inhalt und Fusszeile, damit Logo,
 * Reiter und Titel an einer Kante beginnen.
 * Mobil wandern Meta-Navigation und Suche in ein aufklappbares Menü, die
 * Reiter bleiben unter dem Logo sichtbar.
 */
export function SiteHeader({
  variant = "public",
  tabs,
  tabsLabel = "Hauptnavigation",
  meta,
  account,
}: {
  /** `admin` kennzeichnet den Admin-Bereich und blendet die Suche aus. */
  variant?: "public" | "admin"
  /** Standard: Reiter des Portals; `[]` für Seiten ohne Reiter. */
  tabs?: PrimaryTab[]
  tabsLabel?: string
  meta?: MetaItem[]
  /**
   * Angemeldetes Konto (Name, «Abmelden») als benannte Region, damit es per
   * Landmarken-Navigation erreichbar ist; steht vor der Meta-Navigation.
   */
  account?: React.ReactNode
}) {
  const isAdmin = variant === "admin"
  const items = tabs ?? (isAdmin ? [] : PUBLIC_TABS)
  const metaItems: MetaItem[] = meta ?? [
    {
      key: "admin",
      node: <MetaLink href="/admin">Administration</MetaLink>,
    },
  ]
  const hasTabs = items.length > 0
  const hasSearch = !isAdmin

  return (
    <header data-variant={variant} className="border-b border-hairline">
      <div
        className={cn(
          "container-page grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,35.625rem)] lg:gap-x-12",
          !hasTabs && "pb-5 lg:pb-8"
        )}
      >
        {/* Logo mit Schutzraum (mindestens eine Logohöhe) und Portalname. */}
        <div className="col-start-1 row-start-1 flex min-w-0 flex-col gap-y-4 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 lg:pt-8">
          <Link
            href="/"
            aria-label="Business-IT-Serviceportal, Startseite"
            className="-m-4 inline-flex shrink-0 self-start p-4 sm:self-auto"
          >
            <BrandLogo
              src={LOGO_SRC}
              alt="Kanton Solothurn"
              className="block h-4 w-auto"
            />
          </Link>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 type-nav-meta">
            <span>Business-IT-Serviceportal</span>
            {isAdmin ? <span className="sr-only">,</span> : null}
            {isAdmin ? (
              <span className="inline-flex min-h-6 items-center rounded-full bg-secondary px-2.5 py-1 type-eyebrow text-secondary-foreground">
                Administration
              </span>
            ) : null}
          </p>
        </div>

        {metaItems.length > 0 || account ? (
          <div className="col-start-2 row-start-1 hidden items-center gap-x-10 justify-self-end pt-7 lg:flex">
            {account ? (
              <section
                aria-label="Angemeldetes Konto"
                className="flex items-center gap-x-10"
              >
                {account}
              </section>
            ) : null}
            {metaItems.length > 0 ? (
              <nav aria-label="Meta-Navigation">
                <ul className="flex items-center gap-x-10">
                  {metaItems.map((item) => (
                    <li key={item.key}>{item.node}</li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </div>
        ) : null}

        {hasSearch || metaItems.length > 0 || account ? (
          <MobileMenu
            buttonClassName="col-start-2 row-start-1 mt-4 justify-self-end"
            panelClassName="col-span-full row-start-3 mt-px flex flex-col gap-4"
          >
            {hasSearch ? <HeaderSearch id="suche-mobil" /> : null}
            {account ? (
              <section
                aria-label="Angemeldetes Konto (mobil)"
                className="flex flex-wrap items-center gap-x-6 gap-y-1"
              >
                {account}
              </section>
            ) : null}
            {metaItems.length > 0 ? (
              <nav aria-label="Meta-Navigation (mobil)">
                <ul className="flex flex-col">
                  {metaItems.map((item) => (
                    <li
                      key={item.key}
                      className="border-b border-hairline py-2 last:border-b-0 last:pb-0"
                    >
                      {item.node}
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </MobileMenu>
        ) : null}

        {hasTabs ? (
          <div
            className={cn(
              "col-span-2 row-start-2 mt-4 self-end lg:mt-8",
              hasSearch && "lg:col-span-1"
            )}
          >
            <PrimaryTabs tabs={items} label={tabsLabel} />
          </div>
        ) : null}

        {hasSearch ? (
          <HeaderSearch
            id="suche-kopf"
            className="col-start-2 row-start-2 mb-1 hidden self-end lg:flex"
          />
        ) : null}
      </div>
    </header>
  )
}

/** Link der Meta-Navigation (16 px Black, Schiefer, Symbol im Kreis). */
export function MetaLink({
  href,
  children,
  icon = true,
}: {
  href: string
  children: React.ReactNode
  /** Rundes Personensymbol wie bei «my.so.ch». */
  icon?: boolean
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 type-nav-meta text-secondary transition-colors duration-200 hover:text-primary"
    >
      {children}
      {icon ? (
        <CircleUserRoundIcon
          aria-hidden="true"
          strokeWidth={1.5}
          className="size-6 text-primary"
        />
      ) : null}
    </Link>
  )
}
