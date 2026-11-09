import path from "node:path"

import { loadEnvConfig } from "@next/env"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { startMockLeanix } from "../../../../scripts/mock-leanix.mjs"

/**
 * Integrationstest: Sync gegen den LeanIX-Mock und eine echte
 * Postgres-Datenbank. Verwendet eine eigene Testdatenbank
 * (`<DATABASE_URL-Datenbank>_it`, wird angelegt und migriert) oder
 * `CATALOG_IT_DATABASE_URL`. Ohne erreichbares Postgres wird er übersprungen.
 */

interface MockLeanix {
  url: string
  requests: { token: number; graphql: number }
  setOptions(patch: Record<string, unknown>): void
  close(): Promise<void>
}

const appDir = path.resolve(import.meta.dirname, "../..")
loadEnvConfig(appDir)

async function prepareDatabase(): Promise<string | null> {
  const explicit = process.env.CATALOG_IT_DATABASE_URL
  const base = explicit ?? process.env.DATABASE_URL
  if (!base) return null
  const options = { max: 1, connect_timeout: 3, onnotice: () => {} }

  let url = base
  if (!explicit) {
    const parsed = new URL(base)
    const name = `${parsed.pathname.replace(/^\//, "") || "postgres"}_it`
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
    url = parsed.toString()
  }

  const client = postgres(url, options)
  try {
    await migrate(drizzle(client), {
      migrationsFolder: path.join(appDir, "db/migrations"),
    })
    await client`truncate catalog_sync_run, catalog_snapshot`
    return url
  } catch {
    return null
  } finally {
    await client.end({ timeout: 1 })
  }
}

const databaseUrl = await prepareDatabase()

