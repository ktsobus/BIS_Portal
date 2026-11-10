"use client"

import type { SyncRun } from "@workspace/api"
import { BanIcon, CircleCheckIcon, CircleXIcon } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  formatDateTimeCompact,
  formatDuration,
  formatNumber,
  runStatusLabels,
  triggerLabels,
} from "./format"

const INITIAL_ROWS = 8

export function RunStatusBadge({ status }: { status: SyncRun["status"] }) {
  const label = runStatusLabels[status]
  switch (status) {
    case "success":
      return (
        <Badge variant="outline">
          <CircleCheckIcon aria-hidden="true" />
          {label}
        </Badge>
      )
    case "failed":
      return (
        <Badge variant="destructive">
          <CircleXIcon aria-hidden="true" />
          {label}
        </Badge>
      )
    case "rejected":
      return (
        <Badge variant="secondary">
          <BanIcon aria-hidden="true" />
          {label}
        </Badge>
      )
    case "running":
      return (
        <Badge variant="secondary">
          <Spinner aria-hidden="true" />
          {label}
        </Badge>
      )
  }
}

/** Protokoll der letzten Synchronisierungen (neueste zuerst). */
export function SyncRunsTable({ runs }: { runs: SyncRun[] }) {
  const [showAll, setShowAll] = React.useState(false)

  if (runs.length === 0) {
    return (
      <p className="rounded-tile bg-tile-teaser p-6">
        Es wurde noch keine Synchronisierung durchgeführt.
      </p>
    )
  }

  const visible = showAll ? runs : runs.slice(0, INITIAL_ROWS)
  const hidden = runs.length - visible.length

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="w-full overflow-hidden rounded-tile border border-hairline">
        <Table>
          <caption className="sr-only">
            Letzte Synchronisierungen, neueste zuerst
          </caption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col">Start</TableHead>
              <TableHead scope="col">Auslöser</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col" className="text-right">
                Dauer
              </TableHead>
              <TableHead scope="col" className="text-right">
                Leistungen
              </TableHead>
              <TableHead scope="col" className="w-full">
                Meldung
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((run) => (
              <TableRow key={run.id} className="align-top">
                <TableCell className="py-2.5 align-top tabular-nums">
                  <time dateTime={run.startedAt}>
                    {formatDateTimeCompact(run.startedAt)}
                  </time>
                </TableCell>
                <TableCell className="py-2.5 align-top">
                  {triggerLabels[run.trigger]}
                </TableCell>
                <TableCell className="py-2.5 align-top">
                  <RunStatusBadge status={run.status} />
                </TableCell>
                <TableCell className="py-2.5 text-right align-top tabular-nums">
                  {run.status === "running"
                    ? "–"
                    : formatDuration(run.durationMs)}
                </TableCell>
                <TableCell className="py-2.5 text-right align-top tabular-nums">
                  {run.stats ? formatNumber(run.stats.leistungen) : "–"}
                </TableCell>
                <TableCell className="min-w-64 py-2.5 align-top whitespace-normal">
                  {run.message ?? (
                    <span className="text-muted-foreground">–</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {hidden > 0 || showAll ? (
        <Button
          variant="outline"
          size="sm"
          aria-expanded={showAll}
          onClick={() => setShowAll(!showAll)}
        >
          {showAll
            ? "Weniger anzeigen"
            : `Alle ${formatNumber(runs.length)} Läufe anzeigen`}
        </Button>
      ) : null}
    </div>
  )
}
