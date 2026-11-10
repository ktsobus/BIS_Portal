"use client"

import Link from "next/link"
import { useEffect } from "react"
import { ArrowRightIcon } from "lucide-react"

import { PageTitle } from "@/components/site/page-title"
import { Button, buttonVariants } from "@/components/ui/button"

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
 * Text, Ansprechpartner, «Erneut versuchen» (rote Hauptaktion) und eine
 * weisse Pille zur Startseite.
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
    <div className="flex max-w-reading flex-col gap-8">
      <PageTitle
        eyebrow="Fehler"
        lead="Die Seite konnte nicht geladen werden. Bitte versuchen Sie es in einem Moment erneut."
      >
        Es ist ein Fehler aufgetreten
      </PageTitle>
      <div className="flex max-w-[70ch] flex-col items-start gap-6">
        <p>
          Besteht das Problem weiter, wenden Sie sich an den Service Desk des
          Amts für Informatik und Organisation. Betrifft es den Admin-Bereich,
          informieren Sie den Betrieb des Portals
          {digest ? (
            <>
              {" "}
              und geben Sie die Fehler-ID{" "}
              <code className="rounded-sm bg-tile-teaser px-1.5 font-mono text-[0.9em]">
                {digest}
              </code>{" "}
              an
            </>
          ) : null}
          .
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => retry()}>
            Erneut versuchen
          </Button>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Zur Startseite
            <ArrowRightIcon aria-hidden="true" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </div>
  )
}
