"use client"

import * as React from "react"
import Link from "next/link"
import { ORPCError } from "@orpc/client"
import type { SearchEntry } from "@workspace/api"
import { useQuery } from "@tanstack/react-query"
import { ArrowRightIcon } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { orpc } from "@/lib/orpc"

import { prepareEntries, searchEntries } from "../search"
import { SearchFieldLarge } from "./search-field-large"
import { CardGrid, ServiceCard } from "./service-card"

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

/**
 * Clientseitige Suche über den Suchindex (`catalog.searchIndex`). Die
 * Eingabe wird in der URL gehalten (`q`, `art`, `bezueger`). Filter sind
 * graue Chips, Treffer erscheinen als Servicekarten.
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
  const resultsHeadingRef = React.useRef<HTMLHeadingElement>(null)

  const { data, error, isPending } = useQuery(
    orpc.catalog.searchIndex.queryOptions({
      staleTime: 5 * 60 * 1000,
      // Katalog nicht verfügbar: sofort melden statt ~7 s «wird geladen»
      // (TanStack-Standard: drei Wiederholungen). Sonst ein Versuch mehr.
      retry: (failureCount, error) =>
        !isCatalogUnavailable(error) && failureCount < 1,
    })
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
  // Ein Filter mit nur einem Wert grenzt nichts ein; er bleibt aber sichtbar,
  // wenn er (z. B. über einen Link) schon gesetzt ist, damit man ihn löst.
  const showSubtypes = subtypes.length > 1 || Boolean(state.subtype)
  const showAudiences = audiences.length > 1 || Boolean(state.audience)

  return (
    <div className="flex flex-col gap-12">
      <form
        role="search"
        aria-label="Katalog durchsuchen"
        onSubmit={(event) => {
          // Die Treffer erscheinen schon beim Tippen; «Suchen» springt hin.
          event.preventDefault()
          resultsHeadingRef.current?.focus()
        }}
        className="flex flex-col gap-8"
      >
        <SearchFieldLarge
          id="suche-begriff"
          label="Suchbegriff"
          value={state.query}
          onChange={(event) => update({ query: event.target.value })}
          className="max-w-reading"
        />

        {showSubtypes || showAudiences ? (
          <div className="flex flex-col gap-6">
            {showSubtypes ? (
              <ChipFilter
                legend="Art der Leistung"
                options={subtypes}
                value={state.subtype}
                onChange={(subtype) => update({ subtype })}
              />
            ) : null}
            {showAudiences ? (
              <ChipFilter
                legend="Leistungsbezüger"
                options={audiences}
                value={state.audience}
                onChange={(audience) => update({ audience })}
              />
            ) : null}
          </div>
        ) : null}
      </form>

      <section
        aria-labelledby="suche-ergebnisse"
        className="flex flex-col gap-6"
      >
        <div aria-live="polite" aria-atomic="true">
          <h2
            id="suche-ergebnisse"
            ref={resultsHeadingRef}
            tabIndex={-1}
            className="type-body-lg font-normal outline-none"
          >
            {isPending
              ? "Suchindex wird geladen …"
              : error
                ? "Suche nicht verfügbar"
                : resultHeading(results.length, query)}
          </h2>
        </div>

        {isPending ? <ResultsSkeleton /> : null}

        {error ? (
          <p className="max-w-[70ch]">
            {isCatalogUnavailable(error)
              ? "Der Katalog ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut."
              : "Der Suchindex konnte nicht geladen werden. Bitte laden Sie die Seite neu."}
          </p>
        ) : null}

        {!isPending && !error && results.length === 0 ? (
          <div className="flex max-w-[70ch] flex-col items-start gap-6">
            <p>
              {state.subtype || state.audience
                ? "Versuchen Sie einen anderen oder kürzeren Begriff, oder setzen Sie die Filter auf «Alle»."
                : "Versuchen Sie einen anderen oder kürzeren Begriff."}
            </p>
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              Alle Service-Familien
              <ArrowRightIcon aria-hidden="true" strokeWidth={1.5} />
            </Link>
          </div>
        ) : null}

        {results.length > 0 ? (
          <CardGrid>
            {results.map((entry) => (
              <li key={`${entry.kind}-${entry.id}`}>
                <SearchResult entry={entry} />
              </li>
            ))}
          </CardGrid>
        ) : null}
      </section>
    </div>
  )
}

function isCatalogUnavailable(error: unknown): boolean {
  return error instanceof ORPCError && error.code === "CATALOG_UNAVAILABLE"
}

function resultHeading(count: number, query: string) {
  const hits = count === 1 ? "1 Resultat" : `${count} Resultate`
  return query ? `${hits} für «${query}»` : hits
}

/** Filter als graue Chips; der gewählte Chip ist rot (`aria-pressed`). */
function ChipFilter({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 type-body-sm">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {["", ...options].map((option) => (
          <Button
            key={option || "alle"}
            type="button"
            variant="chip"
            size="sm"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {option || "Alle"}
          </Button>
        ))}
      </div>
    </fieldset>
  )
}

function SearchResult({ entry }: { entry: SearchEntry }) {
  const href =
    entry.kind === "leistung"
      ? `/leistung/${entry.slug}`
      : `/service/${entry.slug}`
  return (
    <ServiceCard
      id={`treffer-${entry.kind}-${entry.id}`}
      href={href}
      title={entry.name}
      meta={
        <>
          {entry.subtypeLabel ??
            (entry.kind === "leistung" ? "Leistung" : "Service")}
          {entry.context ? (
            <>
              <br />
              {entry.context}
            </>
          ) : null}
        </>
      }
    >
      {entry.summary ? <p className="line-clamp-3">{entry.summary}</p> : null}
    </ServiceCard>
  )
}

function ResultsSkeleton() {
  return (
    <ul
      aria-hidden="true"
      className="grid gap-3 md:grid-cols-2 md:gap-6 xl:grid-cols-3 xl:gap-12"
    >
      {[0, 1, 2].map((index) => (
        <li key={index}>
          <Skeleton className="h-60 rounded-tile bg-tile-service" />
        </li>
      ))}
    </ul>
  )
}
