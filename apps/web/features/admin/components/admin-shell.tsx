import { SiteHeader } from "@/components/site/site-header"
import { cn } from "@/lib/utils"

/**
 * Inhaltsbreite und Seitenränder; entspricht dem öffentlichen Layout, damit
 * Kopf und Inhalt fluchten.
 */
const container = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10"

/**
 * Rahmen für den Admin-Bereich und die Anmeldeseiten: Kopf mit
 * Admin-Kennzeichnung, optionale Werkzeugleiste (Reiter, Abmelden), Inhalt.
 */
export function AdminShell({
  toolbar,
  children,
}: {
  toolbar?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader variant="admin" />
      {toolbar ? (
        <div className="border-b border-border">
          <div
            className={cn(
              container,
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
        className={cn(container, "flex-1 pt-6 pb-16 outline-none sm:pt-10")}
      >
        {children}
      </main>
    </div>
  )
}
