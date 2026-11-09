import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

/**
 * Fehlgeschlagene Passwort-Anmeldungen je E-Mail-Adresse (Drosselung pro
 * Konto, unabhängig von der IP). Siehe `lib/sign-in-throttle.ts`.
 */
export const signInThrottle = pgTable(
  "sign_in_throttle",
  {
    /** E-Mail-Adresse in Kleinbuchstaben (auch für unbekannte Adressen). */
    email: text("email").primaryKey(),
    failures: integer("failures").notNull(),
    /** Beginn des aktuellen Zeitfensters (erster Fehlversuch darin). */
    windowStartedAt: timestamp("window_started_at", {
      withTimezone: true,
    }).notNull(),
  },
  (table) => [index("sign_in_throttle_window_idx").on(table.windowStartedAt)]
)
