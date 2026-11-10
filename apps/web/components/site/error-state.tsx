"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

import { PageTitle } from "./page-title"

/** Inhalt der Fehlerseiten: was passiert ist und wie es weitergeht. */
export function ErrorState({
  error,
  retry,
  homeHref = "/",
  homeLabel = "Zum Katalog",
}: {
  error: unknown
  retry: () => void
  homeHref?: string
  homeLabel?: string
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="border-b border-line bg-white">
      <div className="container-page py-10 md:py-14">
        <PageTitle>Die Seite konnte nicht geladen werden</PageTitle>
        <p className="mt-3 max-w-[40rem] text-lg text-text">
          Auf dem Server ist ein Fehler aufgetreten. Versuchen Sie es erneut;
          wenn der Fehler bleibt, melden Sie ihn dem Service Desk des AIO.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button variant="primary" size="lg" onClick={() => retry()}>
            Erneut versuchen
          </Button>
          <Button asChild size="lg">
            {/* Volle Navigation: lädt auch die Rahmenseite neu. */}
            <a href={homeHref}>{homeLabel}</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
