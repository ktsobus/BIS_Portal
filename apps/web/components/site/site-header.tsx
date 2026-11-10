import type { ReactNode } from "react"
import Link from "next/link"

import { Logo } from "./logo"

/**
 * Kopfzeile auf Weiss (das farbige Logo steht nur auf weissem Grund).
 * `children` ist die Navigation des jeweiligen Bereichs.
 */
export function SiteHeader({
  children,
  homeHref = "/",
}: {
  children?: ReactNode
  homeHref?: string
}) {
  return (
    <header className="border-b border-line bg-white">
      <div className="container-page flex min-h-[68px] flex-wrap items-center gap-x-6 gap-y-1 py-2">
        <Link
          href={homeHref}
          aria-label="BITS-Portal, Startseite"
          className="flex items-center gap-5 rounded-sm py-5 sm:gap-6"
        >
          <Logo />
          <span className="hidden border-l border-line pl-5 text-base font-bold text-ink min-[30rem]:block sm:pl-6">
            BITS-Portal
          </span>
        </Link>
        {children}
      </div>
    </header>
  )
}

/** Sprungmarke für Tastatur und Screenreader. */
export function SkipLink() {
  return (
    <a
      href="#inhalt"
      className="sr-only rounded-md bg-white px-4 py-2 font-bold text-blue focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:border focus:border-blue"
    >
      Zum Inhalt springen
    </a>
  )
}
