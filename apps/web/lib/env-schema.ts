import { z } from "zod"

/**
 * Schema der serverseitigen Umgebungsvariablen. Liegt bewusst ohne
 * `server-only` in einer eigenen Datei, damit Tests es gegen
 * `.env.example` prüfen können. Die Anwendung liest die Werte nur über
 * `lib/env.ts`.
 */

/**
 * Leere Werte gelten als nicht gesetzt. `@next/env` und Docker setzen für
 * `CATALOG_SOURCE=` (wie in `.env.example`) oder `${VAR:-}` in Compose den
 * leeren String; ohne diese Regel würden Enums daran scheitern und
 * `z.coerce.number()` still 0 daraus machen.
 */
export function withoutEmptyValues(
  source: Record<string, string | undefined>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(source).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[1].trim() !== ""
    )
  )
}

const optionalString = z
  .string()
  .optional()
  .transform((value) =>
    value && value.trim() !== "" ? value.trim() : undefined
  )

/** `true`/`false` (Gross-/Kleinschreibung egal) als Boolean. */
const booleanFlag = (defaultValue: "true" | "false") =>
  z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.enum(["true", "false"]))
    .default(defaultValue)
    .transform((value) => value === "true")

/** Kommagetrennte Liste von Hostnamen, z. B. `intranet.so.ch, alt.so.ch`. */
const hostList = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? "")
      .split(",")
      .map((host) =>
        host
          .trim()
          .toLowerCase()
          .replace(/^\.+|\.+$/g, "")
      )
      .filter((host) => host !== "")
  )

export const serverEnvSchema = z.object({
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
  /** Neuer Snapshot wird abgelehnt, wenn er weniger als diesen Anteil der Leistungen (bzw. Aktionen) des Vorgängers enthält … */
  CATALOG_MIN_RATIO: z.coerce.number().min(0).max(1).default(0.5),
  /** … und mehr als so viele Leistungen (bzw. Aktionen) wegfallen. Kleine Änderungen blockieren so nicht. */
  CATALOG_SHRINK_TOLERANCE: z.coerce.number().int().min(0).default(5),
  /** Ab so vielen Stunden ohne erfolgreichen Sync gilt der Katalog als veraltet. */
  CATALOG_STALE_AFTER_HOURS: z.coerce.number().min(1).default(24),
  /** Personen (Abonnements, z. B. Leistungsverantwortliche/r) anzeigen. */
  CATALOG_SHOW_PERSONS: booleanFlag("false"),
  /**
   * Services ohne Leistung im Kanal (und Familien ohne solche Services)
   * anzeigen. Vorläufiger Standard: aus (Freigabe nur über den Kanal der
   * Leistung), siehe Konzept 2.2 und offene Frage 10.
   */
  CATALOG_SHOW_EMPTY_SERVICES: booleanFlag("false"),
  /** Hosts, für die Ressourcen-Links mit `http:` (unverschlüsselt) erlaubt sind; sonst nur `https:`. */
  CATALOG_HTTP_ALLOWED_HOSTS: hostList,
  /**
   * Standard-Aktion, wenn eine Leistung keine Aktions-Ressource hat, und
   * zentraler Kontakt (Service Desk): https://…, mailto:… oder tel:….
   * Ein ungültiger Wert bricht den Start ab, statt still ignoriert zu werden.
   */
  CATALOG_FALLBACK_REQUEST_URL: optionalString.pipe(
    z
      .string()
      .regex(
        /^(?:https?:\/\/\S+|mailto:\S+@\S+|tel:\+?[\d\s()./-]{3,})$/i,
        "Nur https://…, http://…, mailto:… oder tel:… erlaubt"
      )
      .optional()
  ),
  CATALOG_FALLBACK_REQUEST_LABEL: z
    .string()
    .trim()
    .min(1)
    .default("Anfrage an den Service Desk"),
  /** Optional: E-Mail-Adresse des Service Desk (Fusszeile, Kontaktangaben). */
  CATALOG_SUPPORT_EMAIL: optionalString.pipe(
    z.email("Keine gültige E-Mail-Adresse").optional()
  ),
  /** Optional: Telefonnummer des Service Desk, z. B. «032 627 00 00». */
  CATALOG_SUPPORT_PHONE: optionalString.pipe(
    z
      .string()
      .regex(/^\+?[\d\s()./-]{6,30}$/, "Keine gültige Telefonnummer")
      .optional()
  ),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

/** Prüft die Umgebung; leere Werte gelten als nicht gesetzt. */
export function parseServerEnv(
  source: Record<string, string | undefined>
): ServerEnv {
  return serverEnvSchema.parse(withoutEmptyValues(source))
}

/** Effektive Datenquelle: ohne Token immer Demo, sofern nicht gesetzt. */
export function resolveCatalogSource(
  env: Pick<ServerEnv, "CATALOG_SOURCE" | "LEANIX_API_TOKEN">
): "leanix" | "demo" {
  return env.CATALOG_SOURCE ?? (env.LEANIX_API_TOKEN ? "leanix" : "demo")
}
