import * as React from "react"

/**
 * Die eine Statuszeile eines Formulars oder einer Liste (`role="status"`):
 * Sie wird vorgelesen, sobald sich ihr Text ändert. Das Element bleibt immer
 * im Dokument, auch leer, sonst gehen Ansagen verloren.
 */
export function Status({
  id,
  bad = false,
  children,
}: {
  id?: string
  /** Fehlschlag: in der Fehlerfarbe und mit Gewicht 500. */
  bad?: boolean
  children?: React.ReactNode
}) {
  return (
    <p
      id={id}
      role="status"
      className={bad ? "form__status form__status--bad" : "form__status"}
    >
      {children}
    </p>
  )
}
