"use client"

import type { SyncRun } from "@workspace/api"
import * as React from "react"

import {
  formatDateTimeCompact,
  formatDuration,
  formatNumber,
  runStatusLabels,
  triggerLabels,
} from "./format"

const INITIAL_ROWS = 8

const statusTags: Record<SyncRun["status"], string> = {
  success: "tag tag--good",
  failed: "tag tag--bad",
  rejected: "tag tag--warn",
  running: "tag",
}

export function RunStatusTag({ status }: { status: SyncRun["status"] }) {
  return <span className={statusTags[status]}>{runStatusLabels[status]}</span>
}

/** Protokoll der letzten Synchronisierungen (neueste zuerst). */
export function SyncRunsTable({ runs }: { runs: SyncRun[] }) {
  const [showAll, setShowAll] = React.useState(false)

  if (runs.length === 0) {
    return (
      <p className="muted">
        Es wurde noch keine Synchronisierung durchgeführt.
      </p>
    )
  }

  const visible = showAll ? runs : runs.slice(0, INITIAL_ROWS)
  const hidden = runs.length - visible.length

  return (
    <>
      <div className="table-wrap">
        <table className="table table--stack">
          <caption className="sr-only">
            Letzte Synchronisierungen, neueste zuerst
          </caption>
          <thead>
            <tr>
              <th scope="col">Start</th>
              <th scope="col">Auslöser</th>
              <th scope="col">Status</th>
              <th scope="col" className="num">
                Dauer
              </th>
              <th scope="col" className="num">
                Leistungen
              </th>
              <th scope="col">Meldung</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((run) => (
              <tr key={run.id}>
                <td className="table__date" data-label="Start">
                  <time dateTime={run.startedAt}>
                    {formatDateTimeCompact(run.startedAt)}
                  </time>
                </td>
                <td data-label="Auslöser">{triggerLabels[run.trigger]}</td>
                <td data-label="Status">
                  <RunStatusTag status={run.status} />
                </td>
                <td className="num" data-label="Dauer">
                  {run.status === "running"
                    ? "–"
                    : formatDuration(run.durationMs)}
                </td>
                <td className="num" data-label="Leistungen">
                  {run.stats ? formatNumber(run.stats.leistungen) : "–"}
                </td>
                <td className="table__message" data-label="Meldung">
                  {run.message ?? <span className="muted">–</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hidden > 0 || showAll ? (
        <div className="btn-row list-more">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            aria-expanded={showAll}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll
              ? "Weniger anzeigen"
              : `Alle ${formatNumber(runs.length)} Läufe anzeigen`}
          </button>
        </div>
      ) : null}
    </>
  )
}
