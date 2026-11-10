import Link from "next/link"
import type { CatalogPublicStatus } from "@workspace/api"

import { Status } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/format"

import { hasSupportContact, SupportContactLinks } from "./support-contact"

/**
 * Fusszeile des Katalogs: Absender (Amtsbezeichnung in Black Italic gemäss CD-Manual),
 * zentraler Kontakt und der Stand des Katalogs.
 */
export function CatalogFooter({
  status,
}: {
  status: CatalogPublicStatus | null
}) {
  const generatedAt = formatDateTime(status?.generatedAt)
  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="container-page grid gap-x-12 gap-y-8 py-10 text-sm md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="text-base font-extrabold text-ink italic">
            Amt für Informatik und Organisation
          </p>
          <p className="mt-1 text-text italic">
            Business IT-Services
            <br />
            Kanton Solothurn
          </p>
        </div>

        <div>
          <h2 className="text-sm font-bold text-ink">Service Desk</h2>
          {hasSupportContact(status?.contact) ? (
            <SupportContactLinks
              contact={status.contact}
              variant="link"
              className="mt-2"
            />
          ) : (
            <p className="mt-2 max-w-[32ch] text-text">
              Die verantwortliche Stelle steht bei jedem Service und jeder
              Leistung.
            </p>
          )}
        </div>

        <div>
          <h2 className="text-sm font-bold text-ink">Stand des Katalogs</h2>
          <div className="mt-2 space-y-1.5 text-text">
            {status?.available ? (
              <>
                <Status tone={status.stale ? "warning" : "ok"}>
                  {status.stale ? "Nicht aktuell" : "Aktuell"}
                </Status>
                {generatedAt ? <p>{generatedAt}</p> : null}
                <p className="text-muted">
                  {status.source === "demo"
                    ? "Demo-Daten, kein Abgleich mit LeanIX"
                    : "Quelle: SAP LeanIX"}
                </p>
              </>
            ) : (
              <Status tone="error">Nicht verfügbar</Status>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4 text-sm text-muted">
          <p>BITS-Portal · Business IT-Servicekatalog</p>
          <Link
            href="/sign-in"
            className="rounded-sm underline-offset-[0.2em] transition-colors duration-150 hover:text-ink hover:underline"
          >
            Anmelden (Verwaltung)
          </Link>
        </div>
      </div>
    </footer>
  )
}
