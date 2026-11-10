import * as React from "react"

/**
 * Hinweis im Seitenfluss (`.note` aus portal.css): eine Zeile in Gewicht 500,
 * darunter der Text und bei Bedarf Knöpfe. `bad` für Ausfälle und Fehler.
 */
export function Notice({
  title,
  bad = false,
  role,
  children,
}: {
  title: string
  bad?: boolean
  role?: "alert" | "status"
  children?: React.ReactNode
}) {
  return (
    <div className={bad ? "note note--bad" : "note"} role={role}>
      <strong>{title}</strong>
      {children}
    </div>
  )
}

/** Hinweis für eine Liste, die nicht geladen werden konnte, mit «Erneut versuchen». */
export function LoadError({
  title,
  message,
  onRetry,
  retrying = false,
}: {
  title: string
  message: string
  onRetry: () => void
  retrying?: boolean
}) {
  return (
    <Notice title={title} bad role="alert">
      <p>{message}</p>
      <div className="btn-row">
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={onRetry}
          disabled={retrying}
        >
          Erneut versuchen
        </button>
      </div>
    </Notice>
  )
}
