"use client"

import * as React from "react"
import Link from "next/link"
import { ORPCError } from "@orpc/client"
import type { SearchEntry } from "@workspace/api"
import { useQuery } from "@tanstack/react-query"

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { orpc } from "@/lib/orpc"

import { prepareEntries, searchEntries } from "../search"

export interface CatalogSearchProps {
  initialQuery?: string
  initialSubtype?: string
  initialAudience?: string
}

interface SearchState {
  query: string
  subtype: string
  audience: string
}

/** Schreibt den Suchzustand in die URL (ohne neuen Verlaufseintrag). */
function writeUrl(state: SearchState) {
  const params = new URLSearchParams()
  if (state.query.trim()) params.set("q", state.query.trim())
  if (state.subtype) params.set("art", state.subtype)
  if (state.audience) params.set("bezueger", state.audience)
  const search = params.toString()
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${search ? `?${search}` : ""}`
  )
}

const selectClass =
  "w-full [&_select]:h-11 [&_select]:rounded-[3px] [&_select]:border-input [&_select]:text-base"

/**
 * Clientseitige Suche über den Suchindex (`catalog.searchIndex`). Die
 * Eingabe wird in der URL gehalten (`q`, `art`, `bezueger`).
 */
export function CatalogSearch({
  initialQuery = "",
  initialSubtype = "",
  initialAudience = "",
}: CatalogSearchProps) {
  const [state, setState] = React.useState<SearchState>({
    query: initialQuery,
    subtype: initialSubtype,
    audience: initialAudience,
  })

  const { data, error, isPending } = useQuery(
    orpc.catalog.searchIndex.queryOptions({ staleTime: 5 * 60 * 1000 })
  )

  const prepared = React.useMemo(
    () => (data ? prepareEntries(data.entries) : []),
    [data]
  )
  const results = React.useMemo(
    () =>
      searchEntries(prepared, {
        query: state.query,
        subtype: state.subtype,
        audience: state.audience,
      }),
    [prepared, state]
  )

  function update(patch: Partial<SearchState>) {
    const next = { ...state, ...patch }
    setState(next)
    writeUrl(next)
  }

  const subtypes = data?.facets.subtypes ?? []
  const audiences = data?.facets.audiences ?? []
  const query = state.query.trim()
  const hasFilter = Boolean(query || state.subtype || state.audience)

  return (
    <div className="flex flex-col gap-8">
      <form
        role="search"
        aria-label="Katalog durchsuchen"
        onSubmit={(event) => event.preventDefault()}
        className="flex flex-col gap-4 border-t-4 border-primary bg-so-surface p-5"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="suche-begriff" className="text-lg leading-tight">
            Suchbegriff
          </label>
          <input
            id="suche-begriff"
            type="search"
            value={state.query}
            onChange={(event) => update({ query: event.target.value })}
            autoComplete="off"
            placeholder="z. B. eLearning, Mitwirkung, Zugang"
            aria-describedby="suche-hinweis"
            className="h-12 w-full max-w-[44rem] border border-input bg-background px-3 text-lg placeholder:text-muted-foreground"
          />
          <p id="suche-hinweis" className="text-sm text-so-graphite">
            Mehrere Wörter grenzen die Suche ein. Gross-/Kleinschreibung und
            Umlaute (ä oder ae) spielen keine Rolle.
          </p>
        </div>

        {subtypes.length > 0 || audiences.length > 0 ? (
          <div className="grid max-w-[44rem] gap-4 sm:grid-cols-2">
            {subtypes.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="suche-art" className="text-base">
                  Art der Leistung
                </label>
                <NativeSelect
                  id="suche-art"
                  value={state.subtype}
                  onChange={(event) => update({ subtype: event.target.value })}
                  className={selectClass}
                >
                  <NativeSelectOption value="">Alle</NativeSelectOption>
                  {subtypes.map((subtype) => (
                    <NativeSelectOption key={subtype} value={subtype}>
                      {subtype}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            ) : null}
            {audiences.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="suche-bezueger" className="text-base">
                  Leistungsbezüger
                </label>
                <NativeSelect
                  id="suche-bezueger"
                  value={state.audience}
                  onChange={(event) => update({ audience: event.target.value })}
                  className={selectClass}
                >
                  <NativeSelectOption value="">Alle</NativeSelectOption>
                  {audiences.map((audience) => (
                    <NativeSelectOption key={audience} value={audience}>
                      {audience}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            ) : null}
          </div>
        ) : null}
      </form>

      <section
        aria-labelledby="suche-ergebnisse"
        className="flex flex-col gap-2"
      >
        <div aria-live="polite" aria-atomic="true">
          <h2 id="suche-ergebnisse" className="text-2xl leading-tight">
            {isPending
              ? "Suchindex wird geladen …"
              : error
                ? "Suche nicht verfügbar"
                : resultHeading(results.length, query, hasFilter)}
          </h2>
        </div>

        {error ? (
          <p className="max-w-[70ch]">
            {error instanceof ORPCError && error.code === "CATALOG_UNAVAILABLE"
              ? "Der Katalog ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut."
              : "Der Suchindex konnte nicht geladen werden. Bitte laden Sie die Seite neu."}
          </p>
        ) : null}

        {!isPending && !error && results.length === 0 ? (
          <div className="flex max-w-[70ch] flex-col gap-2">
            <p>
              Versuchen Sie einen anderen oder kürzeren Begriff, oder setzen Sie
              die Filter auf «Alle».
            </p>
            <p>
              <Link href="/" className="link-cd">
                Alle Service-Familien anzeigen
              </Link>
            </p>
          </div>
        ) : null}

        {results.length > 0 ? (
          <ol className="flex flex-col border-b border-border">
            {results.map((entry) => (
              <SearchResult key={`${entry.kind}-${entry.id}`} entry={entry} />
            ))}
          </ol>
        ) : null}
      </section>
    </div>
  )
}

function resultHeading(count: number, query: string, hasFilter: boolean) {
  if (!hasFilter) return `Alle Einträge (${count})`
  const hits = count === 1 ? "1 Treffer" : `${count} Treffer`
  return query ? `${hits} für «${query}»` : hits
}

function SearchResult({ entry }: { entry: SearchEntry }) {
  const href =
    entry.kind === "leistung"
      ? `/leistung/${entry.slug}`
      : `/service/${entry.slug}`
  return (
    <li className="group relative flex flex-col gap-1.5 border-t border-border py-4">
      <h3 className="text-lg leading-tight font-bold">
        <Link
          href={href}
          className="group-hover:underline after:absolute after:inset-0"
        >
          {entry.name}
        </Link>
      </h3>
      <p className="order-first text-sm text-so-graphite">
        <span className="font-bold">
          {entry.subtypeLabel ??
            (entry.kind === "leistung" ? "Leistung" : "Service")}
        </span>
        {entry.context ? <> · {entry.context}</> : null}
      </p>
      {entry.summary ? (
        <p className="max-w-[70ch] text-so-graphite">{entry.summary}</p>
      ) : null}
    </li>
  )
}
