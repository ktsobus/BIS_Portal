"use client"

import * as React from "react"

/** Wert zum Kopieren (URL für den Identity Provider) mit eigenem Knopf. */
export function CopyField({ label, value }: { label: string; value: string }) {
  const id = React.useId()
  const [note, setNote] = React.useState<string | null>(null)

  return (
    <div className="copyfield">
      <p className="t-label muted" id={id}>
        {label}
      </p>
      <div className="copyline">
        <span className="code" aria-labelledby={id}>
          {value}
        </span>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          aria-label={`${label} kopieren`}
          onClick={() =>
            navigator.clipboard
              .writeText(value)
              .then(() => setNote("In die Zwischenablage kopiert."))
              .catch(() =>
                setNote("Kopieren nicht möglich. Bitte manuell markieren.")
              )
          }
        >
          Kopieren
        </button>
      </div>
      <p role="status" className="t-small copyfield__status">
        {note}
      </p>
    </div>
  )
}
