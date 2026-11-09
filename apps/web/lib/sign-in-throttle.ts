import "server-only"

import { eq, sql } from "drizzle-orm"

import { db, schema } from "@/db"

/**
 * Drosselung der Passwort-Anmeldung pro Konto (E-Mail-Adresse), unabhängig
 * von der IP-Adresse. Ergänzt das IP-basierte Rate-Limit von better-auth,
 * das sich ohne vertrauenswürdigen Reverse Proxy per `X-Forwarded-For`
 * umgehen lässt.
 *
 * Nach {@link MAX_FAILURES} Fehlversuchen innerhalb von
 * {@link WINDOW_MINUTES} Minuten (gerechnet ab dem ersten Fehlversuch) wird
 * die Adresse bis zum Ende dieses Zeitfensters gesperrt. Eine erfolgreiche
 * Anmeldung setzt den Zähler zurück. Unbekannte Adressen werden gleich
 * behandelt, damit die Antwort nichts über vorhandene Konten verrät.
 */
export const MAX_FAILURES = 10
export const WINDOW_MINUTES = 15

const table = schema.signInThrottle
const windowStart = sql`now() - make_interval(mins => ${WINDOW_MINUTES})`

/** Kleinbuchstaben ohne Leerraum; `null` bei ungültigem Wert. */
export function normalizeThrottleEmail(value: unknown): string | null {
  if (typeof value !== "string") return null
  const email = value.trim().toLowerCase()
  return email.length > 0 && email.length <= 320 ? email : null
}

/** Sekunden, die die Adresse noch gesperrt ist (0 = nicht gesperrt). */
export async function signInLockedForSeconds(email: string): Promise<number> {
  const [row] = await db
    .select({
      seconds: sql<number>`ceil(extract(epoch from (${table.windowStartedAt} + make_interval(mins => ${WINDOW_MINUTES}) - now())))::int`,
    })
    .from(table)
    .where(
      sql`${table.email} = ${email} and ${table.failures} >= ${MAX_FAILURES} and ${table.windowStartedAt} > ${windowStart}`
    )
    .limit(1)
  return row ? Math.max(1, row.seconds) : 0
}

/** Zählt einen Fehlversuch (atomar) und räumt abgelaufene Einträge auf. */
export async function recordSignInFailure(email: string) {
  const expired = sql`${table.windowStartedAt} <= ${windowStart}`
  await db
    .insert(table)
    .values({ email, failures: 1, windowStartedAt: sql`now()` })
    .onConflictDoUpdate({
      target: table.email,
      set: {
        failures: sql`case when ${expired} then 1 else ${table.failures} + 1 end`,
        windowStartedAt: sql`case when ${expired} then now() else ${table.windowStartedAt} end`,
      },
    })
  await db.delete(table).where(expired)
}

/** Nach erfolgreicher Anmeldung: Zähler zurücksetzen. */
export async function clearSignInFailures(email: string) {
  await db.delete(table).where(eq(table.email, email))
}
