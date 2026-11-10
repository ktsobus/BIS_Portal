import { serverClient } from "@/lib/orpc-server"
import { formatDateTime } from "@/lib/format"
import {
  hasSupportContact,
  SupportContactLinks,
} from "@/features/catalog/components/support-contact"
import { loadStatus } from "@/features/catalog/load"

import { FooterDirectLinks, SiteFooterFrame } from "./site-footer-frame"

async function loadFamilies() {
  // Die Fusszeile darf eine Seite nie scheitern lassen.
  try {
    return (await serverClient.catalog.overview()).families
  } catch {
    return []
  }
}

/**
 * Fusszeile des Portals: Absender (CD: Black Italic), Kontakt zum Service
 * Desk (falls konfiguriert), Stand der Katalogdaten und Direktlinks auf die
 * Service-Familien.
 */
export async function SiteFooter() {
  // Scheitert nie: `loadStatus` liefert bei Fehlern `null`.
  const [status, families] = await Promise.all([loadStatus(), loadFamilies()])
  const contact = status?.contact
  const generatedAt =
    status?.available && status.generatedAt
      ? formatDateTime(status.generatedAt)
      : null

  return (
    <SiteFooterFrame
      cta={{ href: "/suche", label: "Alle Leistungen" }}
      info={
        <>
          {hasSupportContact(contact) ? (
            <section
              aria-labelledby="fuss-kontakt"
              className="flex flex-col gap-2 type-body-md"
            >
              <h2 id="fuss-kontakt" className="type-nav-meta">
                Kontakt Service Desk
              </h2>
              <SupportContactLinks contact={contact} variant="links" />
            </section>
          ) : null}
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
                <strong>Hinweis:</strong> Die Daten konnten seit längerer Zeit
                nicht aus LeanIX aktualisiert werden.
              </p>
            ) : null}
          </div>
        </>
      }
      directLinks={
        <FooterDirectLinks
          title="Service-Familien"
          links={families.map((family) => ({
            key: family.id,
            href: `/kategorie/${family.slug}`,
            label: family.name,
          }))}
        />
      }
    />
  )
}
