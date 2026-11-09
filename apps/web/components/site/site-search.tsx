"use client"

import Form from "next/form"
import { usePathname } from "next/navigation"
import { SearchIcon } from "lucide-react"

/**
 * Schnellsuche im Seitenkopf (ab md). Auf der Suchseite ausgeblendet: Dort
 * steht das grosse Suchfeld, zwei gleichartige Such-Landmarken wären doppelt.
 */
export function SiteSearch() {
  const pathname = usePathname()
  if (pathname === "/suche") return null

  return (
    <Form
      action="/suche"
      role="search"
      aria-label="Schnellsuche"
      className="hidden items-stretch md:flex"
    >
      <label htmlFor="site-search" className="sr-only">
        Suchbegriff
      </label>
      <input
        id="site-search"
        name="q"
        type="search"
        placeholder="Services und Leistungen suchen …"
        autoComplete="off"
        className="h-9 w-72 min-w-0 border border-r-0 border-input bg-background px-2.5 text-base placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-foreground bg-foreground text-background hover:border-primary hover:bg-primary"
      >
        <SearchIcon aria-hidden="true" className="size-4" />
        <span className="sr-only">Suchen</span>
      </button>
    </Form>
  )
}
