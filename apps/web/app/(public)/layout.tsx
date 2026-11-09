import { siteContainer } from "@/components/site/container"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { cn } from "@/lib/utils"

/** Öffentliches Layout (ohne Anmeldung): Kopf, Inhalt, Fuss. */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main
        id="inhalt"
        tabIndex={-1}
        className={cn(siteContainer, "flex-1 pt-6 pb-4 outline-none sm:pt-8")}
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
