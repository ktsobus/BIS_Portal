import type { SupportContact } from "@workspace/api"

import { PageHead } from "@/components/site/page-head"
import { Button } from "@/components/ui/button"

import { HelpPanel } from "./help-panel"

/** Ausfallseite: Es liegt kein Katalog-Stand vor (z. B. vor dem ersten Sync). */
export function CatalogUnavailable({
  contact,
  retryHref,
}: {
  contact: SupportContact | null | undefined
  /** Seite, die erneut geladen wird. */
  retryHref: string
}) {
  return (
    <>
      <PageHead
        title="Der Katalog ist vorübergehend nicht verfügbar"
        lead="Die Daten aus LeanIX konnten nicht geladen werden. Das Portal versucht es laufend erneut; in der Regel ist der Katalog nach wenigen Minuten wieder da."
      >
        <Button asChild variant="primary" size="lg">
          {/* Volle Navigation, damit die Seite neu vom Server kommt. */}
          <a href={retryHref}>Seite neu laden</a>
        </Button>
      </PageHead>
      <div className="container-page py-8 md:py-10">
        <HelpPanel contact={contact} className="max-w-xl" />
      </div>
    </>
  )
}
