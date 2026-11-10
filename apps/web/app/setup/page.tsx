import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { PageHead } from "@/components/site/page-head"
import { SiteHeader, SkipLink } from "@/components/site/site-header"
import { SetupForm } from "@/features/setup/components/setup-form"
import { isSetupComplete } from "@/lib/setup"

export const metadata: Metadata = { title: "Einrichtung" }

export default async function SetupPage() {
  if (await isSetupComplete()) redirect("/sign-in")
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <SiteHeader />
      <main id="inhalt" className="flex-1">
        <PageHead
          title="BITS-Portal einrichten"
          lead="Legen Sie das erste Admin-Konto an. Dieser Schritt ist nur einmal möglich; weitere Konten erfassen Sie danach in der Verwaltung."
        />
        <div className="container-page py-8 md:py-10">
          <SetupForm />
        </div>
      </main>
    </div>
  )
}
