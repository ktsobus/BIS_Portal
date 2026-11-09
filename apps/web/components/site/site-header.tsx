import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { BrandLogo } from "./brand-logo"
import { siteContainer } from "./container"
import { SiteNav } from "./site-nav"
import { SiteSearch } from "./site-search"

/** Pfad des Original-Logos (wird separat bereitgestellt, nicht nachgebaut). */
const LOGO_SRC = "/brand/kanton-solothurn-logo.svg"

/*
 * Logo und Schutzraum (CD-Manual, docs/branding.md): Logohöhe X = 20 px,
 * ab sm 24 px (≥ 16 px, damit «KANTON» lesbar bleibt). Rundum mindestens X
 * frei: Innenabstand oben/unten (py-5 / sm:py-6), Abstand zum Portalnamen
 * (mobil gap-y-5 darunter, ab sm gap-x-8 bis zur Trennlinie) und zur
 * umbrechenden Navigation (gap-y-5 / sm:gap-y-6).
 */
export function SiteHeader({
  variant = "public",
}: {
  /** `admin` zeigt zusätzlich die Admin-Kennzeichnung. */
  variant?: "public" | "admin"
}) {
  const isAdmin = variant === "admin"

  return (
    <header data-variant={variant} className="border-b border-border">
      <div
        className={cn(
          siteContainer,
          "flex flex-wrap items-center gap-x-6 gap-y-5 py-5 sm:gap-y-6 sm:py-6"
        )}
      >
        <div className="mr-auto flex min-w-0 flex-col items-start gap-y-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-6">
          <Link
            href="/"
            className="group flex min-w-0 flex-col items-start gap-y-5 sm:flex-row sm:items-center sm:gap-x-8"
          >
            <BrandLogo
              src={LOGO_SRC}
              alt="Kanton Solothurn"
              className="block h-5 w-auto shrink-0 sm:h-6"
            />
            <span className="text-base leading-tight group-hover:underline sm:border-l sm:border-border sm:py-1 sm:pl-4 sm:text-lg">
              Business-IT-Serviceportal
            </span>
          </Link>
          {isAdmin ? (
            <span className="bg-foreground px-2 py-0.5 text-xs font-bold tracking-[0.06em] text-background uppercase">
              Administration
            </span>
          ) : null}
        </div>

        {isAdmin ? (
          <nav aria-label="Hauptnavigation">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-1.5 px-2 text-base hover:underline"
            >
              <ArrowLeftIcon aria-hidden="true" className="size-4" />
              Zurück zum Portal
            </Link>
          </nav>
        ) : (
          <div className="flex items-center gap-4">
            <SiteNav
              items={[
                { href: "/", label: "Start" },
                { href: "/suche", label: "Suche" },
              ]}
            />
            <SiteSearch />
          </div>
        )}
      </div>
    </header>
  )
}
