import type { Metadata } from "next"
import Link from "next/link"

import { PageTitle } from "@/components/site/page-title"
import { SiteHeader } from "@/components/site/site-header"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Seite nicht gefunden" }

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="border-b border-line bg-white">
        <div className="container-page py-10 md:py-14">
          <PageTitle>Diese Seite gibt es nicht</PageTitle>
          <p className="mt-3 max-w-[40rem] text-lg text-text">
            Die Adresse ist falsch geschrieben oder die Seite wurde entfernt.
          </p>
          <div className="mt-7">
            <Button asChild variant="primary" size="lg">
              <Link href="/">Zum Katalog</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
