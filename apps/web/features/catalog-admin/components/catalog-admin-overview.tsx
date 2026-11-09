"use client"

import type { CatalogAdminOverview as Overview } from "@workspace/api"
import { useQuery } from "@tanstack/react-query"
import {
  BanIcon,
  CircleAlertIcon,
  CircleXIcon,
  InfoIcon,
  RotateCwIcon,
  TriangleAlertIcon,
} from "lucide-react"
import Link from "next/link"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { errorMessage } from "@/lib/messages"
import { orpc } from "@/lib/orpc"

import { AdminSection } from "./admin-section"
import { CatalogStats } from "./catalog-stats"
import { formatDateTimeLong, formatHours } from "./format"
import { QualityReport } from "./quality-report"
import { SyncNowButton } from "./sync-now-button"
import { SyncRunsTable } from "./sync-runs-table"
import { SyncStatusPanel } from "./sync-status-panel"

/** Katalog-Verwaltung: Status, Kennzahlen, Läufe, Datenqualität. */
export function CatalogAdminOverview() {
  const overview = useQuery({
    ...orpc.catalogAdmin.overview.queryOptions(),
    retry: 1,
    // Während ein Lauf im Gang ist, Status laufend nachladen.
    refetchInterval: (query) =>
      query.state.data?.runs.some((run) => run.status === "running")
        ? 3000
        : false,
  })

  if (overview.isPending) return <OverviewSkeleton />

  if (overview.isError) {
    const unauthorized =
      "code" in overview.error && overview.error.code === "UNAUTHORIZED"
    return (
      <Alert variant="destructive" className="max-w-3xl p-4">
        <CircleAlertIcon aria-hidden="true" />
        <AlertTitle className="text-base font-bold">
          Der Katalog-Status konnte nicht geladen werden.
        </AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3 text-foreground!">
          <p>{errorMessage(overview.error)}</p>
          {unauthorized ? (
            <Button variant="outline" size="sm" asChild>
              <Link href="/sign-in?callbackUrl=/admin/catalog">
                Erneut anmelden
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void overview.refetch()}
              disabled={overview.isFetching}
            >
              {overview.isFetching ? (
                <Spinner aria-hidden="true" />
              ) : (
                <RotateCwIcon aria-hidden="true" />
              )}
              Erneut versuchen
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  const data = overview.data
  const running = data.runs.some((run) => run.status === "running")

  return (
    <div className="flex flex-col gap-12">
      <Notices data={data} />

      <AdminSection
        id="status"
        title="Status"
        description="Woher die Daten stammen, wie aktuell sie sind und wie die Synchronisierung eingestellt ist."
      >
        <SyncNowButton
          config={data.config}
          running={running}
          hasSnapshot={data.status.available}
        />
        <SyncStatusPanel data={data} />
      </AdminSection>

      <AdminSection
        id="kennzahlen"
        title="Kennzahlen"
        description="Umfang des aktuell angezeigten Katalogs."
      >
        {data.snapshot ? (
          <CatalogStats stats={data.snapshot.stats} />
        ) : (
          <p className="border border-dashed border-border p-6 text-muted-foreground">
            Noch kein Katalog-Stand vorhanden.
          </p>
        )}
      </AdminSection>

      <AdminSection
        id="laeufe"
        title="Letzte Synchronisierungen"
        description="Protokoll der Läufe. Schlägt ein Lauf fehl oder wird er abgelehnt, bleibt ein bisheriger Stand aktiv."
      >
        <SyncRunsTable runs={data.runs} />
      </AdminSection>

      <AdminSection
        id="datenqualitaet"
        title="Datenqualität"
        description="Auffälligkeiten aus dem letzten Katalog-Stand. Korrekturen erfolgen in LeanIX und erscheinen nach der nächsten Synchronisierung."
      >
        <QualityReport issues={data.issues} />
      </AdminSection>
    </div>
  )
}

/** Hinweise, die sofort Aufmerksamkeit brauchen. */
function Notices({ data }: { data: Overview }) {
  const { status, config } = data
  const lastRun = data.runs[0]
  const notices: React.ReactNode[] = []

  if (!status.available) {
    notices.push(
      <Alert key="unavailable" variant="destructive" className="p-4">
        <CircleXIcon aria-hidden="true" />
        <AlertTitle className="text-base font-bold">
          Kein Katalog verfügbar
        </AlertTitle>
        <AlertDescription className="text-foreground!">
          Es ist kein gültiger Katalog-Stand geladen. Das Portal zeigt «Katalog
          vorübergehend nicht verfügbar». Starten Sie eine Synchronisierung oder
          prüfen Sie die Verbindung zu LeanIX.
        </AlertDescription>
      </Alert>
    )
  } else if (status.stale) {
    notices.push(
      <Alert key="stale" className="p-4">
        <TriangleAlertIcon aria-hidden="true" />
        <AlertTitle className="text-base font-bold">
          Die Katalogdaten sind veraltet
        </AlertTitle>
        <AlertDescription className="text-foreground!">
          Seit mehr als {formatHours(config.staleAfterHours)} gab es keine
          erfolgreiche Synchronisierung. Das Portal zeigt weiterhin den Stand
          vom {formatDateTimeLong(status.generatedAt)}.
        </AlertDescription>
      </Alert>
    )
  }

  if (
    lastRun &&
    (lastRun.status === "failed" || lastRun.status === "rejected")
  ) {
    const failed = lastRun.status === "failed"
    notices.push(
      <Alert key="last-run" className="p-4">
        {failed ? (
          <CircleXIcon aria-hidden="true" />
        ) : (
          <BanIcon aria-hidden="true" />
        )}
        <AlertTitle className="text-base font-bold">
          {failed
            ? "Die letzte Synchronisierung ist fehlgeschlagen"
            : "Der neue Stand der letzten Synchronisierung wurde abgelehnt"}
        </AlertTitle>
        <AlertDescription className="text-foreground!">
          {lastRun.message ? <p>{lastRun.message}</p> : null}
          <p>
            {status.available
              ? "Der bisherige Stand bleibt aktiv."
              : "Es ist noch kein Stand vorhanden; das Portal meldet «Der Katalog ist vorübergehend nicht verfügbar»."}
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  // Ohne Standard-Aktion enden Leistungen ohne Aktions-Ressource ohne Link.
  const withoutAction = data.issues.filter(
    (issue) => issue.code === "LEISTUNG_WITHOUT_ACTION"
  ).length
  if (
    status.available &&
    !config.fallbackActionConfigured &&
    withoutAction > 0
  ) {
    notices.push(
      <Alert key="no-fallback" className="p-4">
        <InfoIcon aria-hidden="true" />
        <AlertTitle className="text-base font-bold">
          Keine Standard-Aktion für Leistungen ohne Bestellweg
        </AlertTitle>
        <AlertDescription className="text-foreground!">
          <p>
            {withoutAction === 1
              ? "1 Leistung hat"
              : `${withoutAction} Leistungen haben`}{" "}
            keine Ressource für einen nächsten Schritt. Das Portal nennt dort
            nur die verantwortliche Stelle bzw. den Service Desk, ohne Link.
          </p>
          <p>
            Ressource in LeanIX erfassen oder die Standard-Aktion{" "}
            <code>CATALOG_FALLBACK_REQUEST_URL</code> (z. B. Service Desk)
            konfigurieren.
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  if (notices.length === 0) return null
  return <div className="flex max-w-4xl flex-col gap-3">{notices}</div>
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-12" aria-busy="true">
      <span className="sr-only" role="status">
        Katalog-Status wird geladen …
      </span>
      {[0, 1].map((section) => (
        <div
          key={section}
          className="flex flex-col gap-5 border-t border-border pt-6"
        >
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} className="h-6 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
