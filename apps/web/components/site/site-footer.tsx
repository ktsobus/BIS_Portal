import Link from "next/link"

import {
  hasSupportContact,
  SupportContactLinks,
} from "@/features/catalog/components/support-contact"
import { loadStatus } from "@/features/catalog/load"
import { cn } from "@/lib/utils"

import { siteContainer } from "./container"
import { formatDateTime } from "./format"

/**
 * Fusszeile mit Absender (CD: Black Italic), Kontakt zum Service Desk (falls
 * konfiguriert) und Stand der Katalogdaten.
 */
export async function SiteFooter() {
  // Scheitert nie: Die Fusszeile darf eine Seite nicht scheitern lassen.
  const status = await loadStatus()
  const contact = status?.contact
  const generatedAt =
    status?.available && status.generatedAt
      ? formatDateTime(status.generatedAt)
      : null

  return (
    <footer className="mt-16 border-t border-border bg-so-surface">
      <div
        className={cn(
          siteContainer,
          "flex flex-col gap-6 py-8 text-sm md:flex-row md:items-start md:justify-between"
        )}
      >
        <div className="flex flex-col gap-1">
          <p className="text-lg leading-tight font-bold italic">
            Amt für Informatik und Organisation
          </p>
          <p className="text-muted-foreground">
            Kanton Solothurn · Business-IT-Serviceportal
          </p>
        </div>

        {hasSupportContact(contact) ? (
          <section
            aria-labelledby="footer-kontakt"
            className="flex flex-col gap-1.5"
          >
            <h2 id="footer-kontakt" className="text-sm font-bold">
              Kontakt Service Desk
            </h2>
            <SupportContactLinks contact={contact} variant="links" />
          </section>
        ) : null}

        <div className="flex max-w-[44ch] flex-col gap-1.5">
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
              <strong>Hinweis:</strong> Die Daten konnten seit längerer Zeit
              nicht aus LeanIX aktualisiert werden.
            </p>
          ) : null}
          <p>
            <Link href="/sign-in" className="link-cd text-muted-foreground">
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
