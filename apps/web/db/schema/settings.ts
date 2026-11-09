import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core"

/** Singleton row (id = "default") with app-wide settings edited by admins. */
export const appSettings = pgTable("app_settings", {
  id: text("id").primaryKey().default("default"),
  requireAdminTwoFactor: boolean("require_admin_two_factor")
    .default(false)
    .notNull(),
  /**
   * Zeitpunkt der Ersteinrichtung (erstes Admin-Konto über /setup). Ist er
   * gesetzt, bleibt /setup für immer geschlossen, auch wenn später kein
   * Admin mehr existiert (Wiederherstellung dann nur per DB).
   */
  setupCompletedAt: timestamp("setup_completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})
