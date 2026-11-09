"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { ContentPage } from "@/components/site/content-page"
import { PageTitle } from "@/components/site/page-title"
import { Button, buttonVariants } from "@/components/ui/button"

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
    <ContentPage>
      <PageTitle
        eyebrow="Fehler"
        lead="Die Seite konnte nicht vollständig geladen werden. Bitte versuchen Sie es erneut."
      >
        Es ist ein Fehler aufgetreten
      </PageTitle>
      <div className="flex max-w-[70ch] flex-col items-start gap-6">
        <p>
          Besteht das Problem weiter, wenden Sie sich an den Service Desk des
          Amts für Informatik und Organisation.
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
    </ContentPage>
  )
}
