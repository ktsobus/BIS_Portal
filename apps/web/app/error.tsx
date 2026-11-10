"use client"

import * as React from "react"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main id="top" className="app">
      <div className="wrap">
        <div className="page-head">
          <p className="t-label muted">Fehler</p>
          <h1>Die Seite konnte nicht geladen werden</h1>
          <p className="t-lead">
            Beim Laden ist ein Fehler aufgetreten. Meist hilft ein zweiter
            Versuch.
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn--primary" onClick={reset}>
              Seite neu laden
            </button>
            <a className="btn btn--secondary" href="/">
              Zur Startseite gehen
            </a>
          </div>
          {error.digest ? (
            <p className="t-small muted">Fehlerkennung: {error.digest}</p>
          ) : null}
        </div>
      </div>
    </main>
  )
}
