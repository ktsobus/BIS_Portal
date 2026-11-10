/**
 * Kompatibilität: Die Datumsformatierung liegt in `@/lib/format` (eine
 * Implementierung für Portal und Admin). Neue Aufrufer importieren direkt
 * von dort.
 */
export { currentYear, formatDate, formatDateTime } from "@/lib/format"
