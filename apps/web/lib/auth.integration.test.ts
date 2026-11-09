import path from "node:path"

import { loadEnvConfig } from "@next/env"
import { eq, ne } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

/**
 * Integrationstest für die Härtung in `lib/auth.ts` (Passwortregel,
 * Rollen-Guards, Drosselung pro Konto) gegen eine echte Postgres-Datenbank
 * (`<DATABASE_URL-Datenbank>_auth_it`, wird angelegt und migriert). Ohne
 * erreichbares Postgres wird er übersprungen.
 */

const appDir = path.resolve(import.meta.dirname, "..")
loadEnvConfig(appDir)

async function prepareDatabase(): Promise<string | null> {
  const base = process.env.DATABASE_URL
  if (!base) return null
  const options = { max: 1, connect_timeout: 3, onnotice: () => {} }
  const parsed = new URL(base)
  const name = `${parsed.pathname.replace(/^\//, "") || "postgres"}_auth_it`
  if (!/^[a-z0-9_]+$/i.test(name)) return null
  const admin = postgres(base, options)
  try {
    const [exists] =
      await admin`select 1 as found from pg_database where datname = ${name}`
    if (!exists) await admin.unsafe(`create database "${name}"`)
  } catch {
    return null
  } finally {
    await admin.end({ timeout: 1 })
  }
  parsed.pathname = `/${name}`
  const url = parsed.toString()

  const client = postgres(url, options)
  try {
    await migrate(drizzle(client), {
      migrationsFolder: path.join(appDir, "db/migrations"),
    })
    await client`truncate "user", sign_in_throttle, app_settings cascade`
    return url
  } catch {
    return null
  } finally {
    await client.end({ timeout: 1 })
  }
}

const databaseUrl = await prepareDatabase()

const PASSWORD = "Korrekt-Pferd-42!"

