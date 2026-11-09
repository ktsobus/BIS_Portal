import Link from "next/link"

import { siteContainer } from "@/components/site/container"
import { FooterSender } from "@/components/site/footer-sender"
import { SiteHeader } from "@/components/site/site-header"
import { cn } from "@/lib/utils"

/**
 * Rahmen für den Admin-Bereich und die Anmeldeseiten: Kopf mit
 * Admin-Kennzeichnung, optionale Werkzeugleiste (Reiter, Abmelden), Inhalt
 * und schlanke Fusszeile mit Absender. Ohne Server-Aufrufe, damit er auch in
 * Fehlerseiten (Client Components) nutzbar ist.
 */
export function AdminShell({
  toolbar,
  variant = "admin",
  children,
}: {
  toolbar?: React.ReactNode
  /** `public` z. B. für Fehlerseiten des öffentlichen Portals. */
  variant?: "admin" | "public"
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader variant={variant} />
      {toolbar ? (
        <div className="border-b border-border">
          <div
            className={cn(
              siteContainer,
              "flex flex-wrap items-end justify-between gap-x-6 gap-y-1"
            )}
          >
            {toolbar}
          </div>
        </div>
      ) : null}
      <main
        id="inhalt"
        tabIndex={-1}
        className={cn(siteContainer, "flex-1 pt-6 pb-16 outline-none sm:pt-10")}
      >
        {children}
      </main>
      <footer className="border-t border-border bg-so-surface">
        <div
          className={cn(
            siteContainer,
            "flex flex-col gap-4 py-6 text-sm md:flex-row md:items-end md:justify-between"
          )}
        >
          <FooterSender />
          <p>
            <Link href="/" className="link-cd text-muted-foreground">
              Zum Katalog
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
