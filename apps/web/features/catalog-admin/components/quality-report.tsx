"use client"

import type { QualityIssue } from "@workspace/api"
import {
  CircleCheckIcon,
  CircleXIcon,
  ExternalLinkIcon,
  InfoIcon,
  TriangleAlertIcon,
} from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { factSheetTypeLabel, formatNumber, severityLabels } from "./format"

type Severity = QualityIssue["severity"]
type Filter = Severity | "all"

const severities: Severity[] = ["error", "warning", "info"]

/** So viele Einträge je Gruppe zeigen, bevor «Alle anzeigen» nötig ist. */
const GROUP_PREVIEW = 8

const toggleItemClass =
  "h-10 px-3 data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:text-background"

const severityIcons: Record<Severity, React.ReactNode> = {
  error: <CircleXIcon aria-hidden="true" className="size-5 text-destructive" />,
  warning: <TriangleAlertIcon aria-hidden="true" className="size-5" />,
  info: (
    <InfoIcon aria-hidden="true" className="size-5 text-muted-foreground" />
  ),
}

function matches(issue: QualityIssue, query: string) {
  if (!query) return true
  const haystack =
    `${issue.factSheetName} ${issue.message} ${issue.code} ${factSheetTypeLabel(issue.factSheetType)}`.toLocaleLowerCase(
      "de-CH"
    )
  return query
    .toLocaleLowerCase("de-CH")
    .split(/\s+/)
    .every((term) => haystack.includes(term))
}

/** Datenqualitätsbericht: Auffälligkeiten nach Schweregrad, mit Filter. */
export function QualityReport({ issues }: { issues: QualityIssue[] }) {
  const [filter, setFilter] = React.useState<Filter>("all")
  const [query, setQuery] = React.useState("")
  const searchId = React.useId()

  const counts = React.useMemo(() => {
    const result: Record<Severity, number> = { error: 0, warning: 0, info: 0 }
    for (const issue of issues) result[issue.severity] += 1
    return result
  }, [issues])

  const groups = React.useMemo(() => {
    const trimmed = query.trim()
    return severities
      .filter((severity) => filter === "all" || filter === severity)
      .map((severity) => ({
        severity,
        items: issues
          .filter((i) => i.severity === severity && matches(i, trimmed))
          .sort(
            (a, b) =>
              a.code.localeCompare(b.code) ||
              a.factSheetName.localeCompare(b.factSheetName, "de-CH")
          ),
      }))
      .filter((group) => group.items.length > 0)
  }, [issues, filter, query])

  if (issues.length === 0) {
    return (
      <p className="flex items-center gap-2 border border-border p-6">
        <CircleCheckIcon aria-hidden="true" className="size-5" />
        Keine Auffälligkeiten: Die Daten aus LeanIX sind vollständig erfasst.
      </p>
    )
  }

  const shown = groups.reduce((sum, group) => sum + group.items.length, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1.5">
          <span id={`${searchId}-filter`} className="text-sm font-bold">
            Schweregrad
          </span>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={filter}
            onValueChange={(value) => {
              if (value) setFilter(value as Filter)
            }}
            aria-labelledby={`${searchId}-filter`}
            className="flex-wrap"
          >
            <ToggleGroupItem value="all" className={toggleItemClass}>
              Alle ({formatNumber(issues.length)})
            </ToggleGroupItem>
            {severities.map((severity) => (
              <ToggleGroupItem
                key={severity}
                value={severity}
                className={toggleItemClass}
              >
                {severityLabels[severity].plural} (
                {formatNumber(counts[severity])})
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex w-full flex-col gap-1.5 lg:max-w-sm">
          <label htmlFor={searchId} className="text-sm font-bold">
            Suche
          </label>
          <Input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Fact Sheet, Meldung oder Code"
            autoComplete="off"
            className="h-10"
          />
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {formatNumber(shown)} von {formatNumber(issues.length)} Einträgen
        angezeigt
      </p>

      {groups.length === 0 ? (
        <p className="border border-dashed border-border p-6 text-muted-foreground">
          Keine Einträge für diesen Filter.
        </p>
      ) : (
        groups.map((group) => (
          <IssueGroup
            key={group.severity}
            severity={group.severity}
            items={group.items}
            showAll={query.trim() !== "" || filter !== "all"}
          />
        ))
      )}
    </div>
  )
}

/** Gruppe eines Schweregrads; lange Listen zuerst gekürzt. */
function IssueGroup({
  severity,
  items,
  showAll,
}: {
  severity: Severity
  items: QualityIssue[]
  /** Bei Suche oder Filter immer alle Einträge zeigen. */
  showAll: boolean
}) {
  const [expanded, setExpanded] = React.useState(false)
  const listId = React.useId()
  const collapsible = !showAll && items.length > GROUP_PREVIEW
  const visible =
    collapsible && !expanded ? items.slice(0, GROUP_PREVIEW) : items
  const label =
    items.length === 1
      ? severityLabels[severity].singular
      : severityLabels[severity].plural

  return (
    <div className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-lg font-bold">
        {severityIcons[severity]}
        {label}{" "}
        <span className="font-normal text-muted-foreground">
          ({formatNumber(items.length)})
        </span>
      </h3>
      <ul id={listId} className="border-t border-border">
        {visible.map((issue, index) => (
          <IssueItem
            key={`${issue.factSheetId}-${issue.code}-${index}`}
            issue={issue}
          />
        ))}
      </ul>
      {collapsible ? (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? "Weniger anzeigen"
            : `Alle ${formatNumber(items.length)} ${severityLabels[severity].plural} anzeigen`}
        </Button>
      ) : null}
    </div>
  )
}

function IssueItem({ issue }: { issue: QualityIssue }) {
  return (
    <li className="grid gap-x-6 gap-y-1 border-b border-border py-3 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-bold [overflow-wrap:anywhere]">
            {issue.factSheetName}
          </span>
          <span className="text-sm text-muted-foreground">
            {factSheetTypeLabel(issue.factSheetType)}
          </span>
        </p>
        <p className="max-w-[70ch]">{issue.message}</p>
        <p className="font-mono text-xs text-muted-foreground">{issue.code}</p>
      </div>
      <a
        href={issue.leanixUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 self-start text-sm whitespace-nowrap underline decoration-1 underline-offset-4 hover:text-primary hover:decoration-2"
      >
        In LeanIX öffnen
        <ExternalLinkIcon aria-hidden="true" className="size-3.5" />
        <span className="sr-only">
          : {issue.factSheetName} (öffnet in neuem Tab)
        </span>
      </a>
    </li>
  )
}
