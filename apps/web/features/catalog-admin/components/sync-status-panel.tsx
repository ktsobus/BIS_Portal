import type { CatalogAdminOverview } from "@workspace/api"
import {
  CircleCheckIcon,
  ArrowUpRightIcon,
  TriangleAlertIcon,
} from "lucide-react"

import {
  formatDateTimeLong,
  formatHours,
  formatInterval,
  formatPercent,
  formatRelative,
} from "./format"

function leanixFactSheetUrl(
  config: CatalogAdminOverview["config"],
  type: string,
  id: string
) {
  const base = config.leanixBaseUrl.replace(/\/+$/, "")
  return config.workspace
    ? `${base}/${encodeURIComponent(config.workspace)}/factsheet/${type}/${id}`
    : `${base}/factsheet/${type}/${id}`
}

function Item({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 border-b border-hairline py-4 sm:grid sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-x-6">
      <dt className="font-bold">{label}</dt>
      <dd className="min-w-0">
        <div>{children}</div>
        {hint ? <p className="max-w-[70ch] type-body-sm">{hint}</p> : null}
      </dd>
    </div>
  )
}

/** Statusangaben zum Katalog: Quelle, Stand, Aktualität, Konfiguration. */
export function SyncStatusPanel({ data }: { data: CatalogAdminOverview }) {
  const { status, config } = data
  const relative = formatRelative(status.generatedAt)
  const sourceIsDemo = config.source === "demo"

  return (
    <dl className="border-t border-hairline">
      <Item
        label="Datenquelle"
        hint={
          sourceIsDemo
            ? "Mitgelieferter Beispielkatalog, keine Verbindung zu LeanIX."
            : `${config.leanixBaseUrl}${config.workspace ? ` · Workspace ${config.workspace}` : ""}`
        }
      >
        {sourceIsDemo ? "Demo-Daten" : "SAP LeanIX"}
        {status.source && status.source !== config.source ? (
          <span className="text-muted-foreground">
            {" "}
            (angezeigt wird noch ein Stand aus{" "}
            {status.source === "demo" ? "den Demo-Daten" : "LeanIX"})
          </span>
        ) : null}
      </Item>

      <Item
        label="Stand der Daten"
        hint={
          status.generatedAt
            ? "Zeitpunkt, zu dem die angezeigten Daten aus der Quelle gelesen wurden."
            : "Es ist noch kein Katalog-Stand gespeichert."
        }
      >
        {status.generatedAt ? (
          <>
            <time dateTime={status.generatedAt}>
              {formatDateTimeLong(status.generatedAt)}
            </time>
            {relative ? (
              <span className="text-muted-foreground"> ({relative})</span>
            ) : null}
          </>
        ) : (
          "Kein Stand vorhanden"
        )}
      </Item>

      <Item
        label="Aktualität"
        hint={`Als veraltet gilt der Katalog nach ${formatHours(config.staleAfterHours)} ohne erfolgreiche Synchronisierung.`}
      >
        {status.stale ? (
          <span className="inline-flex items-center gap-1.5 font-bold">
            <TriangleAlertIcon
              aria-hidden="true"
              strokeWidth={1.5}
              className="size-5 text-primary"
            />
            Veraltet
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <CircleCheckIcon
              aria-hidden="true"
              strokeWidth={1.5}
              className="size-5"
            />
            Aktuell
          </span>
        )}
      </Item>

      <Item
        label="LeanIX-API-Token"
        hint="Der Token selbst wird nie angezeigt; er ist nur auf dem Server hinterlegt."
      >
        {config.tokenConfigured ? "Konfiguriert" : "Nicht konfiguriert"}
      </Item>

      <Item
        label="Automatische Synchronisierung"
        hint={
          sourceIsDemo
            ? "Im Demo-Modus findet keine Synchronisierung statt."
            : undefined
        }
      >
        {formatInterval(config.syncIntervalMinutes)}
      </Item>

      <Item
        label="Mindestanteil"
        hint={`Ein neuer Stand wird nur übernommen, wenn er mindestens ${formatPercent(config.minRatio)} der Leistungen des bisherigen Stands enthält. Schützt vor unvollständigen Antworten.`}
      >
        {formatPercent(config.minRatio)}
      </Item>

      <Item
        label="Wurzel-Kategorie"
        hint="LeanIX-ID der Leistungskategorie «Business IT-Servicekatalog» (Ebene 1)."
      >
        <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <code className="font-mono text-sm break-all">
            {config.rootCategoryId}
          </code>
          <a
            href={leanixFactSheetUrl(
              config,
              "Leistungskategorie",
              config.rootCategoryId
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 type-body-sm underline decoration-1 underline-offset-4 transition-colors duration-200 hover:text-primary"
          >
            In LeanIX öffnen
            <ArrowUpRightIcon
              aria-hidden="true"
              strokeWidth={1.5}
              className="size-5 text-primary"
            />
            <span className="sr-only">(öffnet in neuem Tab)</span>
          </a>
        </span>
      </Item>
    </dl>
  )
}
