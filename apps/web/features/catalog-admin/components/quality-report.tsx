"use client"

import type { QualityIssue } from "@workspace/api"
import * as React from "react"

import { factSheetTypeLabel, formatNumber, severityLabels } from "./format"

type Severity = QualityIssue["severity"]
type Filter = Severity | "all"

const severities: Severity[] = ["error", "warning", "info"]

/** So viele Einträge je Gruppe zeigen, bevor «Alle anzeigen» nötig ist. */
const GROUP_PREVIEW = 8

const severityTags: Record<Severity, string> = {
  error: "tag tag--bad",
  warning: "tag tag--warn",
  info: "tag",
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
  const filterName = React.useId()

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
      <p>
        Keine Auffälligkeiten: Die Daten aus LeanIX sind vollständig erfasst.
      </p>
    )
  }

  const shown = groups.reduce((sum, group) => sum + group.items.length, 0)
  const options: Array<{ value: Filter; label: string }> = [
    { value: "all", label: `Alle (${formatNumber(issues.length)})` },
    ...severities.map((severity) => ({
      value: severity,
      label: `${severityLabels[severity].plural} (${formatNumber(counts[severity])})`,
    })),
  ]

  return (
    <div className="quality">
      <div className="list-tools">
        <div className="filters">
          <fieldset>
            <legend>Schweregrad</legend>
            {options.map((option) => (
              <label className="chip" key={option.value}>
                <input
                  type="radio"
                  name={filterName}
                  value={option.value}
                  checked={filter === option.value}
                  onChange={() => setFilter(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
        </div>
        <div className="field list-tools__search">
          <label htmlFor={searchId}>Suche</label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Fact Sheet, Meldung oder Code"
            autoComplete="off"
          />
        </div>
      </div>

      <p role="status" className="search__count">
        {formatNumber(shown)} von {formatNumber(issues.length)} Einträgen
        angezeigt
      </p>

      {groups.length === 0 ? (
        <p className="muted">Keine Einträge für diesen Filter.</p>
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
    <div className="quality__group">
      <h3 className="quality__title">
        <span className={severityTags[severity]}>{label}</span>
        <span className="muted">{formatNumber(items.length)}</span>
      </h3>
      <ul id={listId} className="entries">
        {visible.map((issue, index) => (
          <IssueItem
            key={`${issue.factSheetId}-${issue.code}-${index}`}
            issue={issue}
          />
        ))}
      </ul>
      {collapsible ? (
        <div className="btn-row list-more">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded
              ? "Weniger anzeigen"
              : `Alle ${formatNumber(items.length)} ${severityLabels[severity].plural} anzeigen`}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function IssueItem({ issue }: { issue: QualityIssue }) {
  return (
    <li className="issue">
      <div className="issue__body">
        <p>
          <span className="issue__name">{issue.factSheetName}</span>{" "}
          <span className="t-small muted">
            {factSheetTypeLabel(issue.factSheetType)}
          </span>
        </p>
        <p className="measure">{issue.message}</p>
        <p className="code muted">{issue.code}</p>
      </div>
      <a
        className="ext admin-link"
        href={issue.leanixUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        In LeanIX öffnen
        <span className="sr-only">
          : {issue.factSheetName} (öffnet in neuem Tab)
        </span>
      </a>
    </li>
  )
}
