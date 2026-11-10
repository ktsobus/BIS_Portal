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
 * Desk (falls konfiguriert) und Direktlinks auf die Service-Familien; der
 * Stand der Katalogdaten steht in der Meta-Zeile.
 */
export async function SiteFooter() {
  // Scheitert nie: `loadStatus` liefert bei Fehlern `null`.
  const [status, families] = await Promise.all([loadStatus(), loadFamilies()])
  const contact = status?.contact
  const generatedAt =
    status?.available && status.generatedAt
      ? formatDateTime(status.generatedAt)
      : null
  // Zusatz zum Stand: Testdaten bzw. länger nicht aktualisiert.
  const remark =
    status?.source === "demo"
      ? "Demo-Daten"
      : status?.stale
        ? "seit längerer Zeit nicht aktualisiert"
        : null

  return (
    <SiteFooterFrame
      info={
        hasSupportContact(contact) ? (
          <section
            aria-labelledby="fuss-kontakt"
            className="flex flex-col gap-2 type-body-md"
          >
            <h2 id="fuss-kontakt" className="type-nav-meta">
              Service Desk
            </h2>
            <SupportContactLinks contact={contact} variant="links" />
          </section>
        ) : null
      }
      status={
        generatedAt ? (
          <>
            Stand der Daten:{" "}
            <time dateTime={status?.generatedAt ?? undefined}>
              {generatedAt}
            </time>
            {remark ? ` (${remark})` : null}
          </>
        ) : (
          "Der Katalog ist derzeit nicht verfügbar."
        )
      }
      directLinks={
        <FooterDirectLinks
          title="Direktlinks"
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
