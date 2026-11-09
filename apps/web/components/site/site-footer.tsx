import Link from "next/link"
import type { CatalogStatus, FamilySummary } from "@workspace/api"
import { ArrowRightIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { serverClient } from "@/lib/orpc-server"
import { cn } from "@/lib/utils"

import { currentYear, formatDateTime } from "./format"

interface FooterData {
  status: CatalogStatus | null
  families: FamilySummary[]
}

async function loadFooterData(): Promise<FooterData> {
  // Die Fusszeile darf eine Seite nie scheitern lassen.
  try {
    const overview = await serverClient.catalog.overview()
    return { status: overview.status, families: overview.families }
  } catch {
    try {
      return { status: await serverClient.catalog.status(), families: [] }
    } catch {
      return { status: null, families: [] }
    }
  }
}

/**
 * Fusszeile nach so.ch: Schieferfläche mit 10-px-Ecken, eingerückt vom
 * Fensterrand; links Absender (CD-Manual: Amtsbezeichnung in Black Italic),
 * Datenstand und Schaltflächen, rechts Direktlinks auf die Service-Familien;
 * darunter eine weisse Meta-Zeile mit Copyright.
 */
export async function SiteFooter({
  variant = "public",
}: {
  /** `admin`: ohne Direktlinks und Datenstand (dort im Admin-Bereich). */
  variant?: "public" | "admin"
}) {
  const { status, families } =
    variant === "public"
      ? await loadFooterData()
      : { status: null, families: [] }
  const generatedAt =
    status?.available && status.generatedAt
      ? formatDateTime(status.generatedAt)
      : null

  return (
    <footer className="mt-16 lg:mt-24">
      <div className="px-4 lg:px-6">
        <div className="on-dark mx-auto max-w-chrome rounded-tile bg-secondary text-secondary-foreground">
          <div
            className={cn(
              "container-page grid gap-x-6 gap-y-12 py-12 lg:grid-cols-3 lg:gap-y-16",
              variant === "public" ? "lg:py-24" : "lg:py-16"
            )}
          >
            <div className="flex flex-col gap-8">
              <address className="flex flex-col gap-1 not-italic">
                <span className="type-headline-sm font-bold italic">
                  Amt für Informatik und Organisation
                </span>
                <span>Kanton Solothurn</span>
                <span>Business-IT-Serviceportal</span>
              </address>

              {variant === "public" ? (
                <div className="flex flex-col gap-2 type-body-md">
                  {generatedAt ? (
                    <p>
                      Stand der Daten:{" "}
                      <time dateTime={status?.generatedAt ?? undefined}>
                        {generatedAt}
                      </time>
                    </p>
                  ) : (
                    <p>Der Katalog ist derzeit nicht verfügbar.</p>
                  )}
                  {status?.source === "demo" ? (
                    <p>
                      <strong>Demo-Daten:</strong> Die Inhalte stammen aus einem
                      Testdatensatz, nicht direkt aus LeanIX.
                    </p>
                  ) : null}
                  {status?.stale ? (
                    <p>
                      <strong>Hinweis:</strong> Die Daten konnten seit längerer
                      Zeit nicht aus LeanIX aktualisiert werden.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <ul className="flex flex-col items-start gap-3">
                <li>
                  <Link
                    href={variant === "public" ? "/suche" : "/"}
                    className={buttonVariants({ variant: "on-dark" })}
                  >
                    {variant === "public" ? "Alle Leistungen" : "Zum Portal"}
                    <ArrowRightIcon aria-hidden="true" strokeWidth={1.5} />
                  </Link>
                </li>
              </ul>
            </div>

            {families.length > 0 ? (
              <nav
                aria-labelledby="fuss-direktlinks"
                className="flex flex-col gap-4 lg:col-span-2"
              >
                <h2 id="fuss-direktlinks" className="type-nav-meta">
                  Service-Familien
                </h2>
                <ul className="grid gap-x-6 sm:grid-cols-2">
                  {families.map((family) => (
                    <li key={family.id} className="border-b border-steel">
                      <Link
                        href={`/kategorie/${family.slug}`}
                        className="group flex min-h-11 items-center justify-between gap-4 py-6 type-body-lg"
                      >
                        <span className="group-hover:underline">
                          {family.name}
                        </span>
                        <span
                          aria-hidden="true"
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-background text-secondary transition-shadow duration-150 group-hover:shadow-press-light"
                        >
                          <ArrowRightIcon
                            strokeWidth={1.5}
                            className="size-5"
                          />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
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
              href="/admin"
              className="inline-flex min-h-11 items-center transition-colors duration-200 hover:text-primary"
            >
              Administration
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  )
}
