"use client"

import type { CatalogAdminOverview, SyncRun } from "@workspace/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as React from "react"

import { Status } from "@/components/ui/status"
import { errorMessage } from "@/lib/messages"
import { orpc } from "@/lib/orpc"

import { formatNumber } from "./format"

const syncErrors = {
  CONFLICT:
    "Es läuft bereits eine Synchronisierung. Der Status wird aktualisiert, sobald sie abgeschlossen ist.",
  PRECONDITION_FAILED:
    "Synchronisierung nicht möglich: Auf dem Server ist kein LeanIX-API-Token hinterlegt oder die Datenquelle ist auf «demo» gesetzt.",
}

/** Was bei einem gescheiterten Lauf weiter angezeigt wird. */
function keptStateHint(hasSnapshot: boolean) {
  return hasSnapshot
    ? "Der bisherige Stand bleibt aktiv."
    : "Es ist noch kein Stand vorhanden; das Portal meldet «Der Katalog ist vorübergehend nicht verfügbar»."
}

interface Announcement {
  message: string
  bad: boolean
}

/** Ergebnis eines ausgelösten Laufs als ein Satz für die Statuszeile. */
function announceRun(run: SyncRun, hasSnapshot: boolean): Announcement {
  switch (run.status) {
    case "success":
      return {
        message: run.stats
          ? `Synchronisierung abgeschlossen: ${formatNumber(run.stats.leistungen)} Leistungen im Portal, ${formatNumber(run.stats.issues)} Auffälligkeiten.`
          : "Synchronisierung abgeschlossen.",
        bad: false,
      }
    case "rejected":
      return {
        message: `Neuer Stand nicht übernommen: ${run.message ?? "Die Plausibilisierung hat den neuen Stand abgelehnt."} ${keptStateHint(hasSnapshot)}`,
        bad: true,
      }
    case "failed":
      return {
        message: `Synchronisierung fehlgeschlagen: ${run.message ?? "Unbekannter Fehler."} ${keptStateHint(hasSnapshot)}`,
        bad: true,
      }
    case "running":
      return { message: "Synchronisierung gestartet.", bad: false }
  }
}

/** Erklärung, warum keine Synchronisierung möglich ist (oder `null`). */
export function syncUnavailableReason(
  config: CatalogAdminOverview["config"]
): string | null {
  if (config.source === "demo") {
    return config.tokenConfigured
      ? "Demo-Modus: Die Datenquelle ist auf «demo» gesetzt (Umgebungsvariable CATALOG_SOURCE). Das Portal zeigt den mitgelieferten Beispielkatalog."
      : "Demo-Modus: Das Portal zeigt den mitgelieferten Beispielkatalog. Für die Synchronisierung mit LeanIX muss auf dem Server ein API-Token hinterlegt sein (Umgebungsvariable LEANIX_API_TOKEN)."
  }
  if (!config.tokenConfigured) {
    return "LeanIX-Modus, aber kein API-Token hinterlegt: Das Portal zeigt den zuletzt gespeicherten Stand, eine Synchronisierung ist nicht möglich. Hinterlegen Sie den Token auf dem Server (Umgebungsvariable LEANIX_API_TOKEN)."
  }
  return null
}

export function SyncNowButton({
  config,
  running,
  hasSnapshot,
}: {
  config: CatalogAdminOverview["config"]
  /** Ein Lauf ist bereits im Gang (z. B. vom Zeitplan ausgelöst). */
  running: boolean
  /** Es gibt einen Katalog-Stand, der bei einem Fehlschlag aktiv bleibt. */
  hasSnapshot: boolean
}) {
  const queryClient = useQueryClient()
  const [announcement, setAnnouncement] = React.useState<Announcement | null>(
    null
  )
  const syncNow = useMutation(
    orpc.catalogAdmin.syncNow.mutationOptions({
      onSuccess: (run) => setAnnouncement(announceRun(run, hasSnapshot)),
      onError: (error) =>
        setAnnouncement({
          message: `Synchronisierung nicht möglich: ${errorMessage(error, syncErrors)}`,
          bad: true,
        }),
      onSettled: () =>
        Promise.all([
          queryClient.invalidateQueries({
            queryKey: orpc.catalogAdmin.key(),
          }),
          // Öffentliche Seiten zeigen danach den neuen Stand.
          queryClient.invalidateQueries({ queryKey: orpc.catalog.key() }),
        ]),
    })
  )

  const unavailable = syncUnavailableReason(config)
  const busy = syncNow.isPending || running

  return (
    <div className="sync">
      <div className="sync__row">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            setAnnouncement(null)
            syncNow.mutate(undefined)
          }}
          disabled={busy || unavailable !== null}
          aria-describedby="sync-hint"
        >
          {busy ? "Synchronisierung läuft …" : "Jetzt synchronisieren"}
        </button>
        <p id="sync-hint" className="sync__hint">
          {unavailable ??
            "Liest Leistungen und Kategorien aus LeanIX und übernimmt den neuen Stand, wenn er plausibel ist. Läuft sonst automatisch im eingestellten Intervall."}
        </p>
      </div>
      <Status bad={announcement?.bad}>{announcement?.message}</Status>
    </div>
  )
}
