import type { Metadata } from "next"

import { SiteNav } from "@/components/shell/site-nav"

export const metadata: Metadata = { title: "Seite nicht gefunden" }

export default function NotFound() {
  return (
    <>
      <SiteNav plain />
      <main id="top" className="app">
        <div className="wrap">
          <div className="page-head">
            <p className="t-label muted">Fehler 404</p>
            <h1>Diese Seite gibt es nicht</h1>
            <p className="t-lead">
              Die Adresse stimmt nicht, oder die Leistung ist nicht mehr im
              Katalog. Die Suche findet, was heute angeboten wird.
            </p>
            <div className="btn-row">
              <a className="btn btn--primary" href="/suche">
                Leistung suchen
              </a>
              <a className="btn btn--secondary" href="/">
                Zur Startseite gehen
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
