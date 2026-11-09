import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { ContentPage } from "@/components/site/content-page"
import { PageTitle } from "@/components/site/page-title"
import { buttonVariants } from "@/components/ui/button"

/** Anzeige, wenn noch kein Katalog-Snapshot geladen ist. */
export function CatalogUnavailable() {
  return (
    <ContentPage>
      <PageTitle lead="Die Business-IT-Services können im Moment nicht angezeigt werden. Bitte versuchen Sie es in einigen Minuten erneut.">
        Der Katalog ist vorübergehend nicht verfügbar
      </PageTitle>
      <div className="flex max-w-[70ch] flex-col items-start gap-6">
        <p>
          Dringende Anliegen richten Sie bitte wie gewohnt an den Service Desk
          des Amts für Informatik und Organisation.
        </p>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Zur Startseite
          <ArrowRightIcon aria-hidden="true" strokeWidth={1.5} />
        </Link>
      </div>
    </ContentPage>
  )
}
