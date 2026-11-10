import type { CatalogAdminOverview } from "@workspace/api"

import { formatRelative } from "@/lib/format"

import {
  formatDateTimeLong,
  formatHours,
  formatInterval,
  formatPercent,
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
    <div>
      <dt>{label}</dt>
      <dd>
        <div>{children}</div>
        {hint ? <small>{hint}</small> : null}
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
    <dl className="kv">
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
          <span className="muted">
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
            : data.unreadableSnapshots
              ? "Der gespeicherte Stand ist mit dieser Version nicht kompatibel (Schema). Die nächste erfolgreiche Synchronisierung ersetzt ihn."
              : "Es ist noch kein Katalog-Stand gespeichert."
        }
      >
        {status.generatedAt ? (
          <>
            <time dateTime={status.generatedAt}>
              {formatDateTimeLong(status.generatedAt)}
            </time>
            {relative ? <span className="muted"> ({relative})</span> : null}
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
          <span className="tag tag--warn">Veraltet</span>
        ) : (
          <span className="tag tag--good">Aktuell</span>
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
            : config.tokenConfigured
              ? undefined
              : "Ohne LeanIX-API-Token findet keine Synchronisierung statt."
        }
      >
        {sourceIsDemo
          ? "Aus (Demo-Modus)"
          : config.tokenConfigured
            ? formatInterval(config.syncIntervalMinutes)
            : "Aus (kein API-Token)"}
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
        <span className="kv__inline">
          <code className="code">{config.rootCategoryId}</code>
          <a
            className="ext admin-link"
            href={leanixFactSheetUrl(
              config,
              "Leistungskategorie",
              config.rootCategoryId
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            In LeanIX öffnen
            <span className="sr-only"> (öffnet in neuem Tab)</span>
          </a>
        </span>
      </Item>
    </dl>
  )
}
