import type { QualityIssue, SyncRunStatus, SyncTrigger } from "@workspace/api"

import { formatDateTime, formatDateTimeShort } from "@/lib/format"

/** Zahlen und Labels für den Admin-Bereich (de-CH); Datum aus `lib/format`. */
const LOCALE = "de-CH"

const number = new Intl.NumberFormat(LOCALE)
const decimal = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 })
const percent = new Intl.NumberFormat(LOCALE, { style: "percent" })

/** Tabellen: z. B. «09.11.2026, 14:16»; «–» ohne Wert. */
export function formatDateTimeCompact(
  value: string | null | undefined
): string {
  return formatDateTimeShort(value) ?? "–"
}

/** Fliesstext: z. B. «9. November 2026, 14:16 Uhr»; «–» ohne Wert. */
export function formatDateTimeLong(value: string | null | undefined): string {
  return formatDateTime(value) ?? "–"
}

/** z. B. «850 ms», «12.3 s», «2 min 5 s». */
export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "–"
  if (ms < 1000) return `${number.format(ms)} ms`
  if (ms < 60_000) return `${decimal.format(ms / 1000)} s`
  const minutes = Math.floor(ms / 60_000)
  const seconds = Math.round((ms % 60_000) / 1000)
  return seconds > 0 ? `${minutes} min ${seconds} s` : `${minutes} min`
}

export function formatNumber(value: number): string {
  return number.format(value)
}

/** z. B. «50%» (de-CH ohne Abstand). */
export function formatPercent(value: number): string {
  return percent.format(value)
}

/** z. B. «alle 15 Minuten», «stündlich», «alle 2 Stunden». */
export function formatInterval(minutes: number): string {
  if (minutes === 1) return "jede Minute"
  if (minutes === 60) return "stündlich"
  if (minutes % 60 === 0) return `alle ${minutes / 60} Stunden`
  return `alle ${minutes} Minuten`
}

export function formatHours(hours: number): string {
  return hours === 1 ? "1 Stunde" : `${decimal.format(hours)} Stunden`
}

export const triggerLabels: Record<SyncTrigger, string> = {
  startup: "Serverstart",
  schedule: "Zeitplan",
  manual: "Manuell",
  webhook: "LeanIX-Ereignis",
}

export const runStatusLabels: Record<SyncRunStatus, string> = {
  running: "Läuft",
  success: "Erfolgreich",
  failed: "Fehlgeschlagen",
  rejected: "Abgelehnt",
}

export const severityLabels: Record<
  QualityIssue["severity"],
  { singular: string; plural: string }
> = {
  error: { singular: "Fehler", plural: "Fehler" },
  warning: { singular: "Warnung", plural: "Warnungen" },
  info: { singular: "Hinweis", plural: "Hinweise" },
}

/** Anzeigename des LeanIX-Fact-Sheet-Typs. */
export function factSheetTypeLabel(type: string): string {
  switch (type) {
    case "behoerdenLeistungen":
      return "Leistung"
    case "Leistungskategorie":
      return "Leistungskategorie"
    case "Organisationseinheit":
      return "Organisationseinheit"
    case "Application":
      return "Anwendung"
    case "UserGroup":
      return "Leistungsbezüger"
    default:
      return type
  }
}
