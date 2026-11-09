"use client"

// Ersetzt bei einem Fehler im Root-Layout das ganze Dokument; Schrift und
// CD-Stile müssen deshalb hier selbst geladen werden.
import "@fontsource-variable/source-sans-3/wght.css"
import "@fontsource-variable/source-sans-3/wght-italic.css"
import "./globals.css"

import { AdminShell } from "@/features/admin/components/admin-shell"
import { ErrorNotice } from "@/features/admin/components/error-notice"

/** Notseite für Fehler im Root-Layout selbst (deutsch, im CD). */
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  return (
    <html lang="de-CH" className="antialiased">
      <body>
        <title>Fehler · Business-IT-Serviceportal · Kanton Solothurn</title>
        <AdminShell variant="public">
          <ErrorNotice error={error} retry={retry} />
        </AdminShell>
      </body>
    </html>
  )
}
