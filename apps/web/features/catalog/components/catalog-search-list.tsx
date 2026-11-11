"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ArrowRightIcon, SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import {
  prepareEntries,
  searchEntries,
  writeSearchUrl,
  type SearchFilter,
} from "../search"
import {
  isCatalogUnavailable,
  searchIndexQuery,
  type CatalogSearchProps,
} from "./catalog-search"

/**
 * Suche als Liste (Aufbau aus `tasteskill-frontend`, Farben und Schrift von
 * so.ch): umrandetes grosses Feld mit Lupe, Filter als Optionsfelder mit der
 * Beschriftung davor, Treffer als Zeilen mit Art und Pfeil rechts. Die ganze
 * Zeile ist klickbar, der Linkname ist der Titel.
 */
export function CatalogSearchList({
  initialQuery = "",
  initialSubtype = "",
  initialAudience = "",
}: CatalogSearchProps) {
  const [state, setState] = React.useState<Required<SearchFilter>>({
    query: initialQuery,
    subtype: initialSubtype,
    audience: initialAudience,
  })
  const { data, error, isPending } = useQuery(searchIndexQuery())

  function update(patch: Partial<SearchFilter>) {
    const next = { ...state, ...patch }
    setState(next)
    writeSearchUrl(next)
  }

  const prepared = React.useMemo(
    () => (data ? prepareEntries(data.entries) : []),
    [data]
  )
  const deferred = React.useDeferredValue(state)
  const results = React.useMemo(
    () => searchEntries(prepared, deferred),
    [prepared, deferred]
  )

  const query = state.query.trim()
  const filtered = Boolean(query || state.subtype || state.audience)
  let count = ""
  if (data) {
    if (results.length === 0) {
      count = query
        ? `Kein Treffer für «${query}».`
        : "Kein Treffer mit diesen Filtern."
    } else if (filtered) {
      count = results.length === 1 ? "1 Treffer" : `${results.length} Treffer`
    } else {
      count = `${results.length} Einträge im Katalog`
    }
  }

  return (
    <div className="grid gap-6">
      <form
        role="search"
        aria-label="Katalog durchsuchen"
        className="grid gap-6"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="relative max-w-reading">
          <label className="sr-only" htmlFor="suche-liste-begriff">
            Suchbegriff
          </label>
          <SearchIcon
            aria-hidden="true"
            strokeWidth={1.5}
            className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2"
          />
          <input
            id="suche-liste-begriff"
            type="search"
            value={state.query}
            onChange={(event) => update({ query: event.target.value })}
            placeholder="Stichwort, Anwendung oder Stelle"
            autoComplete="off"
            enterKeyHint="search"
            className="h-16 w-full rounded-xl border border-secondary/20 bg-background pr-6 pl-14 text-xl transition-colors duration-200 hover:border-secondary [&::-webkit-search-cancel-button]:appearance-none"
          />
        </div>
        {data ? (
          <div className="grid gap-4">
            <RadioChips
              legend="Art"
              name="art"
              options={data.facets.subtypes}
              value={state.subtype}
              onChange={(subtype) => update({ subtype })}
            />
            <RadioChips
              legend="Für"
              name="bezueger"
              options={data.facets.audiences}
              value={state.audience}
              onChange={(audience) => update({ audience })}
            />
          </div>
        ) : null}
      </form>

      <p
        role="status"
        aria-live="polite"
        className="min-h-[1.5em] type-body-sm"
      >
        {isPending ? "Der Katalog wird geladen …" : count}
      </p>

      {error ? (
        <p
          role="alert"
          className="grid max-w-reading gap-2 rounded-xl bg-primary/8 px-6 py-4"
        >
          <strong>
            {isCatalogUnavailable(error)
              ? "Der Katalog ist im Moment nicht erreichbar."
              : "Der Suchindex konnte nicht geladen werden."}
          </strong>
          Versuchen Sie es in einigen Minuten erneut.
        </p>
      ) : null}

      {results.length > 0 ? (
        <ul className="border-t border-secondary/20">
          {results.map((entry) => (
            <li
              key={`${entry.kind}-${entry.id}`}
              className="group relative grid items-start gap-x-6 gap-y-2 border-b border-hairline py-6 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <h2 className="type-headline-sm">
                <Link
                  href={
                    entry.kind === "leistung"
                      ? `/leistung/${entry.slug}`
                      : `/service/${entry.slug}`
                  }
                  className="transition-colors duration-200 group-hover:text-primary after:absolute after:inset-0"
                >
                  {entry.name}
                </Link>
              </h2>
              {entry.summary ? (
                <p className="max-w-[68ch] sm:col-start-1">{entry.summary}</p>
              ) : null}
              {entry.context ? (
                <p className="type-body-sm sm:col-start-1">{entry.context}</p>
              ) : null}
              <span className="flex items-center gap-4 type-body-sm whitespace-nowrap sm:col-start-2 sm:row-span-3 sm:row-start-1">
                <span className="inline-flex h-6 items-center rounded-md bg-tile-teaser px-2 text-[0.8125rem]">
                  {entry.kind === "service"
                    ? "Service"
                    : (entry.subtypeLabel ?? "Leistung")}
                </span>
                <ArrowRightIcon
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4 transition-[translate,color] duration-200 group-hover:translate-x-[3px] group-hover:text-primary"
                />
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {data && results.length === 0 && filtered ? (
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => update({ query: "", subtype: "", audience: "" })}
          >
            Suche zurücksetzen
          </Button>
        </div>
      ) : null}
    </div>
  )
}

/** Filter als Optionsfelder im Chip-Look; der gewählte Chip ist Schiefer. */
function RadioChips({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string
  name: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  // Ein Filter mit nur einem Wert grenzt nichts ein (wie in den Kacheln).
  if (options.length < 2 && !value) return null
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="float-left mr-3 text-[0.8125rem] leading-11">
        {legend}
      </legend>
      {["", ...options].map((option) => (
        <label key={option || "alle"} className="relative inline-flex">
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            className="peer absolute inset-0 m-0 cursor-pointer opacity-0"
          />
          <span className="inline-flex min-h-11 items-center rounded-md bg-secondary/6 px-4 text-sm transition-[background-color,color,scale] duration-200 peer-checked:bg-secondary peer-checked:text-secondary-foreground peer-hover:bg-secondary/12 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-active:scale-[0.98]">
            {option || "Alle"}
          </span>
        </label>
      ))}
    </fieldset>
  )
}
