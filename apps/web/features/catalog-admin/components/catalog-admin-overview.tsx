"use client"

import type { CatalogAdminOverview as Overview } from "@workspace/api"
import { useQuery } from "@tanstack/react-query"
import * as React from "react"

import { LoadError, Notice } from "@/components/ui/notice"
import { errorMessage } from "@/lib/messages"
import { orpc } from "@/lib/orpc"

import { CatalogStats } from "./catalog-stats"
import { formatDateTimeLong, formatHours } from "./format"
import { QualityReport } from "./quality-report"
import { SyncNowButton } from "./sync-now-button"
import { SyncRunsTable } from "./sync-runs-table"
import { SyncStatusPanel } from "./sync-status-panel"

/** Abschnitt der Katalog-Verwaltung: Titel, ein Satz, Inhalt. */
function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    // Kein <section> direkt in <main>: Dort gilt die Bildschirmhöhe des Kits.
    <div className="wrap">
      <section id={id} aria-labelledby={`${id}-h`}>
        <div className="block-head">
          <h2 id={`${id}-h`}>{title}</h2>
        </div>
        <p className="measure admin-intro">{description}</p>
        {children}
      </section>
    </div>
  )
}

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

  if (overview.isPending) {
    return (
      <div className="wrap" aria-busy="true">
        <p className="muted" role="status">
          Katalog-Status wird geladen …
        </p>
      </div>
    )
  }

  if (overview.isError) {
    const unauthorized =
      "code" in overview.error && overview.error.code === "UNAUTHORIZED"
    return (
      <div className="wrap">
        {unauthorized ? (
          <Notice
            title="Der Katalog-Status konnte nicht geladen werden."
            bad
            role="alert"
          >
            <p>{errorMessage(overview.error)}</p>
            <div className="btn-row">
              <a
                className="btn btn--secondary btn--sm"
                href="/sign-in?callbackUrl=/admin/catalog"
              >
                Erneut anmelden
              </a>
            </div>
          </Notice>
        ) : (
          <LoadError
            title="Der Katalog-Status konnte nicht geladen werden."
            message={errorMessage(overview.error)}
            onRetry={() => void overview.refetch()}
            retrying={overview.isFetching}
          />
        )}
      </div>
    )
  }

  const data = overview.data
  const running = data.runs.some((run) => run.status === "running")

  return (
    <>
      <Notices data={data} />

      <Section
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
      </Section>

      <Section
        id="kennzahlen"
        title="Kennzahlen"
        description="Umfang des aktuell angezeigten Katalogs."
      >
        {data.snapshot ? (
          <CatalogStats stats={data.snapshot.stats} />
        ) : (
          <p className="muted">Noch kein Katalog-Stand vorhanden.</p>
        )}
      </Section>

      <Section
        id="laeufe"
        title="Letzte Synchronisierungen"
        description="Protokoll der Läufe. Schlägt ein Lauf fehl oder wird er abgelehnt, bleibt ein bisheriger Stand aktiv."
      >
        <SyncRunsTable runs={data.runs} />
      </Section>

      <Section
        id="datenqualitaet"
        title="Datenqualität"
        description="Auffälligkeiten aus dem letzten Katalog-Stand. Korrekturen erfolgen in LeanIX und erscheinen nach der nächsten Synchronisierung."
      >
        <QualityReport issues={data.issues} />
      </Section>
    </>
  )
}

/** Hinweise, die sofort Aufmerksamkeit brauchen. */
function Notices({ data }: { data: Overview }) {
  const { status, config } = data
  const lastRun = data.runs[0]
  const notices: React.ReactNode[] = []

  if (!status.available) {
    notices.push(
      <Notice key="unavailable" title="Kein Katalog verfügbar" bad>
        <p>
          Es ist kein gültiger Katalog-Stand geladen. Das Portal zeigt «Katalog
          vorübergehend nicht verfügbar». Starten Sie eine Synchronisierung oder
          prüfen Sie die Verbindung zu LeanIX.
        </p>
      </Notice>
    )
  } else if (status.stale) {
    notices.push(
      <Notice key="stale" title="Die Katalogdaten sind veraltet">
        <p>
          Seit mehr als {formatHours(config.staleAfterHours)} gab es keine
          erfolgreiche Synchronisierung. Das Portal zeigt weiterhin den Stand
          vom {formatDateTimeLong(status.generatedAt)}.
        </p>
      </Notice>
    )
  }

  if (
    lastRun &&
    (lastRun.status === "failed" || lastRun.status === "rejected")
  ) {
    const failed = lastRun.status === "failed"
    notices.push(
      <Notice
        key="last-run"
        bad={failed}
        title={
          failed
            ? "Die letzte Synchronisierung ist fehlgeschlagen"
            : "Der neue Stand der letzten Synchronisierung wurde abgelehnt"
        }
      >
        {lastRun.message ? <p>{lastRun.message}</p> : null}
        <p>
          {status.available
            ? "Der bisherige Stand bleibt aktiv."
            : "Es ist noch kein Stand vorhanden; das Portal meldet «Der Katalog ist vorübergehend nicht verfügbar»."}
        </p>
      </Notice>
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
      <Notice
        key="no-fallback"
        title="Keine Standard-Aktion für Leistungen ohne Bestellweg"
      >
        <p>
          {withoutAction === 1
            ? "1 Leistung hat"
            : `${withoutAction} Leistungen haben`}{" "}
          keine Ressource für einen nächsten Schritt. Das Portal nennt dort nur
          die verantwortliche Stelle bzw. den Service Desk, ohne Link.
        </p>
        <p>
          Ressource in LeanIX erfassen oder die Standard-Aktion{" "}
          <code className="code">CATALOG_FALLBACK_REQUEST_URL</code> (z. B.
          Service Desk) konfigurieren.
        </p>
      </Notice>
    )
  }

  if (notices.length === 0) return null
  return <div className="wrap notices">{notices}</div>
}
