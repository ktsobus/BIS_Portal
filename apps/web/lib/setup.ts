import "server-only"

import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { connection } from "next/server"

import { db, schema } from "@/db"

// Once an admin exists, setup can never become "incomplete" again, so the
// positive result is cached for the lifetime of the server process.
let setupComplete = false

/** True once at least one admin account exists. */
export async function isSetupComplete() {
  // Must run per request, never at build time (prerendering).
  await connection()
  if (setupComplete) return true
  const [admin] = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.role, "admin"))
    .limit(1)
  setupComplete = Boolean(admin)
  return setupComplete
}

/** Redirects to /setup until the first admin has been created. */
export async function requireSetupComplete() {
  if (!(await isSetupComplete())) redirect("/setup")
}
