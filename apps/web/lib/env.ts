import "server-only"

import { z } from "zod"

const optionalString = z
  .string()
  .optional()
  .transform((value) =>
    value && value.trim() !== "" ? value.trim() : undefined
  )

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  /**
   * IP-Adressen oder CIDR-Bereiche der Reverse Proxies (kommagetrennt), z. B.
   * `172.18.0.0/16`. Nur nötig, wenn der Proxy `X-Forwarded-For` ergänzt
   * statt zu überschreiben; dann wird die Kette von rechts gelesen und der
   * erste nicht vertrauenswürdige Eintrag gilt als Client-IP (Rate-Limit).
   */
  AUTH_TRUSTED_PROXIES: z
    .string()
    .optional()
    .transform((value) =>
      (value ?? "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    ),

  // --- LeanIX / Katalog -----------------------------------------------------
  /** Basis-URL der LeanIX-Instanz (ohne Workspace). */
  LEANIX_BASE_URL: z.url().default("https://ktso.leanix.net"),
  /** Workspace-Name für Links ins Fact Sheet. */
  LEANIX_WORKSPACE: z.string().default("eamktsoLive"),
  /** API-Token des technischen Benutzers. Ohne Token läuft der Demo-Modus. */
  LEANIX_API_TOKEN: optionalString,
  /** `leanix` (Sync aus LeanIX) oder `demo` (mitgelieferter Snapshot). */
  CATALOG_SOURCE: z.enum(["leanix", "demo"]).optional(),
  /** LeanIX-ID der Ebene-1-Kategorie (übersteuert `lib/leanix/model.ts`). */
  CATALOG_ROOT_ID: optionalString,
  CATALOG_SYNC_INTERVAL_MINUTES: z.coerce.number().int().min(1).default(15),
  /** Neuer Snapshot wird abgelehnt, wenn er weniger als diesen Anteil der Leistungen des Vorgängers enthält. */
  CATALOG_MIN_RATIO: z.coerce.number().min(0).max(1).default(0.5),
  /** Ab so vielen Stunden ohne erfolgreichen Sync gilt der Katalog als veraltet. */
  CATALOG_STALE_AFTER_HOURS: z.coerce.number().min(1).default(24),
  /** Personen (Abonnements, z. B. Leistungsverantwortliche/r) anzeigen. */
  CATALOG_SHOW_PERSONS: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  /** Standard-Aktion, wenn eine Leistung keine Aktions-Ressource hat. */
  CATALOG_FALLBACK_REQUEST_URL: optionalString,
  CATALOG_FALLBACK_REQUEST_LABEL: z
    .string()
    .default("Anfrage an den Service Desk"),
})

export const env = serverEnvSchema.parse(process.env)

/** Effektive Datenquelle: ohne Token immer Demo. */
export const catalogSource: "leanix" | "demo" =
  env.CATALOG_SOURCE ?? (env.LEANIX_API_TOKEN ? "leanix" : "demo")
