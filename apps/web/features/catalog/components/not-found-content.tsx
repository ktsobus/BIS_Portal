import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { ContentPage } from "@/components/site/content-page"
import { PageTitle } from "@/components/site/page-title"
import { buttonVariants } from "@/components/ui/button"

/** Inhalt der 404-Seite (öffentlicher Bereich und unbekannte Adressen). */
export function NotFoundContent() {
  return (
    <ContentPage>
      <PageTitle
        eyebrow="Fehler 404"
        lead="Die gewünschte Seite gibt es nicht oder nicht mehr. Möglicherweise wurde die Leistung umbenannt oder ist im Portal nicht mehr veröffentlicht."
      >
        Seite nicht gefunden
      </PageTitle>
      <ul className="flex flex-wrap gap-3">
        <li>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Zur Startseite
            <ArrowRightIcon aria-hidden="true" strokeWidth={1.5} />
          </Link>
        </li>
        <li>
          <Link
            href="/suche"
            className={buttonVariants({ variant: "outline" })}
          >
            Services und Leistungen suchen
            <ArrowRightIcon aria-hidden="true" strokeWidth={1.5} />
          </Link>
        </li>
      </ul>
    </ContentPage>
  )
}
