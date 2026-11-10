"use client"

import { useMemo, useState } from "react"
import type {
  CatalogAdminOverview,
  QualityIssue,
  SyncRun,
} from "@workspace/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { RefreshCw, Search } from "lucide-react"

import { ExternalLink } from "@/components/site/external-link"
import { Status, type Tone } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Notice } from "@/components/ui/notice"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, Td, Th } from "@/components/ui/table"
import { useToast } from "@/components/ui/toast"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { QueryError } from "@/components/admin/query-error"
import { formatRelative } from "@/lib/format"
import { errorMessage } from "@/lib/messages"
import { orpc } from "@/lib/orpc"
import { cn } from "@/lib/utils"

import {
  factSheetTypeLabel,
  formatDateTimeCompact,
  formatDateTimeLong,
  formatDuration,
  formatHours,
  formatInterval,
  formatNumber,
  formatPercent,
  runStatusLabels,
  severityLabels,
  triggerLabels,
} from "../format"

type Severity = QualityIssue["severity"]

const severityTone: Record<Severity, Tone> = {
  error: "error",
  warning: "warning",
  info: "info",
}
const severityOrder: Record<Severity, number> = {
  error: 0,
  warning: 1,
  info: 2,
}

const runTone: Record<SyncRun["status"], Tone> = {
  running: "info",
  success: "ok",
  failed: "error",
  rejected: "warning",
}

const PAGE_SIZE = 25

function SyncNowButton({ demo }: { demo: boolean }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const sync = useMutation(
    orpc.catalogAdmin.syncNow.mutationOptions({
      onSuccess: (run) => {
        if (run.status === "success") {
          toast({
            title: "Abgleich abgeschlossen",
            description: run.stats
              ? `${formatNumber(run.stats.leistungen)} Leistungen im Katalog.`
              : undefined,
          })
        } else {
          toast({
            tone: "error",
            title:
              run.status === "rejected"
                ? "Neuer Stand abgelehnt"
                : "Abgleich fehlgeschlagen",
            description:
              run.message ?? "Der bisherige Stand bleibt veröffentlicht.",
          })
        }
      },
      onError: (error) => {
        toast({
          tone: "error",
          title: "Abgleich nicht gestartet",
          description: errorMessage(error, {
            CONFLICT: "Ein Abgleich läuft bereits.",
            PRECONDITION_FAILED:
              "Im Demo-Modus gibt es keinen Abgleich: Es ist kein LeanIX-API-Token konfiguriert.",
          }),
        })
      },
      onSettled: () =>
        queryClient.invalidateQueries({
          queryKey: orpc.catalogAdmin.overview.key(),
        }),
    })
  )
  return (
    <Button
      variant="primary"
      loading={sync.isPending}
      disabled={demo}
      title={demo ? "Im Demo-Modus gibt es keinen Abgleich" : undefined}
      onClick={() => sync.mutate({})}
    >
      {sync.isPending ? null : <RefreshCw aria-hidden="true" />}
      {sync.isPending ? "Abgleich läuft …" : "Jetzt abgleichen"}
    </Button>
  )
}

function Fact({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm break-words text-ink">{children}</dd>
    </div>
  )
}

