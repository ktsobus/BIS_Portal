import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { currentYear } from "@/lib/format"
import { cn } from "@/lib/utils"

import { FooterSender } from "./footer-sender"

/**
 * Fusszeile nach so.ch ohne Datenzugriff: Schieferfläche mit 10-px-Ecken,
 * eingerückt vom Fensterrand; links Absender, Zusatzangaben und eine
 * Schaltfläche, rechts optional Direktlinks; darunter eine weisse
 * Meta-Zeile mit Copyright. Ohne Server-Aufrufe, damit sie auch in
 * Fehlerseiten (Client Components) nutzbar ist.
 */
export function SiteFooterFrame({
  info,
  directLinks,
  cta,
  compact = false,
}: {
  /** Unter dem Absender, z. B. Kontakt und Stand der Daten. */
  info?: React.ReactNode
  /** Rechte Spalten, z. B. Direktlinks auf die Service-Familien. */
  directLinks?: React.ReactNode
  /** Schaltfläche auf der Schieferfläche (Pille mit Haarlinie). */
  cta: { href: string; label: string }
  /** Weniger Innenabstand (Admin-Bereich, Fehlerseiten). */
  compact?: boolean
}) {
  return (
    <footer className="mt-16 lg:mt-24">
      <div className="px-4 lg:px-6">
        <div className="on-dark mx-auto max-w-chrome rounded-tile bg-secondary text-secondary-foreground">
          <div
            className={cn(
              "container-page grid gap-x-6 gap-y-12 py-12 lg:grid-cols-3 lg:gap-y-16",
              compact ? "lg:py-16" : "lg:py-24"
            )}
          >
            <div className="flex flex-col gap-8">
              <FooterSender />
              {info}
              <ul className="flex flex-col items-start gap-3">
                <li>
                  <Link
                    href={cta.href}
                    className={buttonVariants({ variant: "on-dark" })}
                  >
                    {cta.label}
                    <ArrowRightIcon aria-hidden="true" strokeWidth={1.5} />
                  </Link>
                </li>
              </ul>
            </div>
            {directLinks}
          </div>
        </div>
      </div>

      <div className="container-chrome flex flex-col gap-x-6 gap-y-2 py-6 type-body-sm sm:flex-row sm:items-center">
        <p className="text-ink">© {currentYear()}, Kanton Solothurn</p>
        <ul className="flex flex-wrap gap-x-6">
          <li>
            <Link
              href="/suche"
              className="inline-flex min-h-11 items-center transition-colors duration-200 hover:text-primary"
            >
              Suche
            </Link>
          </li>
          <li>
            <Link
              href="/sign-in"
              className="inline-flex min-h-11 items-center transition-colors duration-200 hover:text-primary"
            >
              Anmeldung Administration
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  )
}

/**
 * Direktlinks auf der Schieferfläche: weisse Beschriftung (18 px) und rechts
 * ein weisser 32-px-Kreis mit Schiefer-Pfeil, getrennt durch Stahllinien.
 */
export function FooterDirectLinks({
  title,
  links,
}: {
  title: string
  links: { key: string; href: string; label: string }[]
}) {
  if (links.length === 0) return null
  return (
    <nav
      aria-labelledby="fuss-direktlinks"
      className="flex flex-col gap-4 lg:col-span-2"
    >
      <h2 id="fuss-direktlinks" className="type-nav-meta">
        {title}
      </h2>
      <ul className="grid gap-x-6 sm:grid-cols-2">
        {links.map((link) => (
          <li key={link.key} className="border-b border-steel">
            <Link
              href={link.href}
              className="group flex min-h-11 items-center justify-between gap-4 py-6 type-body-lg"
            >
              <span className="group-hover:underline">{link.label}</span>
              <span
                aria-hidden="true"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-background text-secondary transition-shadow duration-150 group-hover:shadow-press-light"
              >
                <ArrowRightIcon strokeWidth={1.5} className="size-5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
