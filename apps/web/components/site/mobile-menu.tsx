"use client"

import * as React from "react"
import { MenuIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Mobiles Menü: runder 36-px-Schalter (weiss, Haarlinie, rotes Symbol) oben
 * rechts; klappt darunter ein Feld mit Suche und Meta-Navigation auf.
 * Schliesst bei Escape, nach Auswahl eines Links und nach dem Absenden der
 * Suche. Ab Desktop-Breite ausgeblendet.
 */
export function MobileMenu({
  children,
  buttonClassName,
  panelClassName,
}: {
  children: React.ReactNode
  /** Platzierung im Raster des Kopfs. */
  buttonClassName?: string
  panelClassName?: string
}) {
  const [open, setOpen] = React.useState(false)
  const panelId = React.useId()
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-hairline bg-background text-primary transition-shadow duration-150 after:absolute after:-inset-1 hover:shadow-press-light lg:hidden",
          buttonClassName
        )}
      >
        {open ? (
          <XIcon aria-hidden="true" strokeWidth={1.5} className="size-5" />
        ) : (
          <MenuIcon aria-hidden="true" strokeWidth={1.5} className="size-5" />
        )}
        <span className="sr-only">{open ? "Menü schliessen" : "Menü"}</span>
      </button>
      <div
        id={panelId}
        hidden={!open}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setOpen(false)
        }}
        onSubmit={() => setOpen(false)}
        className={cn(
          "menu-drop border-t border-hairline pt-4 pb-4 lg:hidden",
          panelClassName
        )}
      >
        {children}
      </div>
    </>
  )
}
