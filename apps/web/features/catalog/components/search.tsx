"use client"

import { useQuery } from "@tanstack/react-query"
import * as React from "react"

import { Arrow, SearchGlyph } from "@/components/ui/arrow"
import { orpc } from "@/lib/orpc"

import { prepareEntries, searchEntries } from "../search"

interface SearchState {
  query: string
  subtype: string
  audience: string
}

/** Hält die Adresse aktuell, damit ein Treffer teilbar bleibt (ohne Navigation). */
function writeUrl(state: SearchState) {
  const params = new URLSearchParams()
  if (state.query.trim()) params.set("q", state.query.trim())
  if (state.subtype) params.set("art", state.subtype)
  if (state.audience) params.set("bezueger", state.audience)
  const search = params.toString()
  window.history.replaceState(
    null,
    "",
    search ? `${window.location.pathname}?${search}` : window.location.pathname
  )
}

function Chips({
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
  if (options.length === 0) return null
  return (
    <fieldset>
      <legend>{legend}</legend>
      {["", ...options].map((option) => (
        <label className="chip" key={option || "alle"}>
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
          />
          <span>{option || "Alle"}</span>
        </label>
      ))}
    </fieldset>
  )
}

/**
 * Suche über den ganzen Katalog. Der Index ist klein und wird einmal geladen;
 * gefiltert wird im Browser (`../search.ts`).
 */
export function CatalogSearch({
  initialQuery,
  initialSubtype,
  initialAudience,
}: {
  initialQuery: string
  initialSubtype: string
  initialAudience: string
}) {
  const [state, setState] = React.useState<SearchState>({
    query: initialQuery,
    subtype: initialSubtype,
    audience: initialAudience,
  })
  const { data, error, isPending } = useQuery(
    orpc.catalog.searchIndex.queryOptions()
  )

  const update = (patch: Partial<SearchState>) => {
    setState((current) => {
      const next = { ...current, ...patch }
      writeUrl(next)
      return next
    })
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

  const filtered = Boolean(
    state.query.trim() || state.subtype || state.audience
  )
  let count = ""
  if (data) {
    if (results.length === 0) {
      count = state.query.trim()
        ? `Kein Treffer für «${state.query.trim()}».`
        : "Kein Treffer mit diesen Filtern."
    } else if (filtered) {
      count = results.length === 1 ? "1 Treffer" : `${results.length} Treffer`
    } else {
      count = `${results.length} Einträge im Katalog`
    }
  }

  return (
    <div className="search">
      <form
        role="search"
        className="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="search__field">
          <label className="sr-only" htmlFor="suche-q">
            Suchbegriff
          </label>
          <SearchGlyph />
          <input
            id="suche-q"
            type="search"
            name="q"
            value={state.query}
            onChange={(event) => update({ query: event.target.value })}
            placeholder="Stichwort, Anwendung oder Stelle"
            autoComplete="off"
            enterKeyHint="search"
            autoFocus
          />
        </div>
        {data ? (
          <div className="filters">
            <Chips
              legend="Art"
              name="art"
              options={data.facets.subtypes}
              value={state.subtype}
              onChange={(subtype) => update({ subtype })}
            />
            <Chips
              legend="Für"
              name="bezueger"
              options={data.facets.audiences}
              value={state.audience}
              onChange={(audience) => update({ audience })}
            />
          </div>
        ) : null}
      </form>

      <p className="search__count" role="status" aria-live="polite">
        {isPending ? "Der Katalog wird geladen …" : count}
      </p>

      {error ? (
        <p className="note note--bad" role="alert">
          <strong>Der Katalog ist im Moment nicht erreichbar.</strong>
          Versuchen Sie es in einigen Minuten erneut.
        </p>
      ) : null}

      {results.length > 0 ? (
        <ul className="entries">
          {results.map((entry) => (
            <li className="entry" key={`${entry.kind}-${entry.id}`}>
              <h2 className="entry__name">
                <a
                  href={
                    entry.kind === "leistung"
                      ? `/leistung/${entry.slug}`
                      : `/service/${entry.slug}`
                  }
                >
                  {entry.name}
                </a>
              </h2>
              {entry.summary ? (
                <p className="entry__text">{entry.summary}</p>
              ) : null}
              <p className="entry__meta">{entry.context}</p>
              <span className="entry__side">
                <span className="tag">
                  {entry.kind === "service"
                    ? "Service"
                    : (entry.subtypeLabel ?? "Leistung")}
                </span>
                <Arrow />
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {data && results.length === 0 && filtered ? (
        <div className="btn-row">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => update({ query: "", subtype: "", audience: "" })}
          >
            Suche zurücksetzen
          </button>
        </div>
      ) : null}
    </div>
  )
}
