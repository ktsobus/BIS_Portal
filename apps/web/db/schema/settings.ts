import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core"

/** Singleton row (id = "default") with app-wide settings edited by admins. */
export const appSettings = pgTable("app_settings", {
  id: text("id").primaryKey().default("default"),
  requireAdminTwoFactor: boolean("require_admin_two_factor")
    .default(false)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})