describe.skipIf(!databaseUrl)(
  "Katalog-Sync mit Postgres und LeanIX-Mock",
  () => {
    let mock: MockLeanix
    let sync: typeof import("./sync")
    let store: typeof import("./store")
    let database: typeof import("@/db")

    beforeAll(async () => {
      mock = (await startMockLeanix({ port: 0 })) as MockLeanix
      Object.assign(process.env, {
        DATABASE_URL: databaseUrl,
        LEANIX_BASE_URL: mock.url,
        LEANIX_API_TOKEN: "dummy",
        LEANIX_WORKSPACE: "fallback",
        CATALOG_SOURCE: "leanix",
        CATALOG_SHOW_PERSONS: "false",
        CATALOG_MIN_RATIO: "0.5",
      })
      process.env.BETTER_AUTH_SECRET ??= "integrationstest-geheimnis-0123456789"
      process.env.BETTER_AUTH_URL ??= "http://localhost:3000"
      // Erst jetzt laden: lib/env.ts liest die Umgebung beim Import.
      database = await import("@/db")
      store = await import("./store")
      sync = await import("./sync")
    })

    afterAll(async () => {
      await mock?.close()
      await database?.db.$client.end({ timeout: 1 })
    })

    async function snapshotRows() {
      return database.db
        .select({
          id: database.schema.catalogSnapshot.id,
          generatedAt: database.schema.catalogSnapshot.generatedAt,
        })
        .from(database.schema.catalogSnapshot)
    }

    it("liefert ohne Snapshot keinen Katalog", async () => {
      expect(await store.getCatalog()).toBeNull()
      expect(await store.getCatalogStatus()).toEqual({
        available: false,
        source: null,
        generatedAt: null,
        stale: false,
      })
    })

    it("speichert einen Snapshot und aktualisiert den Speicher", async () => {
      const run = await sync.runSync("startup")
      expect(run).toMatchObject({ trigger: "startup", status: "success" })
      expect(run.stats).toMatchObject({
        families: 5,
        services: 29,
        leistungen: 7,
      })
      expect(run.durationMs).toBeGreaterThanOrEqual(0)

      const rows = await snapshotRows()
      expect(rows).toHaveLength(1)

      const catalog = await store.getCatalog()
      expect(catalog?.source).toEqual({
        kind: "leanix",
        baseUrl: mock.url,
        workspace: "eamktsoLive",
      })
      expect(catalog?.leistungen).toHaveLength(7)
      expect(await store.getCatalogStatus()).toMatchObject({
        available: true,
        source: "leanix",
        stale: false,
      })
      // Ohne CATALOG_SHOW_PERSONS keine Personen.
      expect(catalog?.leistungen.every((l) => l.persons.length === 0)).toBe(
        true
      )
    })

    it("führt bei unverändertem Inhalt nur den Stand nach", async () => {
      const before = (await snapshotRows())[0]!
      const run = await sync.runSync("schedule")
      expect(run.status).toBe("success")
      const rows = await snapshotRows()
      expect(rows).toHaveLength(1)
      expect(rows[0]!.id).toBe(before.id)
      expect(rows[0]!.generatedAt.getTime()).toBeGreaterThan(
        before.generatedAt.getTime()
      )
      const runs = await store.listSyncRuns()
      expect(runs[0]?.id).toBe(run.id)
    })

    it("legt bei Änderungen einen neuen Snapshot an", async () => {
      mock.setOptions({ exampleResources: true })
      const run = await sync.runSync("manual")
      expect(run.status).toBe("success")
      expect(await snapshotRows()).toHaveLength(2)

      const catalog = await store.getCatalog()
      const leistung = catalog?.leistungen.find(
        (l) => l.name === "eLearning Inhalte publizieren"
      )
      expect(leistung?.actions.map((a) => a.kind)).toEqual(["order"])
      expect(leistung?.links.map((a) => a.url)).toEqual([
        "https://example.org/lernplattform",
      ])
    })

    it("protokolliert Fehler und behält den alten Snapshot", async () => {
      const before = await store.getCatalog()
      mock.setOptions({ fail: true })
      const run = await sync.runSync("schedule")
      mock.setOptions({ fail: false })

      expect(run.status).toBe("failed")
      expect(run.message).toContain("HTTP 503")
      expect(run.message).not.toContain("dummy")
      expect(run.stats).toBeNull()
      expect(await snapshotRows()).toHaveLength(2)
      expect((await store.getCatalog())?.generatedAt).toBe(before?.generatedAt)
    })

    it("lehnt einen stark geschrumpften Snapshot ab", async () => {
      const before = await store.getCatalog()
      mock.setOptions({ channelLimit: 1 })
      const run = await sync.runSync("manual")
      mock.setOptions({ channelLimit: null })

      expect(run.status).toBe("rejected")
      expect(run.message).toContain("nur 1 statt bisher 7 Leistungen")
      expect(run.stats?.leistungen).toBe(1)
      expect(await snapshotRows()).toHaveLength(2)
      expect((await store.getCatalog())?.generatedAt).toBe(before?.generatedAt)
    })

    it("verhindert gleichzeitige Läufe im Prozess", async () => {
      const first = sync.runSync("manual")
      expect(sync.isSyncRunning()).toBe(true)
      await expect(sync.runSync("manual")).rejects.toBeInstanceOf(
        sync.SyncBusyError
      )
      expect((await first).status).toBe("success")
      expect(sync.isSyncRunning()).toBe(false)
    })

    it("respektiert das Advisory-Lock einer anderen Instanz", async () => {
      const other = postgres(databaseUrl!, { max: 1, onnotice: () => {} })
      try {
        await other`select pg_advisory_lock(hashtext('bits-portal.catalog-sync'))`
        await expect(sync.runSync("schedule")).rejects.toThrow(
          /anderen Instanz/
        )
        expect(sync.isSyncRunning()).toBe(false)
      } finally {
        await other.end({ timeout: 1 })
      }
      // Nach dem Freigeben läuft der Sync wieder.
      expect((await sync.runSync("schedule")).status).toBe("success")
    })

    it("schliesst verwaiste Läufe ab", async () => {
      const [orphan] = await database.db
        .insert(database.schema.catalogSyncRun)
        .values({ trigger: "schedule", status: "running" })
        .returning()
      await sync.runSync("manual")
      const runs = await store.listSyncRuns(50)
      const updated = runs.find((r) => r.id === orphan!.id)
      expect(updated?.status).toBe("failed")
      expect(updated?.message).toContain("nicht abgeschlossen")
      expect(runs.every((r) => r.status !== "running")).toBe(true)
    })

    it("lädt den Snapshot nach einem Neustart aus der Datenbank", async () => {
      const expected = await store.getCatalog()
      // Neustart simulieren: Speicher leeren.
      delete (globalThis as { __bitsCatalogStore?: unknown }).__bitsCatalogStore
      const reloaded = await store.getCatalog()
      expect(reloaded?.generatedAt).toBe(expected?.generatedAt)
      expect(reloaded?.leistungen).toHaveLength(7)
    })
  }
)
