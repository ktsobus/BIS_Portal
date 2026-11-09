/**
 * Datumsformatierung für die Oberfläche (de-CH, Zeitzone Zürich), damit
 * Server und Browser gleich formatieren. so.ch schreibt Daten numerisch
 * (05.11.2026) und Zeiten mit «Uhr» (14:16 Uhr).
 */
const TIME_ZONE = "Europe/Zurich"

const dateFormat = new Intl.DateTimeFormat("de-CH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TIME_ZONE,
})

const timeFormat = new Intl.DateTimeFormat("de-CH", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
})

const yearFormat = new Intl.DateTimeFormat("de-CH", {
  year: "numeric",
  timeZone: TIME_ZONE,
})

function parse(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** z. B. «09.11.2026»; `null` bei fehlendem oder ungültigem Wert. */
export function formatDate(value: string | null | undefined): string | null {
  const date = parse(value)
  return date ? dateFormat.format(date) : null
}

/** z. B. «09.11.2026, 14:16 Uhr». */
export function formatDateTime(
  value: string | null | undefined
): string | null {
  const date = parse(value)
  return date
    ? `${dateFormat.format(date)}, ${timeFormat.format(date)} Uhr`
    : null
}

/** Aktuelles Jahr in Zürich, z. B. für das Copyright. */
export function currentYear(): string {
  return yearFormat.format(new Date())
}
