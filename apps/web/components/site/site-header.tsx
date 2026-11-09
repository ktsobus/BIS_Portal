import Form from "next/form"
import Link from "next/link"
import { ArrowLeftIcon, SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { BrandLogo } from "./brand-logo"
import { siteContainer } from "./container"
import { SiteNav } from "./site-nav"

/** Pfad des Original-Logos (wird separat bereitgestellt, nicht nachgebaut). */
const LOGO_SRC = "/brand/kanton-solothurn-logo.svg"

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
          "flex flex-wrap items-center gap-x-6 gap-y-2 py-3 sm:py-4"
        )}
      >
        <div className="mr-auto flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            href="/"
            className="group flex min-w-0 flex-col gap-x-4 gap-y-1 sm:flex-row sm:items-center"
          >
            <BrandLogo
              src={LOGO_SRC}
              alt="Kanton Solothurn"
              className="block h-9 w-auto self-start sm:h-10 sm:self-center"
            />
            <span className="text-base leading-tight group-hover:underline sm:border-l sm:border-border sm:py-1.5 sm:pl-4 sm:text-lg">
              Business-IT-Serviceportal
            </span>
          </Link>
          {isAdmin ? (
            <span className="bg-foreground px-2 py-0.5 text-xs font-bold tracking-[0.06em] text-background uppercase sm:self-center">
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
            <Form
              action="/suche"
              role="search"
              aria-label="Katalog durchsuchen"
              className="hidden items-stretch md:flex"
            >
              <label htmlFor="site-search" className="sr-only">
                Suchbegriff
              </label>
              <input
                id="site-search"
                name="q"
                type="search"
                placeholder="Leistung suchen …"
                autoComplete="off"
                className="h-9 w-52 min-w-0 border border-r-0 border-input bg-background px-2.5 text-base placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="inline-flex h-9 w-9 items-center justify-center border border-foreground bg-foreground text-background hover:border-primary hover:bg-primary"
              >
                <SearchIcon aria-hidden="true" className="size-4" />
                <span className="sr-only">Suchen</span>
              </button>
            </Form>
          </div>
        )}
      </div>
    </header>
  )
}
