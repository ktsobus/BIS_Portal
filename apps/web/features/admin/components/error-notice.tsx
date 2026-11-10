"use client"

import { useEffect } from "react"

/** Kennung, mit der der Betrieb den Fehler im Server-Protokoll findet. */
function errorDigest(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return null
  }
  const digest = (error as { digest?: unknown }).digest
  return typeof digest === "string" && digest ? digest : null
}

/**
 * Inhalt der Fehlerseiten (Anmeldung, Ersteinrichtung, Admin-Bereich): was
 * passiert ist, an wen man sich wendet, «Erneut versuchen» und der Weg zum
 * Katalog.
 */
export function ErrorNotice({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const digest = errorDigest(error)

  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Es ist ein Fehler aufgetreten</h1>
        <p className="t-lead">
          Die Seite konnte nicht geladen werden. Bitte versuchen Sie es in einem
          Moment erneut.
        </p>
        <p className="measure">
          Besteht das Problem weiter, wenden Sie sich an den Service Desk des
          Amts für Informatik und Organisation. Betrifft es den Admin-Bereich,
          informieren Sie den Betrieb des Portals
          {digest ? (
            <>
              {" "}
              und geben Sie die Fehler-ID <code className="code">
                {digest}
              </code>{" "}
              an
            </>
          ) : null}
          .
        </p>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => retry()}
          >
            Erneut versuchen
          </button>
          <a className="btn btn--secondary" href="/">
            Katalog öffnen
          </a>
        </div>
      </div>
    </div>
  )
}