function StatusCard({ data }: { data: CatalogAdminOverview }) {
  const { status, config, snapshot } = data
  const demo = config.source === "demo"
  const tone: Tone = !status.available
    ? "error"
    : status.stale
      ? "warning"
      : "ok"
  const label = !status.available
    ? "Kein Katalog geladen"
    : status.stale
      ? "Nicht aktuell"
      : "Aktuell"
  const relative = formatRelative(status.generatedAt)

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line px-6 py-4">
        <Status tone={tone} className="text-base">
          {label}
        </Status>
        {status.generatedAt ? (
          <p className="text-sm text-text">
            Stand {formatDateTimeLong(status.generatedAt)}
            {relative ? (
              <span className="text-muted"> ({relative})</span>
            ) : null}
          </p>
        ) : null}
        {demo ? <Status tone="info">Demo-Modus</Status> : null}
      </div>
      <dl className="grid gap-x-8 gap-y-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Quelle">
          {demo ? "Mitgelieferte Demo-Daten" : config.leanixBaseUrl}
        </Fact>
        <Fact label="Workspace">{config.workspace ?? "–"}</Fact>
        <Fact label="Abgleich">
          {demo ? "Ausgeschaltet" : formatInterval(config.syncIntervalMinutes)}
        </Fact>
        <Fact label="Gilt als veraltet nach">
          {formatHours(config.staleAfterHours)}
        </Fact>
        <Fact label="LeanIX-API-Token">
          {config.tokenConfigured ? "Konfiguriert" : "Nicht konfiguriert"}
        </Fact>
        <Fact label="Standard-Aktion (Service Desk)">
          {config.fallbackActionConfigured
            ? "Konfiguriert"
            : "Nicht konfiguriert"}
        </Fact>
        <Fact label="Schrumpf-Schutz">
          Ablehnung unter {formatPercent(config.minRatio)} der Leistungen
        </Fact>
        <Fact label="Wurzel-Kategorie">
          <span className="font-mono text-xs">{config.rootCategoryId}</span>
        </Fact>
      </dl>
      {snapshot ? (
        <dl className="grid grid-cols-2 border-t border-line sm:grid-cols-3 lg:grid-cols-6">
          {(
            [
              ["Familien", snapshot.stats.families],
              ["Services", snapshot.stats.services],
              ["Leistungen", snapshot.stats.leistungen],
              ["Aktionen", snapshot.stats.actions],
              ["Im Kanal", snapshot.stats.leistungenInChannel],
              ["Nicht angezeigt", snapshot.stats.leistungenSkipped],
            ] as const
          ).map(([name, value]) => (
            <div
              key={name}
              className="border-line px-6 py-4 max-lg:border-b lg:border-r lg:last:border-r-0"
            >
              <dt className="text-xs text-muted">{name}</dt>
              <dd className="mt-0.5 text-2xl font-bold text-ink tabular-nums">
                {value === undefined ? "–" : formatNumber(value)}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </Card>
  )
}

/**
 * Kategorien heissen in LeanIX wie ihr Pfad («Katalog / Familie / Service»).
 * Verlinkt wird der letzte Teil, der Rest steht als Einordnung darunter.
 */
function FactSheetName({ issue }: { issue: QualityIssue }) {
  const parts = issue.factSheetName.split(" / ")
  const name = parts.at(-1) ?? issue.factSheetName
  const parents = parts.slice(0, -1).join(" / ")
  return (
    <>
      <ExternalLink href={issue.leanixUrl} className="link font-bold">
        {name}
      </ExternalLink>
      <span className="block text-xs text-muted">
        {factSheetTypeLabel(issue.factSheetType)}
        {parents ? ` in ${parents}` : null}
      </span>
    </>
  )
}

const URL_IN_TEXT = /(https:\/\/[^\s)]+)/

/**
 * Meldungen nennen das betroffene Fact Sheet teils mit voller LeanIX-Adresse.
 * Die Adresse wird zum kurzen Link, damit der Satz lesbar bleibt.
 */
function IssueMessage({ message }: { message: string }) {
  return (
    <span className="[overflow-wrap:anywhere]">
      {message.split(URL_IN_TEXT).map((part, index) =>
        index % 2 === 1 ? (
          <ExternalLink key={index} href={part} className="link">
            in LeanIX öffnen
          </ExternalLink>
        ) : (
          part
        )
      )}
    </span>
  )
}

function QualityReport({ issues }: { issues: QualityIssue[] }) {
  const [severity, setSeverity] = useState<Severity | "all">("all")
  const [text, setText] = useState("")
  const [limit, setLimit] = useState(PAGE_SIZE)

  const counts = useMemo(() => {
    const result: Record<Severity, number> = { error: 0, warning: 0, info: 0 }
    for (const issue of issues) result[issue.severity] += 1
    return result
  }, [issues])

  const filtered = useMemo(() => {
    const needle = text.trim().toLocaleLowerCase("de-CH")
    return issues
      .filter((issue) => severity === "all" || issue.severity === severity)
      .filter(
        (issue) =>
          !needle ||
          `${issue.factSheetName} ${issue.message} ${issue.code}`
            .toLocaleLowerCase("de-CH")
            .includes(needle)
      )
      .sort(
        (a, b) =>
          severityOrder[a.severity] - severityOrder[b.severity] ||
          a.code.localeCompare(b.code) ||
          a.factSheetName.localeCompare(b.factSheetName, "de-CH")
      )
  }, [issues, severity, text])

  if (issues.length === 0) {
    return (
      <Notice tone="ok" title="Keine Auffälligkeiten">
        Der letzte Abgleich hat in den LeanIX-Daten nichts gefunden, das
        nachgepflegt werden müsste.
      </Notice>
    )
  }

  const filters: { value: Severity | "all"; label: string; count: number }[] = [
    { value: "all", label: "Alle", count: issues.length },
    ...(["error", "warning", "info"] as const).map((value) => ({
      value,
      label: severityLabels[value].plural,
      count: counts[value],
    })),
  ]
  const shown = filtered.slice(0, limit)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Nach Schwere filtern"
          className="flex flex-wrap gap-1.5"
        >
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={severity === filter.value}
              onClick={() => {
                setSeverity(filter.value)
                setLimit(PAGE_SIZE)
              }}
              className={cn(
                "flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition-colors duration-150 ease-out",
                severity === filter.value
                  ? "border-ink bg-white font-bold text-ink"
                  : "border-line bg-white text-text hover:border-line-strong"
              )}
            >
              {filter.label}
              <span className="text-muted tabular-nums">
                {formatNumber(filter.count)}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            inputMode="search"
            value={text}
            aria-label="Auffälligkeiten durchsuchen"
            placeholder="Fact Sheet, Meldung oder Code"
            onChange={(event) => {
              setText(event.target.value)
              setLimit(PAGE_SIZE)
            }}
            className="h-9 w-full rounded-md border border-line-strong bg-white pr-3 pl-9 text-sm text-ink transition-colors duration-150 ease-out hover:border-ink"
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <>
          <div className="mt-3">
            <Table>
              <thead>
                <tr>
                  <Th className="w-32">Schwere</Th>
                  <Th>Fact Sheet in LeanIX</Th>
                  <Th>Auffälligkeit</Th>
                </tr>
              </thead>
              <tbody>
                {shown.map((issue, index) => (
                  <tr key={`${issue.factSheetId}-${issue.code}-${index}`}>
                    <Td>
                      <Status tone={severityTone[issue.severity]}>
                        {severityLabels[issue.severity].singular}
                      </Status>
                    </Td>
                    <Td className="md:w-[38%]">
                      <FactSheetName issue={issue} />
                    </Td>
                    <Td>
                      <IssueMessage message={issue.message} />
                      <button
                        type="button"
                        title="Nur Auffälligkeiten dieser Art anzeigen"
                        onClick={() => {
                          setText(issue.code)
                          setLimit(PAGE_SIZE)
                        }}
                        className="mt-0.5 block rounded-sm font-mono text-xs text-muted underline-offset-[0.2em] hover:text-ink hover:underline"
                      >
                        {issue.code}
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
            <p role="status">
              {formatNumber(shown.length)} von {formatNumber(filtered.length)}{" "}
              angezeigt
            </p>
            {filtered.length > shown.length ? (
              <Button size="sm" onClick={() => setLimit(limit + PAGE_SIZE)}>
                Weitere {Math.min(PAGE_SIZE, filtered.length - shown.length)}{" "}
                anzeigen
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <Card className="mt-3 p-6 text-sm text-text">
          <p role="status">Kein Eintrag passt zu diesem Filter.</p>
          <Button
            size="sm"
            className="mt-3"
            onClick={() => {
              setSeverity("all")
              setText("")
            }}
          >
            Filter zurücksetzen
          </Button>
        </Card>
      )}
    </div>
  )
}

function RunsTable({ runs, demo }: { runs: SyncRun[]; demo: boolean }) {
  if (runs.length === 0) {
    return (
      <Card className="p-6 text-sm text-text">
        {demo
          ? "Im Demo-Modus läuft kein Abgleich. Sobald ein LeanIX-API-Token konfiguriert ist, erscheinen hier die Läufe."
          : "Noch kein Abgleich gelaufen. Der erste startet beim Serverstart oder über «Jetzt abgleichen»."}
      </Card>
    )
  }
  return (
    <Table>
      <thead>
        <tr>
          <Th>Start</Th>
          <Th>Auslöser</Th>
          <Th>Ergebnis</Th>
          <Th className="text-right">Dauer</Th>
          <Th className="text-right">Leistungen</Th>
          <Th>Meldung</Th>
        </tr>
      </thead>
      <tbody>
        {runs.map((run) => (
          <tr key={run.id}>
            <Td label="Start" className="whitespace-nowrap">
              {formatDateTimeCompact(run.startedAt)}
            </Td>
            <Td label="Auslöser" className="whitespace-nowrap">
              {triggerLabels[run.trigger]}
            </Td>
            <Td label="Ergebnis">
              <Status tone={runTone[run.status]}>
                {runStatusLabels[run.status]}
              </Status>
            </Td>
            <Td label="Dauer" className="text-right whitespace-nowrap">
              {formatDuration(run.durationMs)}
            </Td>
            <Td label="Leistungen" className="text-right">
              {run.stats ? formatNumber(run.stats.leistungen) : "–"}
            </Td>
            <Td label="Meldung" className="md:min-w-64">
              {run.message ?? "–"}
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

function LoadingState() {
  return (
    <div aria-busy="true" aria-label="Katalogstatus wird geladen">
      <Card className="p-6">
        <Skeleton className="h-6 w-64" />
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
      </Card>
      <Skeleton className="mt-12 h-7 w-48" />
      <Card className="mt-4 space-y-4 p-6">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-5 w-full" />
        ))}
      </Card>
    </div>
  )
}

/** Verwaltung › Katalog: Stand, Datenqualität und Verlauf der Abgleiche. */
export function CatalogAdmin() {
  const overview = useQuery({
    ...orpc.catalogAdmin.overview.queryOptions(),
    refetchInterval: 30_000,
  })
  const data = overview.data
  const demo = data?.config.source === "demo"

  return (
    <>
      <AdminPageHeader
        title="Katalog"
        description="Abgleich mit SAP LeanIX und Qualität der veröffentlichten Daten."
        actions={data ? <SyncNowButton demo={demo} /> : null}
      />

      {overview.isPending ? (
        <LoadingState />
      ) : overview.isError ? (
        <QueryError
          error={overview.error}
          retrying={overview.isFetching}
          onRetry={() => void overview.refetch()}
        />
      ) : data ? (
        <div className="space-y-12">
          <div className="space-y-4">
            {!data.status.available ? (
              <Notice tone="error" title="Der öffentliche Katalog ist leer">
                {data.unreadableSnapshots
                  ? `${formatNumber(data.unreadableSnapshots)} gespeicherte Stände lassen sich mit dieser Version nicht lesen. Ein neuer Abgleich stellt den Katalog wieder her.`
                  : "Es liegt noch kein Stand vor. Besucherinnen und Besucher sehen die Ausfallseite, bis ein Abgleich gelingt."}
              </Notice>
            ) : data.status.stale ? (
              <Notice tone="warning" title="Der Katalog ist nicht aktuell">
                Seit über {formatHours(data.config.staleAfterHours)} ist kein
                Abgleich gelungen. Der letzte gute Stand bleibt veröffentlicht;
                die Ursache steht im Verlauf.
              </Notice>
            ) : null}
            {!data.config.fallbackActionConfigured ? (
              <Notice
                tone="warning"
                title="Kein zentraler Kontakt konfiguriert"
              >
                Leistungen ohne eigenen Bestell- oder Anfrageweg zeigen nur die
                verantwortliche Stelle. Setzen Sie{" "}
                <code className="font-mono text-xs">
                  CATALOG_FALLBACK_REQUEST_URL
                </code>{" "}
                (z. B. Service Desk), damit jede Leistung einen nächsten Schritt
                hat.
              </Notice>
            ) : null}
            <StatusCard data={data} />
          </div>

          <section aria-labelledby="qualitaet-titel">
            <h2 id="qualitaet-titel" className="text-2xl font-bold">
              Datenqualität
            </h2>
            <p className="mt-1 mb-4 max-w-[65ch] text-sm text-text">
              Auffälligkeiten aus dem letzten Abgleich. Der Link führt direkt
              zum Fact Sheet in LeanIX, wo die Daten nachgepflegt werden.
            </p>
            <QualityReport issues={data.issues} />
          </section>

          <section aria-labelledby="verlauf-titel">
            <h2 id="verlauf-titel" className="mb-4 text-2xl font-bold">
              Verlauf der Abgleiche
            </h2>
            <RunsTable runs={data.runs} demo={demo} />
          </section>
        </div>
      ) : null}
    </>
  )
}
