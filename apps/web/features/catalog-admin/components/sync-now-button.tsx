"use client"

import type { CatalogAdminOverview, SyncRun } from "@workspace/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { RefreshCwIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { errorMessage } from "@/lib/messages"
import { orpc } from "@/lib/orpc"

import { formatNumber } from "./format"

const syncErrors = {
  CONFLICT:
    "Es läuft bereits eine Synchronisierung. Der Status wird aktualisiert, sobald sie abgeschlossen ist.",
  PRECONDITION_FAILED:
    "Kein LeanIX-API-Token konfiguriert. Im Demo-Modus ist keine Synchronisierung möglich.",
}

function announceRun(run: SyncRun) {
  switch (run.status) {
    case "success":
      toast.success("Synchronisierung abgeschlossen", {
        description: run.stats
          ? `${formatNumber(run.stats.leistungen)} Leistungen im Portal, ${formatNumber(run.stats.issues)} Auffälligkeiten.`
          : undefined,
      })
      break
    case "rejected":
      toast.warning("Neuer Stand nicht übernommen", {
        description: `${run.message ?? "Die Plausibilisierung hat den neuen Stand abgelehnt."} Der bisherige Stand bleibt aktiv.`,
      })
      break
    case "failed":
      toast.error("Synchronisierung fehlgeschlagen", {
        description: `${run.message ?? "Unbekannter Fehler."} Der bisherige Stand bleibt aktiv.`,
      })
      break
    case "running":
      toast.info("Synchronisierung gestartet")
      break
  }
}

/** Erklärung, warum keine Synchronisierung möglich ist (oder `null`). */
export function syncUnavailableReason(
  config: CatalogAdminOverview["config"]
): string | null {
  if (!config.tokenConfigured) {
    return "Demo-Modus: Das Portal zeigt den mitgelieferten Beispielkatalog. Für die Synchronisierung mit LeanIX muss auf dem Server ein API-Token hinterlegt sein (Umgebungsvariable LEANIX_API_TOKEN)."
  }
  if (config.source === "demo") {
    return "Demo-Modus: Die Datenquelle ist auf «demo» gesetzt (Umgebungsvariable CATALOG_SOURCE). Das Portal zeigt den mitgelieferten Beispielkatalog."
  }
  return null
}

export function SyncNowButton({
  config,
  running,
}: {
  config: CatalogAdminOverview["config"]
  /** Ein Lauf ist bereits im Gang (z. B. vom Zeitplan ausgelöst). */
  running: boolean
}) {
  const queryClient = useQueryClient()
  const syncNow = useMutation(
    orpc.catalogAdmin.syncNow.mutationOptions({
      onSuccess: announceRun,
      onError: (error) =>
        toast.error("Synchronisierung nicht möglich", {
          description: errorMessage(error, syncErrors),
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
    <div className="flex flex-col items-start gap-3 bg-muted p-4 sm:flex-row sm:items-center sm:gap-6">
      <Button
        size="lg"
        className="shrink-0"
        onClick={() => syncNow.mutate(undefined)}
        disabled={busy || unavailable !== null}
        aria-describedby="sync-hint"
      >
        {busy ? (
          <Spinner aria-hidden="true" />
        ) : (
          <RefreshCwIcon aria-hidden="true" />
        )}
        {busy ? "Synchronisierung läuft …" : "Jetzt synchronisieren"}
      </Button>
      <p id="sync-hint" className="max-w-[70ch] text-sm">
        {unavailable ??
          "Liest Leistungen und Kategorien aus LeanIX und übernimmt den neuen Stand, wenn er plausibel ist. Läuft sonst automatisch im eingestellten Intervall."}
      </p>
    </div>
  )
}
