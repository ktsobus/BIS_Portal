"use client"

import { useEffect, useId, useMemo, useState } from "react"
import Link from "next/link"
import type { SearchEntry, SupportContact } from "@workspace/api"
import { Search, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label, Select } from "@/components/ui/field"

import { prepareEntries, searchEntries } from "../search"
import { countLabel } from "../text"
import { HelpPanel } from "./help-panel"

export interface SearchState {
  query: string
  subtype: string
  audience: string
}

function toUrl({ query, subtype, audience }: SearchState) {
  const params = new URLSearchParams()
  if (query.trim()) params.set("q", query.trim())
  if (subtype) params.set("typ", subtype)
  if (audience) params.set("fuer", audience)
  const search = params.toString()
  return search ? `/suche?${search}` : "/suche"
}

function entryHref(entry: SearchEntry) {
  return entry.kind === "leistung"
    ? `/leistung/${entry.slug}`
    : `/service/${entry.slug}`
}

/**
 * Volltextsuche über den ganzen Katalog. Die Datenmenge ist klein, darum
 * filtert der Browser bei jeder Eingabe; die Adresse bleibt teilbar.
 */
export function SearchView({
  entries,
  facets,
  initial,
  contact,
}: {
  entries: SearchEntry[]
  facets: { subtypes: string[]; audiences: string[] }
  initial: SearchState
  contact: SupportContact | null
}) {
  const inputId = useId()
  const subtypeId = useId()
  const audienceId = useId()
  const [state, setState] = useState(initial)

  const prepared = useMemo(() => prepareEntries(entries), [entries])
  const results = useMemo(
    () => searchEntries(prepared, state),
    [prepared, state]
  )

  // Adresse nachführen, ohne neu zu laden (Zurück-Taste bleibt beim Katalog).
  useEffect(() => {
    const url = toUrl(state)
    if (url !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, "", url)
    }
  }, [state])

  const filtered = Boolean(
    state.query.trim() || state.subtype || state.audience
  )
  const hasFacets = facets.subtypes.length > 1 || facets.audiences.length > 0

  return (
    <div className="container-page py-8 md:py-10">
      <form
        role="search"
        aria-label="Katalog durchsuchen"
        onSubmit={(event) => event.preventDefault()}
        className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem_14rem] md:items-end"
      >
        <div className="space-y-1.5">
          <Label htmlFor={inputId}>Suchbegriff</Label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted"
            />
            <input
              id={inputId}
              type="text"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              spellCheck={false}
              autoFocus
              value={state.query}
              placeholder="Name, Service, Anwendung …"
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  query: event.target.value,
                }))
              }
              className="h-12 w-full rounded-md border border-line-strong bg-white pr-11 pl-11 text-base text-ink transition-colors duration-150 ease-out hover:border-ink"
            />
            {state.query ? (
              <button
                type="button"
                aria-label="Suchbegriff löschen"
                onClick={() =>
                  setState((current) => ({ ...current, query: "" }))
                }
                className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted transition-colors duration-150 hover:bg-ground hover:text-ink"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
        {facets.subtypes.length > 1 ? (
          <div className="space-y-1.5">
            <Label htmlFor={subtypeId}>Art der Leistung</Label>
            <Select
              id={subtypeId}
              value={state.subtype}
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  subtype: event.target.value,
                }))
              }
              className="[&>select]:h-12"
            >
              <option value="">Alle</option>
              {facets.subtypes.map((subtype) => (
                <option key={subtype} value={subtype}>
                  {subtype}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        {facets.audiences.length > 0 ? (
          <div className="space-y-1.5">
            <Label htmlFor={audienceId}>Leistungsbezüger</Label>
            <Select
              id={audienceId}
              value={state.audience}
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  audience: event.target.value,
                }))
              }
              className="[&>select]:h-12"
            >
              <option value="">Alle</option>
              {facets.audiences.map((audience) => (
                <option key={audience} value={audience}>
                  {audience}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </form>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <h2 role="status" className="text-xl font-extrabold">
          {filtered
            ? countLabel(results.length, "Treffer", "Treffer")
            : `Alle ${countLabel(results.length, "Eintrag", "Einträge")}`}
        </h2>
        {filtered && hasFacets ? (
          <Button
            variant="quiet"
            size="sm"
            onClick={() => setState({ query: "", subtype: "", audience: "" })}
          >
            Suche zurücksetzen
          </Button>
        ) : null}
      </div>

      {results.length > 0 ? (
        <Card className="mt-4">
          <ul>
            {results.map((entry) => (
              <li
                key={`${entry.kind}-${entry.id}`}
                className="relative border-b border-line px-5 py-4 transition-colors duration-150 ease-out last:border-b-0 hover:bg-ground md:px-6"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-lg font-bold">
                    <Link
                      href={entryHref(entry)}
                      className="rounded-sm after:absolute after:inset-0"
                    >
                      {entry.name}
                    </Link>
                  </h3>
                  <Badge>
                    {entry.kind === "service"
                      ? "Service"
                      : (entry.subtypeLabel ?? "Leistung")}
                  </Badge>
                </div>
                {entry.summary ? (
                  <p className="mt-1 line-clamp-2 max-w-[70ch] text-sm text-text">
                    {entry.summary}
                  </p>
                ) : null}
                <p className="mt-1.5 text-sm text-muted">{entry.context}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Card className="p-6">
            <h3 className="text-lg font-bold">
              Zu dieser Suche gibt es keinen Eintrag
            </h3>
            <ul className="mt-3 max-w-[60ch] space-y-1.5 text-sm text-text">
              <li>
                – Prüfen Sie die Schreibweise oder suchen Sie mit weniger
                Wörtern.
              </li>
              <li>– Versuchen Sie den Namen der Anwendung, z. B. «SO!Desk».</li>
              {state.subtype || state.audience ? (
                <li>
                  – Entfernen Sie die Filter «Art der Leistung» und
                  «Leistungsbezüger».
                </li>
              ) : null}
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  setState({ query: "", subtype: "", audience: "" })
                }
              >
                Alle Einträge anzeigen
              </Button>
              <Button asChild variant="quiet">
                <Link href="/">Zu den Service-Familien</Link>
              </Button>
            </div>
          </Card>
          <HelpPanel contact={contact} />
        </div>
      )}
    </div>
  )
}
