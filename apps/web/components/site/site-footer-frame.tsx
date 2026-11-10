import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { currentYear } from "@/lib/format"
import { cn } from "@/lib/utils"

import { FooterSender } from "./footer-sender"

/**
 * Fusszeile nach so.ch ohne Datenzugriff: Schieferfläche mit 10-px-Ecken,
 * eingerückt vom Fensterrand; links Absender und Kontakt, rechts optional
 * Direktlinks; darunter eine weisse Meta-Zeile mit Copyright, Links und dem
 * Stand der Daten. Ohne Server-Aufrufe, damit sie auch in Fehlerseiten
 * (Client Components) nutzbar ist.
 */
export function SiteFooterFrame({
  info,
  directLinks,
  status,
  compact = false,
  signInLink = true,
}: {
  /** Unter dem Absender, z. B. der Kontakt zum Service Desk. */
  info?: React.ReactNode
  /** Rechte Spalten, z. B. Direktlinks auf die Service-Familien. */
  directLinks?: React.ReactNode
  /** Rechts in der Meta-Zeile, z. B. «Stand der Daten: …». */
  status?: React.ReactNode
  /** Weniger Innenabstand (Admin-Bereich, Fehlerseiten). */
  compact?: boolean
  /** «Anmeldung Administration» in der Meta-Zeile (nicht im Admin-Bereich). */
  signInLink?: boolean
}) {
  return (
    <footer className="mt-16 lg:mt-24">
      <div className="px-4 lg:px-6">
        <div className="on-dark mx-auto max-w-chrome rounded-tile bg-secondary text-secondary-foreground">
          <div
            className={cn(
              "container-page grid gap-x-6 gap-y-12 lg:grid-cols-3",
              compact ? "py-10 lg:py-12" : "py-12 lg:py-24"
            )}
          >
            <div className="flex flex-col gap-8">
              <FooterSender />
              {info}
            </div>
            {directLinks}
          </div>
        </div>
      </div>

      <div className="container-page flex flex-col gap-x-6 gap-y-1 py-6 type-body-sm md:flex-row md:items-center">
        <p className="text-ink">© {currentYear()}, Kanton Solothurn</p>
        <ul className="flex flex-wrap gap-x-6">
          <li>
            <Link href="/suche" className={metaLinkClass}>
              Suche
            </Link>
          </li>
          {signInLink ? (
            <li>
              <Link href="/sign-in" className={metaLinkClass}>
                Anmeldung Administration
              </Link>
            </li>
          ) : null}
        </ul>
        {status ? <p className="md:ml-auto md:text-right">{status}</p> : null}
      </div>
    </footer>
  )
}

const metaLinkClass =
  "inline-flex min-h-11 items-center transition-colors duration-200 hover:text-primary"

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
