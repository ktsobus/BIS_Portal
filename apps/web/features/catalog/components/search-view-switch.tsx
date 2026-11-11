"use client"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export type SearchView = "liste" | "kacheln"

const VIEWS: { value: SearchView; label: string }[] = [
  { value: "liste", label: "Liste" },
  { value: "kacheln", label: "Kacheln" },
]

/**
 * Schaltet die Darstellung der Suche um (`?ansicht=kacheln`, Standard Liste).
 * Liest die Adresse beim Klick, damit Suchbegriff und Filter erhalten bleiben.
 */
export function SearchViewSwitch({ view }: { view: SearchView }) {
  const router = useRouter()

  function select(value: SearchView) {
    const params = new URLSearchParams(window.location.search)
    if (value === "liste") params.delete("ansicht")
    else params.set("ansicht", value)
    const search = params.toString()
    router.replace(`/suche${search ? `?${search}` : ""}`, { scroll: false })
  }

  return (
    <div role="group" aria-label="Darstellung" className="flex gap-2">
      {VIEWS.map(({ value, label }) => (
        <Button
          key={value}
          type="button"
          variant="chip"
          size="sm"
          aria-pressed={view === value}
          onClick={() => select(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
