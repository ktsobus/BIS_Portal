"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import type { SearchEntry } from "@workspace/api"
import { ArrowRightIcon } from "lucide-react"

import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

import { prepareEntries, searchEntries } from "../search"
import { searchIndexQuery } from "./catalog-search"
import { SearchFieldLarge } from "./search-field-large"

const MAX_SUGGESTIONS = 6
const MIN_QUERY_LENGTH = 2

function entryHref(entry: Pick<SearchEntry, "kind" | "slug">) {
  return entry.kind === "leistung"
    ? `/leistung/${entry.slug}`
    : `/service/${entry.slug}`
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  )
}

/**
 * Grosses Suchfeld der Startseite mit Vorschlägen beim Tippen (Verhalten aus
 * `impeccable-frontend`, Combobox nach WAI-ARIA). Pfeiltasten wählen einen
 * Vorschlag, Enter öffnet ihn oder die volle Trefferliste, Escape schliesst,
 * «/» setzt den Fokus ins Feld. Ohne JavaScript sendet das Formular an
 * `/suche?q=…`.
 */
export function StartSearch() {
  const router = useRouter()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  // Der Index wird erst geladen, wenn jemand das Feld benutzt.
  const [wanted, setWanted] = useState(false)

  const index = useQuery({ ...searchIndexQuery(), enabled: wanted })
  const prepared = useMemo(
    () => prepareEntries(index.data?.entries ?? []),
    [index.data]
  )

  const trimmed = query.trim()
  const searching = trimmed.length >= MIN_QUERY_LENGTH
  const matches = useMemo(
    () => (searching ? searchEntries(prepared, { query: trimmed }) : []),
    [prepared, searching, trimmed]
  )
  const suggestions = matches.slice(0, MAX_SUGGESTIONS)
  // Letzte Zeile der Liste: zur vollen Trefferliste.
  const allIndex = suggestions.length
  const optionCount = suggestions.length > 0 ? suggestions.length + 1 : 0
  const showPopup = open && searching

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key !== "/" ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        isTypingTarget(event.target)
      ) {
        return
      }
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  function goToResults() {
    setOpen(false)
    router.push(trimmed ? `/suche?q=${encodeURIComponent(trimmed)}` : "/suche")
  }

  function choose(position: number) {
    const entry = suggestions[position]
    if (!entry) return goToResults()
    setOpen(false)
    router.push(entryHref(entry))
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (open) {
        event.preventDefault()
        setOpen(false)
        setActive(-1)
      }
      return
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
    if (optionCount === 0) return
    event.preventDefault()
    setOpen(true)
    setActive((current) => {
      if (event.key === "ArrowDown") return (current + 1) % optionCount
      return current <= 0 ? optionCount - 1 : current - 1
    })
  }

  const optionId = (position: number) => `${listId}-option-${position}`
  const optionClass = (position: number) =>
    cn(
      "flex cursor-pointer items-baseline gap-3 px-4 py-3 transition-colors duration-150",
      active === position && "bg-tile-service"
    )

  return (
    <form
      action="/suche"
      role="search"
      aria-label="Katalog durchsuchen"
      onSubmit={(event) => {
        event.preventDefault()
        if (showPopup && active >= 0 && active < allIndex) choose(active)
        else goToResults()
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false)
          setActive(-1)
        }
      }}
    >
      <SearchFieldLarge
        ref={inputRef}
        id="start-suche"
        name="q"
        label="Suche nach Leistungen"
        value={query}
        spellCheck={false}
        role="combobox"
        aria-expanded={showPopup}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          showPopup && active >= 0 ? optionId(active) : undefined
        }
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          setActive(-1)
          setWanted(true)
        }}
        onFocus={() => {
          setWanted(true)
          setOpen(true)
        }}
        onKeyDown={onKeyDown}
        popup={
          <>
            <div
              id={listId}
              role="listbox"
              aria-label="Vorschläge"
              hidden={!showPopup}
              className="absolute inset-x-0 top-full z-30 mt-2 divide-y divide-hairline overflow-hidden rounded-tile border border-hairline bg-background shadow-lift"
            >
              {suggestions.map((entry, position) => (
                <div
                  key={`${entry.kind}-${entry.id}`}
                  id={optionId(position)}
                  role="option"
                  aria-selected={active === position}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(position)}
                  onClick={() => choose(position)}
                  className={optionClass(position)}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{entry.name}</span>
                    <span className="block truncate type-body-sm">
                      {entry.context}
                    </span>
                  </span>
                  <span className="shrink-0 type-body-sm">
                    {entry.kind === "service"
                      ? "Service"
                      : (entry.subtypeLabel ?? "Leistung")}
                  </span>
                </div>
              ))}
              {suggestions.length > 0 ? (
                <div
                  id={optionId(allIndex)}
                  role="option"
                  aria-selected={active === allIndex}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(allIndex)}
                  onClick={goToResults}
                  className={cn(
                    optionClass(allIndex),
                    "items-center font-bold text-primary"
                  )}
                >
                  {matches.length === 1
                    ? "Treffer in der Suche anzeigen"
                    : `Alle ${matches.length} Treffer anzeigen`}
                  <ArrowRightIcon
                    aria-hidden="true"
                    strokeWidth={1.5}
                    className="size-5"
                  />
                </div>
              ) : (
                <p className="flex items-center gap-2 px-4 py-3">
                  {index.isPending ? (
                    <>
                      <Spinner /> Katalog wird geladen …
                    </>
                  ) : index.isError ? (
                    "Vorschläge sind gerade nicht verfügbar. Mit Enter suchen Sie trotzdem."
                  ) : (
                    <>
                      Keine Treffer für «{trimmed}». Versuchen Sie ein anderes
                      Wort.
                    </>
                  )}
                </p>
              )}
            </div>
            <p role="status" className="sr-only">
              {showPopup && !index.isPending && !index.isError
                ? matches.length === 0
                  ? "Keine Treffer"
                  : `${matches.length} Treffer, mit den Pfeiltasten wählen`
                : ""}
            </p>
          </>
        }
      />
    </form>
  )
}
