"use client"

import { useEffect } from "react"
import Link from "next/link"

import { PageTitle } from "@/components/site/page-title"
import { Button } from "@/components/ui/button"

export default function PublicError({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Fehler">Es ist ein Fehler aufgetreten</PageTitle>
      <div className="flex max-w-[70ch] flex-col gap-4">
        <p className="text-lg">
          Die Seite konnte nicht vollständig geladen werden. Bitte versuchen Sie
          es erneut. Besteht das Problem weiter, wenden Sie sich an den Service
          Desk des Amts für Informatik und Organisation.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="button"
            onClick={() => retry()}
            className="h-auto min-h-10 px-4 text-base font-bold"
          >
            Erneut versuchen
          </Button>
          <Link href="/" className="link-cd">
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}
