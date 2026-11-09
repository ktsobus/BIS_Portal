import type { Metadata } from "next"

import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { NotFoundContent } from "@/features/catalog/components/not-found-content"

export const metadata: Metadata = { title: "Seite nicht gefunden" }

/** 404 für unbekannte Adressen (ausserhalb des öffentlichen Layouts). */
export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main id="inhalt" tabIndex={-1} className="flex-1 outline-none">
        <NotFoundContent />
      </main>
      <SiteFooter />
    </div>
  )
}
