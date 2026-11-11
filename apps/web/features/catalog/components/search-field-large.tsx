import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Grosses Suchfeld (Startseite, Suche): sichtbare Beschriftung, darunter die
 * 24-px-Eingabe ohne Rahmen mit Unterstrich in Stahlblau (beim Fokus rot),
 * rechts «Suchen» in 24 px Black und ein roter 44-px-Kreis mit weisser Lupe.
 * Muss in einem `<form>` stehen.
 */
export function SearchFieldLarge({
  id,
  label,
  className,
  popup,
  ...inputProps
}: Omit<React.ComponentProps<"input">, "type" | "id"> & {
  id: string
  /** Sichtbare Beschriftung über dem Feld (ein Platzhalter ersetzt sie nicht). */
  label: string
  /** Liste unter dem Feld, z. B. Vorschläge beim Tippen. */
  popup?: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <label htmlFor={id} className="type-title-sm">
        {label}
      </label>
      <div className="flex items-end gap-4 sm:gap-6">
        <div className="relative min-w-0 flex-1">
          <input
            id={id}
            type="search"
            autoComplete="off"
            className="field-underline h-14 w-full min-w-0 rounded-none border-0 border-b border-steel bg-transparent px-0 type-input-lg text-ink transition-[border-color,box-shadow] duration-200 placeholder:text-placeholder [&::-webkit-search-cancel-button]:hidden"
            {...inputProps}
          />
          {popup}
        </div>
        <button
          type="submit"
          className="group/submit inline-flex min-h-11 shrink-0 items-center gap-3 pb-1.5 transition-[scale] duration-150 active:scale-[0.985]"
        >
          <span className="sr-only type-headline-md sm:not-sr-only">
            Suchen
          </span>
          <span
            aria-hidden="true"
            className="inline-flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-shadow duration-150 group-hover/submit:shadow-press-dark group-active/submit:shadow-press-dark"
          >
            <SearchIcon strokeWidth={1.5} className="size-6" />
          </span>
        </button>
      </div>
    </div>
  )
}
