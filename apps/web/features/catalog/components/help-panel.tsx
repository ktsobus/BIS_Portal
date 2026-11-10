import type { SupportContact } from "@workspace/api"

import { cn } from "@/lib/utils"

import { hasSupportContact, SupportContactLinks } from "./support-contact"

/**
 * Getönte Fläche «Nichts Passendes gefunden?» mit dem zentralen Kontakt.
 * Ohne konfigurierten Kontakt verweist sie auf die verantwortlichen Stellen.
 */
export function HelpPanel({
  contact,
  className,
}: {
  contact: SupportContact | null | undefined
  className?: string
}) {
  return (
    <section
      aria-labelledby="hilfe-titel"
      className={cn("rounded-lg bg-blue-tint p-6", className)}
    >
      <h2 id="hilfe-titel" className="text-xl font-extrabold">
        Nichts Passendes gefunden?
      </h2>
      {hasSupportContact(contact) ? (
        <>
          <p className="mt-2 text-sm text-text">
            Der Service Desk des AIO nimmt Ihre Anfrage entgegen und leitet sie
            an die richtige Stelle weiter.
          </p>
          <SupportContactLinks contact={contact} className="mt-4" />
        </>
      ) : (
        <p className="mt-2 text-sm text-text">
          Bei jedem Service und jeder Leistung steht die verantwortliche Stelle.
          Sie hilft Ihnen weiter, auch wenn Ihr Anliegen im Katalog noch fehlt.
        </p>
      )}
    </section>
  )
}
