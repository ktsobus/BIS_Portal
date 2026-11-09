"use client"

import Link from "next/link"
import { useEffect } from "react"

import { PageTitle } from "@/components/site/page-title"
import { Button } from "@/components/ui/button"

/** Kennung, mit der der Betrieb den Fehler im Server-Protokoll findet. */
function errorDigest(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return null
  }
  const digest = (error as { digest?: unknown }).digest
  return typeof digest === "string" && digest ? digest : null
}

/**
 * Inhalt der Fehlerseiten (Anmeldung, Ersteinrichtung, Admin): deutscher
 * Text, Ansprechpartner, «Erneut versuchen» und Link zum Katalog.
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
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Fehler">Es ist ein Fehler aufgetreten</PageTitle>
      <div className="flex max-w-[70ch] flex-col gap-4">
        <p className="text-lg">
          Die Seite konnte nicht geladen werden. Bitte versuchen Sie es in einem
          Moment erneut.
        </p>
        <p>
          Besteht das Problem weiter, wenden Sie sich an den Service Desk des
          Amts für Informatik und Organisation. Betrifft es den Admin-Bereich,
          informieren Sie den Betrieb des Portals
          {digest ? (
            <>
              {" "}
              und geben Sie die Fehler-ID{" "}
              <code className="font-mono">{digest}</code> an
            </>
          ) : null}
          .
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Button type="button" size="lg" onClick={() => retry()}>
            Erneut versuchen
          </Button>
          <Link href="/" className="link-cd">
            Zum Katalog
          </Link>
        </div>
      </div>
    </div>
  )
}
