import "server-only"

import { and, eq, isNotNull } from "drizzle-orm"
import { redirect } from "next/navigation"
import { connection } from "next/server"

import { db, schema } from "@/db"

const SETTINGS_ID = "default"

// Once setup is done it can never become "incomplete" again, so the positive
// result is cached for the lifetime of the server process.
let setupComplete = false

/**
 * True once the first admin has been created at /setup.
 *
 * This reads the stored `app_settings.setup_completed_at` flag instead of
 * looking for an admin account: if every admin is later removed or demoted
 * (e.g. directly in the DB), /setup must not reopen for anonymous visitors.
 * Recovery is then only possible via the DB.
 */
export async function isSetupComplete() {
  // Must run per request, never at build time (prerendering).
  await connection()
  if (setupComplete) return true
  const [row] = await db
    .select({ id: schema.appSettings.id })
    .from(schema.appSettings)
    .where(
      and(
        eq(schema.appSettings.id, SETTINGS_ID),
        isNotNull(schema.appSettings.setupCompletedAt)
      )
    )
    .limit(1)
  setupComplete = Boolean(row)
  return setupComplete
}

type Executor = Pick<typeof db, "insert">

/** Marks setup as completed (inside the setup transaction). */
export async function markSetupComplete(executor: Executor = db) {
  const now = new Date()
  await executor
    .insert(schema.appSettings)
    .values({ id: SETTINGS_ID, setupCompletedAt: now })
    .onConflictDoUpdate({
      target: schema.appSettings.id,
      set: { setupCompletedAt: now },
    })
}

/** Redirects to /setup until the first admin has been created. */
export async function requireSetupComplete() {
  if (!(await isSetupComplete())) redirect("/setup")
}
