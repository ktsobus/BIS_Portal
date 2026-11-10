/**
 * Datumsformatierung für die ganze Oberfläche (de-CH, Zeitzone Zürich),
 * damit Server und Browser gleich formatieren. Fehlende oder ungültige Werte
 * ergeben `null`; die Aufrufer entscheiden, was sie dann zeigen.
 *
 * Wie auf so.ch (docs/design.md) werden Daten numerisch geschrieben
 * («09.11.2026») und Zeiten mit «Uhr» («14:16 Uhr»).
 */
const LOCALE = "de-CH"
const TIME_ZONE = "Europe/Zurich"

const numericDate = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TIME_ZONE,
})

const shortDateTime = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: TIME_ZONE,
})

const time = new Intl.DateTimeFormat(LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
})

const relative = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" })

export type DateInput = string | Date | null | undefined

/** `Date` aus ISO-String oder `Date`; `null` bei fehlendem/ungültigem Wert. */
export function parseDate(value: DateInput): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** z. B. «09.11.2026». */
export function formatDate(value: DateInput): string | null {
  const date = parseDate(value)
  return date ? numericDate.format(date) : null
}

/** z. B. «09.11.2026» (Tabellen; gleich wie `formatDate`). */
export function formatDateShort(value: DateInput): string | null {
  return formatDate(value)
}

/** z. B. «09.11.2026, 14:16 Uhr». */
export function formatDateTime(value: DateInput): string | null {
  const date = parseDate(value)
  return date ? `${numericDate.format(date)}, ${time.format(date)} Uhr` : null
}

/** z. B. «09.11.2026, 14:16» (Tabellen). */
export function formatDateTimeShort(value: DateInput): string | null {
  const date = parseDate(value)
  return date ? shortDateTime.format(date) : null
}

/** z. B. «vor 5 Minuten», «gestern», «gerade eben». */
export function formatRelative(
  value: DateInput,
  now = Date.now()
): string | null {
  const date = parseDate(value)
  if (!date) return null
  const seconds = Math.round((date.getTime() - now) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 60) return "gerade eben"
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute")
  if (abs < 86400) return relative.format(Math.round(seconds / 3600), "hour")
  return relative.format(Math.round(seconds / 86400), "day")
}

const year = new Intl.DateTimeFormat(LOCALE, {
  year: "numeric",
  timeZone: TIME_ZONE,
})

/** Aktuelles Jahr in Zürich, z. B. für das Copyright. */
export function currentYear(now: Date = new Date()): string {
  return year.format(now)
}
