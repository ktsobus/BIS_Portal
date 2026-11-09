import Link from "next/link"

import { PageTitle } from "@/components/site/page-title"

import { DashList } from "./dash-list"

/** Inhalt der 404-Seite (öffentlicher Bereich und unbekannte Adressen). */
export function NotFoundContent() {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Fehler 404">Seite nicht gefunden</PageTitle>
      <div className="flex max-w-[70ch] flex-col gap-4">
        <p className="text-lg">
          Die gewünschte Seite gibt es nicht oder nicht mehr. Möglicherweise
          wurde die Leistung umbenannt oder ist im Portal nicht mehr
          veröffentlicht.
        </p>
        <DashList
          items={[
            {
              key: "start",
              content: (
                <Link href="/" className="link-cd">
                  Zur Startseite mit allen Service-Familien
                </Link>
              ),
            },
            {
              key: "suche",
              content: (
                <Link href="/suche" className="link-cd">
                  Leistung suchen
                </Link>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
