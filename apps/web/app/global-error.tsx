"use client"

/** Letzte Sicherung, wenn selbst das Wurzel-Layout scheitert (ohne Stylesheets des Layouts). */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="de-CH">
      <head>
        <link rel="stylesheet" href="/assets/system.css" />
        <link rel="stylesheet" href="/styles/portal.css" />
      </head>
      <body>
        <main id="top" className="app">
          <div className="wrap">
            <div className="page-head">
              <h1>Das Portal ist im Moment gestört</h1>
              <p className="t-lead">
                Die Seite konnte nicht aufgebaut werden. Versuchen Sie es in
                einigen Minuten erneut.
              </p>
              <div className="btn-row">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={reset}
                >
                  Seite neu laden
                </button>
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
