/**
 * Prüfung der Katalog-Datenquelle beim Serverstart (aus `instrumentation.ts`).
 *
 * Ohne `LEANIX_API_TOKEN` fällt das Portal still in den Demo-Modus: Es zeigt
 * den mitgelieferten Testdatensatz und synchronisiert nicht mit LeanIX. In
 * Produktion ist das fast immer ein Konfigurationsfehler (z. B. Token nicht an
 * den Container weitergegeben) und wird deshalb deutlich gemeldet. Ein
 * bewusster Demo-Betrieb (`CATALOG_SOURCE=demo`) bleibt still.
 *
 * Bewusst nur eine Warnung und kein Abbruch: `next start` ohne Token (Demo,
 * Vorführung) soll weiter funktionieren. docker-compose.prod.yml verlangt den
 * Token ohnehin. Die Prüfung läuft nicht während `next build`.
 */
export interface CatalogSourceCheckInput {
  nodeEnv: string | undefined
  /** Effektive Datenquelle (`catalogSource` aus `lib/env.ts`). */
  catalogSource: "leanix" | "demo"
  /** Rohwert von `CATALOG_SOURCE`, wie er gesetzt ist. */
  configuredSource: string | undefined
  tokenConfigured: boolean
}

export function catalogSourceWarning(
  input: CatalogSourceCheckInput
): string | null {
  if (input.nodeEnv !== "production") return null

  if (input.catalogSource === "demo") {
    if (input.configuredSource?.trim() === "demo") return null
    return (
      "[catalog] WARNUNG: Kein LEANIX_API_TOKEN gesetzt. Das Portal läuft im " +
      "Demo-Modus, zeigt den mitgelieferten Testdatensatz statt der Daten aus " +
      "LeanIX und synchronisiert nicht. Token setzen (docs/betrieb.md) oder " +
      "CATALOG_SOURCE=demo, wenn der Demo-Modus gewollt ist."
    )
  }

  if (!input.tokenConfigured) {
    return (
      "[catalog] WARNUNG: CATALOG_SOURCE=leanix, aber kein LEANIX_API_TOKEN " +
      "gesetzt. Jeder Sync schlägt fehl; das Portal zeigt nur den zuletzt " +
      "gespeicherten Stand."
    )
  }

  return null
}
