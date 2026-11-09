import Link from "next/link"

import { PageTitle } from "@/components/site/page-title"

/** Anzeige, wenn noch kein Katalog-Snapshot geladen ist. */
export function CatalogUnavailable() {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle>Der Katalog ist vorübergehend nicht verfügbar</PageTitle>
      <div className="flex max-w-[70ch] flex-col gap-3">
        <p>
          Die Business-IT-Services können im Moment nicht angezeigt werden.
          Bitte versuchen Sie es in einigen Minuten erneut.
        </p>
        <p>
          Dringende Anliegen richten Sie bitte wie gewohnt an den Service Desk
          des Amts für Informatik und Organisation.
        </p>
        <p>
          <Link href="/" className="link-cd">
            Zur Startseite
          </Link>
        </p>
      </div>
    </div>
  )
}