describe.skipIf(!databaseUrl)("Anmeldung und Rollen (better-auth)", () => {
  let auth: typeof import("./auth").auth
  let database: typeof import("@/db")
  let throttle: typeof import("./sign-in-throttle")

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl!
    process.env.BETTER_AUTH_SECRET ??= "integrationstest-geheimnis-0123456789"
    process.env.BETTER_AUTH_URL ??= "http://localhost:3000"
    // Erst jetzt laden: lib/env.ts liest die Umgebung beim Import.
    database = await import("@/db")
    throttle = await import("./sign-in-throttle")
    auth = (await import("./auth")).auth
  })

  afterAll(async () => {
    await database?.db.$client.end({ timeout: 1 })
  })

  async function createUser(email: string, role: "admin" | "user") {
    const { user } = await auth.api.createUser({
      body: { name: email, email, password: PASSWORD, role },
    })
    return user
  }

  async function signIn(email: string, password = PASSWORD) {
    return auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    })
  }

  async function sessionHeaders(email: string) {
    const response = await signIn(email)
    expect(response.status).toBe(200)
    const cookie = response.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ")
    return new Headers({ cookie })
  }

  async function roleOf(id: string) {
    const [row] = await database.db
      .select({ role: database.schema.user.role })
      .from(database.schema.user)
      .where(eq(database.schema.user.id, id))
    return row?.role
  }

  it("verlangt mindestens 12 Zeichen, auch über better-auth direkt (R4-07)", async () => {
    // HTTP-Weg wie im Befund: admin/create-user mit Admin-Sitzung.
    await createUser("pruefer@example.org", "admin")
    const response = await auth.handler(
      new Request("http://localhost:3000/api/auth/admin/create-user", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          cookie: (await sessionHeaders("pruefer@example.org")).get("cookie")!,
        },
        body: JSON.stringify({
          name: "Bypass",
          email: "bypass@example.org",
          password: "abcdefgh",
          role: "admin",
        }),
      })
    )
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ code: "PASSWORD_TOO_SHORT" })

    await expect(
      auth.api.createUser({
        body: {
          name: "Kurz",
          email: "kurz@example.org",
          password: "abcdefgh",
          role: "admin",
        },
      })
    ).rejects.toMatchObject({ body: { code: "PASSWORD_TOO_SHORT" } })
  })

  it("lässt nur die Rollen admin/user zu (R4-05)", async () => {
    await expect(
      auth.api.createUser({
        body: {
          name: "Liste",
          email: "liste@example.org",
          password: PASSWORD,
          role: ["admin", "user"],
        },
      })
    ).rejects.toMatchObject({ body: { code: "INVALID_ROLE" } })
  })

  it("verhindert Rollenänderung über update-user und das Entfernen des letzten Admins (R4-05)", async () => {
    const admin = await createUser("admin1@example.org", "admin")
    const other = await createUser("admin2@example.org", "admin")
    const headers = await sessionHeaders("admin1@example.org")

    // Selbst-Degradierung über update-user (umging früher den Guard).
    await expect(
      auth.api.adminUpdateUser({
        headers,
        body: { userId: admin.id, data: { role: "user" } },
      })
    ).rejects.toMatchObject({ body: { code: "ROLE_VIA_SET_ROLE_ONLY" } })
    expect(await roleOf(admin.id)).toBe("admin")

    // Eigene Rolle über set-role bleibt gesperrt.
    await expect(
      auth.api.setRole({ headers, body: { userId: admin.id, role: "user" } })
    ).rejects.toMatchObject({ body: { code: "CANNOT_CHANGE_OWN_ROLE" } })

    // Anderen Admin degradieren geht, solange ein Admin bleibt.
    await auth.api.setRole({
      headers,
      body: { userId: other.id, role: "user" },
    })
    expect(await roleOf(other.id)).toBe("user")

    // Ohne Sitzung (Server-Aufruf) darf der letzte Admin nicht weg.
    await database.db
      .update(database.schema.user)
      .set({ role: "user" })
      .where(ne(database.schema.user.id, admin.id))
    await expect(
      auth.api.removeUser({ body: { userId: admin.id } })
    ).rejects.toMatchObject({ body: { code: "LAST_ADMIN" } })
    await expect(
      auth.api.setRole({
        headers: new Headers(),
        body: { userId: admin.id, role: "user" },
      })
    ).rejects.toMatchObject({ body: { code: "LAST_ADMIN" } })
    expect(await roleOf(admin.id)).toBe("admin")
  })

  it("drosselt Fehlversuche pro Konto, unabhängig von der IP (R4-06)", async () => {
    await createUser("gesperrt@example.org", "admin")

    for (let i = 0; i < throttle.MAX_FAILURES; i++) {
      const response = await signIn("gesperrt@example.org", `falsch-${i}`)
      expect(response.status).toBe(401)
    }
    // Ab jetzt gesperrt, auch mit richtigem Passwort und anderer «IP».
    const locked = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "10.9.8.7",
        },
        body: JSON.stringify({
          email: "GESPERRT@example.org",
          password: PASSWORD,
        }),
      })
    )
    expect(locked.status).toBe(429)
    expect(locked.headers.get("retry-after")).toMatch(/^\d+$/)
    expect(await locked.json()).toMatchObject({
      code: "SIGN_IN_TEMPORARILY_LOCKED",
    })

    // Andere Konten sind nicht betroffen.
    await createUser("frei@example.org", "admin")
    expect((await signIn("frei@example.org")).status).toBe(200)
  })

  it("setzt den Zähler nach erfolgreicher Anmeldung zurück (R4-06)", async () => {
    await createUser("vergesslich@example.org", "admin")
    for (let i = 0; i < throttle.MAX_FAILURES - 1; i++) {
      await signIn("vergesslich@example.org", "falsch")
    }
    expect((await signIn("vergesslich@example.org")).status).toBe(200)
    expect(
      await throttle.signInLockedForSeconds("vergesslich@example.org")
    ).toBe(0)
    expect((await signIn("vergesslich@example.org", "falsch")).status).toBe(401)
    expect((await signIn("vergesslich@example.org")).status).toBe(200)
  })

  it("bietet Passwort-Reset und E-Mail-Bestätigung nicht an (R5-06)", async () => {
    const reset = await auth.handler(
      new Request("http://localhost:3000/api/auth/request-password-reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "admin1@example.org" }),
      })
    )
    expect(reset.status).toBe(404)
    const verify = await auth.handler(
      new Request("http://localhost:3000/api/auth/send-verification-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "admin1@example.org" }),
      })
    )
    expect(verify.status).toBe(404)
    const token = await auth.handler(
      new Request("http://localhost:3000/api/auth/reset-password/abc", {
        method: "GET",
      })
    )
    expect(token.status).toBe(404)
  })
})
