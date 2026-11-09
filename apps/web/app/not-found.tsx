import type { Metadata } from "next"

import { siteContainer } from "@/components/site/container"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { NotFoundContent } from "@/features/catalog/components/not-found-content"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Seite nicht gefunden" }

/** 404 für unbekannte Adressen (ausserhalb des öffentlichen Layouts). */
export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main
        id="inhalt"
        tabIndex={-1}
        className={cn(siteContainer, "flex-1 pt-6 pb-4 outline-none sm:pt-8")}
      >
        <NotFoundContent />
      </main>
      <SiteFooter />
    </div>
  )
}
