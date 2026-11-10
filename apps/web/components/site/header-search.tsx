"use client"

import Form from "next/form"
import { usePathname } from "next/navigation"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Schnellsuche im Kopf: ohne Rahmen, nur schwarzer Unterstrich (beim Fokus
 * rot), rote Lupe am Ende. Sendet an `/suche?q=…`. Auf der Startseite und
 * der Suchseite ausgeblendet: Dort steht das grosse Suchfeld, dieselbe
 * Aufgabe zweimal auf einem Bildschirm wäre doppelt.
 */
export function HeaderSearch({
  id,
  className,
}: {
  /** Eindeutige ID (Desktop-Kopf und mobiles Menü haben je ein Feld). */
  id: string
  className?: string
}) {
  const pathname = usePathname()
  if (pathname === "/" || pathname === "/suche") return null

  return (
    <Form
      action="/suche"
      role="search"
      aria-label="Schnellsuche"
      className={cn("relative flex w-full items-stretch", className)}
    >
      <label htmlFor={id} className="sr-only">
        Suchbegriff
      </label>
      <input
        id={id}
        name="q"
        type="search"
        placeholder="Suche"
        autoComplete="off"
        className="field-underline h-[3.1875rem] w-full min-w-0 rounded-none border-0 border-b border-ink bg-transparent pr-12 pl-0 text-base text-ink transition-[border-color,box-shadow] duration-200 placeholder:text-placeholder [&::-webkit-search-cancel-button]:hidden"
      />
      <button
        type="submit"
        className="absolute top-1/2 right-0 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-primary transition-shadow duration-150 hover:shadow-press-light"
      >
        <SearchIcon aria-hidden="true" strokeWidth={1.5} className="size-6" />
        <span className="sr-only">Suchen</span>
      </button>
    </Form>
  )
}
