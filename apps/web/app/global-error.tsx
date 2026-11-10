"use client"

import "./globals.css"

/**
 * Fängt Fehler in der Rahmenseite. Ersetzt das Root-Layout und bringt darum
 * ein eigenes Dokument mit; bewusst ohne Logo und Provider, damit die Seite
 * auch bei einem Fehler in diesen Teilen erscheint.
 */
export default function GlobalError({
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  return (
    <html lang="de-CH">
      <body>
        <title>Fehler · BITS-Portal</title>
        <main className="container-page py-14">
          <h1 className="text-3xl font-extrabold">
            Das BITS-Portal ist gerade nicht erreichbar
          </h1>
          <p className="mt-3 max-w-[40rem] text-lg">
            Auf dem Server ist ein Fehler aufgetreten. Versuchen Sie es in
            einigen Minuten erneut.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="mt-7 inline-flex h-12 items-center rounded-md border border-red bg-red px-5 font-bold text-white hover:border-red-strong hover:bg-red-strong"
          >
            Erneut versuchen
          </button>
        </main>
      </body>
    </html>
  )
}
